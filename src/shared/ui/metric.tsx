/*
 * Numbers with their unit. Metric: a large dot-matrix value with a 13px unit on
 * the same baseline ("55 min"). MetricRow: small values in Inter, in columns
 * divided by hairlines, each with a label under it (min, séries, volume).
 */
import type { ReactNode } from "react";

import { DotNumber, type DotNumberSize } from "./dot-number";
import { cx } from "./cx";

type MetricProps = {
    value: ReactNode;
    unit: ReactNode;
    size: DotNumberSize;
    /** Space between value and unit: 8px, or 6px for very short units ("kg"). */
    spacing?: "regular" | "tight";
    /** Layout only (margins). */
    className?: string;
};

export function Metric({ value, unit, size, spacing = "regular", className }: MetricProps) {
    return (
        <p
            className={cx(
                "flex items-baseline",
                spacing === "tight" ? "gap-1.5" : "gap-2",
                className,
            )}
        >
            <DotNumber size={size}>{value}</DotNumber>
            <span className="whitespace-nowrap text-[13px] text-ink-secondary">{unit}</span>
        </p>
    );
}

export type MetricRowItem = { value: string; label: string };

export function MetricRow({ items }: { items: readonly MetricRowItem[] }) {
    return (
        <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
            {items.map((item, index) => (
                <div
                    key={item.label}
                    className={index > 0 ? "border-l border-hairline pl-3" : "pr-3"}
                >
                    <p className="text-[22px] font-normal tabular-nums">{item.value}</p>
                    <p className="text-[13px] text-ink-secondary">{item.label}</p>
                </div>
            ))}
        </div>
    );
}
