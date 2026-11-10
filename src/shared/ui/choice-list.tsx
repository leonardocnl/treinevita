"use client";

/*
 * A list where one row is chosen (goal, experience, theme). Rows are tappable,
 * so they have a fill: 64px rounded rectangles (radius 20), tint when not chosen
 * and an ink cell with bg text when chosen, 8px apart. `variant="cards"` leaves
 * room for more lines (the program models). It is a radio group: arrow keys move
 * the choice, and only the chosen option (or the first, when none is) is in the Tab order.
 */
import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { cx } from "./cx";

import { Icon } from "./icons";

export type Choice<Value extends string | number> = {
    value: Value;
    label: string;
    detail?: string;
    /** More lines under the detail (cards only). */
    extra?: ReactNode;
};

type ChoiceListProps<Value extends string | number> = {
    options: readonly Choice<Value>[];
    value: Value | null;
    onChange: (value: Value) => void;
    /** Names the group for screen readers. */
    label: string;
    variant?: "list" | "cards";
};

export function ChoiceList<Value extends string | number>({
    options,
    value,
    onChange,
    label,
    variant = "list",
}: ChoiceListProps<Value>) {
    const cards = variant === "cards";
    const groupRef = useRef<HTMLDivElement>(null);
    const selected = options.findIndex((option) => option.value === value);

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const delta =
            event.key === "ArrowDown" || event.key === "ArrowRight"
                ? 1
                : event.key === "ArrowUp" || event.key === "ArrowLeft"
                  ? -1
                  : 0;
        if (delta === 0) {
            return;
        }
        event.preventDefault();
        const next = (Math.max(selected, 0) + delta + options.length) % options.length;
        onChange(options[next].value);
        groupRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
    }

    return (
        <div
            ref={groupRef}
            role="radiogroup"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="flex flex-col gap-inner"
        >
            {options.map((option, index) => {
                const checked = index === selected;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked || (selected === -1 && index === 0) ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        className={cx(
                            "pressable focus-ring flex min-h-16 w-full gap-gutter rounded-cta px-margin text-left",
                            cards ? "items-start py-label" : "items-center py-inner",
                            checked ? "bg-ink text-bg" : "bg-tint text-ink",
                        )}
                    >
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-17 font-semibold">{option.label}</span>
                            {option.detail ? (
                                <span
                                    className={cx(
                                        "text-13",
                                        checked ? "opacity-70" : "text-secondary",
                                    )}
                                >
                                    {option.detail}
                                </span>
                            ) : null}
                            {cards && option.extra ? (
                                <span className="mt-inner flex flex-col gap-inner">
                                    {option.extra}
                                </span>
                            ) : null}
                        </span>
                        <span className={checked ? undefined : "invisible"}>
                            <Icon name="check" size={20} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
