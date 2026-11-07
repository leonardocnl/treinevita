/**
 * Summary widgets: which exist, which sizes each supports and the default layout.
 * Sizes follow the iOS model: small (1×1), medium (2×1) and large (2×2).
 */

export const WIDGET_SIZES = ["small", "medium", "large"] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

export const WIDGET_KINDS = [
    "weekly_goal",
    "consistency",
    "next_workout",
    "last_workout",
    "body_weight",
    "waist",
    "personal_record",
    "muscle_volume",
    "stagnant_exercises",
] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];

export type WidgetDefinition = {
    readonly kind: WidgetKind;
    readonly title: string;
    readonly description: string;
    readonly sizes: readonly WidgetSize[];
};

export const WIDGET_CATALOG: Record<WidgetKind, WidgetDefinition> = {
    weekly_goal: {
        kind: "weekly_goal",
        title: "Semana",
        description: "Treinos da semana contra a sua meta",
        sizes: ["small", "medium", "large"],
    },
    consistency: {
        kind: "consistency",
        title: "Constância",
        description: "Semanas contra a meta e média de treinos",
        sizes: ["small", "medium", "large"],
    },
    next_workout: {
        kind: "next_workout",
        title: "Próximo treino",
        description: "O treino da vez e o que sobe de carga",
        sizes: ["small", "medium", "large"],
    },
    last_workout: {
        kind: "last_workout",
        title: "Último treino",
        description: "Duração, séries e volume da última sessão",
        sizes: ["small", "medium", "large"],
    },
    body_weight: {
        kind: "body_weight",
        title: "Peso",
        description: "Peso atual e a tendência",
        sizes: ["small", "medium", "large"],
    },
    waist: {
        kind: "waist",
        title: "Cintura",
        description: "Medida da cintura",
        sizes: ["small"],
    },
    personal_record: {
        kind: "personal_record",
        title: "Recordes",
        description: "Suas melhores marcas recentes",
        sizes: ["small", "medium", "large"],
    },
    muscle_volume: {
        kind: "muscle_volume",
        title: "Volume por músculo",
        description: "Séries da semana por grupo muscular",
        sizes: ["small", "medium", "large"],
    },
    stagnant_exercises: {
        kind: "stagnant_exercises",
        title: "Estagnados",
        description: "Exercícios sem progredir há 3 semanas",
        sizes: ["small", "medium", "large"],
    },
};

export type WidgetPlacement = {
    readonly kind: WidgetKind;
    readonly size: WidgetSize;
};

export const DEFAULT_LAYOUT: readonly WidgetPlacement[] = [
    { kind: "weekly_goal", size: "medium" },
    { kind: "body_weight", size: "small" },
    { kind: "personal_record", size: "small" },
    { kind: "next_workout", size: "medium" },
    { kind: "consistency", size: "large" },
    { kind: "last_workout", size: "small" },
    { kind: "stagnant_exercises", size: "small" },
    { kind: "muscle_volume", size: "medium" },
];

export const MAX_WIDGETS = 16;

/** Keeps only known kinds with a supported size, without duplicates, up to the limit. */
export function sanitizeLayout(
    input: readonly { kind: string; size: string }[],
): WidgetPlacement[] {
    const seen = new Set<string>();
    const result: WidgetPlacement[] = [];
    for (const item of input) {
        const definition = WIDGET_CATALOG[item.kind as WidgetKind];
        if (!definition || seen.has(item.kind)) {
            continue;
        }
        if (!definition.sizes.includes(item.size as WidgetSize)) {
            continue;
        }
        seen.add(item.kind);
        result.push({ kind: definition.kind, size: item.size as WidgetSize });
        if (result.length >= MAX_WIDGETS) {
            break;
        }
    }
    return result;
}
