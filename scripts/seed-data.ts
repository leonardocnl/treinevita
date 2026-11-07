/**
 * Mock data for local development: the owner's current program (A/B/C) and
 * six weeks of plausible history. Every number here is fictional.
 */

export type ExerciseSeed = {
    key: string;
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

export const muscleGroupSeeds = [
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

export const exerciseSeeds: ExerciseSeed[] = [
    {
        key: "incline_machine_press",
        name: "Supino articulado inclinado",
        equipment: "machine",
        movementPattern: "horizontal_push",
        incrementKg: 2.5,
        primary: ["chest"],
        secondary: ["front_delts", "triceps"],
    },
    {
        key: "neutral_machine_row",
        name: "Remada articulada neutra",
        equipment: "machine",
        movementPattern: "horizontal_pull",
        incrementKg: 2.5,
        primary: ["upper_back", "lats"],
        secondary: ["biceps", "rear_delts"],
    },
    {
        key: "machine_shoulder_press",
        name: "Desenvolvimento articulado aberto",
        equipment: "machine",
        movementPattern: "vertical_push",
        incrementKg: 2.5,
        primary: ["front_delts"],
        secondary: ["triceps", "side_delts"],
    },
    {
        key: "leg_extension",
        name: "Banco extensor",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["quads"],
    },
    {
        key: "lying_leg_curl",
        name: "Mesa flexora",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["hamstrings"],
    },
    {
        key: "machine_triceps",
        name: "Tríceps máquina",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["triceps"],
    },
    {
        key: "seated_calf_raise",
        name: "Banco sóleo",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["calves"],
    },
    {
        key: "back_extension",
        name: "Extensão lombar no banco romano",
        equipment: "bodyweight",
        movementPattern: "hinge",
        incrementKg: 2.5,
        primary: ["lower_back"],
        secondary: ["glutes", "hamstrings"],
    },
    {
        key: "barbell_bench_press",
        name: "Supino reto com barra",
        equipment: "barbell",
        movementPattern: "horizontal_push",
        incrementKg: 2.5,
        primary: ["chest"],
        secondary: ["front_delts", "triceps"],
    },
    {
        key: "wide_machine_pulldown",
        name: "Puxador articulado aberto",
        equipment: "machine",
        movementPattern: "vertical_pull",
        incrementKg: 2.5,
        primary: ["lats"],
        secondary: ["biceps", "upper_back"],
    },
    {
        key: "reverse_pec_deck",
        name: "Crucifixo inverso",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["rear_delts"],
        secondary: ["upper_back"],
    },
    {
        key: "concentration_curl",
        name: "Rosca concentrada",
        equipment: "dumbbell",
        movementPattern: "isolation",
        incrementKg: 1,
        primary: ["biceps"],
    },
    {
        key: "horizontal_leg_press",
        name: "Leg press 180°",
        equipment: "machine",
        movementPattern: "squat",
        incrementKg: 5,
        primary: ["quads"],
        secondary: ["glutes"],
    },
    {
        key: "seated_leg_curl",
        name: "Banco flexor",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["hamstrings"],
    },
    {
        key: "hip_abduction",
        name: "Banco abdutor",
        equipment: "machine",
        movementPattern: "isolation",
        incrementKg: 2.5,
        primary: ["abductors"],
        secondary: ["glutes"],
    },
    {
        key: "front_plank",
        name: "Prancha ventral",
        equipment: "bodyweight",
        movementPattern: "core",
        measurement: "duration",
        incrementKg: 0,
        primary: ["abs"],
    },
    {
        key: "dumbbell_stiff",
        name: "Stiff com halteres",
        equipment: "dumbbell",
        movementPattern: "hinge",
        incrementKg: 2,
        primary: ["hamstrings", "glutes"],
        secondary: ["lower_back"],
    },
    {
        key: "leg_press_45",
        name: "Leg press 45°",
        equipment: "machine",
        movementPattern: "squat",
        incrementKg: 5,
        primary: ["quads"],
        secondary: ["glutes"],
    },
    {
        key: "machine_chest_press",
        name: "Supino máquina",
        equipment: "machine",
        movementPattern: "horizontal_push",
        incrementKg: 2.5,
        primary: ["chest"],
        secondary: ["front_delts", "triceps"],
    },
    {
        key: "neutral_cable_row",
        name: "Remada baixa pegada neutra",
        equipment: "cable",
        movementPattern: "horizontal_pull",
        incrementKg: 2.5,
        primary: ["upper_back", "lats"],
        secondary: ["biceps", "rear_delts"],
    },
    {
        key: "ez_bar_curl",
        name: "Rosca direta com barra W",
        equipment: "barbell",
        movementPattern: "isolation",
        incrementKg: 2,
        primary: ["biceps"],
    },
    {
        key: "skull_crusher",
        name: "Tríceps testa no banco 30°",
        equipment: "barbell",
        movementPattern: "isolation",
        incrementKg: 2,
        primary: ["triceps"],
    },
    {
        key: "cable_lateral_raise",
        name: "Elevação lateral no cross",
        equipment: "cable",
        movementPattern: "isolation",
        incrementKg: 1.25,
        primary: ["side_delts"],
    },
    {
        key: "floor_crunch",
        name: "Abdominal supra no solo",
        equipment: "bodyweight",
        movementPattern: "core",
        incrementKg: 0,
        primary: ["abs"],
    },
];

export type PrescriptionSeed = {
    exercise: string;
    repMin?: number;
    repMax?: number;
    durationMin?: number;
    durationMax?: number;
    startLoadKg: number;
    restSeconds: number;
    /** Simulates an exercise that stopped progressing (for the stagnation warning). */
    stuck?: boolean;
};

export const workoutSeeds: { label: string; exercises: PrescriptionSeed[] }[] = [
    {
        label: "A",
        exercises: [
            {
                exercise: "incline_machine_press",
                repMin: 10,
                repMax: 12,
                startLoadKg: 25,
                restSeconds: 90,
            },
            {
                exercise: "neutral_machine_row",
                repMin: 10,
                repMax: 12,
                startLoadKg: 30,
                restSeconds: 90,
            },
            {
                exercise: "machine_shoulder_press",
                repMin: 10,
                repMax: 12,
                startLoadKg: 20,
                restSeconds: 90,
                stuck: true,
            },
            { exercise: "leg_extension", repMin: 10, repMax: 12, startLoadKg: 30, restSeconds: 60 },
            {
                exercise: "lying_leg_curl",
                repMin: 10,
                repMax: 12,
                startLoadKg: 25,
                restSeconds: 60,
            },
            {
                exercise: "machine_triceps",
                repMin: 10,
                repMax: 12,
                startLoadKg: 20,
                restSeconds: 60,
            },
            {
                exercise: "seated_calf_raise",
                repMin: 15,
                repMax: 20,
                startLoadKg: 20,
                restSeconds: 60,
            },
            { exercise: "back_extension", repMin: 10, repMax: 12, startLoadKg: 0, restSeconds: 60 },
        ],
    },
    {
        label: "B",
        exercises: [
            {
                exercise: "barbell_bench_press",
                repMin: 10,
                repMax: 12,
                startLoadKg: 20,
                restSeconds: 120,
            },
            {
                exercise: "wide_machine_pulldown",
                repMin: 10,
                repMax: 12,
                startLoadKg: 35,
                restSeconds: 90,
            },
            {
                exercise: "reverse_pec_deck",
                repMin: 10,
                repMax: 12,
                startLoadKg: 15,
                restSeconds: 60,
            },
            {
                exercise: "concentration_curl",
                repMin: 10,
                repMax: 12,
                startLoadKg: 8,
                restSeconds: 60,
            },
            {
                exercise: "horizontal_leg_press",
                repMin: 10,
                repMax: 12,
                startLoadKg: 60,
                restSeconds: 120,
            },
            {
                exercise: "seated_leg_curl",
                repMin: 10,
                repMax: 12,
                startLoadKg: 25,
                restSeconds: 60,
            },
            { exercise: "hip_abduction", repMin: 15, repMax: 20, startLoadKg: 30, restSeconds: 60 },
            {
                exercise: "front_plank",
                durationMin: 30,
                durationMax: 45,
                startLoadKg: 0,
                restSeconds: 60,
            },
        ],
    },
    {
        label: "C",
        exercises: [
            {
                exercise: "dumbbell_stiff",
                repMin: 10,
                repMax: 12,
                startLoadKg: 12,
                restSeconds: 90,
            },
            { exercise: "leg_press_45", repMin: 10, repMax: 12, startLoadKg: 80, restSeconds: 120 },
            {
                exercise: "machine_chest_press",
                repMin: 10,
                repMax: 12,
                startLoadKg: 27.5,
                restSeconds: 90,
            },
            {
                exercise: "neutral_cable_row",
                repMin: 10,
                repMax: 12,
                startLoadKg: 30,
                restSeconds: 90,
            },
            { exercise: "ez_bar_curl", repMin: 10, repMax: 12, startLoadKg: 14, restSeconds: 60 },
            { exercise: "skull_crusher", repMin: 10, repMax: 12, startLoadKg: 12, restSeconds: 60 },
            {
                exercise: "cable_lateral_raise",
                repMin: 10,
                repMax: 12,
                startLoadKg: 5,
                restSeconds: 60,
            },
            { exercise: "floor_crunch", repMin: 15, repMax: 20, startLoadKg: 0, restSeconds: 60 },
        ],
    },
];

/** Training days of the mock history (local dates). The Friday of the current week is missing on purpose. */
export function trainingDays(): { date: string; label: string }[] {
    const days: { date: string; label: string }[] = [];
    const firstMonday = new Date(Date.UTC(2026, 8, 28));
    const skipped = new Set(["2026-10-16", "2026-11-06"]);
    let rotation = 0;
    const labels = ["A", "B", "C"];

    for (let week = 0; week < 6; week += 1) {
        for (const offset of [0, 2, 4]) {
            const day = new Date(firstMonday);
            day.setUTCDate(firstMonday.getUTCDate() + week * 7 + offset);
            const date = day.toISOString().slice(0, 10);
            if (skipped.has(date)) {
                continue;
            }
            days.push({ date, label: labels[rotation % 3] });
            rotation += 1;
        }
    }
    return days;
}

/** Weekly weigh-ins (Saturday mornings). */
export const bodyMeasurementSeeds = [
    { measuredOn: "2026-10-03", weightKg: 61.6, waistCm: 76.0, bodyFatPercent: 14.5 },
    { measuredOn: "2026-10-10", weightKg: 61.9, waistCm: 76.0 },
    { measuredOn: "2026-10-17", weightKg: 62.1, waistCm: 76.2 },
    { measuredOn: "2026-10-24", weightKg: 62.4, waistCm: 76.3 },
    { measuredOn: "2026-10-31", weightKg: 62.6, waistCm: 76.3 },
    { measuredOn: "2026-11-07", weightKg: 63.0, waistCm: 76.5 },
];
