"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { formatDuration, formatNumber } from "@/shared/format/numbers";
import { StatusDot } from "@/shared/ui/dot";
import { DotMeter } from "@/shared/ui/dot-meter";
import { FloatBar } from "@/shared/ui/float-bar";
import { Icon } from "@/shared/ui/icons";
import { List, ListRow } from "@/shared/ui/list";
import { Panel, PanelNote } from "@/shared/ui/panel";
import { PillAction } from "@/shared/ui/pill-action";
import { QuietBand } from "@/shared/ui/quiet-band";
import { RoundButton } from "@/shared/ui/round-button";
import { Label } from "@/shared/ui/text";
import { WHEEL_ITEM_HEIGHT, WheelPicker } from "@/shared/ui/wheel-picker";

import { logSetAction, undoSetAction } from "../../_components/actions";
import { cx } from "@/shared/ui/cx";

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
            <Panel aria-label="Registro da série">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[15px] text-on-panel-secondary">
                        {finished ? "Exercício concluído" : `Série ${currentIndex + 1}`}
                    </h2>
                    <DotMeter
                        total={targetSets}
                        done={currentIndex}
                        highlight={currentIndex}
                        size={7}
                        surface="panel"
                        label={`${currentIndex} de ${targetSets} séries feitas`}
                    />
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
                            <QuietBand top={WHEEL_ITEM_HEIGHT + 2} height={WHEEL_ITEM_HEIGHT - 4} />
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
                                                    <StatusDot
                                                        size={7}
                                                        label="Carga subiu desde a última vez"
                                                        className="mb-6 self-center"
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

                {props.lastTimeText ? <PanelNote>{props.lastTimeText}</PanelNote> : null}
            </Panel>

            {doneSets.length > 0 || !finished ? (
                <List aria-label="Séries" className="mt-5 px-2">
                    {Array.from({ length: targetSets }, (_, index) => {
                        const set = doneSets[index];
                        const isLast = index === doneSets.length - 1;
                        return (
                            <ListRow
                                key={index}
                                className={cx(
                                    "flex h-12 items-center justify-between text-[15px]",
                                    !set && "text-ink-secondary",
                                )}
                            >
                                <span>Série {index + 1}</span>
                                {set ? (
                                    <Label
                                        as="span"
                                        size={17}
                                        weight="normal"
                                        key={isLast ? `last-${doneSets.length}` : index}
                                        className={cx(
                                            "tabular-nums",
                                            isLast && "pulse-once inline-block",
                                        )}
                                    >
                                        {set.durationSeconds !== null
                                            ? formatDuration(set.durationSeconds)
                                            : `${formatNumber(set.loadKg ?? 0)} × ${set.reps ?? 0}`}
                                    </Label>
                                ) : (
                                    <span aria-label="pendente">·</span>
                                )}
                            </ListRow>
                        );
                    })}
                </List>
            ) : null}

            <FloatBar inlineOnDesktop>
                {doneSets.length > 0 ? (
                    <form action={undoSetAction}>
                        <input
                            type="hidden"
                            name="performedExerciseId"
                            value={performedExerciseId}
                        />
                        <RoundButton type="submit" aria-label="Desfazer a última série">
                            <Icon name="undo" size={20} />
                        </RoundButton>
                    </form>
                ) : null}

                {finished ? (
                    <PillAction
                        href={props.nextHref ?? "/treino"}
                        grow
                        icon={<Icon name="arrow-right" size={20} />}
                    >
                        {props.nextHref ? "Próximo exercício" : "Voltar à lista"}
                    </PillAction>
                ) : (
                    <form action={logSetAction} className="flex-1">
                        <input
                            type="hidden"
                            name="performedExerciseId"
                            value={performedExerciseId}
                        />
                        <input type="hidden" name="position" value={currentIndex} />
                        {isDuration ? (
                            <input type="hidden" name="durationSeconds" value={durationSeconds} />
                        ) : (
                            <>
                                <input type="hidden" name="loadKg" value={loadKg} />
                                <input type="hidden" name="reps" value={reps} />
                            </>
                        )}
                        <ConfirmButton summary={summaryText} />
                    </form>
                )}
            </FloatBar>
        </>
    );
}

function ConfirmButton({ summary }: { summary: string }) {
    const { pending } = useFormStatus();
    return (
        <PillAction type="submit" disabled={pending} icon={<Icon name="check" size={20} />}>
            Confirmar <span className="tabular-nums">{summary}</span>
        </PillAction>
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
