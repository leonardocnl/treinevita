/*
 * Numbers in Doto (the `num` utility), 36px and up only: a smaller size is a
 * TypeScript error, and so is red: the tone is ink or secondary, and there is
 * no class prop to sneak a color in. Under 36px a number is Mona Sans with
 * tabular figures.
 */
import type { ReactNode } from "react";

import { cx } from "./cx";

const sizeClass = {
    36: "text-36",
    56: "text-56",
    58: "text-58",
    64: "text-64",
    128: "text-128",
} as const;

export type DotNumberSize = keyof typeof sizeClass;
export type DotNumberTone = "ink" | "secondary";

type DotNumberProps = {
    children: ReactNode;
    size: DotNumberSize;
    tone?: DotNumberTone;
    /** The goal of a fraction, after a slash, in secondary: 3/4. */
    of?: ReactNode;
    /** A 13px unit on the same baseline, in secondary ("kg", "sem"). */
    unit?: ReactNode;
    /** Empty states: the same value at 15% opacity, in the place of the real one. */
    ghost?: boolean;
    as?: "p" | "span";
};

export function DotNumber({
    children,
    size,
    tone = "ink",
    of,
    unit,
    ghost = false,
    as: Tag = "span",
}: DotNumberProps) {
    return (
        <Tag
            className={cx(
                Tag === "p" ? "flex" : "inline-flex",
                "items-baseline whitespace-nowrap",
                ghost && "opacity-15",
            )}
        >
            <span
                className={cx(
                    "num",
                    sizeClass[size],
                    tone === "ink" ? "text-ink" : "text-secondary",
                )}
            >
                {children}
                {of !== undefined ? <span className="text-secondary">/{of}</span> : null}
            </span>
            {unit !== undefined ? (
                <span className="ml-1 text-13 font-semibold text-secondary">{unit}</span>
            ) : null}
        </Tag>
    );
}
