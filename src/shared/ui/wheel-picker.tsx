"use client";

/*
 * Selection wheel (design v2) on native scroll snapping. On the iPhone the
 * scroll runs on the compositor with the system's momentum, and mandatory
 * snapping always lands exactly on a value; a JavaScript spring would fight
 * Safari's touch scrolling and lose frames.
 *
 * Three rows: the selected value in Doto 64 (smaller only when a long value
 * like "102,5" would not fit the column), one neighbor above and one below in
 * Doto 36 at 22%. A 6px red dot marks the selected row on the outer side, and
 * the 11px label sits under the wheel. The value under the center follows the
 * scroll on every frame and pulses at each step; the new value is committed
 * when scrolling ends. Vertical only. Arrow keys move one step.
 */

import { memo, useLayoutEffect, useRef, useState } from "react";

import { cx } from "./cx";

export const WHEEL_ITEM_HEIGHT = 72;
const VISIBLE_ROWS = 3;
/** Biggest size of the selected value, in px. */
const MAX_FONT_PX = 64;
/** Width of one glyph of Doto (monospaced: 0.6em) plus a little air. */
const GLYPH_EM = 0.61;
/** Room for the red dot and its gap on the outer side (6 + 10px). */
const RESERVED_PX = 16;
/** Silence after the last scroll event that counts as "settled" where `scrollend` is missing. */
const SETTLE_MS = 60;

type WheelPickerProps = {
    values: readonly number[];
    value: number;
    onChange: (value: number) => void;
    format: (value: number) => string;
    /** Spoken name ("Carga em quilos"). */
    label: string;
    /** The 11px label under the wheel ("kg", "repetições"). */
    unit: string;
    /** Which side is outer: the red dot and the alignment. */
    align?: "start" | "end" | "center";
};

/**
 * Font size of a selected value: 64px, or smaller when it would not fit the
 * column (container query width, `cqi`). "7,5" stays at 64px; "102,5" shrinks.
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
}: WheelPickerProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    /** Where a key press or a tap is scrolling to, so quick presses add up. */
    const target = useRef<number | null>(null);
    const committedIndex = Math.max(0, values.indexOf(value));
    const [centered, setCentered] = useState(committedIndex);

    const justify =
        align === "start"
            ? "justify-start pl-4"
            : align === "end"
              ? "justify-end pr-4"
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

    // A value set from outside (the next suggestion after a confirm) moves the wheel.
    const [seenValue, setSeenValue] = useState(value);
    if (value !== seenValue) {
        setSeenValue(value);
        setCentered(committedIndex);
    }
    useLayoutEffect(() => {
        const list = listRef.current;
        if (list && target.current === null && indexAtCenter() !== committedIndex) {
            list.scrollTo({ top: committedIndex * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seenValue]);

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
        <div className="@container flex min-w-0 flex-col gap-inner">
            <div className="relative">
                {align !== "center" ? (
                    <span
                        aria-hidden
                        className={cx(
                            "pointer-events-none absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent",
                            align === "start" ? "left-0" : "right-0",
                        )}
                    />
                ) : null}
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
                    className="no-scrollbar focus-ring relative w-full touch-pan-y snap-y snap-mandatory overflow-x-hidden overflow-y-scroll overscroll-contain"
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
                            near={Math.abs(index - centered) === 1}
                            justify={justify}
                            origin={origin}
                            onSelect={() => step(index - (target.current ?? indexAtCenter()))}
                        />
                    ))}
                </div>
            </div>
            <span className={`label flex ${justify}`}>{unit}</span>
        </div>
    );
}

type WheelRowProps = {
    text: string;
    selected: boolean;
    near: boolean;
    justify: string;
    origin: string;
    onSelect: () => void;
};

/** One value. Only rows whose state changes render again while scrolling. */
const WheelRow = memo(
    function WheelRow({ text, selected, near, justify, origin, onSelect }: WheelRowProps) {
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
                    className={`num absolute inset-0 flex items-center whitespace-nowrap text-ink transition-[opacity,transform] duration-(--vita-duration-snappy) ease-snappy ${justify} ${origin} ${
                        selected ? "opacity-100" : "scale-[0.56] opacity-0"
                    }`}
                >
                    {/* Remounts when the row reaches the center, so the pulse plays once per step. */}
                    <span
                        key={selected ? "on" : "off"}
                        className={`${origin} ${selected ? "wheel-tick" : ""}`}
                    >
                        {text}
                    </span>
                </span>
                <span
                    aria-hidden
                    className={`num absolute inset-0 flex items-center whitespace-nowrap text-36 text-ink transition-[opacity,transform] duration-(--vita-duration-snappy) ease-snappy ${justify} ${origin} ${
                        selected ? "scale-[1.78] opacity-0" : near ? "opacity-[0.22]" : "opacity-0"
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
        before.near === after.near,
);
