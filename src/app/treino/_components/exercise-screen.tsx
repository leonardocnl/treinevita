"use client";

/*
 * The set logging screen (DESIGN.md, "Set logging screen"), top to bottom:
 * back and reference buttons; the session timeline with the clock; the caption
 * row; the exercise name; the drawing; the wheels (kg 2/3, reps 1/3); the set
 * stepper; "PRÓXIMO" pinned above the bottom bar; undo and "CONFIRMAR".
 *
 * Confirming changes everything in the same frame (the current bar turns ink,
 * the next one red, the value lands in its column, the wheels stay on the next
 * suggestion) and saves in the background. A horizontal swipe changes exercise.
 */
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { formatDuration, formatNumber } from "@/shared/format/numbers";
import { cx } from "@/shared/ui/cx";
import { Dot } from "@/shared/ui/dot";
import { ExerciseDemo, youtubeSearchUrl } from "@/shared/ui/exercise-demo";
import { IconButton } from "@/shared/ui/icon-button";
import { Icon } from "@/shared/ui/icons";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { Sheet } from "@/shared/ui/sheet";
import { Stepper, type StepState } from "@/shared/ui/stepper";
import { BottomBar } from "@/shared/ui/bottom-bar";
import { WheelPicker } from "@/shared/ui/wheel-picker";
import { safeExternalUrl } from "@/shared/url/external-url";

import { nextSuggestion, type LoggedSet, type WorkoutExercise } from "./workout-state";

type ExerciseScreenProps = {
    exercise: WorkoutExercise;
    exercises: readonly WorkoutExercise[];
    position: number;
    startedAt: Date;
    onGo: (position: number | null) => void;
    onLog: (set: LoggedSet) => void;
    onUndo: () => void;
    onEdit: (index: number, set: LoggedSet) => void;
};

function range(start: number, end: number, step: number): number[] {
    const values: number[] = [];
    for (let value = start; value <= end + 1e-9; value += step) {
        values.push(Math.round(value * 100) / 100);
    }
    return values;
}

/** Loads from zero to at least 150 kg in steps of the exercise increment, always including the suggested load. */
function loadValues(incrementKg: number, suggestedKg: number): number[] {
    const step = incrementKg > 0 ? incrementKg : 2.5;
    const values = range(0, Math.max(suggestedKg * 2, suggestedKg + step * 20, 150), step);
    if (!values.includes(suggestedKg)) {
        values.push(suggestedKg);
        values.sort((a, b) => a - b);
    }
    return values;
}

function setText(set: LoggedSet): string {
    return set.durationSeconds !== null
        ? formatDuration(set.durationSeconds)
        : `${formatNumber(set.loadKg ?? 0)} × ${set.reps ?? 0}`;
}

function prescription(exercise: WorkoutExercise): string {
    if (exercise.measurement === "duration") {
        const min = exercise.durationMinSeconds ?? 30;
        const max = exercise.durationMaxSeconds ?? min;
        return `${exercise.targetSets} × ${min === max ? min : `${min}–${max}`} s`;
    }
    const min = exercise.repMin ?? exercise.repMax ?? 10;
    const max = exercise.repMax ?? min;
    return `${exercise.targetSets} × ${min === max ? min : `${min}–${max}`}`;
}

/** "18:42", or "1:05:12" past an hour. Updates once a second. */
function SessionClock({ startedAt }: { startedAt: Date }) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const seconds = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = String(seconds % 60).padStart(2, "0");
    const text =
        hours > 0
            ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
            : `${String(minutes).padStart(2, "0")}:${rest}`;
    return (
        <span className="flex shrink-0 items-center gap-inner">
            <Dot size={6} tone="accent" pulse />
            <span
                className="strong text-13 tabular-nums"
                suppressHydrationWarning
                aria-label={`Tempo de treino ${text}`}
            >
                {text}
            </span>
        </span>
    );
}

export function ExerciseScreen({
    exercise,
    exercises,
    position,
    startedAt,
    onGo,
    onLog,
    onUndo,
    onEdit,
}: ExerciseScreenProps) {
    const isDuration = exercise.measurement === "duration";
    const done = exercise.doneSets.length;
    const finished = done >= exercise.targetSets;
    const total = exercises.length;
    const next = position < total ? position + 1 : null;

    // The wheels open on the suggestion (last time's value, or the last set logged now).
    const [suggested] = useState(() => nextSuggestion(exercise));
    const [loadKg, setLoadKg] = useState(suggested.loadKg);
    const [reps, setReps] = useState(suggested.reps);
    const [durationSeconds, setDurationSeconds] = useState(suggested.durationSeconds);
    const [loads] = useState(() => loadValues(exercise.incrementKg, suggested.loadKg));
    const [repValues] = useState(() => range(1, Math.max(30, suggested.reps + 5), 1));
    const [durations] = useState(() => range(5, Math.max(180, suggested.durationSeconds + 30), 5));
    const [demoOpen, setDemoOpen] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);

    const current: LoggedSet = isDuration
        ? { loadKg: null, reps: null, durationSeconds }
        : { loadKg, reps, durationSeconds: null };
    const reference = safeExternalUrl(exercise.referenceUrl);

    const timeline: StepState[] = exercises.map((item, index) =>
        index === position - 1
            ? "current"
            : item.doneSets.length >= item.targetSets
              ? "done"
              : "future",
    );

    // A horizontal swipe anywhere changes exercise; vertical moves stay with the wheels and the page.
    const swipe = useRef<{ x: number; y: number } | null>(null);
    function onPointerDown(event: PointerEvent<HTMLElement>) {
        swipe.current = { x: event.clientX, y: event.clientY };
    }
    function onPointerUp(event: PointerEvent<HTMLElement>) {
        const start = swipe.current;
        swipe.current = null;
        if (!start) {
            return;
        }
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) {
                onGo(next);
            } else {
                onGo(position > 1 ? position - 1 : null);
            }
        }
    }

    return (
        <>
            <main
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                    swipe.current = null;
                }}
                className="pt-top mx-auto w-full max-w-md touch-pan-y px-margin pb-[calc(max(34px,env(safe-area-inset-bottom))+176px)]"
            >
                <div className="flex h-10 items-center justify-between">
                    <IconButton
                        icon="chevron-left"
                        onClick={() => onGo(null)}
                        aria-label="Voltar à lista do treino"
                    />
                    <IconButton
                        icon="external-link"
                        href={reference ?? youtubeSearchUrl(exercise.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={
                            reference
                                ? `Ver ${exercise.name} em outro site, abre em nova aba`
                                : `Buscar ${exercise.name} no YouTube, abre em nova aba`
                        }
                    />
                </div>

                <div className="mt-intro flex items-center gap-gutter">
                    <Stepper
                        label="Exercícios do treino"
                        steps={timeline}
                        onSelect={(index) => onGo(index + 1)}
                        stepLabel={(index) =>
                            `${exercises[index].name}, ${
                                timeline[index] === "done"
                                    ? "concluído"
                                    : timeline[index] === "current"
                                      ? "atual"
                                      : "a fazer"
                            }`
                        }
                    />
                    <SessionClock startedAt={startedAt} />
                </div>

                <div className="mt-block flex items-center justify-between gap-gutter">
                    <p className="label">
                        Exercício {position} de {total}
                    </p>
                    <p className="label tabular-nums">{prescription(exercise)}</p>
                </div>
                <h1 className="headline mt-inner text-34">{exercise.name}</h1>

                {exercise.media ? (
                    <button
                        type="button"
                        onClick={() => setDemoOpen(true)}
                        aria-label={`Ver ${exercise.name} em tela cheia`}
                        className="pressable focus-ring mt-intro block w-full"
                    >
                        <ExerciseDemo name={exercise.name} media={exercise.media} height={152} />
                    </button>
                ) : null}

                <section aria-label="Registro da série" className="mt-block">
                    {isDuration ? (
                        <WheelPicker
                            values={durations}
                            value={durationSeconds}
                            onChange={setDurationSeconds}
                            format={String}
                            label="Duração em segundos"
                            unit="segundos"
                            align="start"
                        />
                    ) : (
                        <div className="grid grid-cols-[2fr_1fr] gap-gutter">
                            <div className="flex min-w-0 flex-col gap-inner">
                                <WheelPicker
                                    values={loads}
                                    value={loadKg}
                                    onChange={setLoadKg}
                                    format={(value) => formatNumber(value)}
                                    label="Carga em quilos"
                                    unit="kg"
                                    align="start"
                                />
                                {exercise.stagnantWeeks !== null ? (
                                    <p className="flex items-center gap-inner text-13 font-semibold">
                                        <Dot size={6} tone="accent" />
                                        parado há {exercise.stagnantWeeks} semanas
                                    </p>
                                ) : null}
                            </div>
                            <WheelPicker
                                values={repValues}
                                value={reps}
                                onChange={setReps}
                                format={String}
                                label="Repetições"
                                unit="repetições"
                                align="end"
                            />
                        </div>
                    )}
                </section>

                <ol
                    aria-label="Séries"
                    className="mt-block grid gap-gutter"
                    style={{
                        gridTemplateColumns: `repeat(${exercise.targetSets}, minmax(0, 1fr))`,
                    }}
                >
                    {Array.from({ length: exercise.targetSets }, (_, index) => {
                        const set = exercise.doneSets[index];
                        const state: StepState = set
                            ? "done"
                            : index === done
                              ? "current"
                              : "future";
                        const body = (
                            <>
                                <span className="label tabular-nums">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span
                                    className={cx(
                                        "strong mt-inner block truncate text-15 tabular-nums",
                                        state === "current" && "text-accent-text",
                                        state === "future" && "text-off",
                                    )}
                                >
                                    {set ? (
                                        <span key={setText(set)} className="roll-in">
                                            {setText(set)}
                                        </span>
                                    ) : state === "current" ? (
                                        setText(current)
                                    ) : (
                                        "—"
                                    )}
                                </span>
                                <span
                                    className={cx(
                                        "mt-gutter block h-1 rounded-full",
                                        state === "done"
                                            ? "bg-ink"
                                            : state === "current"
                                              ? "bg-accent"
                                              : "bg-off",
                                    )}
                                />
                            </>
                        );
                        return (
                            <li key={index} className="min-w-0">
                                {set ? (
                                    <button
                                        type="button"
                                        onClick={() => setEditing(index)}
                                        aria-label={`Corrigir série ${index + 1}: ${setText(set)}`}
                                        className="pressable focus-ring block w-full text-left"
                                    >
                                        {body}
                                    </button>
                                ) : (
                                    <div
                                        aria-label={`Série ${index + 1}${state === "current" ? ", atual" : ""}`}
                                    >
                                        {body}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </main>

            <BottomBar
                above={
                    <button
                        type="button"
                        onClick={() => onGo(next)}
                        className="pressable focus-ring flex w-full items-center justify-between gap-gutter text-left"
                    >
                        <span className="flex min-w-0 flex-col gap-1">
                            <span className="label">Próximo</span>
                            <span className="truncate text-13 font-semibold">
                                {next ? exercises[next - 1].name : "Lista do treino e finalizar"}
                            </span>
                        </span>
                        <Icon name="chevron-right" size={20} />
                    </button>
                }
            >
                <button
                    type="button"
                    onClick={onUndo}
                    disabled={done === 0}
                    aria-label="Desfazer a última série"
                    className="pressable focus-ring flex size-16 shrink-0 items-center justify-center rounded-full bg-tint text-ink disabled:opacity-40"
                >
                    <Icon name="undo" size={24} />
                </button>
                {finished ? (
                    <PrimaryAction
                        grow
                        glyph="arrow"
                        label={next ? "Próximo" : "Lista do treino"}
                        meta={next ? exercises[next - 1].name : `${total} exercícios`}
                        onClick={() => onGo(next)}
                    />
                ) : (
                    <PrimaryAction
                        grow
                        glyph="check"
                        label="Confirmar"
                        meta={
                            isDuration
                                ? formatDuration(durationSeconds)
                                : `${formatNumber(loadKg)} kg × ${reps}`
                        }
                        onClick={() => onLog(current)}
                    />
                )}
            </BottomBar>

            <Sheet open={demoOpen} onClose={() => setDemoOpen(false)} title={exercise.name}>
                <ExerciseDemo name={exercise.name} media={exercise.media} height={320} />
            </Sheet>

            <EditSetSheet
                key={editing ?? "none"}
                index={editing}
                set={editing !== null ? exercise.doneSets[editing] : undefined}
                loads={loads}
                repValues={repValues}
                durations={durations}
                onClose={() => setEditing(null)}
                onSave={(index, set) => {
                    setEditing(null);
                    onEdit(index, set);
                }}
            />
        </>
    );
}

function EditSetSheet({
    index,
    set,
    loads,
    repValues,
    durations,
    onClose,
    onSave,
}: {
    index: number | null;
    set: LoggedSet | undefined;
    loads: readonly number[];
    repValues: readonly number[];
    durations: readonly number[];
    onClose: () => void;
    onSave: (index: number, set: LoggedSet) => void;
}) {
    const [loadKg, setLoadKg] = useState(set?.loadKg ?? 0);
    const [reps, setReps] = useState(set?.reps ?? 10);
    const [durationSeconds, setDurationSeconds] = useState(set?.durationSeconds ?? 30);
    const isDuration = set?.durationSeconds !== null && set?.durationSeconds !== undefined;
    return (
        <Sheet
            open={index !== null && set !== undefined}
            onClose={onClose}
            title={`Série ${String((index ?? 0) + 1).padStart(2, "0")}`}
        >
            {isDuration ? (
                <WheelPicker
                    values={durations}
                    value={durationSeconds}
                    onChange={setDurationSeconds}
                    format={String}
                    label="Duração em segundos"
                    unit="segundos"
                    align="start"
                />
            ) : (
                <div className="grid grid-cols-[2fr_1fr] gap-gutter">
                    <WheelPicker
                        values={loads}
                        value={loadKg}
                        onChange={setLoadKg}
                        format={(value) => formatNumber(value)}
                        label="Carga em quilos"
                        unit="kg"
                        align="start"
                    />
                    <WheelPicker
                        values={repValues}
                        value={reps}
                        onChange={setReps}
                        format={String}
                        label="Repetições"
                        unit="repetições"
                        align="end"
                    />
                </div>
            )}
            <div className="mt-block">
                <PrimaryAction
                    glyph="check"
                    label="Corrigir"
                    meta={
                        isDuration
                            ? formatDuration(durationSeconds)
                            : `${formatNumber(loadKg)} kg × ${reps}`
                    }
                    onClick={() =>
                        index !== null &&
                        onSave(
                            index,
                            isDuration
                                ? { loadKg: null, reps: null, durationSeconds }
                                : { loadKg, reps, durationSeconds: null },
                        )
                    }
                />
            </div>
        </Sheet>
    );
}
