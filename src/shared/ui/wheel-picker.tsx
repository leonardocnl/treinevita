"use client";

/*
 * Selection wheel built on native scroll snapping: on the iPhone it gets the
 * system's momentum and snap for free. Arrow keys and taps on a neighbour also
 * work. Made for the dark panel; the selection band (QuietBand) is drawn by the
 * parent so it can span several wheels.
 */

import { useCallback, useEffect, useRef } from "react";

export const WHEEL_ITEM_HEIGHT = 64;
const VISIBLE_ROWS = 3;

type WheelPickerProps = {
    values: readonly number[];
    value: number;
    onChange: (value: number) => void;
    format: (value: number) => string;
    label: string;
    unit: string;
    align?: "start" | "end" | "center";
    /** Shown next to the selected value (the red "load went up" dot). */
    marker?: React.ReactNode;
};

export function WheelPicker({
    values,
    value,
    onChange,
    format,
    label,
    unit,
    align = "center",
    marker,
}: WheelPickerProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const selectedIndex = Math.max(0, values.indexOf(value));
    const justify =
        align === "start"
            ? "justify-start pl-5"
            : align === "end"
              ? "justify-end pr-5"
              : "justify-center";
    const origin =
        align === "start" ? "origin-left" : align === "end" ? "origin-right" : "origin-center";

    useEffect(() => {
        const list = listRef.current;
        if (list) {
            list.scrollTop = selectedIndex * WHEEL_ITEM_HEIGHT;
        }
        // Only on mount and when the value list changes; scrolling drives updates afterwards.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values]);

    const settle = useCallback(() => {
        const list = listRef.current;
        if (!list) {
            return;
        }
        const index = Math.min(
            values.length - 1,
            Math.max(0, Math.round(list.scrollTop / WHEEL_ITEM_HEIGHT)),
        );
        if (values[index] !== value) {
            onChange(values[index]);
        }
    }, [onChange, value, values]);

    function handleScroll() {
        clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(settle, 80);
    }

    function step(delta: number) {
        const index = Math.min(values.length - 1, Math.max(0, selectedIndex + delta));
        listRef.current?.scrollTo({ top: index * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
        onChange(values[index]);
    }

    return (
        <div className="flex flex-col">
            <div
                ref={listRef}
                role="spinbutton"
                tabIndex={0}
                aria-label={label}
                aria-valuenow={value}
                aria-valuetext={`${format(value)} ${unit}`}
                onScroll={handleScroll}
                onKeyDown={(event) => {
                    if (event.key === "ArrowUp") {
                        event.preventDefault();
                        step(-1);
                    }
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        step(1);
                    }
                }}
                className="no-scrollbar fade-y relative w-full snap-y snap-mandatory overflow-y-scroll rounded-inner outline-none focus-visible:ring-1 focus-visible:ring-on-panel-dim"
                style={{
                    height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS,
                    paddingBlock: WHEEL_ITEM_HEIGHT,
                }}
            >
                {values.map((option, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <div
                            key={option}
                            onClick={() => step(index - selectedIndex)}
                            className="relative snap-center"
                            style={{ height: WHEEL_ITEM_HEIGHT }}
                        >
                            {/* Two states crossfade (opacity and scale), so the font size never animates. */}
                            <span
                                aria-hidden={!isSelected}
                                className={`num absolute inset-0 flex items-center gap-1.5 text-[56px] text-on-panel transition-[opacity,transform] duration-150 ease-enter ${justify} ${origin} ${
                                    isSelected ? "opacity-100" : "scale-[0.4] opacity-0"
                                }`}
                            >
                                {format(option)}
                                {isSelected ? marker : null}
                            </span>
                            <span
                                aria-hidden
                                className={`absolute inset-0 flex items-center text-[22px] font-light tabular-nums text-on-panel-dim transition-[opacity,transform] duration-150 ease-enter ${justify} ${origin} ${
                                    isSelected ? "scale-[2.5] opacity-0" : "opacity-100"
                                }`}
                            >
                                {format(option)}
                            </span>
                        </div>
                    );
                })}
            </div>
            <span className={`mt-1 flex text-[13px] text-on-panel-secondary ${justify}`}>
                {unit}
            </span>
        </div>
    );
}
