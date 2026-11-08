"use client";

/*
 * A list where one row is chosen (goal, experience, theme): 64px rows with
 * hairlines, the name at 17px, an optional detail at 13px and a check on the
 * chosen row. With `variant="cards"` each option is a paper tile with room for
 * more lines (the program models); the chosen tile gets an ink ring. It is a
 * radio group: arrow keys move the choice, and only the chosen option (or the
 * first, when none is) is in the Tab order.
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
            className={cards ? "flex flex-col gap-3" : undefined}
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
                            "pressable flex w-full gap-4 text-left",
                            cards
                                ? "items-start rounded-tile bg-paper p-4 ring-inset"
                                : "min-h-16 items-center border-b border-hairline py-3 last:border-b-0",
                            cards && (checked ? "ring-[1.5px] ring-ink" : "ring-0"),
                        )}
                    >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-[17px] font-normal">{option.label}</span>
                            {option.detail ? (
                                <span className="text-[13px] text-ink-secondary">
                                    {option.detail}
                                </span>
                            ) : null}
                            {cards && option.extra ? (
                                <span className="mt-2 flex flex-col gap-2">{option.extra}</span>
                            ) : null}
                        </span>
                        <span className={checked ? "text-ink" : "invisible"}>
                            <Icon name="check" size={20} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
