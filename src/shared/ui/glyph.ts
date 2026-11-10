/* The 5×5 dot-matrix glyphs of PrimaryAction (DESIGN.md, "PrimaryAction"). */

/** `#` is a lit dot, `.` an off one, five rows of five. */
export const GLYPHS = {
    arrow: ["..#..", "...#.", "#####", "...#.", "..#.."],
    check: [".....", "....#", "...#.", "#.#..", ".#..."],
} as const;

export type GlyphName = keyof typeof GLYPHS;

export type GlyphDot = { row: number; col: number; lit: boolean; order: number };

/**
 * Every dot of a glyph, with the order in which the lit ones light up on a
 * press: along the shape, left to right, and from the middle row outwards in a column.
 */
export function glyphDots(rows: readonly string[]): GlyphDot[] {
    const dots = rows.flatMap((line, row) =>
        [...line].map((cell, col) => ({ row, col, lit: cell === "#", order: 0 })),
    );
    const center = (rows.length - 1) / 2;
    const lit = dots
        .filter((dot) => dot.lit)
        .sort((a, b) => a.col - b.col || Math.abs(a.row - center) - Math.abs(b.row - center));
    lit.forEach((dot, index) => {
        dot.order = index;
    });
    return dots;
}
