/*
 * DotColumns: one column of dots per period (week, day, start hour), filled
 * ink from the bottom up to its value and off above. One column can be red
 * (the best hour). Optional labels sit under the columns at 11px.
 */
import { cx } from "./cx";

type DotColumnsProps = {
    /** One value per column, in dots (already scaled to `rows`). */
    values: readonly number[];
    rows: number;
    /** Index of the column drawn in red. */
    highlight?: number;
    labels?: readonly string[];
    /** Dot diameter in px. */
    size?: number;
    label: string;
};

export function DotColumns({ values, rows, highlight, labels, size = 5, label }: DotColumnsProps) {
    return (
        <div role="img" aria-label={label} className="flex w-full justify-between">
            {values.map((value, column) => {
                const filled = Math.max(0, Math.min(rows, Math.round(value)));
                return (
                    <div key={column} className="flex flex-col items-center gap-inner">
                        <div className="flex flex-col-reverse" style={{ gap: size * 0.6 }}>
                            {Array.from({ length: rows }, (_, row) => (
                                <span
                                    key={row}
                                    className={cx(
                                        "rounded-full",
                                        row >= filled
                                            ? "bg-off"
                                            : column === highlight
                                              ? "bg-accent"
                                              : "bg-ink",
                                    )}
                                    style={{ width: size, height: size }}
                                />
                            ))}
                        </div>
                        {labels ? (
                            <span
                                aria-hidden
                                className={cx(
                                    "text-11 font-semibold tabular-nums",
                                    column === highlight ? "text-accent-text" : "text-secondary",
                                )}
                            >
                                {labels[column]}
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

/** Scales raw values to a number of dot rows, against a maximum (at least one dot for any value above zero). */
export function toDotRows(
    values: readonly number[],
    rows: number,
    max = Math.max(...values, 0),
): number[] {
    if (max <= 0) {
        return values.map(() => 0);
    }
    return values.map((value) => (value <= 0 ? 0 : Math.max(1, Math.round((value / max) * rows))));
}
