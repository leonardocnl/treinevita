import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getExercisesByIds } from "@/modules/catalog";
import {
    getLastFinishedSession,
    getLastSetsByExercise,
    listSessionsSince,
    listSetsSince,
} from "@/modules/logging";
import { getActiveProgram, getWeeklyGoal, nextWorkoutInRotation } from "@/modules/training";
import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";
import {
    addDays,
    daysInMonth,
    startOfMonth,
    startOfWeek,
    toLocalDate,
    weekdayIndex,
} from "@/shared/time/local-date";

import { progressionStrategies } from "../domain/progression";
import { estimateOneRepMax } from "../domain/strength";
import { bodyMeasurements } from "../infrastructure/schema";

type Context = TenantContext & { timezone: string };

export type ActivityDay = {
    readonly date: string;
    /** 0 = no training, 1–3 = intensity by number of effective sets, -1 = future. */
    readonly level: -1 | 0 | 1 | 2 | 3;
    readonly isToday: boolean;
};

export const ACTIVITY_WEEKS = 16;

export type CalendarDay = {
    readonly date: string;
    readonly state: "trained" | "today" | "missed" | "future";
};

export type Summary = {
    readonly today: string;
    readonly week: { readonly done: number; readonly goal: number };
    readonly weight: {
        readonly latestKg: number;
        readonly monthDeltaKg: number | null;
        readonly trend: number[];
    } | null;
    readonly waistCm: number | null;
    readonly record: {
        readonly exerciseName: string;
        readonly loadKg: number;
        readonly reps: number;
    } | null;
    readonly nextWorkout: {
        readonly label: string;
        readonly exerciseCount: number;
        readonly increasing: readonly string[];
        readonly exercises: readonly { readonly name: string; readonly increases: boolean }[];
    } | null;
    readonly hasOpenSession: boolean;
    readonly activity: {
        readonly weeks: readonly (readonly ActivityDay[])[];
        /** One flag per week: the weekly goal was met. */
        readonly goalMet: readonly boolean[];
        readonly averagePerWeek: number;
        readonly monthLabels: readonly { readonly weekIndex: number; readonly label: string }[];
        readonly trainedDays: number;
    };
    readonly calendar: {
        readonly monthStart: string;
        readonly leadingBlanks: number;
        readonly days: CalendarDay[];
    };
};

export async function getSummary(context: Context, hasOpenSession: boolean): Promise<Summary> {
    const now = new Date();
    const today = toLocalDate(now, context.timezone);
    const monthStart = startOfMonth(today);
    const weekStart = startOfWeek(today);
    const historyStart = weekStart < monthStart ? weekStart : monthStart;
    const since = new Date(`${addDays(historyStart, -1)}T00:00:00Z`);

    const [sessions, goal, program, lastSession, weight, waistCm, record] = await Promise.all([
        listSessionsSince(context, since),
        getWeeklyGoal(context),
        getActiveProgram(context),
        getLastFinishedSession(context),
        getWeightTrend(context),
        getLatestWaist(context),
        getWeeklyRecord(context, weekStart),
    ]);

    const trainedDates = new Set(
        sessions
            .filter((session) => session.finishedAt)
            .map((session) => toLocalDate(session.startedAt, context.timezone)),
    );
    const doneThisWeek = [...trainedDates].filter(
        (date) => date >= weekStart && date <= today,
    ).length;

    const totalDays = daysInMonth(today);
    const days: CalendarDay[] = [];
    for (let day = 0; day < totalDays; day += 1) {
        const date = addDays(monthStart, day);
        let state: CalendarDay["state"] = "future";
        if (date === today) {
            state = trainedDates.has(date) ? "trained" : "today";
        } else if (date < today) {
            state = trainedDates.has(date) ? "trained" : "missed";
        }
        days.push({ date, state });
    }

    let nextWorkout: Summary["nextWorkout"] = null;
    if (program) {
        const workout = nextWorkoutInRotation(program, lastSession?.workoutLabel ?? null);
        if (workout) {
            const lastSets = await getLastSetsByExercise(
                context,
                workout.exercises.map((exercise) => exercise.exerciseId),
            );
            const flags = workout.exercises.map((exercise) => {
                const history = lastSets.get(exercise.exerciseId);
                if (!history || exercise.repMin === null || exercise.repMax === null) {
                    return false;
                }
                const decision = progressionStrategies[exercise.progressionRule]({
                    lastSets: history.sets
                        .filter((set) => set.loadKg !== null && set.reps !== null)
                        .map((set) => ({
                            loadKg: set.loadKg ?? 0,
                            reps: set.reps ?? 0,
                            setType: set.setType,
                        })),
                    range: { min: exercise.repMin, max: exercise.repMax },
                    incrementKg: exercise.incrementKg,
                });
                return decision?.kind === "increase";
            });
            const exercises = workout.exercises.map((exercise, index) => ({
                name: exercise.name,
                increases: flags[index],
            }));
            nextWorkout = {
                label: workout.label,
                exerciseCount: workout.exercises.length,
                increasing: exercises
                    .filter((exercise) => exercise.increases)
                    .map((exercise) => exercise.name),
                exercises,
            };
        }
    }

    const activity = await getActivity(context, today, goal);

    return {
        today,
        activity,
        week: { done: doneThisWeek, goal },
        weight,
        waistCm,
        record,
        nextWorkout,
        hasOpenSession,
        calendar: { monthStart, leadingBlanks: weekdayIndex(monthStart), days },
    };
}

/** The latest weigh-ins (up to 8, oldest first) with the change over the last 4 weeks. */
export async function getWeightTrend(context: TenantContext): Promise<Summary["weight"]> {
    const db = await getDb();
    const rows = await db
        .select({ measuredOn: bodyMeasurements.measuredOn, weightKg: bodyMeasurements.weightKg })
        .from(bodyMeasurements)
        .where(
            and(inTenant(bodyMeasurements, context), eq(bodyMeasurements.userId, context.userId)),
        )
        .orderBy(desc(bodyMeasurements.measuredOn))
        .limit(8);

    const withWeight = rows.filter((row) => row.weightKg !== null).reverse();
    if (withWeight.length === 0) {
        return null;
    }
    const trend = withWeight.map((row) => Number(row.weightKg));
    const latest = withWeight[withWeight.length - 1];
    const monthAgo = addDays(latest.measuredOn, -28);
    const reference = withWeight.find((row) => row.measuredOn >= monthAgo);
    const monthDeltaKg =
        reference && reference !== latest
            ? Number(latest.weightKg) - Number(reference.weightKg)
            : null;

    return { latestKg: Number(latest.weightKg), monthDeltaKg, trend };
}

async function getLatestWaist(context: Context): Promise<number | null> {
    const db = await getDb();
    const rows = await db
        .select({ waistCm: bodyMeasurements.waistCm })
        .from(bodyMeasurements)
        .where(
            and(inTenant(bodyMeasurements, context), eq(bodyMeasurements.userId, context.userId)),
        )
        .orderBy(desc(bodyMeasurements.measuredOn))
        .limit(4);
    const found = rows.find((row) => row.waistCm !== null);
    return found ? Number(found.waistCm) : null;
}

/** Best estimated one-rep max set of this week that beat everything before it. */
async function getWeeklyRecord(context: Context, weekStart: string): Promise<Summary["record"]> {
    const since = new Date(`${addDays(weekStart, -120)}T00:00:00Z`);
    const rows = await listSetsSince(context, since);

    const bestBefore = new Map<string, number>();
    const thisWeek: { exerciseId: string; loadKg: number; reps: number; estimate: number }[] = [];

    for (const row of rows) {
        const { set } = row;
        if (set.loadKg === null || set.reps === null || set.loadKg <= 0) {
            continue;
        }
        if (set.setType !== "working" && set.setType !== "failure") {
            continue;
        }
        const estimate = estimateOneRepMax(set.loadKg, set.reps);
        if (toLocalDate(row.startedAt, context.timezone) < weekStart) {
            bestBefore.set(row.exerciseId, Math.max(bestBefore.get(row.exerciseId) ?? 0, estimate));
        } else {
            thisWeek.push({
                exerciseId: row.exerciseId,
                loadKg: set.loadKg,
                reps: set.reps,
                estimate,
            });
        }
    }

    const records = thisWeek
        .filter(
            (entry) =>
                entry.estimate > (bestBefore.get(entry.exerciseId) ?? 0) &&
                bestBefore.has(entry.exerciseId),
        )
        .sort(
            (a, b) =>
                b.estimate / (bestBefore.get(b.exerciseId) ?? 1) -
                a.estimate / (bestBefore.get(a.exerciseId) ?? 1),
        );

    const top = records[0];
    if (!top) {
        return null;
    }
    const catalog = await getExercisesByIds(context, [top.exerciseId]);
    return {
        exerciseName: catalog.get(top.exerciseId)?.name ?? "Exercício",
        loadKg: top.loadKg,
        reps: top.reps,
    };
}

/**
 * Training activity of the last weeks, one column per week (Monday on top),
 * like a contribution graph. Intensity comes from the number of effective sets.
 */
async function getActivity(
    context: Context,
    today: string,
    goal: number,
): Promise<Summary["activity"]> {
    const firstDay = addDays(startOfWeek(today), -7 * (ACTIVITY_WEEKS - 1));
    const rows = await listSetsSince(context, new Date(`${addDays(firstDay, -1)}T00:00:00Z`));

    const setsByDay = new Map<string, number>();
    for (const row of rows) {
        if (row.set.setType !== "working" && row.set.setType !== "failure") {
            continue;
        }
        const date = toLocalDate(row.startedAt, context.timezone);
        setsByDay.set(date, (setsByDay.get(date) ?? 0) + 1);
    }

    const weeks: ActivityDay[][] = [];
    const goalMet: boolean[] = [];
    const monthLabels: { weekIndex: number; label: string }[] = [];
    let trainedDays = 0;
    let lastMonth = "";

    for (let week = 0; week < ACTIVITY_WEEKS; week += 1) {
        const days: ActivityDay[] = [];
        for (let weekday = 0; weekday < 7; weekday += 1) {
            const date = addDays(firstDay, week * 7 + weekday);
            const sets = setsByDay.get(date) ?? 0;
            let level: ActivityDay["level"] = 0;
            if (date > today) {
                level = -1;
            } else if (sets >= 24) {
                level = 3;
            } else if (sets >= 16) {
                level = 2;
            } else if (sets > 0) {
                level = 1;
            }
            if (sets > 0 && date <= today) {
                trainedDays += 1;
            }
            days.push({ date, level, isToday: date === today });
        }
        const month = days[0].date.slice(0, 7);
        if (month !== lastMonth) {
            monthLabels.push({ weekIndex: week, label: shortMonth(days[0].date) });
            lastMonth = month;
        }
        weeks.push(days);
        goalMet.push(days.filter((day) => day.level > 0).length >= goal);
    }

    const elapsedWeeks = Math.max(
        1,
        ACTIVITY_WEEKS - (weeks.at(-1)?.some((day) => day.level === -1) ? 0.5 : 0),
    );
    const averagePerWeek = Math.round((trainedDays / elapsedWeeks) * 10) / 10;

    return { weeks, goalMet, averagePerWeek, monthLabels, trainedDays };
}

function shortMonth(localDate: string): string {
    const text = new Date(`${localDate}T12:00:00Z`).toLocaleDateString("pt-BR", {
        month: "short",
        timeZone: "UTC",
    });
    const clean = text.replace(".", "");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}
