"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { formatDuration, formatNumber } from "@/shared/format/numbers";
import { ArrowRightIcon, ArrowUpIcon, CheckIcon, UndoIcon } from "@/shared/ui/icons";

import { logSetAction, undoSetAction } from "../../_components/actions";
import { PrimaryActionContent, primaryActionClass } from "../../_components/primary-action";

import { WheelPicker } from "./wheel-picker";

export type SetLoggerProps = {
    performedExerciseId: string;
    measurement: "load_reps" | "duration";
    targetSets: number;
    doneSets: { loadKg: number | null; reps: number | null; durationSeconds: number | null }[];
    incrementKg: number;
    suggested: { loadKg: number; reps: number; durationSeconds: number };
    increasedTo: number | null;
    askText: string | null;
    lastTimeText: string | null;
    nextHref: string | null;
};

export function SetLogger(props: SetLoggerProps) {
    const { performedExerciseId, measurement, targetSets, doneSets, suggested } = props;
    const isDuration = measurement === "duration";
    const currentIndex = doneSets.length;
    const finished = currentIndex >= targetSets;

    const [loadKg, setLoadKg] = useState(suggested.loadKg);
    const [reps, setReps] = useState(suggested.reps);
    const [durationSeconds, setDurationSeconds] = useState(suggested.durationSeconds);

    const loadValues = useMemo(
        () => buildLoadValues(props.incrementKg, suggested.loadKg),
        [props.incrementKg, suggested.loadKg],
    );
    const repValues = useMemo(
        () => range(1, Math.max(30, suggested.reps + 5), 1),
        [suggested.reps],
    );
    const durationValues = useMemo(
        () => range(5, Math.max(180, suggested.durationSeconds + 30), 5),
        [suggested.durationSeconds],
    );

    const showIncrease =
        props.increasedTo !== null && currentIndex === 0 && loadKg === props.increasedTo;
    const summaryText = isDuration
        ? formatDuration(durationSeconds)
        : `${formatNumber(loadKg)} kg × ${reps}`;

    return (
        <>
            <section
                aria-label="Registro da série"
                className="rounded-surface bg-ink px-5 pb-5 pt-5 text-paper"
            >
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[17px] font-semibold">
                        {finished ? "Exercício concluído" : `Série ${currentIndex + 1}`}
                    </h2>
                    <div
                        className="flex gap-1.5"
                        aria-label={`${currentIndex} de ${targetSets} séries feitas`}
                    >
                        {Array.from({ length: targetSets }, (_, index) => (
                            <span
                                key={index}
                                className={`h-1 w-5 rounded-full ${
                                    index < currentIndex
                                        ? "bg-paper"
                                        : index === currentIndex
                                          ? "bg-red"
                                          : "bg-ink-track"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {finished ? (
                    <p className="px-1 pb-2 pt-6 text-[17px] text-on-ink-secondary">
                        {targetSets} séries registradas. Bom trabalho.
                    </p>
                ) : (
                    <>
                        {props.askText ? (
                            <p className="px-1 pt-3 text-[15px] text-on-ink-secondary">
                                {props.askText}
                            </p>
                        ) : null}
                        <div
                            className={`mt-2 grid gap-2 ${isDuration ? "grid-cols-1" : "grid-cols-2"}`}
                        >
                            {isDuration ? (
                                <WheelPicker
                                    values={durationValues}
                                    value={durationSeconds}
                                    onChange={setDurationSeconds}
                                    format={(value) => String(value)}
                                    label="Duração em segundos"
                                    unit="segundos"
                                />
                            ) : (
                                <>
                                    <WheelPicker
                                        values={loadValues}
                                        value={loadKg}
                                        onChange={setLoadKg}
                                        format={(value) => formatNumber(value)}
                                        label="Carga em quilos"
                                        unit="kg"
                                        marker={
                                            showIncrease ? (
                                                <ArrowUpIcon
                                                    size={14}
                                                    className="text-red"
                                                    role="img"
                                                    aria-label="Carga subiu desde a última vez"
                                                    aria-hidden={false}
                                                />
                                            ) : null
                                        }
                                    />
                                    <WheelPicker
                                        values={repValues}
                                        value={reps}
                                        onChange={setReps}
                                        format={(value) => String(value)}
                                        label="Repetições"
                                        unit="repetições"
                                    />
                                </>
                            )}
                        </div>
                    </>
                )}

                {props.lastTimeText ? (
                    <p className="px-1 pt-3 text-[15px] text-on-ink-secondary">
                        {props.lastTimeText}
                    </p>
                ) : null}
            </section>

            {doneSets.length > 0 ? (
                <section
                    aria-label="Séries feitas"
                    className="glass mt-4 rounded-widget px-5 py-1.5"
                >
                    {doneSets.map((set, index) => (
                        <div
                            key={index}
                            className="flex h-12 items-center justify-between text-[17px]"
                        >
                            <span>Série {index + 1}</span>
                            <span className="numeric flex items-center gap-2 font-bold">
                                {set.durationSeconds !== null
                                    ? formatDuration(set.durationSeconds)
                                    : `${formatNumber(set.loadKg ?? 0)} × ${set.reps ?? 0}`}
                                <CheckIcon
                                    key={
                                        index === doneSets.length - 1
                                            ? `last-${doneSets.length}`
                                            : index
                                    }
                                    size={18}
                                    className={
                                        index === doneSets.length - 1 ? "pulse-once" : undefined
                                    }
                                />
                            </span>
                        </div>
                    ))}
                </section>
            ) : null}

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),14px)] md:static md:mt-6 md:px-0 md:pb-0">
                <div className="glass pointer-events-auto flex w-full max-w-md gap-2 rounded-surface p-2 md:max-w-none">
                    {doneSets.length > 0 ? (
                        <form action={undoSetAction}>
                            <input
                                type="hidden"
                                name="performedExerciseId"
                                value={performedExerciseId}
                            />
                            <button
                                type="submit"
                                aria-label="Desfazer a última série"
                                className="pressable flex size-16 items-center justify-center rounded-control text-ink"
                            >
                                <UndoIcon size={22} />
                            </button>
                        </form>
                    ) : null}

                    {finished ? (
                        <Link
                            href={props.nextHref ?? "/treino"}
                            className={`${primaryActionClass} flex-1`}
                        >
                            <PrimaryActionContent
                                title={props.nextHref ? "Próximo exercício" : "Voltar à lista"}
                                icon={<ArrowRightIcon size={22} />}
                            />
                        </Link>
                    ) : (
                        <form action={logSetAction} className="flex-1">
                            <input
                                type="hidden"
                                name="performedExerciseId"
                                value={performedExerciseId}
                            />
                            <input type="hidden" name="position" value={currentIndex} />
                            {isDuration ? (
                                <input
                                    type="hidden"
                                    name="durationSeconds"
                                    value={durationSeconds}
                                />
                            ) : (
                                <>
                                    <input type="hidden" name="loadKg" value={loadKg} />
                                    <input type="hidden" name="reps" value={reps} />
                                </>
                            )}
                            <ConfirmButton
                                title={`Confirmar série ${currentIndex + 1}`}
                                subtitle={summaryText}
                            />
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}

function ConfirmButton({ title, subtitle }: { title: string; subtitle: string }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className={primaryActionClass}>
            <PrimaryActionContent
                title={title}
                subtitle={subtitle}
                icon={<CheckIcon size={22} />}
            />
        </button>
    );
}

function range(start: number, end: number, step: number): number[] {
    const values: number[] = [];
    for (let value = start; value <= end; value += step) {
        values.push(Math.round(value * 100) / 100);
    }
    return values;
}

/** Loads from zero in steps of the exercise increment, always including the suggested load. */
function buildLoadValues(incrementKg: number, suggestedKg: number): number[] {
    const step = incrementKg > 0 ? incrementKg : 2.5;
    const top = Math.max(suggestedKg * 2, suggestedKg + step * 20, step * 20);
    const values = range(0, top, step);
    if (!values.includes(suggestedKg)) {
        values.push(suggestedKg);
        values.sort((a, b) => a - b);
    }
    return values;
}
