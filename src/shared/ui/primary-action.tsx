"use client";

/*
 * PrimaryAction: the one main action of a screen. 64px high, radius 20, a
 * solid inverse surface (ink in light, paper in dark), the label and a meta
 * line on the left, and a red cell on the right holding a 5×5 dot-matrix glyph.
 * Pressing scales it to 0.97 and lights the glyph's dots one by one along the
 * shape, from the first input event (never after the network).
 */
import {
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
} from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { CTA, CTA_CELL } from "./concentric";
import { cx } from "./cx";
import { GLYPHS, glyphDots, type GlyphName } from "./glyph";

/** 4px dots every 6.5px. */
const DOT = 4;
const PITCH = 6.5;
const GLYPH_SIZE = DOT + PITCH * 4;

function DotGlyph({ name, sweep }: { name: GlyphName; sweep: number }) {
    return (
        <span
            aria-hidden
            // The key restarts the sweep on every press.
            key={sweep}
            className="relative block"
            style={{ width: GLYPH_SIZE, height: GLYPH_SIZE }}
        >
            {glyphDots(GLYPHS[name]).map((dot) => (
                <span
                    key={`${dot.row}-${dot.col}`}
                    className={cx(
                        "absolute rounded-full bg-on-accent",
                        dot.lit ? sweep > 0 && "light-up" : "opacity-[0.18]",
                    )}
                    style={
                        {
                            width: DOT,
                            height: DOT,
                            left: dot.col * PITCH,
                            top: dot.row * PITCH,
                            "--order": dot.order,
                        } as CSSProperties
                    }
                />
            ))}
        </span>
    );
}

type PrimaryActionProps = ActionElementProps & {
    /** The label, in Mona 900/125 at 15px ("Começar", "Confirmar"). */
    label: ReactNode;
    /** The meta line, 10px uppercase ("7 exercícios · ~50 min"). */
    meta?: ReactNode;
    glyph: GlyphName;
    /** Take the rest of a row (next to the undo button). */
    grow?: boolean;
};

export function PrimaryAction({ label, meta, glyph, grow = false, ...props }: PrimaryActionProps) {
    const [sweep, setSweep] = useState(0);
    const disabled = "disabled" in props && props.disabled === true;

    // Merged here (and cast) because a link and a button type their events differently.
    const handlers = {
        onPointerDown: (event: PointerEvent<HTMLElement>) => {
            if (!disabled) {
                setSweep((count) => count + 1);
            }
            (props.onPointerDown as ((event: PointerEvent<HTMLElement>) => void) | undefined)?.(
                event,
            );
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (!disabled && (event.key === "Enter" || event.key === " ")) {
                setSweep((count) => count + 1);
            }
            (props.onKeyDown as ((event: KeyboardEvent<HTMLElement>) => void) | undefined)?.(event);
        },
    };

    return (
        <ActionElement
            {...({ ...props, ...handlers } as ActionElementProps)}
            style={{ height: CTA.height, padding: CTA.padding, paddingLeft: 20 }}
            className={cx(
                "pressable focus-ring flex w-full min-w-0 items-center justify-between gap-gutter rounded-cta bg-cta-bg text-left text-cta-fg disabled:opacity-40",
                grow && "flex-1",
            )}
        >
            <span className="flex min-w-0 flex-col gap-1">
                <span className="action truncate text-15">{label}</span>
                {meta !== undefined ? (
                    <span className="truncate text-10 font-semibold uppercase leading-none tracking-[0.1em] text-cta-meta tabular-nums">
                        {meta}
                    </span>
                ) : null}
            </span>
            <span
                className="flex shrink-0 items-center justify-center bg-accent"
                style={{
                    width: CTA_CELL.size,
                    height: CTA_CELL.size,
                    borderRadius: CTA_CELL.radius,
                }}
            >
                <DotGlyph name={glyph} sweep={sweep} />
            </span>
        </ActionElement>
    );
}
