import { describe, expect, it } from "vitest";

import { CTA_CELL, SELECTOR_CELL_RADIUS, concentricRadius } from "./concentric";

describe("concentricRadius", () => {
    it("subtracts the padding from the outer radius", () => {
        expect(concentricRadius(20, 6)).toBe(14);
        expect(concentricRadius(10, 2)).toBe(8);
    });

    it("never goes below zero, and ignores a negative padding", () => {
        expect(concentricRadius(4, 10)).toBe(0);
        expect(concentricRadius(14, -3)).toBe(14);
    });

    it("sizes the red cell of PrimaryAction and the size selector cells", () => {
        expect(CTA_CELL).toEqual({ size: 52, radius: 14 });
        expect(SELECTOR_CELL_RADIUS).toBe(8);
    });
});
