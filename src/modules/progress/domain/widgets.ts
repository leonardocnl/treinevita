/**
 * Home widgets (design v2): which exist, the sizes each allows (P, M, G), how
 * they are grouped in the "Adicionar" sheet, and how saved layouts are
 * validated and migrated from the v1 catalog.
 */

/** P (half width), M (full width, compact) and G (full width, large). */
export const WIDGET_SIZES = ["small", "medium", "large"] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

export const WIDGET_KINDS = [
    "weekly_goal",
    "streak",
    "personal_record",
    "body_weight",
    "measurements",
    "weekly_volume",
    "last_workout",
    "stagnant",
    "month_time",
    "month_volume",
    "next_increase",
    "goal",
    "sleep",
    "water",
    "steps",
    "energy",
    "custom",
    "month_compare",
    "best_hour",
] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];

export const WIDGET_GROUPS = ["training", "body", "habits"] as const;
export type WidgetGroup = (typeof WIDGET_GROUPS)[number];

export type WidgetDefinition = {
    readonly kind: WidgetKind;
    readonly title: string;
    readonly sizes: readonly WidgetSize[];
    readonly group: WidgetGroup;
    /** The person logs it by hand: tapping the widget opens its sheet. */
    readonly manual: boolean;
    /** An achievement widget: a red dot before its label. */
    readonly accent: boolean;
};

function define(
    kind: WidgetKind,
    title: string,
    sizes: readonly WidgetSize[],
    group: WidgetGroup,
    options: { manual?: boolean; accent?: boolean } = {},
): WidgetDefinition {
    return {
        kind,
        title,
        sizes,
        group,
        manual: options.manual ?? false,
        accent: options.accent ?? false,
    };
}

const P = "small";
const M = "medium";
const G = "large";

export const WIDGET_CATALOG: Record<WidgetKind, WidgetDefinition> = {
    weekly_goal: define("weekly_goal", "Semana", [P, M, G], "training"),
    streak: define("streak", "Sequência", [P, M], "training"),
    personal_record: define("personal_record", "Recorde", [P, M], "training", { accent: true }),
    body_weight: define("body_weight", "Peso", [P, G], "body", { manual: true }),
    measurements: define("measurements", "Medidas", [P, M], "body", { manual: true }),
    weekly_volume: define("weekly_volume", "Volume semanal", [P, M], "training"),
    last_workout: define("last_workout", "Último treino", [P, M], "training"),
    stagnant: define("stagnant", "Estagnados", [P, M], "training"),
    month_time: define("month_time", "Tempo no mês", [P], "training"),
    month_volume: define("month_volume", "Volume do mês", [P, M], "training"),
    next_increase: define("next_increase", "Próximo aumento", [P, M], "training"),
    goal: define("goal", "Meta", [P, M, G], "training", { manual: true }),
    sleep: define("sleep", "Sono", [P, M], "habits", { manual: true }),
    water: define("water", "Água", [P], "habits", { manual: true }),
    steps: define("steps", "Passos", [P, M], "habits", { manual: true }),
    energy: define("energy", "Energia", [P], "habits", { manual: true }),
    custom: define("custom", "Personalizado", [P, M], "habits", { manual: true }),
    month_compare: define("month_compare", "Este mês", [M], "training"),
    best_hour: define("best_hour", "Melhor horário", [P, M], "training", { accent: true }),
};

export type WidgetPlacement = {
    readonly kind: WidgetKind;
    readonly size: WidgetSize;
    /** Custom widgets: the id of the person's tracker. */
    readonly ref: string | null;
};

/** One key per widget on the home: the kind, or the kind and the tracker of a custom widget. */
export function placementKey(placement: Pick<WidgetPlacement, "kind" | "ref">): string {
    return placement.kind === "custom" ? `custom:${placement.ref}` : placement.kind;
}

export const DEFAULT_LAYOUT: readonly WidgetPlacement[] = [
    { kind: "weekly_goal", size: "large", ref: null },
    { kind: "personal_record", size: "small", ref: null },
    { kind: "body_weight", size: "small", ref: null },
    { kind: "last_workout", size: "medium", ref: null },
    { kind: "streak", size: "small", ref: null },
    { kind: "month_time", size: "small", ref: null },
    { kind: "weekly_volume", size: "medium", ref: null },
    { kind: "stagnant", size: "medium", ref: null },
];

export const MAX_WIDGETS = 24;

/** v1 kinds that live on as a v2 widget; any other old kind is dropped. */
const LEGACY_KINDS: Readonly<Record<string, WidgetKind>> = {
    consistency: "streak",
    waist: "measurements",
    muscle_volume: "weekly_volume",
    stagnant_exercises: "stagnant",
};

/** The requested size when allowed, else the closest one (M, then P, then G). */
export function closestSize(requested: string, allowed: readonly WidgetSize[]): WidgetSize {
    if (allowed.includes(requested as WidgetSize)) {
        return requested as WidgetSize;
    }
    const preference: Record<string, readonly WidgetSize[]> = {
        small: ["medium", "large"],
        medium: ["large", "small"],
        large: ["medium", "small"],
    };
    return (preference[requested] ?? []).find((size) => allowed.includes(size)) ?? allowed[0];
}

type RawPlacement = { readonly kind: string; readonly size: string; readonly ref?: string | null };

/**
 * Keeps known kinds (old kinds mapped to the new ones) with an allowed size, a
 * custom widget only when its tracker is one of `customIds`, no duplicates, up to the limit.
 */
export function sanitizeLayout(
    input: readonly RawPlacement[],
    customIds: ReadonlySet<string> = new Set(),
): WidgetPlacement[] {
    const seen = new Set<string>();
    const result: WidgetPlacement[] = [];
    for (const item of input) {
        const kind = (LEGACY_KINDS[item.kind] ?? item.kind) as WidgetKind;
        const definition = WIDGET_CATALOG[kind];
        if (!definition) {
            continue;
        }
        const ref = kind === "custom" ? (item.ref ?? null) : null;
        if (kind === "custom" && (ref === null || !customIds.has(ref))) {
            continue;
        }
        const placement: WidgetPlacement = {
            kind,
            size: closestSize(item.size, definition.sizes),
            ref,
        };
        const key = placementKey(placement);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(placement);
        if (result.length >= MAX_WIDGETS) {
            break;
        }
    }
    return result;
}

/**
 * Strict check of a layout sent by the client: only v2 kinds, allowed sizes,
 * no duplicates, at most 24. Custom tracker ids are checked by the caller.
 */
export function isValidLayout(input: readonly RawPlacement[]): boolean {
    if (input.length > MAX_WIDGETS) {
        return false;
    }
    const seen = new Set<string>();
    for (const item of input) {
        const definition = WIDGET_CATALOG[item.kind as WidgetKind];
        if (!definition || !definition.sizes.includes(item.size as WidgetSize)) {
            return false;
        }
        if ((item.kind === "custom") !== (typeof item.ref === "string")) {
            return false;
        }
        const key = placementKey({ kind: definition.kind, ref: item.ref ?? null });
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
    }
    return true;
}
