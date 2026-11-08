"use client";

/*
 * A small pill of options where exactly one is chosen (the widget size switch).
 * It is a radio group: arrow keys move the choice, and only the chosen option
 * is in the Tab order.
 */
import { useRef, type KeyboardEvent, type ReactNode } from "react";

export type SegmentedOption<Value extends string> = {
    value: Value;
    /** Spoken name of the option. */
    label: string;
    /** What is drawn (an icon); the label is used when there is none. */
    content?: ReactNode;
};

type SegmentedControlProps<Value extends string> = {
    options: readonly SegmentedOption<Value>[];
    value: Value;
    onChange: (value: Value) => void;
    /** Names the group for screen readers. */
    label: string;
};

export function SegmentedControl<Value extends string>({
    options,
    value,
    onChange,
    label,
}: SegmentedControlProps<Value>) {
    const groupRef = useRef<HTMLDivElement>(null);

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const delta =
            event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : 0;
        if (delta === 0) {
            return;
        }
        event.preventDefault();
        const current = options.findIndex((option) => option.value === value);
        const next = (current + delta + options.length) % options.length;
        onChange(options[next].value);
        groupRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
    }

    return (
        <div
            ref={groupRef}
            role="radiogroup"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="flex gap-1 rounded-full bg-canvas p-1"
        >
            {options.map((option) => {
                const checked = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        aria-label={option.label}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        className={`pressable flex size-8 items-center justify-center rounded-full ${
                            checked ? "bg-ink text-canvas" : "text-ink-secondary"
                        }`}
                    >
                        {option.content ?? option.label}
                    </button>
                );
            })}
        </div>
    );
}
