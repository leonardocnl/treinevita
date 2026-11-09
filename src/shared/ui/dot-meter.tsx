/*
 * A row of dots counting progress: sets of an exercise, workouts of a week.
 * Done dots are lit, the item being done now is a short red pill, one dot can
 * be red (a load going up), and the rest are unlit or, with `hollow`, outlined.
 */
import { Dot, type DotTone } from "./dot";

type DotMeterProps = {
    total: number;
    done: number;
    /** Text alternative read by screen readers ("2 de 3 séries feitas"). */
    label: string;
    /** Dot diameter: 6 in lists, 7 on the panel, 8 or 11 in week rows. */
    size?: 6 | 7 | 8 | 11;
    /** Index of a pending dot drawn in red. */
    highlight?: number;
    /** Index of the item being done now: a red dot stretched into a short pill. */
    current?: number;
    /** "panel" for the dark set logger panel. */
    surface?: "canvas" | "panel";
    /** Pending dots as an outline instead of a fill (the week still running). */
    hollow?: boolean;
};

export function DotMeter({
    total,
    done,
    label,
    size = 6,
    highlight,
    current,
    surface = "canvas",
    hollow = false,
}: DotMeterProps) {
    const lit: DotTone = surface === "panel" ? "secondary" : "ink";
    const unlit: DotTone = "off";
    return (
        <span
            role="img"
            aria-label={label}
            className={`flex items-center ${size === 6 ? "gap-1" : "gap-1.5"}`}
        >
            {Array.from({ length: total }, (_, index) =>
                index < done ? (
                    <Dot key={index} size={size} tone={lit} />
                ) : index === current ? (
                    <span
                        key={index}
                        aria-hidden
                        className="rounded-full bg-accent"
                        style={{ width: size * 2, height: size }}
                    />
                ) : index === highlight ? (
                    <Dot key={index} size={size} tone="accent" />
                ) : hollow ? (
                    <Dot key={index} size={size} tone="off" />
                ) : (
                    <Dot key={index} size={size} tone={unlit} />
                ),
            )}
        </span>
    );
}
