import { describe, expect, it } from "vitest";

import {
    DEFAULT_LAYOUT,
    WIDGET_CATALOG,
    closestSize,
    isValidLayout,
    sanitizeLayout,
} from "./widgets";

const TRACKER = "0195f0e2-0000-7000-8000-000000000001";

describe("sanitizeLayout", () => {
    it("keeps known kinds with allowed sizes, in order", () => {
        expect(
            sanitizeLayout([
                { kind: "body_weight", size: "large" },
                { kind: "weekly_goal", size: "small" },
            ]),
        ).toEqual([
            { kind: "body_weight", size: "large", ref: null },
            { kind: "weekly_goal", size: "small", ref: null },
        ]);
    });

    it("migrates v1 kinds and sizes and drops unknown ones", () => {
        expect(
            sanitizeLayout([
                { kind: "consistency", size: "large" },
                { kind: "waist", size: "small" },
                { kind: "muscle_volume", size: "large" },
                { kind: "stagnant_exercises", size: "small" },
                { kind: "next_workout", size: "medium" },
                { kind: "body_weight", size: "medium" },
                { kind: "hacked", size: "small" },
            ]),
        ).toEqual([
            { kind: "streak", size: "medium", ref: null },
            { kind: "measurements", size: "small", ref: null },
            { kind: "weekly_volume", size: "medium", ref: null },
            { kind: "stagnant", size: "small", ref: null },
            { kind: "body_weight", size: "large", ref: null },
        ]);
    });

    it("drops duplicates, and custom widgets whose tracker is not the person's", () => {
        expect(
            sanitizeLayout(
                [
                    { kind: "water", size: "small" },
                    { kind: "water", size: "small" },
                    { kind: "custom", size: "small", ref: TRACKER },
                    { kind: "custom", size: "small", ref: "someone-else" },
                    { kind: "custom", size: "small" },
                ],
                new Set([TRACKER]),
            ),
        ).toEqual([
            { kind: "water", size: "small", ref: null },
            { kind: "custom", size: "small", ref: TRACKER },
        ]);
    });

    it("stops at 24 widgets", () => {
        const many = Array.from({ length: 30 }, () => ({
            kind: "custom",
            size: "small",
            ref: TRACKER,
        }));
        const ids = new Set<string>();
        const input = many.map((item, index) => {
            const ref = `${TRACKER}-${index}`;
            ids.add(ref);
            return { ...item, ref };
        });
        expect(sanitizeLayout(input, ids)).toHaveLength(24);
    });
});

describe("closestSize", () => {
    it("prefers M, then P, then G", () => {
        expect(closestSize("large", ["small", "medium"])).toBe("medium");
        expect(closestSize("medium", ["small", "large"])).toBe("large");
        expect(closestSize("small", ["medium"])).toBe("medium");
        expect(closestSize("weird", ["small"])).toBe("small");
    });
});

describe("isValidLayout", () => {
    it("accepts the default layout and rejects sizes a widget does not allow", () => {
        expect(isValidLayout(DEFAULT_LAYOUT)).toBe(true);
        expect(isValidLayout([{ kind: "water", size: "large", ref: null }])).toBe(false);
        expect(isValidLayout([{ kind: "consistency", size: "small", ref: null }])).toBe(false);
    });

    it("rejects duplicates, a custom widget without a tracker and more than 24", () => {
        expect(
            isValidLayout([
                { kind: "water", size: "small", ref: null },
                { kind: "water", size: "small", ref: null },
            ]),
        ).toBe(false);
        expect(isValidLayout([{ kind: "custom", size: "small", ref: null }])).toBe(false);
        expect(
            isValidLayout(
                Array.from({ length: 25 }, (_, index) => ({
                    kind: "custom",
                    size: "small",
                    ref: String(index),
                })),
            ),
        ).toBe(false);
    });

    it("lists every widget with at least one size", () => {
        for (const definition of Object.values(WIDGET_CATALOG)) {
            expect(definition.sizes.length).toBeGreaterThan(0);
        }
    });
});
