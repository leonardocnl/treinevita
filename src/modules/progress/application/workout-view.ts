import "server-only";

import { getExercisesByIds, type ExerciseMedia } from "@/modules/catalog";
import {
    getLastSetsByExercise,
    listSetsSince,
    type OpenSession,
    type PerformedSet,
} from "@/modules/logging";
import type { TenantContext } from "@/shared/db/tenant";
import { addDays, startOfWeek, toLocalDate } from "@/shared/time/local-date";

import { STAGNATION_WEEKS, weeksSinceProgress, type WeeklyTop } from "../domain/metrics";
import { isEffectiveSet } from "../domain/strength";

import { progressionStrategies, type LoadDecision } from "../domain/progression";

export type ExerciseView = {
    readonly performedExerciseId: string;
    readonly exerciseId: string;
    readonly position: number;
    readonly name: string;
    readonly measurement: "load_reps" | "duration";
    /** The catalog's reference page, unchecked: the screen keeps only https links. */
    readonly referenceUrl: string | null;
    readonly media: ExerciseMedia | null;
    readonly targetSets: number;
    readonly repMin: number | null;
    readonly repMax: number | null;
    readonly durationMinSeconds: number | null;
    readonly durationMaxSeconds: number | null;
    readonly incrementKg: number;
    readonly doneSets: readonly PerformedSet[];
    readonly lastTime: {
        readonly performedOn: Date;
        readonly sets: readonly PerformedSet[];
    } | null;
    readonly decision: LoadDecision | null;
    /** Weeks without load or rep progress, only when 3 or more (the stagnation fact). */
    readonly stagnantWeeks: number | null;
    /** Where the wheel opens for the next set. */
    readonly suggested: {
        readonly loadKg: number;
        readonly reps: number;
        readonly durationSeconds: number;
    };
};

export type WorkoutView = {
    readonly sessionId: string;
    readonly label: string;
    readonly startedAt: Date;
    readonly exercises: readonly ExerciseView[];
};

/**
 * Everything the workout screens need, with the progression already decided:
 * the wheel opens on the right load and the screen only asks when in doubt.
 */
export async function getWorkoutView(
    context: TenantContext & { timezone: string },
    session: OpenSession,
): Promise<WorkoutView> {
    const exerciseIds = session.exercises.map((exercise) => exercise.exerciseId);
    const today = toLocalDate(new Date(), context.timezone);
    const [catalog, history, recent] = await Promise.all([
        getExercisesByIds(context, exerciseIds),
        getLastSetsByExercise(context, exerciseIds),
        listSetsSince(context, new Date(`${addDays(today, -7 * 20)}T00:00:00Z`)),
    ]);

    // Heaviest set of each week per exercise, from finished sessions only, for the stagnation fact.
    const tops = new Map<string, Map<string, WeeklyTop>>();
    for (const row of recent) {
        const { loadKg, reps, setType } = row.set;
        if (row.sessionId === session.sessionId || loadKg === null || reps === null) {
            continue;
        }
        if (!isEffectiveSet({ loadKg, reps, setType })) {
            continue;
        }
        const week = startOfWeek(toLocalDate(row.startedAt, context.timezone));
        const byWeek = tops.get(row.exerciseId) ?? new Map<string, WeeklyTop>();
        const top = byWeek.get(week);
        if (!top || loadKg > top.loadKg || (loadKg === top.loadKg && reps > top.reps)) {
            byWeek.set(week, { weekStart: week, loadKg, reps });
        }
        tops.set(row.exerciseId, byWeek);
    }
    const stagnantWeeks = (exerciseId: string) => {
        const weeks = weeksSinceProgress([...(tops.get(exerciseId)?.values() ?? [])], today);
        return weeks !== null && weeks >= STAGNATION_WEEKS ? weeks : null;
    };

    const exercises = session.exercises.map((exercise): ExerciseView => {
        const info = catalog.get(exercise.exerciseId);
        const prescription = exercise.prescription;
        const lastTime = history.get(exercise.exerciseId) ?? null;
        const incrementKg = prescription?.loadIncrementKg ?? info?.defaultIncrementKg ?? 2.5;
        const repMin = prescription?.repMin ?? null;
        const repMax = prescription?.repMax ?? null;

        let decision: LoadDecision | null = null;
        if (lastTime && repMin !== null && repMax !== null) {
            decision = progressionStrategies[prescription?.progressionRule ?? "double_progression"](
                {
                    lastSets: lastTime.sets
                        .filter((set) => set.loadKg !== null && set.reps !== null)
                        .map((set) => ({
                            loadKg: set.loadKg ?? 0,
                            reps: set.reps ?? 0,
                            setType: set.setType,
                        })),
                    range: { min: repMin, max: repMax },
                    incrementKg,
                },
            );
        }

        const previousInSession = exercise.sets.at(-1);
        const lastDuration = lastTime?.sets.at(-1)?.durationSeconds ?? null;
        const suggested = {
            loadKg:
                previousInSession?.loadKg ?? decision?.loadKg ?? lastTime?.sets.at(-1)?.loadKg ?? 0,
            reps:
                previousInSession?.reps ??
                (decision?.kind === "increase"
                    ? (repMin ?? 10)
                    : (lastTime?.sets[0]?.reps ?? repMin ?? 10)),
            durationSeconds:
                previousInSession?.durationSeconds ??
                lastDuration ??
                prescription?.durationMinSeconds ??
                30,
        };

        return {
            performedExerciseId: exercise.performedExerciseId,
            exerciseId: exercise.exerciseId,
            position: exercise.position,
            name: info?.name ?? "Exercício",
            measurement: info?.measurement ?? "load_reps",
            referenceUrl: info?.referenceUrl ?? null,
            media: info?.media ?? null,
            targetSets: prescription?.sets ?? 3,
            repMin,
            repMax,
            durationMinSeconds: prescription?.durationMinSeconds ?? null,
            durationMaxSeconds: prescription?.durationMaxSeconds ?? null,
            incrementKg,
            doneSets: exercise.sets,
            lastTime,
            decision,
            stagnantWeeks: stagnantWeeks(exercise.exerciseId),
            suggested,
        };
    });

    return {
        sessionId: session.sessionId,
        label: session.workoutLabel ?? "",
        startedAt: session.startedAt,
        exercises,
    };
}
