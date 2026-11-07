"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { formatDuration, formatNumber } from "@/shared/format/numbers";
import { ArrowRightIcon, CheckIcon, UndoIcon } from "@/shared/ui/icons";

import { logSetAction, undoSetAction } from "../../_components/actions";
import {
    PillActionContent,
    pillActionClass,
    roundSmokeClass,
} from "../../_components/primary-action";

import { WHEEL_ITEM_HEIGHT, WheelPicker } from "./wheel-picker";

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
        : `${formatNumber(loadKg)} × ${reps}`;

    return (
        <>
            <section aria-label="Registro da série" className="panel rounded-[30px] px-5 pb-5 pt-5">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[15px] text-on-panel-secondary">
                        {finished ? "Exercício concluído" : `Série ${currentIndex + 1}`}
                    </h2>
                    <div
                        className="flex gap-1.5"
                        role="img"
                        aria-label={`${currentIndex} de ${targetSets} séries feitas`}
                    >
                        {Array.from({ length: targetSets }, (_, index) => (
                            <span
                                key={index}
                                className={`size-[7px] rounded-full ${
                                    index < currentIndex
                                        ? "bg-on-panel"
                                        : index === currentIndex
                                          ? "bg-red"
                                          : "bg-panel-track"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {finished ? (
                    <p className="px-1 pb-3 pt-8 text-[17px] text-on-panel-secondary">
                        {targetSets} séries registradas.
                    </p>
                ) : (
                    <>
                        {props.askText ? (
                            <p className="px-1 pt-3 text-[13px] text-on-panel-secondary">
                                {props.askText}
                            </p>
                        ) : null}
                        <div className="relative mt-3">
                            <div
                                aria-hidden
                                className="quiet pointer-events-none absolute inset-x-0 rounded-full"
                                style={{
                                    top: WHEEL_ITEM_HEIGHT + 2,
                                    height: WHEEL_ITEM_HEIGHT - 4,
                                }}
                            />
                            <div
                                className={`relative grid ${isDuration ? "grid-cols-1" : "grid-cols-2"}`}
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
                                            align="start"
                                            marker={
                                                showIncrease ? (
                                                    <span
                                                        role="img"
                                                        aria-label="Carga subiu desde a última vez"
                                                        className="mb-6 size-[7px] self-center rounded-full bg-red"
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
                                            align="end"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {props.lastTimeText ? (
                    <p className="mt-4 border-t border-white/[0.08] px-1 pt-3.5 text-[13px] text-on-panel-secondary">
                        {props.lastTimeText}
                    </p>
                ) : null}
            </section>

            {doneSets.length > 0 || !finished ? (
                <ol aria-label="Séries" className="mt-5 px-2">
                    {Array.from({ length: targetSets }, (_, index) => {
                        const set = doneSets[index];
                        const isLast = index === doneSets.length - 1;
                        return (
                            <li
                                key={index}
                                className={`flex h-12 items-center justify-between text-[15px] ${
                                    index < targetSets - 1 ? "border-b border-hairline" : ""
                                } ${set ? "" : "text-ink-secondary"}`}
                            >
                                <span>Série {index + 1}</span>
                                {set ? (
                                    <span
                                        key={isLast ? `last-${doneSets.length}` : index}
                                        className={`num text-[20px] ${isLast ? "pulse-once" : ""}`}
                                    >
                                        {set.durationSeconds !== null
                                            ? formatDuration(set.durationSeconds)
                                            : `${formatNumber(set.loadKg ?? 0)} × ${set.reps ?? 0}`}
                                    </span>
                                ) : (
                                    <span aria-label="pendente">·</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            ) : null}

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),20px)] md:static md:mt-8 md:px-0 md:pb-0">
                <div className="pointer-events-auto flex w-full max-w-md items-center gap-2.5 md:max-w-none">
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
                                className={roundSmokeClass}
                            >
                                <UndoIcon size={20} />
                            </button>
                        </form>
                    ) : null}

                    {finished ? (
                        <Link
                            href={props.nextHref ?? "/treino"}
                            className={`${pillActionClass} flex-1`}
                        >
                            <PillActionContent icon={<ArrowRightIcon size={20} />}>
                                {props.nextHref ? "Próximo exercício" : "Voltar à lista"}
                            </PillActionContent>
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
                            <ConfirmButton summary={summaryText} />
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}

function ConfirmButton({ summary }: { summary: string }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className={pillActionClass}>
            <PillActionContent icon={<CheckIcon size={20} />}>
                Confirmar <span className="num text-[19px]">{summary}</span>
            </PillActionContent>
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
