import { sql } from "drizzle-orm";

import type { Database } from "@/platform/db/drivers";

import { exerciseMuscleGroups, exercises, muscleGroups } from "./schema";

/**
 * The global exercise catalog (workspace_id null), seeded on every deploy.
 * `slug` is the stable key that makes the seed idempotent.
 */
export type GlobalExercise = {
    slug: string;
    name: string;
    equipment: "machine" | "barbell" | "dumbbell" | "cable" | "bodyweight" | "other";
    movementPattern:
        | "horizontal_push"
        | "vertical_push"
        | "horizontal_pull"
        | "vertical_pull"
        | "squat"
        | "hinge"
        | "lunge"
        | "isolation"
        | "core";
    measurement?: "load_reps" | "duration";
    incrementKg: number;
    primary: string[];
    secondary?: string[];
};

export const GLOBAL_MUSCLE_GROUPS = [
    { slug: "chest", name: "Peito" },
    { slug: "upper_back", name: "Costas (meio)" },
    { slug: "lats", name: "Dorsais" },
    { slug: "front_delts", name: "Ombro (frente)" },
    { slug: "side_delts", name: "Ombro (lateral)" },
    { slug: "rear_delts", name: "Ombro (posterior)" },
    { slug: "biceps", name: "Bíceps" },
    { slug: "triceps", name: "Tríceps" },
    { slug: "quads", name: "Quadríceps" },
    { slug: "hamstrings", name: "Posterior de coxa" },
    { slug: "glutes", name: "Glúteos" },
    { slug: "calves", name: "Panturrilha" },
    { slug: "abductors", name: "Abdutores" },
    { slug: "lower_back", name: "Lombar" },
    { slug: "abs", name: "Abdômen" },
] as const;

export const GLOBAL_EXERCISES: GlobalExercise[] = [
    {
        slug: "incline_machine_press",
        name: "Supino articulado inclinado",
        equipment: "machine",
        movementPattern: "horizontal_push",
        incrementKg: 2.5,
        primary: ["chest"],
        secondary: ["front_delts", "triceps"],
    },
    {
        slug: "neutral_machine_row",
        name: "Remada articulada neutra",
        equipment: "machine",
        movementPattern: "horizontal_pull",
        incrementKg: 2.5,
        primary: ["upper_back", "lats"],
        secondary: ["biceps", "rear_delts"],
    },
    {
        slug: "machine_shoulder_press",
        name: "Desenvolvimento articulado aberto",
        equipment: "machine",
        movementPattern: "vertical_push",
        incrementKg: 2.5,
        primary: ["front_delts"],
        secondary: ["triceps", "side_delts"],
    },
    {
        slug: "leg_extension",
        name: "Banco extensor",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["quads"],
    },
    {
        slug: "lying_leg_curl",
        name: "Mesa flexora",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["hamstrings"],
    },
    {
        slug: "machine_triceps",
        name: "Tríceps máquina",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["triceps"],
    },
    {
        slug: "seated_calf_raise",
        name: "Banco sóleo",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["calves"],
    },
    {
        slug: "back_extension",
        name: "Extensão lombar no banco romano",
        equipment: "bodyweight",
        movementPattern: "hinge",
        incrementKg: 2.5,
        primary: ["lower_back"],
        secondary: ["glutes", "hamstrings"],
    },
    {
        slug: "barbell_bench_press",
        name: "Supino reto com barra",
        equipment: "barbell",
        movementPattern: "horizontal_push",
        incrementKg: 2.5,
        primary: ["chest"],
        secondary: ["front_delts", "triceps"],
    },
    {
        slug: "wide_machine_pulldown",
        name: "Puxador articulado aberto",
        equipment: "machine",
        movementPattern: "vertical_pull",
        incrementKg: 2.5,
        primary: ["lats"],
        secondary: ["biceps", "upper_back"],
    },
    {
        slug: "reverse_pec_deck",
        name: "Crucifixo inverso",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["rear_delts"],
        secondary: ["upper_back"],
    },
    {
        slug: "concentration_curl",
        name: "Rosca concentrada",
        equipment: "dumbbell",
        movementPattern: "isolation",
        incrementKg: 1,
        primary: ["biceps"],
    },
    {
        slug: "horizontal_leg_press",
        name: "Leg press 180°",
        equipment: "machine",
        movementPattern: "squat",
        incrementKg: 5,
        primary: ["quads"],
        secondary: ["glutes"],
    },
    {
        slug: "seated_leg_curl",
        name: "Banco flexor",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["hamstrings"],
    },
    {
        slug: "hip_abduction",
        name: "Banco abdutor",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["abductors"],
        secondary: ["glutes"],
    },
    {
        slug: "front_plank",
        name: "Prancha ventral",
        equipment: "bodyweight",
        movementPattern: "core",
        measurement: "duration",
        incrementKg: 0,
        primary: ["abs"],
    },
    {
        slug: "dumbbell_stiff",
        name: "Stiff com halteres",
        equipment: "dumbbell",
        movementPattern: "hinge",
        incrementKg: 2,
        primary: ["hamstrings", "glutes"],
        secondary: ["lower_back"],
    },
    {
        slug: "leg_press_45",
        name: "Leg press 45°",
        equipment: "machine",
        movementPattern: "squat",
        incrementKg: 5,
        primary: ["quads"],
        secondary: ["glutes"],
    },
    {
        slug: "machine_chest_press",
        name: "Supino máquina",
        equipment: "machine",
        movementPattern: "horizontal_push",
        incrementKg: 2.5,
        primary: ["chest"],
        secondary: ["front_delts", "triceps"],
    },
    {
        slug: "neutral_cable_row",
        name: "Remada baixa pegada neutra",
        equipment: "cable",
        movementPattern: "horizontal_pull",
        incrementKg: 2.5,
        primary: ["upper_back", "lats"],
        secondary: ["biceps", "rear_delts"],
    },
    {
        slug: "ez_bar_curl",
        name: "Rosca direta com barra W",
        equipment: "barbell",
        movementPattern: "isolation",
        incrementKg: 2,
        primary: ["biceps"],
    },
    {
        slug: "skull_crusher",
        name: "Tríceps testa no banco 30°",
        equipment: "barbell",
        movementPattern: "isolation",
        incrementKg: 2,
        primary: ["triceps"],
    },
    {
        slug: "cable_lateral_raise",
        name: "Elevação lateral no cross",
        equipment: "cable",
        movementPattern: "isolation",
        incrementKg: 1.25,
        primary: ["side_delts"],
    },
    {
        slug: "floor_crunch",
        name: "Abdominal supra no solo",
        equipment: "bodyweight",
        movementPattern: "core",
        incrementKg: 0,
        primary: ["abs"],
    },
];

/** Inserts or updates the global catalog; safe to run on every deploy. Returns ids by slug. */
export async function upsertGlobalCatalog(
    db: Database,
): Promise<Map<string, { id: string; incrementKg: number }>> {
    const result = new Map<string, { id: string; incrementKg: number }>();
    const muscles = await db
        .insert(muscleGroups)
        .values([...GLOBAL_MUSCLE_GROUPS])
        .onConflictDoUpdate({ target: muscleGroups.slug, set: { name: sql`excluded.name` } })
        .returning({ id: muscleGroups.id, slug: muscleGroups.slug });
    const muscleId = new Map(muscles.map((muscle) => [muscle.slug, muscle.id]));

    for (const seed of GLOBAL_EXERCISES) {
        const values = {
            slug: seed.slug,
            name: seed.name,
            equipment: seed.equipment,
            movementPattern: seed.movementPattern,
            measurement: seed.measurement ?? "load_reps",
            defaultIncrementKg: String(seed.incrementKg),
        };
        const [exercise] = await db
            .insert(exercises)
            .values(values)
            .onConflictDoUpdate({ target: exercises.slug, set: values })
            .returning({ id: exercises.id });
        result.set(seed.slug, { id: exercise.id, incrementKg: seed.incrementKg });

        const links = [
            ...seed.primary.map((slug) => ({ slug, role: "primary" as const })),
            ...(seed.secondary ?? []).map((slug) => ({ slug, role: "secondary" as const })),
        ].map(({ slug, role }) => {
            const muscleGroupId = muscleId.get(slug);
            if (!muscleGroupId) {
                throw new Error(`Unknown muscle group: ${slug}`);
            }
            return { exerciseId: exercise.id, muscleGroupId, role };
        });
        await db
            .insert(exerciseMuscleGroups)
            .values(links)
            .onConflictDoUpdate({
                target: [exerciseMuscleGroups.exerciseId, exerciseMuscleGroups.muscleGroupId],
                set: { role: sql`excluded.role` },
            });
    }
    return result;
}
