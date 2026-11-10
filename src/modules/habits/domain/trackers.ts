/**
 * Manual trackers: what can be tracked, the strict range of each value, the
 * default goals and the summaries the home widgets show. Pure: no framework or database.
 */
import { z } from "zod";

export const TRACKER_KINDS = ["sleep", "water", "steps", "energy", "custom"] as const;
export type TrackerKind = (typeof TRACKER_KINDS)[number];
export type BuiltInKind = Exclude<TrackerKind, "custom">;
export const BUILT_IN_KINDS: readonly BuiltInKind[] = ["sleep", "water", "steps", "energy"];

/** A custom tracker is yes/no, a number with a unit, or a time (in minutes). */
export const VALUE_TYPES = ["boolean", "number", "time"] as const;
export type ValueType = (typeof VALUE_TYPES)[number];

export const MAX_CUSTOM_TRACKERS = 10;
export const CUSTOM_NAME = { min: 1, max: 30 } as const;

type Range = { readonly min: number; readonly max: number; readonly step: number };

/** The strict range of every value (ADR 0013). Anything outside is rejected. */
export const RANGES = {
    sleep: { min: 0, max: 24, step: 0.5 },
    water: { min: 0, max: 10, step: 0.25 },
    steps: { min: 0, max: 100_000, step: 500 },
    cardio: { min: 0, max: 600, step: 5 },
    energy: { min: 1, max: 5, step: 1 },
    boolean: { min: 0, max: 1, step: 1 },
    number: { min: 0, max: 100_000, step: 1 },
    time: { min: 0, max: 1440, step: 5 },
} as const satisfies Record<string, Range>;

/** Goals per day (sleep, water, steps) or per week (custom: days done). */
export const DEFAULT_GOALS: Record<BuiltInKind, number> = {
    sleep: 8,
    water: 2.5,
    steps: 8000,
    energy: 5,
};

export function rangeFor(kind: TrackerKind, valueType: ValueType | null): Range {
    if (kind === "custom") {
        return RANGES[valueType ?? "number"];
    }
    return RANGES[kind];
}

/** True when the value is inside the range and on its step. */
export function isValidValue(value: number, range: Range): boolean {
    if (!Number.isFinite(value) || value < range.min || value > range.max) {
        return false;
    }
    const steps = (value - range.min) / range.step;
    return Math.abs(steps - Math.round(steps)) < 1e-9;
}

export const customTrackerSchema = z.object({
    name: z.string().trim().min(CUSTOM_NAME.min).max(CUSTOM_NAME.max),
    valueType: z.enum(VALUE_TYPES),
    unit: z.string().trim().max(8).nullable(),
    /** Yes/no: days per week (1–7). Number and time: per day, inside its range. */
    goal: z.number().min(0).max(100_000),
});
export type CustomTrackerInput = z.infer<typeof customTrackerSchema>;

export function isValidGoal(input: CustomTrackerInput): boolean {
    if (input.valueType === "boolean") {
        return Number.isInteger(input.goal) && input.goal >= 1 && input.goal <= 7;
    }
    const range = RANGES[input.valueType];
    return input.goal > 0 && input.goal <= range.max;
}

export type Entry = {
    readonly day: string;
    readonly value: number;
    readonly secondary: number | null;
};

/** The entry of each of the 7 days from `weekStart`, or null. */
export function weekEntries(entries: readonly Entry[], days: readonly string[]): (Entry | null)[] {
    const byDay = new Map(entries.map((entry) => [entry.day, entry]));
    return days.map((day) => byDay.get(day) ?? null);
}

/** The average of the logged days (not of every day), or null with none. */
export function averageOf(entries: readonly (Entry | null)[]): number | null {
    const logged = entries.filter((entry): entry is Entry => entry !== null);
    if (logged.length === 0) {
        return null;
    }
    return logged.reduce((sum, entry) => sum + entry.value, 0) / logged.length;
}

/** A day counts as done for a custom tracker when it is "yes", or reaches the goal. */
export function isDayDone(entry: Entry | null, valueType: ValueType, goal: number): boolean {
    if (!entry) {
        return false;
    }
    return valueType === "boolean" ? entry.value >= 1 : entry.value >= goal;
}
