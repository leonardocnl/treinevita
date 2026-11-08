import type { Database } from "@/platform/db/drivers";
import type { TenantContext } from "@/shared/db/tenant";

import { STARTER_WORKOUTS, type TemplateDay } from "../domain/templates";

import { prescribedExercises, programs, workouts } from "./schema";

export { STARTER_WORKOUTS };

export type StarterProgram = {
    label: string;
    workoutId: string;
    prescriptions: { id: string; exerciseId: string; slug: string }[];
}[];

/**
 * Inserts a program with its days and prescriptions. `exercises` maps catalog
 * slugs to ids and increments; pass the transaction the caller is in.
 */
export async function insertProgram(
    db: Database,
    context: TenantContext,
    plan: { name: string; days: readonly TemplateDay[]; startedOn: string },
    exercises: ReadonlyMap<string, { id: string; incrementKg: number }>,
): Promise<StarterProgram> {
    const [program] = await db
        .insert(programs)
        .values({
            workspaceId: context.workspaceId,
            athleteUserId: context.userId,
            createdByUserId: context.userId,
            name: plan.name,
            startedOn: plan.startedOn,
        })
        .returning({ id: programs.id });

    const result: StarterProgram = [];
    for (const [position, { label, exercises: prescriptions }] of plan.days.entries()) {
        const [workout] = await db
            .insert(workouts)
            .values({ workspaceId: context.workspaceId, programId: program.id, label, position })
            .returning({ id: workouts.id });

        const rows = prescriptions.map((seed, index) => {
            const exercise = exercises.get(seed.slug);
            if (!exercise) {
                throw new Error(`Exercise missing from the catalog: ${seed.slug}`);
            }
            return {
                workspaceId: context.workspaceId,
                workoutId: workout.id,
                exerciseId: exercise.id,
                position: index,
                sets: seed.sets ?? 3,
                repMin: seed.repMin ?? null,
                repMax: seed.repMax ?? null,
                durationMinSeconds: seed.durationMin ?? null,
                durationMaxSeconds: seed.durationMax ?? null,
                restSeconds: seed.restSeconds,
                progressionRule:
                    exercise.incrementKg > 0 ? ("double_progression" as const) : ("none" as const),
            };
        });
        const inserted = await db.insert(prescribedExercises).values(rows).returning({
            id: prescribedExercises.id,
            exerciseId: prescribedExercises.exerciseId,
            position: prescribedExercises.position,
        });
        result.push({
            label,
            workoutId: workout.id,
            prescriptions: inserted
                .sort((a, b) => a.position - b.position)
                .map(({ id, exerciseId, position: index }) => ({
                    id,
                    exerciseId,
                    slug: prescriptions[index].slug,
                })),
        });
    }
    return result;
}

/** The owner's A/B/C plan, used by the local seed. */
export function insertStarterProgram(
    db: Database,
    context: TenantContext,
    exercises: ReadonlyMap<string, { id: string; incrementKg: number }>,
    startedOn: string,
): Promise<StarterProgram> {
    return insertProgram(
        db,
        context,
        { name: "Ficha de novembro", days: STARTER_WORKOUTS, startedOn },
        exercises,
    );
}
