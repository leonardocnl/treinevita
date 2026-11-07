import type { Database } from "@/platform/db/drivers";
import type { TenantContext } from "@/shared/db/tenant";

import { prescribedExercises, programs, workouts } from "./schema";

/**
 * The owner's current A/B/C plan, created with the personal workspace on first
 * sign-in and by the local seed. `slug` points to the global catalog.
 */
export type StarterPrescription = {
    slug: string;
    repMin?: number;
    repMax?: number;
    durationMin?: number;
    durationMax?: number;
    restSeconds: number;
};

export const STARTER_WORKOUTS: { label: string; exercises: StarterPrescription[] }[] = [
    {
        label: "A",
        exercises: [
            {
                slug: "incline_machine_press",
                repMin: 10,
                repMax: 12,
                restSeconds: 90,
            },
            {
                slug: "neutral_machine_row",
                repMin: 10,
                repMax: 12,
                restSeconds: 90,
            },
            {
                slug: "machine_shoulder_press",
                repMin: 10,
                repMax: 12,
                restSeconds: 90,
            },
            { slug: "leg_extension", repMin: 10, repMax: 12, restSeconds: 60 },
            {
                slug: "lying_leg_curl",
                repMin: 10,
                repMax: 12,
                restSeconds: 60,
            },
            {
                slug: "machine_triceps",
                repMin: 10,
                repMax: 12,
                restSeconds: 60,
            },
            {
                slug: "seated_calf_raise",
                repMin: 15,
                repMax: 20,
                restSeconds: 60,
            },
            { slug: "back_extension", repMin: 10, repMax: 12, restSeconds: 60 },
        ],
    },
    {
        label: "B",
        exercises: [
            {
                slug: "barbell_bench_press",
                repMin: 10,
                repMax: 12,
                restSeconds: 120,
            },
            {
                slug: "wide_machine_pulldown",
                repMin: 10,
                repMax: 12,
                restSeconds: 90,
            },
            {
                slug: "reverse_pec_deck",
                repMin: 10,
                repMax: 12,
                restSeconds: 60,
            },
            {
                slug: "concentration_curl",
                repMin: 10,
                repMax: 12,
                restSeconds: 60,
            },
            {
                slug: "horizontal_leg_press",
                repMin: 10,
                repMax: 12,
                restSeconds: 120,
            },
            {
                slug: "seated_leg_curl",
                repMin: 10,
                repMax: 12,
                restSeconds: 60,
            },
            { slug: "hip_abduction", repMin: 15, repMax: 20, restSeconds: 60 },
            {
                slug: "front_plank",
                durationMin: 30,
                durationMax: 45,
                restSeconds: 60,
            },
        ],
    },
    {
        label: "C",
        exercises: [
            {
                slug: "dumbbell_stiff",
                repMin: 10,
                repMax: 12,
                restSeconds: 90,
            },
            { slug: "leg_press_45", repMin: 10, repMax: 12, restSeconds: 120 },
            {
                slug: "machine_chest_press",
                repMin: 10,
                repMax: 12,
                restSeconds: 90,
            },
            {
                slug: "neutral_cable_row",
                repMin: 10,
                repMax: 12,
                restSeconds: 90,
            },
            { slug: "ez_bar_curl", repMin: 10, repMax: 12, restSeconds: 60 },
            { slug: "skull_crusher", repMin: 10, repMax: 12, restSeconds: 60 },
            {
                slug: "cable_lateral_raise",
                repMin: 10,
                repMax: 12,
                restSeconds: 60,
            },
            { slug: "floor_crunch", repMin: 15, repMax: 20, restSeconds: 60 },
        ],
    },
];

/** Training days of the mock history (local dates): 16 weeks, a few missed days, the Friday of the current week missing on purpose. */

export type StarterProgram = {
    label: string;
    workoutId: string;
    prescriptions: { id: string; exerciseId: string; slug: string }[];
}[];

/** Inserts the starter program; `exercises` maps catalog slugs to ids and increments. */
export async function insertStarterProgram(
    db: Database,
    context: TenantContext,
    exercises: ReadonlyMap<string, { id: string; incrementKg: number }>,
    startedOn: string,
): Promise<StarterProgram> {
    const [program] = await db
        .insert(programs)
        .values({
            workspaceId: context.workspaceId,
            athleteUserId: context.userId,
            createdByUserId: context.userId,
            name: "Ficha de novembro",
            startedOn,
        })
        .returning({ id: programs.id });

    const result: StarterProgram = [];
    for (const [position, { label, exercises: plan }] of STARTER_WORKOUTS.entries()) {
        const [workout] = await db
            .insert(workouts)
            .values({ workspaceId: context.workspaceId, programId: program.id, label, position })
            .returning({ id: workouts.id });

        const rows = plan.map((seed, index) => {
            const exercise = exercises.get(seed.slug);
            if (!exercise) {
                throw new Error(`Exercise missing from the catalog: ${seed.slug}`);
            }
            return {
                workspaceId: context.workspaceId,
                workoutId: workout.id,
                exerciseId: exercise.id,
                position: index,
                sets: 3,
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
                .map(({ id, exerciseId, position }) => ({
                    id,
                    exerciseId,
                    slug: plan[position].slug,
                })),
        });
    }
    return result;
}
