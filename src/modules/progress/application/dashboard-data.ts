import "server-only";

import { getExercisesByIds } from "@/modules/catalog";
import { getLastFinishedSession, listSetsSince } from "@/modules/logging";
import { getActiveProgram } from "@/modules/training";
import type { TenantContext } from "@/shared/db/tenant";
import { addDays, startOfWeek, toLocalDate } from "@/shared/time/local-date";

import { isStagnant } from "../domain/stagnation";
import { estimateOneRepMax, isEffectiveSet, setVolume } from "../domain/strength";
import { weeklySetsByMuscle } from "../domain/volume";

type Context = TenantContext & { timezone: string };

export type WeekDay = {
    readonly date: string;
    readonly label: string;
    readonly trained: boolean;
    readonly isToday: boolean;
    readonly isFuture: boolean;
};

export type RecordEntry = {
    readonly exerciseName: string;
    readonly loadKg: number;
    readonly reps: number;
    readonly date: string;
};

export type DashboardExtras = {
    readonly weekDays: readonly WeekDay[];
    readonly muscleVolume: readonly { readonly name: string; readonly sets: number }[];
    readonly stagnant: readonly { readonly name: string; readonly bestKg: number }[];
    readonly records: readonly RecordEntry[];
    readonly lastWorkout: {
        readonly label: string;
        readonly date: string;
        readonly minutes: number;
        readonly sets: number;
        readonly volumeKg: number;
        readonly highlights: readonly {
            readonly name: string;
            readonly loadKg: number;
            readonly reps: number;
        }[];
    } | null;
};

const WEEKDAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

/** Data for the widgets that the Summary does not already compute. */
export async function getDashboardExtras(context: Context): Promise<DashboardExtras> {
    const today = toLocalDate(new Date(), context.timezone);
    const weekStart = startOfWeek(today);
    const since = new Date(`${addDays(weekStart, -7 * 16)}T00:00:00Z`);

    const [rows, program, lastSession] = await Promise.all([
        listSetsSince(context, since),
        getActiveProgram(context),
        getLastFinishedSession(context),
    ]);

    const effective = rows.filter((row) => isEffectiveSet(toLogged(row.set)));
    const exerciseIds = [...new Set(effective.map((row) => row.exerciseId))];
    const catalog = await getExercisesByIds(context, exerciseIds);
    const nameOf = (id: string) => catalog.get(id)?.name ?? "Exercício";

    // Week strip
    const trainedDates = new Set(
        effective.map((row) => toLocalDate(row.startedAt, context.timezone)),
    );
    const weekDays: WeekDay[] = WEEKDAY_LABELS.map((label, index) => {
        const date = addDays(weekStart, index);
        return {
            date,
            label,
            trained: trainedDates.has(date),
            isToday: date === today,
            isFuture: date > today,
        };
    });

    // Weekly volume per muscle (this week)
    const thisWeek = effective.filter(
        (row) => toLocalDate(row.startedAt, context.timezone) >= weekStart,
    );
    const muscleNames = new Map<string, string>();
    const totals = weeklySetsByMuscle(
        thisWeek.map((row) => {
            const muscles = catalog.get(row.exerciseId)?.muscles ?? [];
            for (const muscle of muscles) {
                muscleNames.set(muscle.slug, muscle.name);
            }
            return {
                ...toLogged(row.set),
                muscles: muscles.map((muscle) => ({ slug: muscle.slug, role: muscle.role })),
            };
        }),
    );
    const muscleVolume = [...totals.entries()]
        .map(([slug, sets]) => ({ name: muscleNames.get(slug) ?? slug, sets }))
        .sort((a, b) => b.sets - a.sets);

    // Stagnation: exercises of the active program without a new best in 3 weeks
    const programExercises = new Set(
        program?.workouts.flatMap((workout) =>
            workout.exercises.map((exercise) => exercise.exerciseId),
        ) ?? [],
    );
    const weekly = new Map<string, Map<string, number>>();
    for (const row of effective) {
        if (!programExercises.has(row.exerciseId) || !row.set.loadKg || !row.set.reps) {
            continue;
        }
        const week = startOfWeek(toLocalDate(row.startedAt, context.timezone));
        const byWeek = weekly.get(row.exerciseId) ?? new Map<string, number>();
        byWeek.set(
            week,
            Math.max(byWeek.get(week) ?? 0, estimateOneRepMax(row.set.loadKg, row.set.reps)),
        );
        weekly.set(row.exerciseId, byWeek);
    }
    const stagnant = [...weekly.entries()]
        .filter(([, byWeek]) =>
            isStagnant(
                [...byWeek.entries()].map(([weekStartDate, bestOneRepMax]) => ({
                    weekStart: weekStartDate,
                    bestOneRepMax,
                })),
            ),
        )
        .map(([exerciseId]) => {
            const best = Math.max(
                ...effective
                    .filter((row) => row.exerciseId === exerciseId)
                    .map((row) => row.set.loadKg ?? 0),
            );
            return { name: nameOf(exerciseId), bestKg: best };
        });

    // Records of the last 30 days (beat everything before them)
    const windowStart = addDays(today, -30);
    const bestBefore = new Map<string, number>();
    const candidates: (RecordEntry & { estimate: number; exerciseId: string })[] = [];
    for (const row of [...effective].sort(
        (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    )) {
        if (!row.set.loadKg || !row.set.reps) {
            continue;
        }
        const estimate = estimateOneRepMax(row.set.loadKg, row.set.reps);
        const date = toLocalDate(row.startedAt, context.timezone);
        const previous = bestBefore.get(row.exerciseId) ?? 0;
        if (date >= windowStart && previous > 0 && estimate > previous) {
            candidates.push({
                exerciseId: row.exerciseId,
                exerciseName: nameOf(row.exerciseId),
                loadKg: row.set.loadKg,
                reps: row.set.reps,
                date,
                estimate,
            });
        }
        bestBefore.set(row.exerciseId, Math.max(previous, estimate));
    }
    const latestByExercise = new Map<string, RecordEntry>();
    for (const candidate of candidates) {
        latestByExercise.set(candidate.exerciseId, {
            exerciseName: candidate.exerciseName,
            loadKg: candidate.loadKg,
            reps: candidate.reps,
            date: candidate.date,
        });
    }
    const records = [...latestByExercise.values()].sort((a, b) => b.date.localeCompare(a.date));

    // Last finished workout
    let lastWorkout: DashboardExtras["lastWorkout"] = null;
    if (lastSession) {
        const sessionSets = effective.filter(
            (row) => row.startedAt.getTime() === lastSession.startedAt.getTime(),
        );
        const bestByExercise = new Map<string, { loadKg: number; reps: number }>();
        for (const row of sessionSets) {
            const current = bestByExercise.get(row.exerciseId);
            const load = row.set.loadKg ?? 0;
            if (!current || load > current.loadKg) {
                bestByExercise.set(row.exerciseId, { loadKg: load, reps: row.set.reps ?? 0 });
            }
        }
        lastWorkout = {
            label: lastSession.workoutLabel ?? "",
            date: toLocalDate(lastSession.startedAt, context.timezone),
            minutes: lastSession.finishedAt
                ? Math.round(
                      (lastSession.finishedAt.getTime() - lastSession.startedAt.getTime()) / 60000,
                  )
                : 0,
            sets: sessionSets.length,
            volumeKg: Math.round(
                sessionSets.reduce((sum, row) => sum + setVolume(toLogged(row.set)), 0),
            ),
            highlights: [...bestByExercise.entries()]
                .filter(([, best]) => best.loadKg > 0)
                .map(([exerciseId, best]) => ({ name: nameOf(exerciseId), ...best })),
        };
    }

    return { weekDays, muscleVolume, stagnant, records, lastWorkout };
}

function toLogged(set: {
    loadKg: number | null;
    reps: number | null;
    setType: "warmup" | "working" | "drop" | "failure";
}) {
    return { loadKg: set.loadKg ?? 0, reps: set.reps ?? 0, setType: set.setType };
}
