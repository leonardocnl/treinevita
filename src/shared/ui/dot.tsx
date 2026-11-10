/*
 * The single dot every dotted display is built from. Ink for done, off for
 * empty, accent for what is live or achieved.
 */
import { cx } from "./cx";

const toneClass = {
    ink: "bg-ink",
    off: "bg-off",
    accent: "bg-accent",
    secondary: "bg-secondary",
} as const;

export type DotTone = keyof typeof toneClass;

type DotProps = {
    /** Diameter in px. */
    size: number;
    tone: DotTone;
    /** Spoken text; without it the dot is decorative. */
    label?: string;
    /** The session clock dot: a slow pulse. */
    pulse?: boolean;
    /** Layout only. */
    className?: string;
};

export function Dot({ size, tone, label, pulse = false, className }: DotProps) {
    const classes = cx(
        "inline-block shrink-0 rounded-full",
        toneClass[tone],
        pulse && "pulse-slow",
        className,
    );
    return label ? (
        <span
            role="img"
            aria-label={label}
            className={classes}
            style={{ width: size, height: size }}
        />
    ) : (
        <span aria-hidden className={classes} style={{ width: size, height: size }} />
    );
}
