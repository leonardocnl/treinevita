"use client";

import { useCallback, useEffect, useRef } from "react";

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 3;

type WheelPickerProps = {
    values: readonly number[];
    value: number;
    onChange: (value: number) => void;
    format: (value: number) => string;
    label: string;
    unit: string;
    marker?: React.ReactNode;
};

/**
 * Selection wheel built on native scroll snapping: on the iPhone it gets the
 * system's momentum and snap for free. Arrow keys also work.
 */
export function WheelPicker({
    values,
    value,
    onChange,
    format,
    label,
    unit,
    marker,
}: WheelPickerProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const selectedIndex = Math.max(0, values.indexOf(value));

    useEffect(() => {
        const list = listRef.current;
        if (list) {
            list.scrollTop = selectedIndex * ITEM_HEIGHT;
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
            Math.max(0, Math.round(list.scrollTop / ITEM_HEIGHT)),
        );
        if (values[index] !== value) {
            onChange(values[index]);
        }
    }, [onChange, value, values]);

    function handleScroll() {
        clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(settle, 90);
    }

    function step(delta: number) {
        const index = Math.min(values.length - 1, Math.max(0, selectedIndex + delta));
        listRef.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
        onChange(values[index]);
    }

    return (
        <div className="relative flex flex-col items-center">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 rounded-[20px] bg-paper/10"
                style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT + 8, marginTop: -4 }}
            />
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
                className="no-scrollbar relative w-full snap-y snap-mandatory overflow-y-scroll outline-none"
                style={{
                    height: ITEM_HEIGHT * VISIBLE_ROWS,
                    paddingBlock: ITEM_HEIGHT,
                    maskImage: "linear-gradient(transparent, #000 30%, #000 70%, transparent)",
                }}
            >
                {values.map((option, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <div
                            key={option}
                            onClick={() => step(index - selectedIndex)}
                            className={`numeric flex snap-center items-center justify-center gap-1.5 transition-[font-size,color] duration-150 ${
                                isSelected
                                    ? "text-[40px] font-extrabold text-paper"
                                    : "text-[19px] font-bold text-on-ink-secondary"
                            }`}
                            style={{ height: ITEM_HEIGHT }}
                        >
                            {format(option)}
                            {isSelected ? marker : null}
                        </div>
                    );
                })}
            </div>
            <span className="mt-1 text-[13px] text-on-ink-secondary">{unit}</span>
        </div>
    );
}
