/*
 * A row of dots counting progress: sets of an exercise, workouts of a week.
 * Done dots are lit, one dot can be red (the current set, a load going up),
 * and the rest are unlit or, with `hollow`, outlined.
 */
import { Dot, type DotFill } from "./dot";

type DotMeterProps = {
    total: number;
    done: number;
    /** Text alternative read by screen readers ("2 de 3 séries feitas"). */
    label: string;
    /** Dot diameter: 6 in lists, 7 on the panel, 8 or 11 in week rows. */
    size?: 6 | 7 | 8 | 11;
    /** Index of a pending dot drawn in red. */
    highlight?: number;
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
    surface = "canvas",
    hollow = false,
}: DotMeterProps) {
    const lit: DotFill = surface === "panel" ? "on-panel" : "ink";
    const unlit: DotFill = surface === "panel" ? "panel-track" : "off";
    return (
        <span role="img" aria-label={label} className={`flex ${size === 6 ? "gap-1" : "gap-1.5"}`}>
            {Array.from({ length: total }, (_, index) =>
                index < done ? (
                    <Dot key={index} size={size} fill={lit} />
                ) : index === highlight ? (
                    <Dot key={index} size={size} fill="red" />
                ) : hollow ? (
                    <Dot key={index} size={size} ring="off" />
                ) : (
                    <Dot key={index} size={size} fill={unlit} />
                ),
            )}
        </span>
    );
}
