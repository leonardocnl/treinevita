export type WeeklyBest = {
    /** ISO week start date, e.g. "2026-11-02". */
    readonly weekStart: string;
    readonly bestOneRepMax: number;
};

/**
 * An exercise is stagnant when the last `weeks` weeks did not beat the best
 * mark from before them. Needs history from before the window to decide.
 */
export function isStagnant(history: readonly WeeklyBest[], weeks = 3): boolean {
    if (history.length <= weeks) {
        return false;
    }

    const ordered = [...history].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    const before = ordered.slice(0, ordered.length - weeks);
    const recent = ordered.slice(ordered.length - weeks);

    const previousBest = Math.max(...before.map((week) => week.bestOneRepMax));
    const recentBest = Math.max(...recent.map((week) => week.bestOneRepMax));

    return recentBest <= previousBest;
}
