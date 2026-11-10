/**
 * Personal goals with a deadline: a load on an exercise or a body weight.
 * Progress, what is left and the projection at the current pace. Pure.
 */
import { z } from "zod";

export const GOAL_KINDS = ["exercise_load", "body_weight"] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];

export const MAX_GOALS = 10;

export const goalSchema = z
    .object({
        kind: z.enum(GOAL_KINDS),
        exerciseId: z.uuid().nullable(),
        targetValue: z.number().min(1).max(500),
        deadline: z.iso.date(),
    })
    .refine((goal) => (goal.kind === "exercise_load") === (goal.exerciseId !== null), {
        message: "An exercise goal needs its exercise, and only it.",
    });
export type GoalInput = z.infer<typeof goalSchema>;

export type Point = { readonly day: string; readonly value: number };

/** Share of the way from the start value to the target, 0 to 100 (it works for losing weight too). */
export function goalPercent(start: number, current: number, target: number): number {
    if (target === start) {
        return current === target ? 100 : 0;
    }
    const share = (current - start) / (target - start);
    return Math.round(Math.max(0, Math.min(1, share)) * 100);
}

/** What is left to reach the target, always positive (0 when reached or passed). */
export function goalRemaining(start: number, current: number, target: number): number {
    const rising = target >= start;
    return Math.max(0, rising ? target - current : current - target);
}

const DAY_MS = 86_400_000;

function dayNumber(day: string): number {
    return Date.parse(`${day}T12:00:00Z`) / DAY_MS;
}

/**
 * When the target is reached at the current pace: a least-squares line through
 * the points, followed until it crosses the target. Null with fewer than two
 * days of history, when the trend goes the wrong way, or past two years.
 */
export function projectGoal(points: readonly Point[], target: number): string | null {
    if (points.length < 2) {
        return null;
    }
    const xs = points.map((point) => dayNumber(point.day));
    const ys = points.map((point) => point.value);
    const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
    const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
    const spread = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
    if (spread === 0) {
        return null;
    }
    const slope = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index] - meanY), 0) / spread;
    const lastX = Math.max(...xs);
    const fitted = meanY + slope * (lastX - meanX);
    const gap = target - fitted;
    if (gap === 0) {
        return points.at(-1)?.day ?? null;
    }
    if (slope === 0 || Math.sign(gap) !== Math.sign(slope)) {
        return null;
    }
    const days = gap / slope;
    if (days > 730) {
        return null;
    }
    return new Date((lastX + days) * DAY_MS).toISOString().slice(0, 10);
}
