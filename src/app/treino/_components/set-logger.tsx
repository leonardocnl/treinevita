"use client";

import { useState } from "react";

import { formatDuration, formatNumber, setsLabel } from "@/shared/format/numbers";
import { Dot } from "@/shared/ui/dot";
import { DotMeter } from "@/shared/ui/dot-meter";
import { BottomBar } from "@/shared/ui/bottom-bar";
import { List, ListRow } from "@/shared/ui/list";
import { Panel, PanelNote } from "@/shared/ui/panel";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { QuietBand } from "@/shared/ui/quiet-band";
import { IconButton } from "@/shared/ui/icon-button";
import { Label } from "@/shared/ui/text";
import { WHEEL_ITEM_HEIGHT, WheelPicker } from "@/shared/ui/wheel-picker";
import { cx } from "@/shared/ui/cx";

import type { LoggedSet } from "./workout-state";

export type SetLoggerProps = {
    measurement: "load_reps" | "duration";
    targetSets: number;
    doneSets: readonly LoggedSet[];
    incrementKg: number;
    /** Where the wheels open; read once, so nothing in them moves while a set is saving. */
    suggested: { loadKg: number; reps: number; durationSeconds: number };
    increasedTo: number | null;
    askText: string | null;
    lastTimeText: string | null;
    hasNext: boolean;
    onLog: (set: LoggedSet) => void;
    onUndo: () => void;
    onNext: () => void;
};

export function SetLogger(props: SetLoggerProps) {
    const { measurement, targetSets, doneSets } = props;
    const isDuration = measurement === "duration";
    const currentIndex = doneSets.length;
    const finished = currentIndex >= targetSets;

    const [loadKg, setLoadKg] = useState(props.suggested.loadKg);
    const [reps, setReps] = useState(props.suggested.reps);
    const [durationSeconds, setDurationSeconds] = useState(props.suggested.durationSeconds);

    // The value lists are built once per exercise screen and never change under the wheel.
    const [loadValues] = useState(() => buildLoadValues(props.incrementKg, loadKg));
    const [repValues] = useState(() => range(1, Math.max(30, reps + 5), 1));
    const [durationValues] = useState(() => range(5, Math.max(180, durationSeconds + 30), 5));

    const showIncrease =
        props.increasedTo !== null && currentIndex === 0 && loadKg === props.increasedTo;
    const summaryText = isDuration
        ? formatDuration(durationSeconds)
        : `${formatNumber(loadKg)} × ${reps}`;

    return (
        <>
            <Panel aria-label="Registro da série">
                <div className="flex items-center justify-between gap-3 px-1">
                    <h2 className="text-[15px] text-on-panel-secondary">
                        {finished ? (
                            "Exercício concluído"
                        ) : (
                            <>
                                Série{" "}
                                <span key={currentIndex} className="roll-in tabular-nums">
                                    {currentIndex + 1}
                                </span>
                            </>
                        )}
                    </h2>
                    <div
                        role="group"
                        aria-label={`${setsLabel(currentIndex, targetSets)} feitas`}
                        className="flex items-center gap-2.5"
                    >
                        <span
                            aria-hidden
                            key={currentIndex}
                            className="roll-in text-[13px] tabular-nums text-on-panel-secondary"
                        >
                            {setsLabel(currentIndex, targetSets)}
                        </span>
                        <span aria-hidden>
                            <DotMeter
                                total={targetSets}
                                done={currentIndex}
                                current={finished ? undefined : currentIndex}
                                size={7}
                                surface="panel"
                                label={setsLabel(currentIndex, targetSets)}
                            />
                        </span>
                    </div>
                </div>

                {finished ? (
                    <p className="fade-in px-1 pb-3 pt-8 text-[17px] text-on-panel-secondary">
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
                                                    <Dot
                                                        size={6}
                                                        tone="accent"
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
                                        className={cx("tabular-nums", isLast && "roll-in")}
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

            <BottomBar>
                {doneSets.length > 0 ? (
                    <IconButton
                        icon="undo"
                        onClick={props.onUndo}
                        aria-label="Desfazer a última série"
                    />
                ) : null}

                {finished ? (
                    <PrimaryAction
                        onClick={props.onNext}
                        grow
                        glyph="arrow"
                        label={props.hasNext ? "Próximo exercício" : "Voltar à lista"}
                    />
                ) : (
                    <PrimaryAction
                        grow
                        onClick={() =>
                            props.onLog(
                                isDuration
                                    ? { loadKg: null, reps: null, durationSeconds }
                                    : { loadKg, reps, durationSeconds: null },
                            )
                        }
                        glyph="check"
                        label="Confirmar"
                        meta={summaryText}
                    />
                )}
            </BottomBar>
        </>
    );
}

function range(start: number, end: number, step: number): number[] {
    const values: number[] = [];
    for (let value = start; value <= end; value += step) {
        values.push(Math.round(value * 100) / 100);
    }
    return values;
}

/** Loads from zero to at least 150 kg in steps of the exercise increment, always including the suggested load. */
function buildLoadValues(incrementKg: number, suggestedKg: number): number[] {
    const step = incrementKg > 0 ? incrementKg : 2.5;
    const top = Math.max(suggestedKg * 2, suggestedKg + step * 20, 150);
    const values = range(0, top, step);
    if (!values.includes(suggestedKg)) {
        values.push(suggestedKg);
        values.sort((a, b) => a - b);
    }
    return values;
}
