/**
 * Metrics the home widgets show, computed from the logged history. Pure: the
 * application layer loads the rows and hands them over.
 */
import { estimateOneRepMax } from "./strength";

const DAY_MS = 86_400_000;

function daysBetween(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS);
}

export type WeekCount = {
    /** Monday, YYYY-MM-DD. */
    readonly start: string;
    readonly trained: number;
};

/**
 * Weeks in a row that met the goal. `weeks` is oldest first and ends with the
 * running week, which only counts once it is met (a week still running never
 * breaks the streak).
 */
export function weekStreak(
    weeks: readonly WeekCount[],
    goal: number,
): { current: number; best: number } {
    const met = weeks.map((week) => week.trained >= goal);
    let best = 0;
    let run = 0;
    for (const value of met) {
        run = value ? run + 1 : 0;
        best = Math.max(best, run);
    }
    let current = 0;
    const last = met.length - 1;
    for (let index = met[last] ? last : last - 1; index >= 0 && met[index]; index -= 1) {
        current += 1;
    }
    return { current, best };
}

export type WeeklyTop = {
    /** Monday of the week, YYYY-MM-DD. */
    readonly weekStart: string;
    /** The heaviest set of the week, and its reps. */
    readonly loadKg: number;
    readonly reps: number;
};

/**
 * Whole weeks since the exercise last progressed: a heavier load than ever, or
 * more reps than ever at its best load. Null without at least two weeks of history.
 */
export function weeksSinceProgress(history: readonly WeeklyTop[], today: string): number | null {
    if (history.length < 2) {
        return null;
    }
    const ordered = [...history].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    let bestLoad = -1;
    let bestReps = -1;
    let lastProgress = ordered[0].weekStart;
    for (const week of ordered) {
        if (week.loadKg > bestLoad || (week.loadKg === bestLoad && week.reps > bestReps)) {
            lastProgress = week.weekStart;
            bestLoad = week.loadKg;
            bestReps = week.reps;
        }
    }
    return Math.floor(daysBetween(lastProgress, today) / 7);
}

/** Stagnation is a fact the app states only after 3 weeks or more without progress. */
export const STAGNATION_WEEKS = 3;

export type HistorySet = {
    readonly exerciseId: string;
    readonly sessionId: string;
    /** Local day of the session, YYYY-MM-DD. */
    readonly day: string;
    /** Local start hour of the session, 0–23. */
    readonly hour: number;
    readonly loadKg: number;
    readonly reps: number;
};

export type PersonalRecord = {
    readonly exerciseId: string;
    readonly day: string;
    readonly hour: number;
    readonly loadKg: number;
    readonly reps: number;
    /** Load added since the previous session of the exercise (its heaviest set). */
    readonly gainKg: number;
};

/**
 * Sessions that beat every earlier estimated one-rep max of their exercise
 * (one record per exercise and session, its best set). The first session of an
 * exercise is not a record. Newest first.
 */
export function findRecords(sets: readonly HistorySet[]): PersonalRecord[] {
    const bySession = new Map<string, HistorySet[]>();
    for (const set of sets) {
        if (set.loadKg <= 0 || set.reps <= 0) {
            continue;
        }
        const key = `${set.exerciseId}|${set.sessionId}`;
        const group = bySession.get(key) ?? [];
        group.push(set);
        bySession.set(key, group);
    }
    const performances = [...bySession.values()]
        .map((group) => {
            const top = group.reduce((best, set) =>
                estimateOneRepMax(set.loadKg, set.reps) > estimateOneRepMax(best.loadKg, best.reps)
                    ? set
                    : best,
            );
            const heaviest = Math.max(...group.map((set) => set.loadKg));
            return { top, heaviest, estimate: estimateOneRepMax(top.loadKg, top.reps) };
        })
        .sort((a, b) => a.top.day.localeCompare(b.top.day) || a.top.hour - b.top.hour);

    const best = new Map<string, number>();
    const previousHeaviest = new Map<string, number>();
    const records: PersonalRecord[] = [];
    for (const { top, heaviest, estimate } of performances) {
        const before = best.get(top.exerciseId);
        if (before !== undefined && estimate > before) {
            records.push({
                exerciseId: top.exerciseId,
                day: top.day,
                hour: top.hour,
                loadKg: top.loadKg,
                reps: top.reps,
                gainKg: Math.max(
                    0,
                    top.loadKg - (previousHeaviest.get(top.exerciseId) ?? top.loadKg),
                ),
            });
        }
        best.set(top.exerciseId, Math.max(before ?? 0, estimate));
        previousHeaviest.set(top.exerciseId, heaviest);
    }
    return records.sort((a, b) => b.day.localeCompare(a.day) || b.hour - a.hour);
}

/** Records per start hour, and the hour with the most (the earliest on a tie), or null with none. */
export function bestHour(hours: readonly number[]): { counts: number[]; best: number | null } {
    const counts = Array.from({ length: 24 }, () => 0);
    for (const hour of hours) {
        if (hour >= 0 && hour < 24) {
            counts[hour] += 1;
        }
    }
    const top = Math.max(...counts);
    return { counts, best: top === 0 ? null : counts.indexOf(top) };
}

export type MonthTotals = {
    readonly workouts: number;
    readonly minutes: number;
    readonly volumeKg: number;
    readonly records: number;
};

/** "6 h 40 min" as parts, so the digits can be drawn in Doto and the units in Mona. */
export function hoursAndMinutes(totalMinutes: number): { hours: number; minutes: number } {
    const rounded = Math.max(0, Math.round(totalMinutes));
    return { hours: Math.floor(rounded / 60), minutes: rounded % 60 };
}

/**
 * How long a workout will take: the average of its last finished sessions when
 * there are any, otherwise about 2.5 minutes per set. Rounded to 5 minutes.
 */
export function estimateMinutes(pastMinutes: readonly number[], totalSets: number): number {
    const recent = pastMinutes.filter((minutes) => minutes > 0).slice(-5);
    const raw =
        recent.length > 0
            ? recent.reduce((sum, minutes) => sum + minutes, 0) / recent.length
            : totalSets * 2.5;
    return Math.max(5, Math.round(raw / 5) * 5);
}

/** The ordinal of the next session of the week: done + 1 ("4ª"). */
export function nextSessionOrdinal(doneThisWeek: number): string {
    return `${doneThisWeek + 1}ª`;
}
