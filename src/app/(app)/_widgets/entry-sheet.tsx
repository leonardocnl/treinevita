"use client";

/*
 * The sheet a manual widget opens: a wheel or a toggle and one save button.
 * One tap logs today. The sheet closes on the tap (motion starts on input) and
 * the save runs in the background; the home refreshes when the server answers.
 */
import { useState, useTransition, type ReactNode } from "react";

import type { HomeData } from "@/modules/progress/client";
import { formatNumber } from "@/shared/format/numbers";
import { ChoiceList } from "@/shared/ui/choice-list";
import { cx } from "@/shared/ui/cx";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { SectionLabel } from "@/shared/ui/section-label";
import { Sheet } from "@/shared/ui/sheet";
import { TextButton } from "@/shared/ui/text-button";
import { TextField } from "@/shared/ui/text-field";
import { WheelPicker } from "@/shared/ui/wheel-picker";

import {
    createGoalAction,
    createTrackerAction,
    deleteGoalAction,
    logHabitAction,
    recordMeasurementsAction,
} from "../../_components/home-actions";
import { recordWeightAction } from "../../_components/profile-actions";

export type Entry =
    | { kind: "body_weight" | "measurements" | "goal" | "sleep" | "water" | "steps" | "energy" }
    | { kind: "custom"; trackerId: string }
    | { kind: "new_custom" };

function range(min: number, max: number, step: number): number[] {
    const values: number[] = [];
    for (let value = min; value <= max + 1e-9; value += step) {
        values.push(Math.round(value * 100) / 100);
    }
    return values;
}

/** The nearest value of a list. */
function snap(values: readonly number[], value: number): number {
    return values.reduce((best, candidate) =>
        Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
    );
}

const WEIGHT = range(30, 250, 0.5);
const WAIST = range(40, 200, 0.5);
const CHEST = range(50, 200, 0.5);
const ARM = range(15, 70, 0.5);
const SLEEP = range(0, 24, 0.5);
const WATER = range(0, 10, 0.25);
const STEPS = range(0, 100_000, 500);
const CARDIO = range(0, 600, 5);
const TIME = range(0, 600, 5);
const DAYS = range(1, 7, 1);
const LOAD = range(2.5, 300, 2.5);

type EntrySheetProps = {
    entry: Entry | null;
    data: HomeData;
    onClose: () => void;
    /** A custom tracker was created: put it on the home. */
    onCreated: (trackerId: string) => void;
    onFailed: () => void;
};

export function EntrySheet({ entry, data, onClose, onCreated, onFailed }: EntrySheetProps) {
    const title = entry ? titleOf(entry, data) : "";
    return (
        <Sheet open={entry !== null} onClose={onClose} title={title}>
            {entry ? (
                <EntryForm
                    key={JSON.stringify(entry)}
                    entry={entry}
                    data={data}
                    onClose={onClose}
                    onCreated={onCreated}
                    onFailed={onFailed}
                />
            ) : null}
        </Sheet>
    );
}

function titleOf(entry: Entry, data: HomeData): string {
    switch (entry.kind) {
        case "body_weight":
            return "Registrar peso";
        case "measurements":
            return "Registrar medidas";
        case "goal":
            return data.goals.length > 0 ? "Metas" : "Criar meta";
        case "sleep":
            return "Sono de hoje";
        case "water":
            return "Água de hoje";
        case "steps":
            return "Passos de hoje";
        case "energy":
            return "Energia antes do treino";
        case "custom":
            return (
                data.habits.custom.find((tracker) => tracker.id === entry.trackerId)?.name ??
                "Registrar"
            );
        case "new_custom":
            return "Novo personalizado";
    }
}

function EntryForm({
    entry,
    data,
    onClose,
    onCreated,
    onFailed,
}: Required<EntrySheetProps> & { entry: Entry }) {
    const [, startTransition] = useTransition();

    /** Closes at once, saves in the background. */
    function save(send: () => Promise<boolean | string | null | { error: string } | undefined>) {
        onClose();
        startTransition(async () => {
            const result = await send().catch(() => false);
            if (
                result === false ||
                result === null ||
                (typeof result === "object" && result && "error" in result)
            ) {
                onFailed();
            }
        });
    }

    switch (entry.kind) {
        case "body_weight":
            return (
                <WeightForm
                    initial={data.weight?.latestKg ?? 70}
                    onSave={(kg) => save(() => recordWeightAction(kg))}
                />
            );
        case "measurements":
            return (
                <MeasurementsForm
                    data={data}
                    onSave={(input) => save(() => recordMeasurementsAction(input))}
                />
            );
        case "sleep":
            return (
                <SingleWheelForm
                    values={SLEEP}
                    initial={
                        data.habits.sleep.week.findLast((hours) => hours !== null) ??
                        data.habits.sleep.goal
                    }
                    unit="horas"
                    label="Horas de sono"
                    format={(value) => formatNumber(value, 1)}
                    onSave={(value) =>
                        save(() =>
                            logHabitAction({ target: { kind: "sleep" }, value, secondary: null }),
                        )
                    }
                />
            );
        case "water":
            return (
                <SingleWheelForm
                    values={WATER}
                    initial={data.habits.water.today ?? 1}
                    unit="litros"
                    label="Litros de água"
                    format={(value) => formatNumber(value, 2)}
                    onSave={(value) =>
                        save(() =>
                            logHabitAction({ target: { kind: "water" }, value, secondary: null }),
                        )
                    }
                />
            );
        case "steps":
            return (
                <StepsForm
                    initial={data.habits.steps}
                    onSave={(value, secondary) =>
                        save(() => logHabitAction({ target: { kind: "steps" }, value, secondary }))
                    }
                />
            );
        case "energy":
            return (
                <EnergyForm
                    initial={data.habits.energy.today}
                    onSave={(value) =>
                        save(() =>
                            logHabitAction({ target: { kind: "energy" }, value, secondary: null }),
                        )
                    }
                />
            );
        case "custom": {
            const tracker = data.habits.custom.find((item) => item.id === entry.trackerId);
            if (!tracker) {
                return null;
            }
            const send = (value: number) =>
                save(() =>
                    logHabitAction({ target: { trackerId: tracker.id }, value, secondary: null }),
                );
            if (tracker.valueType === "boolean") {
                return <YesNoForm initial={tracker.today} onSave={send} />;
            }
            const values =
                tracker.valueType === "time" ? TIME : range(0, Math.max(100, tracker.goal * 3), 1);
            return (
                <SingleWheelForm
                    values={values}
                    initial={tracker.today ?? tracker.goal}
                    unit={tracker.valueType === "time" ? "minutos" : (tracker.unit ?? "valor")}
                    label={tracker.name}
                    format={(value) => formatNumber(value)}
                    onSave={send}
                />
            );
        }
        case "new_custom":
            return (
                <NewTrackerForm
                    onCreate={(input) => {
                        onClose();
                        startTransition(async () => {
                            const id = await createTrackerAction(input).catch(() => null);
                            if (id) {
                                onCreated(id);
                            } else {
                                onFailed();
                            }
                        });
                    }}
                />
            );
        case "goal":
            return (
                <GoalForm
                    data={data}
                    onSave={(input) => save(() => createGoalAction(input))}
                    onDelete={(id) => save(() => deleteGoalAction(id))}
                />
            );
    }
}

function SaveButton({
    onClick,
    label = "Salvar",
    disabled = false,
}: {
    onClick: () => void;
    label?: string;
    disabled?: boolean;
}) {
    return (
        <div className="mt-block">
            <PrimaryAction
                glyph="check"
                label={label}
                meta="hoje"
                onClick={onClick}
                disabled={disabled}
            />
        </div>
    );
}

function SingleWheelForm({
    values,
    initial,
    unit,
    label,
    format,
    onSave,
}: {
    values: readonly number[];
    initial: number;
    unit: string;
    label: string;
    format: (value: number) => string;
    onSave: (value: number) => void;
}) {
    const [value, setValue] = useState(() => snap(values, initial));
    return (
        <>
            <WheelPicker
                values={values}
                value={value}
                onChange={setValue}
                format={format}
                label={label}
                unit={unit}
                align="start"
            />
            <SaveButton onClick={() => onSave(value)} />
        </>
    );
}

function WeightForm({ initial, onSave }: { initial: number; onSave: (kg: number) => void }) {
    return (
        <SingleWheelForm
            values={WEIGHT}
            initial={initial}
            unit="kg"
            label="Peso em quilos"
            format={(value) => formatNumber(value, 1, 1)}
            onSave={onSave}
        />
    );
}

function MeasurementsForm({
    data,
    onSave,
}: {
    data: HomeData;
    onSave: (input: { waistCm: number; chestCm: number; armCm: number }) => void;
}) {
    const [waist, setWaist] = useState(snap(WAIST, data.measurements.waist?.value ?? 80));
    const [chest, setChest] = useState(snap(CHEST, data.measurements.chest?.value ?? 95));
    const [arm, setArm] = useState(snap(ARM, data.measurements.arm?.value ?? 33));
    const format = (value: number) => formatNumber(value, 1);
    return (
        <>
            <div className="grid grid-cols-3 gap-gutter">
                <WheelPicker
                    values={WAIST}
                    value={waist}
                    onChange={setWaist}
                    format={format}
                    label="Cintura em centímetros"
                    unit="cintura"
                    align="start"
                />
                <WheelPicker
                    values={CHEST}
                    value={chest}
                    onChange={setChest}
                    format={format}
                    label="Peito em centímetros"
                    unit="peito"
                />
                <WheelPicker
                    values={ARM}
                    value={arm}
                    onChange={setArm}
                    format={format}
                    label="Braço em centímetros"
                    unit="braço"
                    align="end"
                />
            </div>
            <SaveButton onClick={() => onSave({ waistCm: waist, chestCm: chest, armCm: arm })} />
        </>
    );
}

function StepsForm({
    initial,
    onSave,
}: {
    initial: { today: number | null; cardioToday: number | null };
    onSave: (steps: number, cardio: number) => void;
}) {
    const [steps, setSteps] = useState(snap(STEPS, initial.today ?? 6000));
    const [cardio, setCardio] = useState(snap(CARDIO, initial.cardioToday ?? 0));
    return (
        <>
            <div className="grid grid-cols-[2fr_1fr] gap-gutter">
                <WheelPicker
                    values={STEPS}
                    value={steps}
                    onChange={setSteps}
                    format={(value) => formatNumber(value)}
                    label="Passos"
                    unit="passos"
                    align="start"
                />
                <WheelPicker
                    values={CARDIO}
                    value={cardio}
                    onChange={setCardio}
                    format={String}
                    label="Minutos de cardio"
                    unit="min cardio"
                    align="end"
                />
            </div>
            <SaveButton onClick={() => onSave(steps, cardio)} />
        </>
    );
}

/** Tappable cells in a row: the chosen one is an ink cell. */
function CellRow({
    options,
    value,
    onChange,
    label,
}: {
    options: readonly { value: number; text: ReactNode }[];
    value: number | null;
    onChange: (value: number) => void;
    label: string;
}) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className="grid gap-inner"
            style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={option.value === value}
                    onClick={() => onChange(option.value)}
                    className={cx(
                        "pressable focus-ring action flex h-16 items-center justify-center rounded-cta text-15",
                        option.value === value ? "bg-ink text-bg" : "bg-tint text-ink",
                    )}
                >
                    {option.text}
                </button>
            ))}
        </div>
    );
}

function EnergyForm({
    initial,
    onSave,
}: {
    initial: number | null;
    onSave: (value: number) => void;
}) {
    const [value, setValue] = useState<number | null>(initial);
    return (
        <>
            <CellRow
                label="Energia de 1 a 5"
                value={value}
                onChange={setValue}
                options={[1, 2, 3, 4, 5].map((level) => ({ value: level, text: level }))}
            />
            <SaveButton onClick={() => value !== null && onSave(value)} disabled={value === null} />
        </>
    );
}

function YesNoForm({
    initial,
    onSave,
}: {
    initial: number | null;
    onSave: (value: number) => void;
}) {
    const [value, setValue] = useState<number | null>(initial);
    return (
        <>
            <CellRow
                label="Hoje"
                value={value}
                onChange={setValue}
                options={[
                    { value: 1, text: "Sim" },
                    { value: 0, text: "Não" },
                ]}
            />
            <SaveButton onClick={() => value !== null && onSave(value)} disabled={value === null} />
        </>
    );
}

type TrackerType = "boolean" | "number" | "time";

function NewTrackerForm({
    onCreate,
}: {
    onCreate: (input: {
        name: string;
        valueType: TrackerType;
        unit: string | null;
        goal: number;
    }) => void;
}) {
    const [name, setName] = useState("");
    const [valueType, setValueType] = useState<TrackerType>("boolean");
    const [unit, setUnit] = useState("");
    const goals =
        valueType === "boolean" ? DAYS : valueType === "time" ? TIME.slice(1) : range(1, 1000, 1);
    const [goal, setGoal] = useState(5);
    const goalValue = snap(goals, goal);
    const valid = name.trim().length >= 1 && name.trim().length <= 30;
    return (
        <div className="flex flex-col gap-block">
            <TextField
                label="Nome"
                value={name}
                onChange={setName}
                maxLength={30}
                placeholder="Leitura"
            />
            <section className="flex flex-col gap-label">
                <SectionLabel as="p">Tipo</SectionLabel>
                <ChoiceList<TrackerType>
                    label="Tipo"
                    value={valueType}
                    onChange={(type) => {
                        setValueType(type);
                        setGoal(type === "boolean" ? 5 : type === "time" ? 30 : 10);
                    }}
                    options={[
                        { value: "boolean", label: "Sim ou não" },
                        { value: "number", label: "Número", detail: "Com a unidade que quiser." },
                        { value: "time", label: "Tempo", detail: "Em minutos." },
                    ]}
                />
            </section>
            {valueType === "number" ? (
                <TextField
                    label="Unidade"
                    value={unit}
                    onChange={setUnit}
                    maxLength={8}
                    placeholder="páginas"
                />
            ) : null}
            <WheelPicker
                values={goals}
                value={goalValue}
                onChange={setGoal}
                format={(value) => formatNumber(value)}
                label="Meta"
                unit={
                    valueType === "boolean"
                        ? "dias por semana"
                        : valueType === "time"
                          ? "minutos por dia"
                          : "por dia"
                }
                align="start"
            />
            <PrimaryAction
                glyph="check"
                label="Criar"
                disabled={!valid}
                onClick={() =>
                    onCreate({
                        name: name.trim(),
                        valueType,
                        unit: valueType === "number" && unit.trim() ? unit.trim() : null,
                        goal: goalValue,
                    })
                }
            />
        </div>
    );
}

function GoalForm({
    data,
    onSave,
    onDelete,
}: {
    data: HomeData;
    onSave: (input: {
        kind: "exercise_load" | "body_weight";
        exerciseId: string | null;
        targetValue: number;
        deadline: string;
    }) => void;
    onDelete: (id: string) => void;
}) {
    const [kind, setKind] = useState<"exercise_load" | "body_weight">(
        data.goalExercises.length > 0 ? "exercise_load" : "body_weight",
    );
    const [exerciseId, setExerciseId] = useState<string | null>(data.goalExercises[0]?.id ?? null);
    const values = kind === "exercise_load" ? LOAD : WEIGHT;
    const [target, setTarget] = useState(
        kind === "exercise_load" ? 50 : (data.weight?.latestKg ?? 70),
    );
    const [deadline, setDeadline] = useState("");
    const targetValue = snap(values, target);
    const valid = deadline > data.today && (kind === "body_weight" || exerciseId !== null);
    return (
        <div className="flex flex-col gap-block">
            {data.goals.length > 0 ? (
                <section className="flex flex-col gap-label">
                    <SectionLabel as="p">Suas metas</SectionLabel>
                    <ul className="flex flex-col gap-inner">
                        {data.goals.map((goal) => (
                            <li
                                key={goal.id}
                                className="flex items-center justify-between gap-gutter"
                            >
                                <span className="min-w-0 truncate text-15">{goal.title}</span>
                                <TextButton
                                    onClick={() => onDelete(goal.id)}
                                    aria-label={`Remover a meta ${goal.title}`}
                                >
                                    Remover
                                </TextButton>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
            <ChoiceList<"exercise_load" | "body_weight">
                label="Tipo de meta"
                value={kind}
                onChange={(next) => {
                    setKind(next);
                    setTarget(next === "exercise_load" ? 50 : (data.weight?.latestKg ?? 70));
                }}
                options={[
                    ...(data.goalExercises.length > 0
                        ? [{ value: "exercise_load" as const, label: "Carga num exercício" }]
                        : []),
                    { value: "body_weight", label: "Peso corporal" },
                ]}
            />
            {kind === "exercise_load" ? (
                <ChoiceList<string>
                    label="Exercício"
                    value={exerciseId}
                    onChange={setExerciseId}
                    options={data.goalExercises.map((exercise) => ({
                        value: exercise.id,
                        label: exercise.name,
                    }))}
                />
            ) : null}
            <WheelPicker
                values={values}
                value={targetValue}
                onChange={setTarget}
                format={(value) => formatNumber(value, 1)}
                label="Alvo em quilos"
                unit="kg"
                align="start"
            />
            <div className="flex flex-col gap-label">
                <label htmlFor="goal-deadline" className="label">
                    Prazo
                </label>
                <input
                    id="goal-deadline"
                    type="date"
                    min={data.today}
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className="focus-ring h-16 w-full rounded-cta bg-tint px-margin text-20 font-semibold text-ink"
                />
            </div>
            <PrimaryAction
                glyph="check"
                label="Criar meta"
                disabled={!valid}
                onClick={() =>
                    onSave({
                        kind,
                        exerciseId: kind === "exercise_load" ? exerciseId : null,
                        targetValue,
                        deadline,
                    })
                }
            />
        </div>
    );
}
