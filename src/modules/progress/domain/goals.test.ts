import { describe, expect, it } from "vitest";

import { goalPercent, goalRemaining, goalSchema, projectGoal } from "./goals";

describe("goalPercent and goalRemaining", () => {
    it("measures the way from the start to the target, rising or falling", () => {
        expect(goalPercent(40, 45, 50)).toBe(50);
        expect(goalPercent(80, 78, 76)).toBe(50);
        expect(goalPercent(40, 38, 50)).toBe(0);
        expect(goalPercent(40, 55, 50)).toBe(100);
        expect(goalRemaining(40, 45, 50)).toBe(5);
        expect(goalRemaining(80, 78, 76)).toBe(2);
        expect(goalRemaining(40, 52, 50)).toBe(0);
    });
});

describe("projectGoal", () => {
    it("follows the pace until it crosses the target", () => {
        const points = [
            { day: "2026-10-01", value: 40 },
            { day: "2026-10-11", value: 41 },
            { day: "2026-10-21", value: 42 },
        ];
        // +0.1 kg a day: 8 kg more takes 80 days after 21 Oct.
        expect(projectGoal(points, 50)).toBe("2027-01-09");
    });

    it("returns null with too little history or a trend going the wrong way", () => {
        expect(projectGoal([{ day: "2026-10-01", value: 40 }], 50)).toBeNull();
        expect(
            projectGoal(
                [
                    { day: "2026-10-01", value: 42 },
                    { day: "2026-10-21", value: 40 },
                ],
                50,
            ),
        ).toBeNull();
    });

    it("returns null when the target is more than two years away", () => {
        expect(
            projectGoal(
                [
                    { day: "2026-10-01", value: 40 },
                    { day: "2026-10-31", value: 40.1 },
                ],
                100,
            ),
        ).toBeNull();
    });
});

describe("goalSchema", () => {
    it("asks an exercise for a load goal and none for a weight goal", () => {
        const base = { targetValue: 50, deadline: "2027-03-31" };
        expect(
            goalSchema.safeParse({ ...base, kind: "body_weight", exerciseId: null }).success,
        ).toBe(true);
        expect(
            goalSchema.safeParse({ ...base, kind: "exercise_load", exerciseId: null }).success,
        ).toBe(false);
        expect(
            goalSchema.safeParse({
                ...base,
                kind: "body_weight",
                targetValue: 900,
                exerciseId: null,
            }).success,
        ).toBe(false);
    });
});
