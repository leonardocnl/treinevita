import { describe, expect, it } from "vitest";

import {
    RANGES,
    averageOf,
    isDayDone,
    isValidGoal,
    isValidValue,
    rangeFor,
    weekEntries,
} from "./trackers";

describe("isValidValue", () => {
    it("keeps the strict ranges of every tracker", () => {
        expect(isValidValue(7.5, RANGES.sleep)).toBe(true);
        expect(isValidValue(24.5, RANGES.sleep)).toBe(false);
        expect(isValidValue(-1, RANGES.sleep)).toBe(false);
        expect(isValidValue(10, RANGES.water)).toBe(true);
        expect(isValidValue(10.25, RANGES.water)).toBe(false);
        expect(isValidValue(100_000, RANGES.steps)).toBe(true);
        expect(isValidValue(100_500, RANGES.steps)).toBe(false);
        expect(isValidValue(0, RANGES.energy)).toBe(false);
        expect(isValidValue(5, RANGES.energy)).toBe(true);
    });

    it("rejects values off the step and values that are not numbers", () => {
        expect(isValidValue(7.3, RANGES.sleep)).toBe(false);
        expect(isValidValue(2.6, RANGES.energy)).toBe(false);
        expect(isValidValue(Number.NaN, RANGES.water)).toBe(false);
        expect(isValidValue(Number.POSITIVE_INFINITY, RANGES.number)).toBe(false);
    });

    it("picks the range of a custom tracker by its value type", () => {
        expect(rangeFor("custom", "boolean")).toBe(RANGES.boolean);
        expect(rangeFor("custom", "time")).toBe(RANGES.time);
        expect(rangeFor("water", null)).toBe(RANGES.water);
    });
});

describe("isValidGoal", () => {
    it("asks days per week for yes/no and a positive amount otherwise", () => {
        expect(isValidGoal({ name: "Ler", valueType: "boolean", unit: null, goal: 5 })).toBe(true);
        expect(isValidGoal({ name: "Ler", valueType: "boolean", unit: null, goal: 8 })).toBe(false);
        expect(isValidGoal({ name: "Páginas", valueType: "number", unit: "pág", goal: 20 })).toBe(
            true,
        );
        expect(isValidGoal({ name: "Meditar", valueType: "time", unit: null, goal: 2000 })).toBe(
            false,
        );
    });
});

describe("week summaries", () => {
    const days = ["2026-11-02", "2026-11-03", "2026-11-04"];
    const entries = [
        { day: "2026-11-02", value: 7, secondary: null },
        { day: "2026-11-04", value: 8, secondary: null },
    ];

    it("lines entries up with the days and averages only the logged ones", () => {
        const week = weekEntries(entries, days);
        expect(week.map((entry) => entry?.value ?? null)).toEqual([7, null, 8]);
        expect(averageOf(week)).toBe(7.5);
        expect(averageOf([null, null])).toBeNull();
    });

    it("marks a day done by yes, or by reaching the goal", () => {
        expect(isDayDone({ day: "x", value: 1, secondary: null }, "boolean", 5)).toBe(true);
        expect(isDayDone({ day: "x", value: 15, secondary: null }, "number", 20)).toBe(false);
        expect(isDayDone(null, "number", 20)).toBe(false);
    });
});
