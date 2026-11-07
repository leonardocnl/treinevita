import { isEffectiveSet, type LoggedSet } from "./strength";

export type RepRange = {
    readonly min: number;
    readonly max: number;
};

/**
 * What the app does with the load for the next session.
 *
 * - `increase`: the progression is obvious, so the wheel already opens on the
 *   new load (with a discreet "went up" mark). No question asked.
 * - `keep`: stay on the same load and keep pushing reps.
 * - `ask`: the last session was ambiguous; the app suggests keeping the load
 *   and lets the person decide.
 */
export type LoadDecision =
    | { readonly kind: "increase"; readonly loadKg: number; readonly previousLoadKg: number }
    | { readonly kind: "keep"; readonly loadKg: number }
    | { readonly kind: "ask"; readonly loadKg: number; readonly reason: AskReason };

export type AskReason = "mixed_loads" | "below_range";

export type ProgressionStrategy = (input: {
    readonly lastSets: readonly LoggedSet[];
    readonly range: RepRange;
    readonly incrementKg: number;
}) => LoadDecision | null;

/**
 * Double progression: work inside a rep range; when every working set reaches
 * the top of the range with the same load, increase the load.
 * Returns null when there is no history yet.
 */
export const doubleProgression: ProgressionStrategy = ({ lastSets, range, incrementKg }) => {
    const effective = lastSets.filter(isEffectiveSet);
    if (effective.length === 0) {
        return null;
    }

    const loads = new Set(effective.map((set) => set.loadKg));
    const heaviest = Math.max(...effective.map((set) => set.loadKg));

    if (loads.size > 1) {
        return { kind: "ask", loadKg: heaviest, reason: "mixed_loads" };
    }

    const load = effective[0].loadKg;

    if (effective.every((set) => set.reps >= range.max)) {
        return { kind: "increase", loadKg: roundToStep(load + incrementKg), previousLoadKg: load };
    }

    if (effective.some((set) => set.reps < range.min)) {
        return { kind: "ask", loadKg: load, reason: "below_range" };
    }

    return { kind: "keep", loadKg: load };
};

/** No automatic progression: always repeat the last load. */
export const noProgression: ProgressionStrategy = ({ lastSets }) => {
    const effective = lastSets.filter(isEffectiveSet);
    if (effective.length === 0) {
        return null;
    }
    return { kind: "keep", loadKg: Math.max(...effective.map((set) => set.loadKg)) };
};

export const progressionStrategies = {
    double_progression: doubleProgression,
    none: noProgression,
} as const;

/** Avoids floating point noise such as 37.49999. Loads move in 0.25 kg steps at most. */
function roundToStep(value: number): number {
    return Math.round(value * 4) / 4;
}
