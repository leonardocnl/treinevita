import { z } from "zod";

/**
 * Code-defined program templates offered in the onboarding. Every `slug`
 * points to the global catalog. The person edits a draft (only the exercise
 * slugs per day); the server rebuilds the prescriptions from the template, so
 * sets and rep ranges never come from the client.
 */
export type Prescription = {
    slug: string;
    sets?: number;
    repMin?: number;
    repMax?: number;
    durationMin?: number;
    durationMax?: number;
    restSeconds: number;
};

export type TemplateDay = {
    label: string;
    /** What the day trains, shown on the review screen ("Superior"). */
    title?: string;
    exercises: Prescription[];
};

export const TEMPLATE_IDS = ["abc", "full_body", "upper_lower", "push_pull_legs"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type ProgramTemplate = {
    id: TemplateId;
    name: string;
    description: string;
    /** How many times a week the model is meant to be trained. */
    daysPerWeek: number;
    /** One sentence on who the model is for, shown on its card. */
    audience: string;
    days: TemplateDay[];
};

const reps = (slug: string, restSeconds = 60, repMin = 10, repMax = 12): Prescription => ({
    slug,
    repMin,
    repMax,
    restSeconds,
});

/** The owner's current A/B/C plan; the local seed uses the same data. */
export const STARTER_WORKOUTS: TemplateDay[] = [
    {
        label: "A",
        exercises: [
            reps("incline_machine_press", 90),
            reps("neutral_machine_row", 90),
            reps("machine_shoulder_press", 90),
            reps("leg_extension"),
            reps("lying_leg_curl"),
            reps("machine_triceps"),
            reps("seated_calf_raise", 60, 15, 20),
            reps("back_extension"),
        ],
    },
    {
        label: "B",
        exercises: [
            reps("barbell_bench_press", 120),
            reps("wide_machine_pulldown", 90),
            reps("reverse_pec_deck"),
            reps("concentration_curl"),
            reps("horizontal_leg_press", 120),
            reps("seated_leg_curl"),
            reps("hip_abduction", 60, 15, 20),
            { slug: "front_plank", durationMin: 30, durationMax: 45, restSeconds: 60 },
        ],
    },
    {
        label: "C",
        exercises: [
            reps("dumbbell_stiff", 90),
            reps("leg_press_45", 120),
            reps("machine_chest_press", 90),
            reps("neutral_cable_row", 90),
            reps("ez_bar_curl"),
            reps("skull_crusher"),
            reps("cable_lateral_raise"),
            reps("floor_crunch", 60, 15, 20),
        ],
    },
];

export const TEMPLATES: Record<TemplateId, ProgramTemplate> = {
    abc: {
        id: "abc",
        name: "A/B/C",
        description: "Três treinos que se alternam, cada um com o corpo todo dividido em partes.",
        daysPerWeek: 3,
        audience: "Para quem já treina e quer dividir o corpo em três treinos.",
        days: STARTER_WORKOUTS,
    },
    full_body: {
        id: "full_body",
        name: "Corpo inteiro",
        description: "Três vezes por semana, o corpo todo em cada treino.",
        daysPerWeek: 3,
        audience: "Para quem está começando ou treina poucas vezes por semana.",
        days: [
            {
                label: "A",
                exercises: [
                    reps("leg_press_45", 120, 8, 12),
                    reps("machine_chest_press", 90, 8, 12),
                    reps("neutral_cable_row", 90, 8, 12),
                    reps("lying_leg_curl"),
                    reps("machine_shoulder_press"),
                    { slug: "front_plank", durationMin: 30, durationMax: 45, restSeconds: 60 },
                ],
            },
            {
                label: "B",
                exercises: [
                    reps("dumbbell_stiff", 90, 8, 12),
                    reps("barbell_bench_press", 120, 8, 12),
                    reps("wide_machine_pulldown", 90, 8, 12),
                    reps("leg_extension"),
                    reps("cable_lateral_raise"),
                    reps("floor_crunch", 60, 15, 20),
                ],
            },
        ],
    },
    upper_lower: {
        id: "upper_lower",
        name: "Superior e inferior",
        description: "Quatro vezes por semana, alternando a parte de cima e a de baixo.",
        daysPerWeek: 4,
        audience: "Para quem quer ganhar força, com mais descanso para cada músculo.",
        days: [
            {
                label: "A",
                title: "Superior",
                exercises: [
                    reps("barbell_bench_press", 120, 6, 10),
                    reps("neutral_cable_row", 90, 6, 10),
                    reps("machine_shoulder_press", 90, 8, 12),
                    reps("wide_machine_pulldown", 90, 8, 12),
                    reps("ez_bar_curl"),
                    reps("skull_crusher"),
                ],
            },
            {
                label: "B",
                title: "Inferior",
                exercises: [
                    reps("leg_press_45", 120, 6, 10),
                    reps("dumbbell_stiff", 120, 6, 10),
                    reps("leg_extension"),
                    reps("seated_leg_curl"),
                    reps("seated_calf_raise", 60, 15, 20),
                    reps("floor_crunch", 60, 15, 20),
                ],
            },
        ],
    },
    push_pull_legs: {
        id: "push_pull_legs",
        name: "Empurrar, puxar e pernas",
        description: "Um treino para empurrar, um para puxar e um para as pernas.",
        daysPerWeek: 3,
        audience: "Para quem já tem experiência e quer mais volume por músculo.",
        days: [
            {
                label: "A",
                title: "Empurrar",
                exercises: [
                    reps("barbell_bench_press", 120, 8, 10),
                    reps("incline_machine_press", 90),
                    reps("machine_shoulder_press", 90),
                    reps("cable_lateral_raise"),
                    reps("machine_triceps"),
                    reps("skull_crusher"),
                ],
            },
            {
                label: "B",
                title: "Puxar",
                exercises: [
                    reps("wide_machine_pulldown", 90, 8, 10),
                    reps("neutral_cable_row", 90),
                    reps("neutral_machine_row", 90),
                    reps("reverse_pec_deck"),
                    reps("ez_bar_curl"),
                    reps("concentration_curl"),
                ],
            },
            {
                label: "C",
                title: "Pernas",
                exercises: [
                    reps("leg_press_45", 120, 8, 10),
                    reps("dumbbell_stiff", 90),
                    reps("leg_extension"),
                    reps("lying_leg_curl"),
                    reps("hip_abduction", 60, 15, 20),
                    reps("seated_calf_raise", 60, 15, 20),
                ],
            },
        ],
    },
};

type Answers = { goal: string; experience: string; trainingPlace: string | null };

/**
 * The template that fits the answers best, with a one-line reason for its card.
 * The person can still pick any.
 */
export function suggest(answers: Answers): { templateId: TemplateId; reason: string } {
    if (answers.trainingPlace === "home" || answers.trainingPlace === "basic_gym") {
        return { templateId: "full_body", reason: "Funciona bem com poucos aparelhos." };
    }
    if (answers.goal === "strength") {
        return {
            templateId: "upper_lower",
            reason: "Para ganhar força: cada músculo descansa entre os treinos.",
        };
    }
    if (answers.experience === "beginner") {
        return {
            templateId: "full_body",
            reason: "Simples para começar: o corpo todo em cada treino.",
        };
    }
    if (answers.goal === "conditioning" || answers.goal === "health") {
        return {
            templateId: "full_body",
            reason: "O corpo todo em cada treino, bom para fôlego e saúde.",
        };
    }
    return answers.experience === "advanced"
        ? {
              templateId: "push_pull_legs",
              reason: "Mais volume por músculo para quem já tem experiência.",
          }
        : { templateId: "abc", reason: "Equilibra volume e descanso para quem já treina." };
}

/** The suggested template id (see `suggest`). */
export function suggestTemplate(answers: Answers): TemplateId {
    return suggest(answers).templateId;
}

/** What the review screen edits: the exercises (catalog slugs) of each day. */
export type ProgramDraft = {
    templateId: TemplateId;
    days: { label: string; title?: string; slugs: string[] }[];
};

export function buildDraft(templateId: TemplateId): ProgramDraft {
    return {
        templateId,
        days: TEMPLATES[templateId].days.map((day) => ({
            label: day.label,
            title: day.title,
            slugs: day.exercises.map((exercise) => exercise.slug),
        })),
    };
}

function mapDay(
    draft: ProgramDraft,
    dayIndex: number,
    change: (slugs: string[]) => string[],
): ProgramDraft {
    return {
        ...draft,
        days: draft.days.map((day, index) =>
            index === dayIndex ? { ...day, slugs: change(day.slugs) } : day,
        ),
    };
}

export function removeExercise(draft: ProgramDraft, dayIndex: number, position: number) {
    return mapDay(draft, dayIndex, (slugs) => slugs.filter((_, index) => index !== position));
}

export function replaceExercise(
    draft: ProgramDraft,
    dayIndex: number,
    position: number,
    slug: string,
) {
    return mapDay(draft, dayIndex, (slugs) =>
        slugs.map((current, index) => (index === position ? slug : current)),
    );
}

export function addExercise(draft: ProgramDraft, dayIndex: number, slug: string) {
    return mapDay(draft, dayIndex, (slugs) => (slugs.includes(slug) ? slugs : [...slugs, slug]));
}

/** "Limpar ficha": keeps the days, empties every one of them. */
export function clearDraft(draft: ProgramDraft): ProgramDraft {
    return { ...draft, days: draft.days.map((day) => ({ ...day, slugs: [] })) };
}

export const MAX_EXERCISES_PER_DAY = 12;

const slugSchema = z.string().regex(/^[a-z0-9_]{1,60}$/);

/** The program choice sent by the onboarding. Only slugs travel; the server checks them. */
export const programChoiceSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("keep") }),
    z.object({
        kind: z.literal("template"),
        templateId: z.enum(TEMPLATE_IDS),
        days: z.array(z.array(slugSchema).min(1).max(MAX_EXERCISES_PER_DAY)).min(1).max(7),
    }),
]);

export type ProgramChoice = z.infer<typeof programChoiceSchema>;

/**
 * Turns the chosen slugs back into full days. An exercise kept from the
 * template keeps its prescription; one added or swapped in gets the default
 * (3 × 10–12, or 30–45 s for exercises by time). Returns null when the days
 * do not fit the template or repeat an exercise.
 */
export function resolveDays(
    templateId: TemplateId,
    days: readonly (readonly string[])[],
    isDuration: (slug: string) => boolean,
): TemplateDay[] | null {
    const template = TEMPLATES[templateId];
    if (days.length !== template.days.length) {
        return null;
    }
    if (days.some((slugs) => new Set(slugs).size !== slugs.length)) {
        return null;
    }
    return template.days.map((day, index) => ({
        label: day.label,
        title: day.title,
        exercises: days[index].map(
            (slug) =>
                day.exercises.find((exercise) => exercise.slug === slug) ??
                (isDuration(slug)
                    ? { slug, durationMin: 30, durationMax: 45, restSeconds: 60 }
                    : reps(slug, 90)),
        ),
    }));
}
