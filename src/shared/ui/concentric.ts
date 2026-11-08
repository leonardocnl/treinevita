/*
 * Concentric corners: when a rounded shape sits inside a rounded container,
 * outer radius = inner radius + gap, with the same gap on every side. Use
 * these instead of working the numbers out by hand.
 */

/** The container's radius for a shape of `innerRadius` placed `gap` px from its edges. */
export function outerRadius(innerRadius: number, gap: number): number {
    return Math.max(0, innerRadius) + Math.max(0, gap);
}

/** The radius of a shape placed `gap` px inside a container of `outerRadius`. */
export function innerRadius(outer: number, gap: number): number {
    return Math.max(0, outer - Math.max(0, gap));
}

/** The gap that makes a shape of `inner` radius concentric inside a container of `outer`. */
export function concentricGap(outer: number, inner: number): number {
    return Math.max(0, outer - Math.max(0, inner));
}

/**
 * A circle inside a pill, with the same gap above, below and at the end:
 * its diameter is the pill height minus both gaps, and the pill stays
 * concentric because its radius (height / 2) equals the circle's plus the gap.
 */
export function insetCircle(pillHeight: number, gap: number): number {
    return Math.max(0, pillHeight - 2 * gap);
}

/** The pill action: 48px tall, its red circle 4px from the top, bottom and end. */
export const PILL = { height: 48, gap: 4 } as const;
export const PILL_CIRCLE = insetCircle(PILL.height, PILL.gap);
