import { describe, expect, it } from "vitest";

import { formatNumber } from "@/shared/format/numbers";

import { wheelFontSize } from "./wheel-picker";

describe("wheel value formatting", () => {
    it("formats loads with a decimal comma", () => {
        expect(formatNumber(102.5)).toBe("102,5");
        expect(formatNumber(7.5)).toBe("7,5");
    });

    it("sizes each value by its own length", () => {
        expect(wheelFontSize(formatNumber(7.5))).toBe("min(56px, calc((100cqi - 34px) / 1.83))");
        expect(wheelFontSize(formatNumber(102.5))).toBe("min(56px, calc((100cqi - 34px) / 3.05))");
    });

    it("keeps 7,5 at full size and fits 102,5 in a phone's kg column (158px)", () => {
        const size = (text: string) => Math.min(56, (158 - 34) / (text.length * 0.61));
        expect(size("7,5")).toBe(56);
        expect(size("102,5") * 0.61 * 5 + 34).toBeLessThanOrEqual(158);
    });
});
