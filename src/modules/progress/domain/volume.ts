import { isEffectiveSet, type LoggedSet } from "./strength";

export type MuscleRole = "primary" | "secondary";

export type SetWithMuscles = LoggedSet & {
    readonly muscles: readonly { readonly slug: string; readonly role: MuscleRole }[];
};

/**
 * Weekly sets per muscle group. A set counts 1 for each primary muscle and
 * 0.5 for each secondary one (the bench press also trains the triceps, but less).
 */
export function weeklySetsByMuscle(sets: readonly SetWithMuscles[]): Map<string, number> {
    const totals = new Map<string, number>();

    for (const set of sets) {
        if (!isEffectiveSet(set)) {
            continue;
        }
        for (const muscle of set.muscles) {
            const weight = muscle.role === "primary" ? 1 : 0.5;
            totals.set(muscle.slug, (totals.get(muscle.slug) ?? 0) + weight);
        }
    }

    return totals;
}
