import { describe, expect, it } from "vitest";

import { addDays, daysInMonth, startOfWeek, toLocalDate, weekdayIndex } from "./local-date";

describe("local dates", () => {
    it("converts an instant to the local date of the time zone", () => {
        expect(toLocalDate(new Date("2026-11-08T01:00:00Z"), "America/Sao_Paulo")).toBe(
            "2026-11-07",
        );
    });

    it("finds the Monday of the week", () => {
        expect(startOfWeek("2026-11-07")).toBe("2026-11-02");
        expect(startOfWeek("2026-11-08")).toBe("2026-11-02");
        expect(startOfWeek("2026-11-02")).toBe("2026-11-02");
    });

    it("adds days across months", () => {
        expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    });

    it("knows the month length and weekday", () => {
        expect(daysInMonth("2026-11-07")).toBe(30);
        expect(weekdayIndex("2026-11-01")).toBe(6);
    });
});
