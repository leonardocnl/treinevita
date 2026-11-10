import { describe, expect, it } from "vitest";

import {
    bestHour,
    estimateMinutes,
    findRecords,
    hoursAndMinutes,
    nextSessionOrdinal,
    weekStreak,
    weeksSinceProgress,
    type HistorySet,
} from "./metrics";

const weeks = (trained: number[]) =>
    trained.map((count, index) => ({ start: `w${index}`, trained: count }));

describe("weekStreak", () => {
    it("counts closed weeks in a row and the best run", () => {
        expect(weekStreak(weeks([3, 3, 1, 3, 3, 3, 0]), 3)).toEqual({ current: 3, best: 3 });
    });

    it("includes the running week once it meets the goal, and never breaks on it", () => {
        expect(weekStreak(weeks([3, 3, 4]), 3)).toEqual({ current: 3, best: 3 });
        expect(weekStreak(weeks([3, 3, 1]), 3)).toEqual({ current: 2, best: 2 });
        expect(weekStreak(weeks([1, 0]), 3)).toEqual({ current: 0, best: 0 });
    });
});

describe("weeksSinceProgress", () => {
    it("counts whole weeks since a heavier load or more reps at the best load", () => {
        const history = [
            { weekStart: "2026-10-05", loadKg: 30, reps: 10 },
            { weekStart: "2026-10-12", loadKg: 30, reps: 12 },
            { weekStart: "2026-10-19", loadKg: 30, reps: 12 },
            { weekStart: "2026-10-26", loadKg: 27.5, reps: 12 },
            { weekStart: "2026-11-02", loadKg: 30, reps: 11 },
        ];
        expect(weeksSinceProgress(history, "2026-11-09")).toBe(4);
    });

    it("needs two weeks of history", () => {
        expect(
            weeksSinceProgress([{ weekStart: "2026-11-02", loadKg: 30, reps: 10 }], "2026-11-09"),
        ).toBeNull();
    });
});

describe("findRecords", () => {
    const set = (
        sessionId: string,
        day: string,
        loadKg: number,
        reps: number,
        hour = 18,
    ): HistorySet => ({
        exerciseId: "supino",
        sessionId,
        day,
        hour,
        loadKg,
        reps,
    });

    it("finds sessions that beat every earlier estimate, with the load gained", () => {
        const records = findRecords([
            set("a", "2026-10-01", 30, 10),
            set("a", "2026-10-01", 30, 9),
            set("b", "2026-10-08", 32.5, 10, 7),
            set("c", "2026-10-15", 30, 8),
            set("d", "2026-10-22", 35, 8, 19),
        ]);
        expect(
            records.map((record) => [record.day, record.loadKg, record.gainKg, record.hour]),
        ).toEqual([
            ["2026-10-22", 35, 5, 19],
            ["2026-10-08", 32.5, 2.5, 7],
        ]);
    });

    it("never counts the first session of an exercise", () => {
        expect(findRecords([set("a", "2026-10-01", 30, 10)])).toEqual([]);
    });
});

describe("bestHour", () => {
    it("counts records per start hour and picks the most frequent", () => {
        const result = bestHour([18, 18, 7, 19, 18, 7]);
        expect(result.best).toBe(18);
        expect(result.counts[18]).toBe(3);
        expect(bestHour([]).best).toBeNull();
    });
});

describe("time helpers", () => {
    it("splits minutes into hours and minutes", () => {
        expect(hoursAndMinutes(400)).toEqual({ hours: 6, minutes: 40 });
        expect(hoursAndMinutes(-3)).toEqual({ hours: 0, minutes: 0 });
    });

    it("estimates a workout from its past sessions, else from its sets", () => {
        expect(estimateMinutes([48, 52, 51], 21)).toBe(50);
        expect(estimateMinutes([], 21)).toBe(55);
        expect(estimateMinutes([], 0)).toBe(5);
    });

    it("names the next session of the week", () => {
        expect(nextSessionOrdinal(3)).toBe("4ª");
    });
});
