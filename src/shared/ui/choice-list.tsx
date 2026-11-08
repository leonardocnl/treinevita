"use client";

/*
 * A list where one row is chosen (goal, experience, theme): 64px rows with
 * hairlines, the name at 17px, an optional detail at 13px and a check on the
 * chosen row. It is a radio group: arrow keys move the choice, and only the
 * chosen row (or the first, when none is) is in the Tab order.
 */
import { useRef, type KeyboardEvent } from "react";

import { Icon } from "./icons";

export type Choice<Value extends string | number> = {
    value: Value;
    label: string;
    detail?: string;
};

type ChoiceListProps<Value extends string | number> = {
    options: readonly Choice<Value>[];
    value: Value | null;
    onChange: (value: Value) => void;
    /** Names the group for screen readers. */
    label: string;
};

export function ChoiceList<Value extends string | number>({
    options,
    value,
    onChange,
    label,
}: ChoiceListProps<Value>) {
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
        <div ref={groupRef} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
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
                        className="pressable flex min-h-16 w-full items-center gap-4 border-b border-hairline py-3 text-left last:border-b-0"
                    >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-[17px] font-normal">{option.label}</span>
                            {option.detail ? (
                                <span className="text-[13px] text-ink-secondary">
                                    {option.detail}
                                </span>
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
