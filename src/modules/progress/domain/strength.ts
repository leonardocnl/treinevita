/**
 * Pure strength math. No framework, no database: easy to test and reuse in
 * the future public API.
 */

export type SetType = "warmup" | "working" | "drop" | "failure";

export type LoggedSet = {
    readonly loadKg: number;
    readonly reps: number;
    readonly setType: SetType;
};

/**
 * Estimated one-rep max (Epley formula): load × (1 + reps / 30).
 * Puts "40 kg × 12" and "42 kg × 9" on the same scale.
 */
export function estimateOneRepMax(loadKg: number, reps: number): number {
    if (loadKg <= 0 || reps <= 0) {
        return 0;
    }
    if (reps === 1) {
        return loadKg;
    }
    return loadKg * (1 + reps / 30);
}

/** Volume of a set: load × reps. */
export function setVolume(set: Pick<LoggedSet, "loadKg" | "reps">): number {
    return Math.max(0, set.loadKg) * Math.max(0, set.reps);
}

/** Only working and failure sets count for progression and records. */
export function isEffectiveSet(set: LoggedSet): boolean {
    return set.setType === "working" || set.setType === "failure";
}

/** Best estimated one-rep max among the effective sets of a session. */
export function bestOneRepMax(sets: readonly LoggedSet[]): number {
    return sets
        .filter(isEffectiveSet)
        .reduce((best, set) => Math.max(best, estimateOneRepMax(set.loadKg, set.reps)), 0);
}
