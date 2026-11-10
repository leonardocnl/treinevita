/*
 * WeekDots: the seven days with their letters (S T Q Q S S D). Today is a red
 * dot with a red letter; days with a workout (or a logged habit) are ink; every
 * other day, past or future, is off.
 */
import { cx } from "./cx";

export type WeekDay = {
    readonly letter: string;
    readonly done: boolean;
    readonly isToday: boolean;
};

type WeekDotsProps = {
    days: readonly WeekDay[];
    /** 12px dots (G and P), 8px in the small M row. */
    size?: 12 | 8;
    label: string;
};

export function WeekDots({ days, size = 12, label }: WeekDotsProps) {
    return (
        <div role="img" aria-label={label} className="flex w-full justify-between">
            {days.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-inner">
                    <span
                        className={cx(
                            "rounded-full",
                            day.isToday ? "bg-accent" : day.done ? "bg-ink" : "bg-off",
                        )}
                        style={{ width: size, height: size }}
                    />
                    <span
                        aria-hidden
                        className={cx(
                            "text-11 font-semibold",
                            day.isToday ? "text-accent-text" : "text-secondary",
                        )}
                    >
                        {day.letter}
                    </span>
                </div>
            ))}
        </div>
    );
}

export const WEEK_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"] as const;
