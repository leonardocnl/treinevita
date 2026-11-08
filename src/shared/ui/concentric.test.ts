import { describe, expect, it } from "vitest";

import {
    PILL,
    PILL_CIRCLE,
    concentricGap,
    innerRadius,
    insetCircle,
    outerRadius,
} from "./concentric";

describe("concentric radii", () => {
    it("adds the gap to the inner radius", () => {
        expect(outerRadius(16, 10)).toBe(26);
        expect(outerRadius(10, 20)).toBe(30);
    });

    it("subtracts the gap from the outer radius, never below zero", () => {
        expect(innerRadius(30, 20)).toBe(10);
        expect(innerRadius(8, 12)).toBe(0);
    });

    it("round-trips", () => {
        expect(innerRadius(outerRadius(12, 4), 4)).toBe(12);
    });

    it("ignores negative input", () => {
        expect(outerRadius(-4, 6)).toBe(6);
        expect(outerRadius(6, -4)).toBe(6);
    });

    it("finds the gap that makes two radii concentric", () => {
        expect(concentricGap(26, 16)).toBe(10);
        expect(outerRadius(16, concentricGap(26, 16))).toBe(26);
        expect(concentricGap(10, 16)).toBe(0);
    });

    it("fits a circle in a pill with the same gap above, below and at the end", () => {
        const diameter = insetCircle(48, 4);
        expect(diameter).toBe(40);
        expect((48 - diameter) / 2).toBe(4);
        expect(outerRadius(diameter / 2, 4)).toBe(48 / 2);
    });

    it("defines the action pill circle from its height and gap", () => {
        expect(PILL_CIRCLE).toBe(PILL.height - 2 * PILL.gap);
    });
});
