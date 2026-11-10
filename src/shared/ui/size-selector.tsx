"use client";

/*
 * SizeSelector: P · M · G. A tint container (radius 10, 2px padding) with
 * 32px cells (radius 8, concentric); the active size is an ink cell, sizes the
 * widget does not support are greyed and disabled. A radio group: arrow keys
 * move the choice over the available sizes, and only the chosen one is in the Tab order.
 */
import { useRef, type KeyboardEvent } from "react";

import { SELECTOR, SELECTOR_CELL_RADIUS } from "./concentric";
import { cx } from "./cx";

export const SIZE_LETTERS = { small: "P", medium: "M", large: "G" } as const;
export type SelectorSize = keyof typeof SIZE_LETTERS;
const ORDER: readonly SelectorSize[] = ["small", "medium", "large"];
const SPOKEN: Record<SelectorSize, string> = { small: "Pequeno", medium: "Médio", large: "Grande" };

type SizeSelectorProps = {
    value: SelectorSize;
    available: readonly SelectorSize[];
    onChange: (size: SelectorSize) => void;
    label: string;
};

export function SizeSelector({ value, available, onChange, label }: SizeSelectorProps) {
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
        const choices = ORDER.filter((size) => available.includes(size));
        const next = choices[(choices.indexOf(value) + delta + choices.length) % choices.length];
        onChange(next);
        groupRef.current?.querySelector<HTMLButtonElement>(`[data-size=${next}]`)?.focus();
    }

    return (
        <div
            ref={groupRef}
            role="radiogroup"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="flex bg-tint"
            style={{ borderRadius: SELECTOR.radius, padding: SELECTOR.padding }}
        >
            {ORDER.map((size) => {
                const enabled = available.includes(size);
                const checked = size === value;
                return (
                    <button
                        key={size}
                        type="button"
                        role="radio"
                        data-size={size}
                        aria-checked={checked}
                        aria-label={SPOKEN[size]}
                        disabled={!enabled}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onChange(size)}
                        className={cx(
                            "focus-ring flex size-8 items-center justify-center text-13 font-bold",
                            checked
                                ? "bg-ink text-bg"
                                : enabled
                                  ? "pressable text-ink"
                                  : "text-off",
                        )}
                        style={{ borderRadius: SELECTOR_CELL_RADIUS }}
                    >
                        {SIZE_LETTERS[size]}
                    </button>
                );
            })}
        </div>
    );
}
