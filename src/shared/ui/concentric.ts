/*
 * Nested radius rule: when a rounded shape sits inside a rounded container,
 * inner radius = outer radius − padding (the same padding on every side).
 * Use this instead of working the numbers out by hand.
 */

/** The radius of a shape placed `padding` px inside a container of radius `outer`. */
export function concentricRadius(outer: number, padding: number): number {
    return Math.max(0, outer - Math.max(0, padding));
}

/** PrimaryAction: a 64px pill, the round red cell 6px from the top, bottom and end. */
export const CTA = { height: 64, padding: 6 } as const;
export const CTA_CELL = { size: CTA.height - 2 * CTA.padding } as const;

/** SizeSelector: container radius 10 with 2px padding. */
export const SELECTOR = { radius: 0, padding: 2 } as const;
export const SELECTOR_CELL_RADIUS = concentricRadius(SELECTOR.radius, SELECTOR.padding);
