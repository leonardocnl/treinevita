/*
 * Numbers in the dot-matrix font (Doto through the `num` utility). Dots are hard
 * to read when small, so the size only accepts 48px and up: anything under 36px
 * is a TypeScript error. Below that, use Inter with tabular figures.
 */
import type { ReactNode } from "react";

const sizeClass = {
    48: "text-[48px]",
    56: "text-[56px]",
    64: "text-[64px]",
    80: "text-[80px]",
    96: "text-[96px]",
} as const;

export type DotNumberSize = keyof typeof sizeClass;

type DotNumberProps = {
    children: ReactNode;
    size: DotNumberSize;
    /** The goal of a fraction, drawn unlit after a slash: 3/4. */
    of?: ReactNode;
    /** Line height: 0.85 for a value with a unit, 0.8 for a hero fraction. */
    leading?: "0.8" | "0.85";
    as?: "p" | "span";
    /** Layout only (margins). */
    className?: string;
};

export function DotNumber({
    children,
    size,
    of,
    leading = "0.85",
    as: Tag = "span",
    className,
}: DotNumberProps) {
    const classes = [
        "num",
        className,
        sizeClass[size],
        leading === "0.8" ? "leading-[0.8]" : "leading-[0.85]",
    ]
        .filter(Boolean)
        .join(" ");
    return (
        <Tag className={classes}>
            {children}
            {of !== undefined ? <span className="text-dot-off">/{of}</span> : null}
        </Tag>
    );
}
