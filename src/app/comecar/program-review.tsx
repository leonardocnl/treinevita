"use client";

/*
 * Review of the chosen template: one section per day. Tapping an exercise
 * opens a sheet to swap it (same primary muscle) or remove it; swiping it to
 * the left removes it (Delete does the same from the keyboard). "Limpar ficha"
 * sits at the end behind a confirmation sheet. It only edits the draft; saving
 * happens with the whole onboarding.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import type { CatalogEntry } from "@/modules/catalog";
import {
    addExercise,
    clearDraft,
    MAX_EXERCISES_PER_DAY,
    removeExercise,
    replaceExercise,
    type ProgramDraft,
    type ProgramTemplate,
} from "@/modules/training/client";
import { cx } from "@/shared/ui/cx";
import { ExerciseThumb } from "@/shared/ui/exercise-demo";
import { Icon } from "@/shared/ui/icons";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { PlusButton } from "@/shared/ui/plus-button";
import { Sheet } from "@/shared/ui/sheet";
import { TextButton } from "@/shared/ui/text-button";

type Picker = { kind: "swap"; day: number; position: number } | { kind: "add"; day: number };

type ProgramReviewProps = {
    draft: ProgramDraft;
    onChange: (draft: ProgramDraft) => void;
    template: ProgramTemplate;
    catalog: readonly CatalogEntry[];
};

export function ProgramReview({ draft, onChange, template, catalog }: ProgramReviewProps) {
    const [picker, setPicker] = useState<Picker | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));

    function prescription(dayIndex: number, slug: string): string {
        const planned = template.days[dayIndex]?.exercises.find((item) => item.slug === slug);
        const sets = planned?.sets ?? 3;
        if (planned?.durationMin !== undefined) {
            return `${sets} × ${planned.durationMin}–${planned.durationMax} s`;
        }
        if (planned) {
            return `${sets} × ${planned.repMin}–${planned.repMax}`;
        }
        return bySlug.get(slug)?.measurement === "duration" ? "3 × 30–45 s" : "3 × 10–12";
    }

    function pickerOptions(current: Picker): CatalogEntry[] {
        const taken = new Set(draft.days[current.day].slugs);
        if (current.kind === "add") {
            return catalog.filter((entry) => !taken.has(entry.slug));
        }
        const replaced = bySlug.get(draft.days[current.day].slugs[current.position]);
        const muscles = new Set(replaced?.primaryMuscles.map((muscle) => muscle.slug));
        return catalog.filter(
            (entry) =>
                !taken.has(entry.slug) &&
                entry.primaryMuscles.some((muscle) => muscles.has(muscle.slug)),
        );
    }

    function pick(slug: string) {
        if (!picker) {
            return;
        }
        onChange(
            picker.kind === "swap"
                ? replaceExercise(draft, picker.day, picker.position, slug)
                : addExercise(draft, picker.day, slug),
        );
        setPicker(null);
    }

    function removeFromPicker() {
        if (picker?.kind === "swap") {
            onChange(removeExercise(draft, picker.day, picker.position));
        }
        setPicker(null);
    }

    const options = picker ? pickerOptions(picker) : [];

    return (
        <div className="flex flex-col gap-section">
            {draft.days.map((day, dayIndex) => (
                <section key={day.label} aria-labelledby={`dia-${day.label}`}>
                    <div className="flex items-baseline justify-between">
                        <h2 className="action text-20" id={`dia-${day.label}`}>
                            Treino {day.label}
                        </h2>
                        {day.title ? (
                            <span className="text-13 text-secondary">{day.title}</span>
                        ) : null}
                    </div>
                    {day.slugs.length === 0 ? (
                        <p className="text-17 mt-label">Nenhum exercício neste dia.</p>
                    ) : (
                        <ol className="mt-label flex flex-col gap-inner">
                            {day.slugs.map((slug, position) => {
                                const entry = bySlug.get(slug);
                                return (
                                    <SwipeRow
                                        key={slug}
                                        name={entry?.name ?? slug}
                                        detail={prescription(dayIndex, slug)}
                                        media={entry?.media ?? null}
                                        onTap={() =>
                                            setPicker({ kind: "swap", day: dayIndex, position })
                                        }
                                        onRemove={() =>
                                            onChange(removeExercise(draft, dayIndex, position))
                                        }
                                    />
                                );
                            })}
                        </ol>
                    )}
                    {day.slugs.length < MAX_EXERCISES_PER_DAY ? (
                        <div className="mt-label flex h-11 items-center">
                            <PlusButton
                                onClick={() => setPicker({ kind: "add", day: dayIndex })}
                                aria-label={`Adicionar exercício ao Treino ${day.label}`}
                            >
                                Adicionar
                            </PlusButton>
                        </div>
                    ) : null}
                </section>
            ))}

            <div>
                <TextButton onClick={() => setConfirmClear(true)}>Limpar ficha</TextButton>
            </div>

            <Sheet
                open={picker !== null}
                onClose={() => setPicker(null)}
                title={picker?.kind === "swap" ? "Trocar exercício" : "Adicionar exercício"}
            >
                {options.length === 0 ? (
                    <p className="text-17 mt-inner">
                        Nenhum outro exercício para esse músculo no catálogo.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-inner">
                        {options.map((entry) => (
                            <li key={entry.slug}>
                                <button
                                    type="button"
                                    onClick={() => pick(entry.slug)}
                                    className="pressable flex min-h-16 w-full items-center gap-gutter text-left"
                                >
                                    <ExerciseThumb media={entry.media} />
                                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="text-17 font-semibold">{entry.name}</span>
                                        <span className="text-13 text-secondary">
                                            {entry.primaryMuscles
                                                .map((muscle) => muscle.name)
                                                .join(", ")}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {picker?.kind === "swap" ? (
                    <div className="mt-intro">
                        <TextButton onClick={removeFromPicker}>Remover do treino</TextButton>
                    </div>
                ) : null}
            </Sheet>

            <Sheet open={confirmClear} onClose={() => setConfirmClear(false)} title="Limpar ficha">
                <p className="text-17 mt-inner">
                    Todos os dias ficam vazios. Depois você adiciona os exercícios que quiser.
                </p>
                <div className="mt-intro">
                    <PrimaryAction
                        glyph="check"
                        label="Limpar ficha"
                        onClick={() => {
                            onChange(clearDraft(draft));
                            setConfirmClear(false);
                        }}
                    />
                </div>
            </Sheet>
        </div>
    );
}

/** Dragged this far to the left (px), the row is removed. */
const REMOVE_DISTANCE = 96;
/** Matches --vita-duration-exit in globals.css. */
const LEAVE_MS = 200;

type SwipeRowProps = {
    name: string;
    detail: string;
    media: CatalogEntry["media"];
    onTap: () => void;
    onRemove: () => void;
};

/**
 * An exercise row: tap to swap, swipe left to remove (the row follows the
 * finger with translateX and, past the threshold, slides out and fades).
 */
function SwipeRow({ name, detail, media, onTap, onRemove }: SwipeRowProps) {
    const start = useRef<{ x: number; y: number } | null>(null);
    const swiped = useRef(false);
    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [leaving, setLeaving] = useState(false);

    function remove() {
        setLeaving(true);
        setTimeout(onRemove, LEAVE_MS);
    }

    function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
        start.current = { x: event.clientX, y: event.clientY };
        swiped.current = false;
    }

    function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
        if (!start.current) {
            return;
        }
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        if (!dragging) {
            // A vertical move is the page scrolling: let it go.
            if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
                start.current = null;
                return;
            }
            if (dx > -8) {
                return;
            }
            setDragging(true);
            swiped.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        setOffset(Math.min(0, dx));
    }

    function onPointerUp() {
        start.current = null;
        if (!dragging) {
            return;
        }
        setDragging(false);
        if (offset < -REMOVE_DISTANCE) {
            remove();
        } else {
            setOffset(0);
        }
    }

    function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            remove();
        }
    }

    return (
        <li className="relative overflow-hidden">
            <span
                aria-hidden
                className={cx(
                    "absolute inset-y-0 right-0 flex items-center pr-2 text-ink transition-opacity duration-150",
                    offset < -24 || leaving ? "opacity-100" : "opacity-0",
                )}
            >
                <Icon name="trash" size={20} />
            </span>
            <button
                type="button"
                onClick={() => {
                    if (!swiped.current) {
                        onTap();
                    }
                }}
                onKeyDown={onKeyDown}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label={`${name}, ${detail}. Toque para trocar.`}
                aria-keyshortcuts="Delete"
                // Only while moving, so the press scale still shows on a plain tap.
                style={
                    leaving
                        ? { transform: "translateX(-100%)" }
                        : offset !== 0
                          ? {
                                transform: `translateX(${offset}px)`,
                                transition: dragging ? "none" : undefined,
                            }
                          : undefined
                }
                className={cx(
                    "relative flex min-h-16 w-full touch-pan-y items-center gap-gutter bg-bg text-left",
                    leaving ? "leave opacity-0" : "pressable",
                )}
            >
                <ExerciseThumb media={media} />
                <span className="flex min-w-0 flex-1 flex-col gap-1 py-2">
                    <span className="text-17 font-semibold">{name}</span>
                    <span className="text-13 text-secondary tabular-nums">{detail}</span>
                </span>
            </button>
        </li>
    );
}
