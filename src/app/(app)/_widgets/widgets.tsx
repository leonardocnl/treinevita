import type { ReactNode } from "react";

import type { DashboardExtras, Summary, WidgetKind, WidgetSize } from "@/modules/progress";
import { formatNumber } from "@/shared/format/numbers";
import { Dot } from "@/shared/ui/dot";
import { DotNumber } from "@/shared/ui/dot-number";
import { DotRing } from "@/shared/ui/dot-ring";
import { EmptyState } from "@/shared/ui/empty-state";
import { List, ValueRow } from "@/shared/ui/list";
import { Metric, MetricRow } from "@/shared/ui/metric";
import { ProgressBar } from "@/shared/ui/progress-bar";
import { Sparkline } from "@/shared/ui/sparkline";
import { Caption, Label, Title } from "@/shared/ui/text";
import { WeekRows, type Week } from "@/shared/ui/week-rows";
import { WidgetFrame as Frame } from "@/shared/ui/widget-frame";

/*
 * Every Summary widget in its three sizes: small (1×1), medium (2×1) and large (2×2).
 * Dot-matrix numbers only at 36px and up (docs/design/DESIGN.md).
 */

export type WidgetData = {
    readonly summary: Summary;
    readonly extras: DashboardExtras;
};

type Render = (data: WidgetData, size: WidgetSize) => ReactNode;

const weekly: Render = ({ summary, extras }, size) => {
    const { done, goal } = summary.week;
    const missing = Math.max(goal - done, 0);
    const caption = missing === 0 ? "Meta batida" : `Falta${missing > 1 ? "m" : ""} ${missing}`;
    const ringLabel = `${done} de ${goal} treinos feitos na semana`;

    if (size === "small") {
        return (
            <Frame
                title="Semana"
                aside={<DotRing done={done} goal={goal} label={ringLabel} size={40} dots={16} />}
            >
                <DotNumber as="p" size={56} of={goal}>
                    {done}
                </DotNumber>
                <Caption className="mt-3">{caption}</Caption>
            </Frame>
        );
    }

    const hero = (
        <div className="flex items-end justify-between gap-3">
            <div>
                <DotNumber as="p" size={64} of={goal}>
                    {done}
                </DotNumber>
                <Label tone="secondary" className="mt-3">
                    {missing === 0
                        ? "Meta da semana batida."
                        : `Falta${missing > 1 ? "m" : ""} ${missing} treino${missing > 1 ? "s" : ""}.`}
                </Label>
            </div>
            <DotRing done={done} goal={goal} label={ringLabel} size={size === "large" ? 108 : 92} />
        </div>
    );

    if (size === "medium") {
        return (
            <Frame title="Semana">
                <div className="mt-auto">{hero}</div>
            </Frame>
        );
    }

    return (
        <Frame title="Semana">
            <div className="mt-4">{hero}</div>
            <div className="mt-auto grid grid-cols-7 gap-1 border-t border-hairline pt-4">
                {extras.weekDays.map((day) => (
                    <div key={day.date} className="flex flex-col items-center gap-2">
                        <Caption as="span" tone={day.isToday ? "primary" : "secondary"}>
                            {day.label}
                        </Caption>
                        {day.trained ? (
                            <Dot size={12} tone="ink" />
                        ) : day.isToday ? (
                            <Dot size={12} tone="accent" />
                        ) : (
                            <Dot size={12} tone="off" />
                        )}
                    </div>
                ))}
            </div>
        </Frame>
    );
};

/** Trained count per week (newest first), from the activity data. */
function weeklyCounts(summary: Summary): Week[] {
    return summary.activity.weeks
        .map((week) => ({
            start: week[0].date,
            trained: week.filter((day) => day.level > 0).length,
            current: week.some((day) => day.isToday),
        }))
        .reverse();
}

const consistency: Render = ({ summary }, size) => {
    const goal = summary.week.goal;
    const all = weeklyCounts(summary);
    const closed = all.filter((week) => !week.current);
    const metCount = closed.filter((week) => week.trained >= goal).length;
    const average = (big: boolean) => (
        <Metric
            size={big ? 64 : 56}
            value={formatNumber(summary.activity.averagePerWeek, 1)}
            unit="por semana"
        />
    );

    if (size === "small") {
        return (
            <Frame title="Constância">
                <div className="mt-auto">{average(false)}</div>
                <div className="mt-3">
                    <WeekRows weeks={all.slice(0, 2)} goal={goal} />
                </div>
            </Frame>
        );
    }

    if (size === "medium") {
        return (
            <Frame title="Constância">
                <div className="mt-auto grid grid-cols-[auto_1fr] items-end gap-5">
                    <div>
                        {average(false)}
                        <Caption className="mt-2">
                            {metCount} de {closed.length} semanas com meta
                        </Caption>
                    </div>
                    <WeekRows weeks={all.slice(0, 4)} goal={goal} />
                </div>
            </Frame>
        );
    }

    return (
        <Frame title="Constância" aside={<Caption>meta de {goal} por semana</Caption>}>
            <div className="mt-3 flex items-end justify-between gap-3">
                {average(true)}
                <Caption className="pb-1 text-right leading-snug">
                    <Label as="span" size={17} weight="normal" tone="primary">
                        {metCount}
                    </Label>{" "}
                    de {closed.length}
                    <br />
                    semanas com meta
                </Caption>
            </div>
            <div className="mt-auto">
                <WeekRows weeks={all.slice(0, 7)} goal={goal} size="large" />
            </div>
        </Frame>
    );
};

const nextWorkout: Render = ({ summary }, size) => {
    const next = summary.nextWorkout;
    const title = summary.hasOpenSession ? "Em andamento" : "Próximo treino";
    if (!next) {
        return (
            <Frame title={title}>
                <EmptyState ghost="0" sentence="Monte sua ficha em Treinos." />
            </Frame>
        );
    }
    const increasing =
        next.increasing.length === 0 ? null : (
            <p className="flex items-center gap-2 text-[13px]">
                <Dot size={6} tone="accent" />
                <span className="truncate">
                    {next.increasing.length === 1 && size !== "small"
                        ? `${next.increasing[0]} sobe de carga`
                        : `${next.increasing.length} sobe${next.increasing.length > 1 ? "m" : ""} de carga`}
                </span>
            </p>
        );

    if (size === "small") {
        return (
            <Frame title={title}>
                <Title as="p" size={30} weight="light" leading="none" className="mt-auto">
                    Treino {next.label}
                </Title>
                <Caption className="mt-2">{next.exerciseCount} exercícios</Caption>
                {increasing ? <div className="mt-2">{increasing}</div> : null}
            </Frame>
        );
    }

    const names = next.exercises.map((exercise) => exercise.name);
    if (size === "medium") {
        return (
            <Frame title={title} aside={<Caption>{next.exerciseCount} exercícios</Caption>}>
                <Title as="p" size={34} weight="light" leading="none" className="mt-auto">
                    Treino {next.label}
                </Title>
                <Caption className="mt-2 truncate">
                    {names.slice(0, 2).join(", ")}
                    {names.length > 2 ? ` e mais ${names.length - 2}` : ""}
                </Caption>
                {increasing ? <div className="mt-2">{increasing}</div> : null}
            </Frame>
        );
    }

    return (
        <Frame title={title} aside={<Caption>{next.exerciseCount} exercícios</Caption>}>
            <Title as="p" size={34} weight="light" leading="none" className="mt-3">
                Treino {next.label}
            </Title>
            <List className="mt-auto">
                {next.exercises.map((exercise, index) => (
                    <ValueRow
                        key={index}
                        size="sm"
                        label={exercise.name}
                        marker={
                            exercise.increases ? (
                                <Dot size={6} tone="accent" label="sobe de carga" />
                            ) : null
                        }
                    />
                ))}
            </List>
        </Frame>
    );
};

const shortDate = (date: string) =>
    new Date(`${date}T12:00:00Z`)
        .toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "UTC",
        })
        .replace(/\./g, "");

const lastWorkout: Render = ({ extras }, size) => {
    const last = extras.lastWorkout;
    if (!last) {
        return (
            <Frame title="Último treino">
                <EmptyState ghost="0" sentence="Seu primeiro treino aparece aqui." />
            </Frame>
        );
    }
    const tons =
        last.volumeKg >= 1000
            ? `${formatNumber(last.volumeKg / 1000, 1)} t`
            : `${formatNumber(last.volumeKg)} kg`;

    if (size === "small") {
        return (
            <Frame title="Último treino">
                <Metric size={56} value={last.minutes} unit="min" className="mt-auto" />
                <Caption className="mt-2">
                    Treino {last.label}, {shortDate(last.date)}
                </Caption>
            </Frame>
        );
    }

    const stats = (
        <MetricRow
            items={[
                { value: String(last.minutes), label: "min" },
                { value: String(last.sets), label: "séries" },
                { value: tons, label: "volume" },
            ]}
        />
    );

    if (size === "medium") {
        return (
            <Frame title="Último treino" aside={<Caption>{shortDate(last.date)}</Caption>}>
                <Title as="p" size={28} weight="light" leading="none" className="mt-2">
                    Treino {last.label}
                </Title>
                <div className="mt-auto">{stats}</div>
            </Frame>
        );
    }

    return (
        <Frame title="Último treino" aside={<Caption>{shortDate(last.date)}</Caption>}>
            <Title as="p" size={28} weight="light" leading="none" className="mt-2">
                Treino {last.label}
            </Title>
            <div className="mt-4">{stats}</div>
            <List className="mt-auto">
                {last.highlights.slice(0, 5).map((item) => (
                    <ValueRow
                        key={item.name}
                        size="sm"
                        label={item.name}
                        value={`${formatNumber(item.loadKg)} × ${item.reps}`}
                    />
                ))}
            </List>
        </Frame>
    );
};

const bodyWeight: Render = ({ summary }, size) => {
    const weight = summary.weight;
    if (!weight) {
        return (
            <Frame title="Peso">
                <EmptyState ghost="0" sentence="Registre seu peso em Perfil." />
            </Frame>
        );
    }
    const delta =
        weight.monthDeltaKg === null
            ? "kg"
            : `kg, ${weight.monthDeltaKg >= 0 ? "+" : ""}${formatNumber(weight.monthDeltaKg, 1)} no mês`;
    const value = <DotNumber size={56}>{formatNumber(weight.latestKg, 1, 1)}</DotNumber>;

    if (size === "small") {
        return (
            <Frame title="Peso">
                <p className="mt-auto">{value}</p>
                <Caption className="mt-2">{delta}</Caption>
            </Frame>
        );
    }
    if (size === "medium") {
        return (
            <Frame title="Peso">
                <div className="mt-auto flex items-end justify-between gap-4">
                    <div>
                        <p>{value}</p>
                        <Caption className="mt-2">{delta}</Caption>
                    </div>
                    <Sparkline
                        values={weight.trend}
                        width={150}
                        height={48}
                        label="Peso nas últimas semanas"
                    />
                </div>
            </Frame>
        );
    }
    return (
        <Frame title="Peso" aside={<Caption>{weight.trend.length} pesagens</Caption>}>
            <p className="mt-3">
                <DotNumber size={64}>{formatNumber(weight.latestKg, 1, 1)}</DotNumber>
            </p>
            <Caption className="mt-2">{delta}</Caption>
            <div className="mt-auto">
                <Sparkline
                    values={weight.trend}
                    width={300}
                    height={90}
                    label="Peso nas últimas semanas"
                />
                <div className="mt-1 flex justify-between">
                    <Caption as="span" size={11}>
                        {formatNumber(Math.min(...weight.trend), 1, 1)} kg
                    </Caption>
                    <Caption as="span" size={11}>
                        {formatNumber(Math.max(...weight.trend), 1, 1)} kg
                    </Caption>
                </div>
            </div>
        </Frame>
    );
};

const waist: Render = ({ summary }) => (
    <Frame title="Cintura">
        {summary.waistCm !== null ? (
            <>
                <DotNumber as="p" size={56}>
                    {formatNumber(summary.waistCm, 1, 1)}
                </DotNumber>
                <Caption className="mt-2">cm</Caption>
            </>
        ) : (
            <EmptyState ghost="0" sentence="Sem medida ainda." />
        )}
    </Frame>
);

const records: Render = ({ extras }, size) => {
    const list = extras.records;
    if (list.length === 0) {
        return (
            <Frame title="Recordes">
                <EmptyState ghost="0" sentence="Nenhum recorde nos últimos 30 dias." />
            </Frame>
        );
    }
    const top = list[0];
    const marker = <Dot size={6} tone="accent" className="mt-1" />;

    if (size === "small") {
        return (
            <Frame title="Recorde" aside={marker}>
                <Metric
                    size={56}
                    value={formatNumber(top.loadKg)}
                    unit="kg"
                    spacing="tight"
                    className="mt-auto"
                />
                <Caption className="mt-2 truncate">{top.exerciseName}</Caption>
            </Frame>
        );
    }

    const rows = (count: number) => (
        <List>
            {list.slice(0, count).map((record) => (
                <ValueRow
                    key={record.exerciseName}
                    label={record.exerciseName}
                    value={`${formatNumber(record.loadKg)} × ${record.reps}`}
                />
            ))}
        </List>
    );

    if (size === "medium") {
        return (
            <Frame title="Recordes" aside={<Caption>30 dias</Caption>}>
                <div className="mt-auto">{rows(3)}</div>
            </Frame>
        );
    }
    return (
        <Frame title="Recordes" aside={<Caption>30 dias</Caption>}>
            <Metric
                size={56}
                value={list.length}
                unit={`recorde${list.length === 1 ? "" : "s"}`}
                className="mt-3"
            />
            <div className="mt-auto">{rows(6)}</div>
        </Frame>
    );
};

const muscleVolume: Render = ({ extras }, size) => {
    const list = extras.muscleVolume;
    if (list.length === 0) {
        return (
            <Frame title="Volume por músculo">
                <EmptyState ghost="0" sentence="Ainda sem séries nesta semana." />
            </Frame>
        );
    }
    const target = 10;
    const max = Math.max(target * 1.5, ...list.map((item) => item.sets));

    if (size === "small") {
        const top = list[0];
        return (
            <Frame title="Mais treinado">
                <Metric
                    size={56}
                    value={formatNumber(top.sets, 1)}
                    unit="séries"
                    spacing="tight"
                    className="mt-auto"
                />
                <Caption className="mt-2 truncate">{top.name}, nesta semana</Caption>
            </Frame>
        );
    }

    const bars = (count: number) => (
        <ol className="flex flex-col gap-2">
            {list.slice(0, count).map((item) => (
                <li
                    key={item.name}
                    className="grid grid-cols-[96px_1fr_28px] items-center gap-2 text-[13px]"
                >
                    <span className="truncate text-ink-secondary">{item.name}</span>
                    <ProgressBar value={item.sets} max={max} reference={target} />
                    <span className="text-right tabular-nums">{formatNumber(item.sets, 1)}</span>
                </li>
            ))}
        </ol>
    );

    if (size === "medium") {
        return (
            <Frame title="Volume por músculo" aside={<Caption>séries na semana</Caption>}>
                <div className="mt-auto">{bars(4)}</div>
            </Frame>
        );
    }
    return (
        <Frame title="Volume por músculo" aside={<Caption>séries na semana</Caption>}>
            <div className="mt-4">{bars(11)}</div>
            <Caption size={11} className="mt-auto flex items-center gap-2">
                <span aria-hidden className="h-3 w-px bg-red" />
                referência de {target} séries por semana
            </Caption>
        </Frame>
    );
};

const stagnant: Render = ({ extras }, size) => {
    const list = extras.stagnant;
    if (size === "small" || list.length === 0) {
        return (
            <Frame title="Estagnados">
                <DotNumber as="p" size={56}>
                    {list.length}
                </DotNumber>
                <Caption className="mt-3">
                    {list.length === 0 ? "Tudo progredindo" : `sem progredir há 3 semanas`}
                </Caption>
            </Frame>
        );
    }
    return (
        <Frame title="Estagnados" aside={<Caption>3 semanas sem progredir</Caption>}>
            <List className="mt-auto">
                {list.slice(0, size === "medium" ? 3 : 7).map((item) => (
                    <ValueRow
                        key={item.name}
                        label={item.name}
                        value={`${formatNumber(item.bestKg)} kg`}
                    />
                ))}
            </List>
            {size === "large" ? (
                <Caption className="mt-4 leading-snug">
                    Vale conversar com o instrutor sobre ajustar a faixa de repetições ou trocar o
                    exercício.
                </Caption>
            ) : null}
        </Frame>
    );
};

export const WIDGET_RENDERERS: Record<WidgetKind, Render> = {
    weekly_goal: weekly,
    consistency,
    next_workout: nextWorkout,
    last_workout: lastWorkout,
    body_weight: bodyWeight,
    waist,
    personal_record: records,
    muscle_volume: muscleVolume,
    stagnant_exercises: stagnant,
};
