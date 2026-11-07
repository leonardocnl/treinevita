"use client";

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
    marker?: React.ReactNode;
};

/**
 * Selection wheel built on native scroll snapping: on the iPhone it gets the
 * system's momentum and snap for free. Arrow keys also work. The selection
 * band is drawn by the parent so it can span several wheels.
 */
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
                className="no-scrollbar relative w-full snap-y snap-mandatory overflow-y-scroll rounded-[20px] outline-none focus-visible:ring-1 focus-visible:ring-on-panel-dim"
                style={{
                    height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS,
                    paddingBlock: WHEEL_ITEM_HEIGHT,
                    maskImage: "linear-gradient(transparent, #000 34%, #000 66%, transparent)",
                }}
            >
                {values.map((option, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <div
                            key={option}
                            onClick={() => step(index - selectedIndex)}
                            className={`num flex snap-center items-center gap-1.5 ${justify} transition-[font-size,color] duration-150 ease-out ${
                                isSelected
                                    ? "text-[56px] text-on-panel"
                                    : "text-[24px] text-on-panel-dim"
                            }`}
                            style={{ height: WHEEL_ITEM_HEIGHT }}
                        >
                            {format(option)}
                            {isSelected ? marker : null}
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
