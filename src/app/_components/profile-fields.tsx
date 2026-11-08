"use client";

/*
 * The profile questions, shared by the onboarding (/comecar) and Perfil:
 * the Portuguese labels of every choice and the wheels for numbers.
 */
import type { Experience, Goal, SessionMinutes, TrainingPlace } from "@/modules/identity";
import { formatNumber } from "@/shared/format/numbers";
import type { Choice } from "@/shared/ui/choice-list";
import { Panel } from "@/shared/ui/panel";
import { QuietBand } from "@/shared/ui/quiet-band";
import { WHEEL_ITEM_HEIGHT, WheelPicker } from "@/shared/ui/wheel-picker";

export const GOAL_OPTIONS: Choice<Goal>[] = [
    { value: "hypertrophy", label: "Ganhar massa", detail: "Músculos maiores." },
    { value: "strength", label: "Ganhar força", detail: "Cargas mais altas." },
    { value: "conditioning", label: "Condicionamento", detail: "Mais fôlego e resistência." },
    { value: "health", label: "Saúde", detail: "Treinar para se sentir bem." },
];

export const EXPERIENCE_OPTIONS: Choice<Experience>[] = [
    { value: "beginner", label: "Iniciante", detail: "Menos de 6 meses treinando." },
    { value: "intermediate", label: "Intermediário", detail: "De 6 meses a 2 anos." },
    { value: "advanced", label: "Avançado", detail: "Mais de 2 anos." },
];

export const SESSION_OPTIONS: Choice<SessionMinutes>[] = [30, 45, 60, 90].map((minutes) => ({
    value: minutes as SessionMinutes,
    label: `${minutes} min`,
}));

export const PLACE_OPTIONS: Choice<TrainingPlace>[] = [
    { value: "full_gym", label: "Academia completa" },
    { value: "basic_gym", label: "Academia básica", detail: "Poucos aparelhos." },
    { value: "home", label: "Em casa" },
];

export function choiceLabel<Value extends string | number>(
    options: readonly Choice<Value>[],
    value: Value | null,
): string {
    return options.find((option) => option.value === value)?.label ?? "Não informado";
}

function range(min: number, max: number, step: number): number[] {
    const values: number[] = [];
    for (let value = min; value <= max; value += step) {
        values.push(Math.round(value * 10) / 10);
    }
    return values;
}

const WEEKLY_VALUES = range(1, 7, 1);
const WEIGHT_VALUES = range(30, 300, 0.5);
const HEIGHT_VALUES = range(100, 250, 1);

/** One wheel on the dark panel, under the selection band. */
function SingleWheel({
    label,
    ...wheel
}: {
    label: string;
    values: readonly number[];
    value: number;
    onChange: (value: number) => void;
    format: (value: number) => string;
    unit: string;
}) {
    return (
        <Panel aria-label={label}>
            <div className="relative">
                <QuietBand top={WHEEL_ITEM_HEIGHT + 2} height={WHEEL_ITEM_HEIGHT - 4} />
                <div className="relative">
                    <WheelPicker label={label} {...wheel} />
                </div>
            </div>
        </Panel>
    );
}

type NumberPickerProps = { value: number; onChange: (value: number) => void };

export function WeeklyGoalPicker({ value, onChange }: NumberPickerProps) {
    return (
        <SingleWheel
            label="Treinos por semana"
            values={WEEKLY_VALUES}
            value={value}
            onChange={onChange}
            format={String}
            unit="treinos por semana"
        />
    );
}

export function WeightPicker({ value, onChange }: NumberPickerProps) {
    return (
        <SingleWheel
            label="Peso em quilos"
            values={WEIGHT_VALUES}
            value={value}
            onChange={onChange}
            format={(weight) => formatNumber(weight)}
            unit="kg"
        />
    );
}

export function HeightPicker({ value, onChange }: NumberPickerProps) {
    return (
        <SingleWheel
            label="Altura em centímetros"
            values={HEIGHT_VALUES}
            value={value}
            onChange={onChange}
            format={String}
            unit="cm"
        />
    );
}

export function BodyPicker({
    weightKg,
    heightCm,
    onChange,
}: {
    weightKg: number;
    heightCm: number;
    onChange: (value: { weightKg: number; heightCm: number }) => void;
}) {
    return (
        <Panel aria-label="Peso e altura">
            <div className="relative">
                <QuietBand top={WHEEL_ITEM_HEIGHT + 2} height={WHEEL_ITEM_HEIGHT - 4} />
                <div className="relative grid grid-cols-2">
                    <WheelPicker
                        values={WEIGHT_VALUES}
                        value={weightKg}
                        onChange={(value) => onChange({ weightKg: value, heightCm })}
                        format={(value) => formatNumber(value)}
                        label="Peso em quilos"
                        unit="kg"
                        align="start"
                    />
                    <WheelPicker
                        values={HEIGHT_VALUES}
                        value={heightCm}
                        onChange={(value) => onChange({ weightKg, heightCm: value })}
                        format={String}
                        label="Altura em centímetros"
                        unit="cm"
                        align="end"
                    />
                </div>
            </div>
        </Panel>
    );
}
