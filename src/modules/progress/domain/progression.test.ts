import { describe, expect, it } from "vitest";

import { doubleProgression, noProgression } from "./progression";
import { isStagnant } from "./stagnation";
import { bestOneRepMax, estimateOneRepMax } from "./strength";
import { weeklySetsByMuscle } from "./volume";

const range = { min: 10, max: 12 };
const working = (loadKg: number, reps: number) => ({ loadKg, reps, setType: "working" as const });

describe("estimateOneRepMax", () => {
    it("uses the Epley formula", () => {
        expect(estimateOneRepMax(30, 12)).toBeCloseTo(42);
    });

    it("returns the load itself for a single rep", () => {
        expect(estimateOneRepMax(100, 1)).toBe(100);
    });

    it("returns zero for empty sets", () => {
        expect(estimateOneRepMax(0, 10)).toBe(0);
        expect(estimateOneRepMax(40, 0)).toBe(0);
    });
});

describe("bestOneRepMax", () => {
    it("ignores warm-up sets", () => {
        const sets = [{ loadKg: 60, reps: 12, setType: "warmup" as const }, working(40, 10)];
        expect(bestOneRepMax(sets)).toBeCloseTo(40 * (1 + 10 / 30));
    });
});

describe("doubleProgression", () => {
    it("increases the load when every working set hits the top of the range", () => {
        const decision = doubleProgression({
            lastSets: [working(35, 12), working(35, 12), working(35, 12)],
            range,
            incrementKg: 2.5,
        });
        expect(decision).toEqual({ kind: "increase", loadKg: 37.5, previousLoadKg: 35 });
    });

    it("keeps the load while reps are inside the range", () => {
        const decision = doubleProgression({
            lastSets: [working(35, 12), working(35, 11), working(35, 10)],
            range,
            incrementKg: 2.5,
        });
        expect(decision).toEqual({ kind: "keep", loadKg: 35 });
    });

    it("asks when a set fell below the range", () => {
        const decision = doubleProgression({
            lastSets: [working(35, 12), working(35, 8)],
            range,
            incrementKg: 2.5,
        });
        expect(decision).toEqual({ kind: "ask", loadKg: 35, reason: "below_range" });
    });

    it("asks when the sets used different loads", () => {
        const decision = doubleProgression({
            lastSets: [working(35, 12), working(37.5, 10)],
            range,
            incrementKg: 2.5,
        });
        expect(decision).toEqual({ kind: "ask", loadKg: 37.5, reason: "mixed_loads" });
    });

    it("ignores warm-up sets when deciding", () => {
        const decision = doubleProgression({
            lastSets: [
                { loadKg: 20, reps: 15, setType: "warmup" },
                working(35, 12),
                working(35, 12),
            ],
            range,
            incrementKg: 2.5,
        });
        expect(decision?.kind).toBe("increase");
    });

    it("returns null without history", () => {
        expect(doubleProgression({ lastSets: [], range, incrementKg: 2.5 })).toBeNull();
    });

    it("avoids floating point noise", () => {
        const decision = doubleProgression({
            lastSets: [working(12.1, 12)],
            range,
            incrementKg: 1.15,
        });
        expect(decision).toMatchObject({ kind: "increase", loadKg: 13.25 });
    });
});

describe("noProgression", () => {
    it("repeats the heaviest load", () => {
        expect(
            noProgression({
                lastSets: [working(20, 12), working(22.5, 10)],
                range,
                incrementKg: 2.5,
            }),
        ).toEqual({
            kind: "keep",
            loadKg: 22.5,
        });
    });
});

describe("isStagnant", () => {
    const week = (weekStart: string, bestOneRepMax: number) => ({ weekStart, bestOneRepMax });

    it("flags three weeks without beating the previous best", () => {
        const history = [
            week("2026-10-05", 50),
            week("2026-10-12", 48),
            week("2026-10-19", 49),
            week("2026-10-26", 50),
        ];
        expect(isStagnant(history)).toBe(true);
    });

    it("does not flag when the recent weeks set a new best", () => {
        const history = [
            week("2026-10-05", 50),
            week("2026-10-12", 48),
            week("2026-10-19", 51),
            week("2026-10-26", 50),
        ];
        expect(isStagnant(history)).toBe(false);
    });

    it("needs history before the window", () => {
        expect(
            isStagnant([week("2026-10-12", 48), week("2026-10-19", 48), week("2026-10-26", 48)]),
        ).toBe(false);
    });
});

describe("weeklySetsByMuscle", () => {
    it("counts primary muscles as 1 and secondary as 0.5", () => {
        const bench = {
            ...working(35, 12),
            muscles: [
                { slug: "chest", role: "primary" as const },
                { slug: "triceps", role: "secondary" as const },
            ],
        };
        const totals = weeklySetsByMuscle([bench, bench]);
        expect(totals.get("chest")).toBe(2);
        expect(totals.get("triceps")).toBe(1);
    });
});
