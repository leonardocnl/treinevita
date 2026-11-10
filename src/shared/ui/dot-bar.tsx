/*
 * DotBar: a row of dots spread across the width. Filled ink up to `value`, off
 * after it, and an optional 1.5px red vertical tick after the `target` dot.
 */
import { cx } from "./cx";

type DotBarProps = {
    total: number;
    value: number;
    /** A tick after this many dots (the weekly target). */
    target?: number;
    /** Dot diameter in px. */
    size?: number;
    /** Spoken text; leave it out when the number is printed next to the bar. */
    label?: string;
};

export function DotBar({ total, value, target, size = 6, label }: DotBarProps) {
    const filled = Math.max(0, Math.min(total, Math.round(value)));
    const span = Math.max(1, total - 1);
    return (
        <span
            className="relative flex w-full items-center justify-between"
            style={{ height: size + 8 }}
            {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
        >
            {Array.from({ length: total }, (_, index) => (
                <span
                    key={index}
                    className={cx("shrink-0 rounded-full", index < filled ? "bg-ink" : "bg-off")}
                    style={{ width: size, height: size }}
                />
            ))}
            {target !== undefined && target > 0 && target < total ? (
                <span
                    aria-hidden
                    className="absolute inset-y-0 rounded-full bg-accent"
                    style={{
                        width: 1.5,
                        // Halfway between the centers of dot `target` and the next one.
                        left: `calc((100% - ${size}px) * ${(target - 0.5) / span} + ${size / 2 - 0.75}px)`,
                    }}
                />
            ) : null}
        </span>
    );
}
