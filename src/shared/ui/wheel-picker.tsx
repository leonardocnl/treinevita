"use client";

/*
 * Selection wheel built on native scroll snapping. On the iPhone, scrolling runs
 * on the compositor with the system's own momentum, and mandatory snapping always
 * lands exactly on a value; a JavaScript spring would fight Safari's touch
 * scrolling and lose frames. `scroll-snap-stop` stays `normal` so a flick can
 * cross many values (`always` would stop at every one).
 *
 * The value under the center follows the scroll on every frame, and each value
 * passing the center gets a short tick (a 2% scale pulse, 80ms). The new value is
 * committed when scrolling ends. Arrow keys move one step; taps on a neighbour
 * and the mouse wheel work too. The column only scrolls vertically, and a long
 * value ("102,5") gets a smaller font so it always fits.
 *
 * Made for the dark panel; the selection band (QuietBand) is drawn by the parent
 * so it can span several wheels.
 */

import { memo, useLayoutEffect, useRef, useState } from "react";

export const WHEEL_ITEM_HEIGHT = 64;
const VISIBLE_ROWS = 3;
/** Biggest size of the selected value, in px. */
const MAX_FONT_PX = 56;
/** Width of one glyph of the dot font (Doto is monospaced: 0.6em, plus 0.01em tracking). */
const GLYPH_EM = 0.61;
/** Room for the side padding (20px) and the marker dot with its gap (14px). */
const RESERVED_PX = 34;
/** Silence after the last scroll event that counts as "settled" where `scrollend` is missing. */
const SETTLE_MS = 60;

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

/**
 * Font size of a selected value: 56px, or smaller when that value would not fit
 * the column (container query width, `cqi`). "7,5" stays at 56px; "102,5" shrinks.
 */
export function wheelFontSize(text: string): string {
    const ems = Math.round(text.length * GLYPH_EM * 100) / 100;
    return `min(${MAX_FONT_PX}px, calc((100cqi - ${RESERVED_PX}px) / ${ems}))`;
}

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
    /** Where a key press or a tap is scrolling to, so quick presses add up. */
    const target = useRef<number | null>(null);
    const committedIndex = Math.max(0, values.indexOf(value));
    const [centered, setCentered] = useState(committedIndex);

    const justify =
        align === "start"
            ? "justify-start pl-5"
            : align === "end"
              ? "justify-end pr-5"
              : "justify-center";
    const origin =
        align === "start" ? "origin-left" : align === "end" ? "origin-right" : "origin-center";

    // Before the first paint, so the wheel never shows the top of the list first.
    useLayoutEffect(() => {
        const list = listRef.current;
        if (list) {
            list.scrollTop = committedIndex * WHEEL_ITEM_HEIGHT;
        }
        // Only on mount and when the value list changes; scrolling drives updates afterwards.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values]);

    function indexAtCenter(): number {
        const top = listRef.current?.scrollTop ?? 0;
        return Math.min(values.length - 1, Math.max(0, Math.round(top / WHEEL_ITEM_HEIGHT)));
    }

    function commit() {
        clearTimeout(settleTimer.current);
        target.current = null;
        const index = indexAtCenter();
        setCentered(index);
        if (values[index] !== value) {
            onChange(values[index]);
        }
    }

    function handleScroll() {
        setCentered(indexAtCenter());
        clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(commit, SETTLE_MS);
    }

    function step(delta: number) {
        const from = target.current ?? indexAtCenter();
        const index = Math.min(values.length - 1, Math.max(0, from + delta));
        target.current = index;
        listRef.current?.scrollTo({ top: index * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
        setCentered(index);
        onChange(values[index]);
    }

    return (
        <div className="@container flex min-w-0 flex-col">
            <div
                ref={listRef}
                role="spinbutton"
                tabIndex={0}
                aria-label={label}
                aria-valuenow={value}
                aria-valuetext={`${format(value)} ${unit}`}
                onScroll={handleScroll}
                onScrollEnd={commit}
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
                className="no-scrollbar fade-y relative w-full touch-pan-y snap-y snap-mandatory overflow-x-hidden overflow-y-scroll overscroll-contain rounded-inner outline-none focus-visible:ring-1 focus-visible:ring-on-panel-dim"
                style={{
                    height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS,
                    paddingBlock: WHEEL_ITEM_HEIGHT,
                }}
            >
                {values.map((option, index) => (
                    <WheelRow
                        key={option}
                        text={format(option)}
                        selected={index === centered}
                        justify={justify}
                        origin={origin}
                        marker={index === centered ? marker : null}
                        onSelect={() => step(index - (target.current ?? indexAtCenter()))}
                    />
                ))}
            </div>
            <span className={`mt-1 flex text-[13px] text-on-panel-secondary ${justify}`}>
                {unit}
            </span>
        </div>
    );
}

type WheelRowProps = {
    text: string;
    selected: boolean;
    justify: string;
    origin: string;
    marker: React.ReactNode;
    onSelect: () => void;
};

/** One value. Only the two rows whose selection changes render again while scrolling. */
const WheelRow = memo(
    function WheelRow({ text, selected, justify, origin, marker, onSelect }: WheelRowProps) {
        return (
            <div
                onClick={onSelect}
                // Clipped, so the scaled-out ghost never widens the column (no sideways scroll).
                className="relative snap-center snap-normal overflow-hidden"
                style={{ height: WHEEL_ITEM_HEIGHT }}
            >
                {/* Two states crossfade (opacity and scale), so the font size never animates. */}
                <span
                    aria-hidden={!selected}
                    style={{ fontSize: wheelFontSize(text) }}
                    className={`num absolute inset-0 flex items-center gap-1.5 whitespace-nowrap text-on-panel transition-[opacity,transform] duration-(--vita-duration-snappy) ease-snappy ${justify} ${origin} ${
                        selected ? "opacity-100" : "scale-[0.4] opacity-0"
                    }`}
                >
                    {/* Remounts when the row reaches the center, so the tick plays once per value. */}
                    <span
                        key={selected ? "on" : "off"}
                        className={`${origin} ${selected ? "wheel-tick" : ""}`}
                    >
                        {text}
                    </span>
                    {marker}
                </span>
                <span
                    aria-hidden
                    className={`absolute inset-0 flex items-center whitespace-nowrap text-[22px] font-light tabular-nums text-on-panel-dim transition-[opacity,transform] duration-(--vita-duration-snappy) ease-snappy ${justify} ${origin} ${
                        selected ? "scale-[2.5] opacity-0" : "opacity-100"
                    }`}
                >
                    {text}
                </span>
            </div>
        );
    },
    // The click handler changes on every render; the row only depends on what it shows.
    (before, after) =>
        before.text === after.text &&
        before.selected === after.selected &&
        before.marker === after.marker,
);
