import { describe, expect, it } from "vitest";

import { GLYPHS, glyphDots } from "./glyph";

const litPath = (rows: readonly string[]) =>
    glyphDots(rows)
        .filter((dot) => dot.lit)
        .sort((a, b) => a.order - b.order)
        .map((dot) => [dot.row, dot.col]);

describe("glyphDots", () => {
    it("draws 25 dots and lights the check along its stroke", () => {
        expect(glyphDots(GLYPHS.check)).toHaveLength(25);
        expect(litPath(GLYPHS.check)).toEqual([
            [3, 0],
            [4, 1],
            [3, 2],
            [2, 3],
            [1, 4],
        ]);
    });

    it("lights the arrow from its tail to its head", () => {
        const path = litPath(GLYPHS.arrow);
        expect(path[0]).toEqual([2, 0]);
        expect(path.at(-1)).toEqual([2, 4]);
        expect(path).toHaveLength(9);
    });
});
