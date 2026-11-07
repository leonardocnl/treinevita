import type { ReactNode } from "react";

import type { DashboardExtras, Summary, WidgetKind, WidgetSize } from "@/modules/progress";
import { formatNumber } from "@/shared/format/numbers";
import { DotRing } from "@/shared/ui/dot-ring";
import { Sparkline } from "@/shared/ui/sparkline";

/*
 * Every Summary widget in its three sizes: small (1×1), medium (2×1) and large (2×2).
 * Dot-matrix numbers only at 36px and up (docs/design/DESIGN.md).
 */

export type WidgetData = {
    readonly summary: Summary;
    readonly extras: DashboardExtras;
};

type Render = (data: WidgetData, size: WidgetSize) => ReactNode;

function Frame({
    title,
    aside,
    children,
}: {
    title: string;
    aside?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex h-full flex-col p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] text-ink-secondary">{title}</p>
                {aside}
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return <p className="mt-auto text-[15px] leading-snug text-ink-secondary">{text}</p>;
}

const weekly: Render = ({ summary, extras }, size) => {
    const { done, goal } = summary.week;
    const missing = Math.max(goal - done, 0);
    const caption = missing === 0 ? "Meta batida" : `Falta${missing > 1 ? "m" : ""} ${missing}`;

    if (size === "small") {
        return (
            <Frame title="Semana" aside={<DotRing done={done} goal={goal} size={40} dots={16} />}>
                <p className="num mt-auto text-[56px] leading-[0.8]">
                    {done}
                    <span className="text-dot-off">/{goal}</span>
                </p>
                <p className="mt-3 text-[13px] text-ink-secondary">{caption}</p>
            </Frame>
        );
    }

    const hero = (
        <div className="flex items-end justify-between gap-3">
            <div>
                <p className="num text-[80px] leading-[0.8]">
                    {done}
                    <span className="text-dot-off">/{goal}</span>
                </p>
                <p className="mt-3 text-[15px] text-ink-secondary">
                    {missing === 0
                        ? "Meta da semana batida."
                        : `Falta${missing > 1 ? "m" : ""} ${missing} treino${missing > 1 ? "s" : ""}.`}
                </p>
            </div>
            <DotRing done={done} goal={goal} size={size === "large" ? 108 : 92} />
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
                        <span
                            className={`text-[13px] ${day.isToday ? "text-ink" : "text-ink-secondary"}`}
                        >
                            {day.label}
                        </span>
                        <span
                            className={`size-3 rounded-full ${
                                day.trained
                                    ? "bg-ink"
                                    : day.isToday
                                      ? "ring-[1.5px] ring-red ring-inset"
                                      : day.isFuture
                                        ? "bg-hairline"
                                        : "bg-dot-off"
                            }`}
                        />
                    </div>
                ))}
            </div>
        </Frame>
    );
};

/** Trained count per week (newest first), from the activity data. */
function weeklyCounts(summary: Summary) {
    return summary.activity.weeks
        .map((week) => ({
            start: week[0].date,
            trained: week.filter((day) => day.level > 0).length,
            current: week.some((day) => day.isToday),
        }))
        .reverse();
}

const weekLabel = (start: string, current: boolean) =>
    current
        ? "Esta semana"
        : new Date(`${start}T12:00:00Z`)
              .toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" })
              .replace(".", "");

/** One row per week: the goal as dots, lit by each workout; a red mark when the goal was met. */
function WeekRows({
    weeks,
    goal,
    dot,
    rowHeight,
}: {
    weeks: { start: string; trained: number; current: boolean }[];
    goal: number;
    dot: number;
    rowHeight: number;
}) {
    return (
        <ol>
            {weeks.map((week) => {
                const met = week.trained >= goal;
                return (
                    <li
                        key={week.start}
                        className="grid grid-cols-[1fr_auto_18px] items-center gap-3 border-b border-hairline last:border-b-0"
                        style={{ height: rowHeight }}
                    >
                        <span
                            className={`truncate text-[13px] ${week.current ? "text-ink" : "text-ink-secondary"}`}
                        >
                            {weekLabel(week.start, week.current)}
                        </span>
                        <span
                            className="flex gap-[6px]"
                            role="img"
                            aria-label={`${week.trained} de ${goal} treinos`}
                        >
                            {Array.from({ length: Math.max(goal, week.trained) }, (_, slot) => (
                                <span
                                    key={slot}
                                    className={`rounded-full ${
                                        slot < week.trained
                                            ? "bg-ink"
                                            : week.current
                                              ? "ring-1 ring-dot-off ring-inset"
                                              : "bg-dot-off"
                                    }`}
                                    style={{ width: dot, height: dot }}
                                />
                            ))}
                        </span>
                        <span className="flex justify-end">
                            {met ? (
                                <span
                                    aria-label="meta batida"
                                    className="h-[3px] w-3.5 rounded-full bg-red"
                                />
                            ) : null}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

const consistency: Render = ({ summary }, size) => {
    const goal = summary.week.goal;
    const all = weeklyCounts(summary);
    const closed = all.filter((week) => !week.current);
    const metCount = closed.filter((week) => week.trained >= goal).length;
    const average = (big: boolean) => (
        <p className="flex items-baseline gap-2">
            <span className={`num leading-[0.85] ${big ? "text-[64px]" : "text-[48px]"}`}>
                {formatNumber(summary.activity.averagePerWeek, 1)}
            </span>
            <span className="whitespace-nowrap text-[13px] text-ink-secondary">por semana</span>
        </p>
    );

    if (size === "small") {
        return (
            <Frame title="Constância">
                <div className="mt-auto">{average(false)}</div>
                <div className="mt-3">
                    <WeekRows weeks={all.slice(0, 2)} goal={goal} dot={8} rowHeight={24} />
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
                        <p className="mt-2 text-[13px] text-ink-secondary">
                            {metCount} de {closed.length} semanas com meta
                        </p>
                    </div>
                    <WeekRows weeks={all.slice(0, 4)} goal={goal} dot={8} rowHeight={24} />
                </div>
            </Frame>
        );
    }

    return (
        <Frame
            title="Constância"
            aside={<p className="text-[13px] text-ink-secondary">meta de {goal} por semana</p>}
        >
            <div className="mt-3 flex items-end justify-between gap-3">
                {average(true)}
                <p className="pb-1 text-right text-[13px] leading-snug text-ink-secondary">
                    <span className="text-[17px] font-normal text-ink">{metCount}</span> de{" "}
                    {closed.length}
                    <br />
                    semanas com meta
                </p>
            </div>
            <div className="mt-auto">
                <WeekRows weeks={all.slice(0, 7)} goal={goal} dot={11} rowHeight={30} />
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
                <Empty text="Monte sua ficha em Treinos." />
            </Frame>
        );
    }
    const increasing =
        next.increasing.length === 0 ? null : (
            <p className="flex items-center gap-2 text-[13px]">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-red" />
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
                <p className="mt-auto text-[30px] font-light leading-none">Treino {next.label}</p>
                <p className="mt-2 text-[13px] text-ink-secondary">
                    {next.exerciseCount} exercícios
                </p>
                {increasing ? <div className="mt-2">{increasing}</div> : null}
            </Frame>
        );
    }

    const names = next.exercises.map((exercise) => exercise.name);
    if (size === "medium") {
        return (
            <Frame
                title={title}
                aside={
                    <p className="text-[13px] text-ink-secondary">
                        {next.exerciseCount} exercícios
                    </p>
                }
            >
                <p className="mt-auto text-[34px] font-light leading-none">Treino {next.label}</p>
                <p className="mt-2 truncate text-[13px] text-ink-secondary">
                    {names.slice(0, 2).join(", ")}
                    {names.length > 2 ? ` e mais ${names.length - 2}` : ""}
                </p>
                {increasing ? <div className="mt-2">{increasing}</div> : null}
            </Frame>
        );
    }

    return (
        <Frame
            title={title}
            aside={
                <p className="text-[13px] text-ink-secondary">{next.exerciseCount} exercícios</p>
            }
        >
            <p className="mt-3 text-[34px] font-light leading-none">Treino {next.label}</p>
            <ol className="mt-auto">
                {next.exercises.map((exercise, index) => (
                    <li
                        key={index}
                        className="flex h-[26px] items-center justify-between gap-2 border-b border-hairline text-[13px] last:border-b-0"
                    >
                        <span className="truncate">{exercise.name}</span>
                        {exercise.increases ? (
                            <span
                                aria-label="sobe de carga"
                                className="size-1.5 shrink-0 rounded-full bg-red"
                            />
                        ) : null}
                    </li>
                ))}
            </ol>
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
                <Empty text="Seu primeiro treino aparece aqui." />
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
                <p className="mt-auto flex items-baseline gap-2">
                    <span className="num text-[48px] leading-[0.85]">{last.minutes}</span>
                    <span className="text-[13px] text-ink-secondary">min</span>
                </p>
                <p className="mt-2 text-[13px] text-ink-secondary">
                    Treino {last.label}, {shortDate(last.date)}
                </p>
            </Frame>
        );
    }

    const stats = (
        <div className="grid grid-cols-3">
            {[
                { value: String(last.minutes), label: "min" },
                { value: String(last.sets), label: "séries" },
                { value: tons, label: "volume" },
            ].map((stat, index) => (
                <div
                    key={stat.label}
                    className={index > 0 ? "border-l border-hairline pl-3" : "pr-3"}
                >
                    <p className="text-[22px] font-normal tabular-nums">{stat.value}</p>
                    <p className="text-[13px] text-ink-secondary">{stat.label}</p>
                </div>
            ))}
        </div>
    );

    if (size === "medium") {
        return (
            <Frame
                title="Último treino"
                aside={<p className="text-[13px] text-ink-secondary">{shortDate(last.date)}</p>}
            >
                <p className="mt-2 text-[28px] font-light leading-none">Treino {last.label}</p>
                <div className="mt-auto">{stats}</div>
            </Frame>
        );
    }

    return (
        <Frame
            title="Último treino"
            aside={<p className="text-[13px] text-ink-secondary">{shortDate(last.date)}</p>}
        >
            <p className="mt-2 text-[28px] font-light leading-none">Treino {last.label}</p>
            <div className="mt-4">{stats}</div>
            <ol className="mt-auto">
                {last.highlights.slice(0, 5).map((item) => (
                    <li
                        key={item.name}
                        className="flex h-[26px] items-center justify-between gap-2 border-b border-hairline text-[13px] last:border-b-0"
                    >
                        <span className="truncate">{item.name}</span>
                        <span className="tabular-nums text-ink-secondary">
                            {formatNumber(item.loadKg)} × {item.reps}
                        </span>
                    </li>
                ))}
            </ol>
        </Frame>
    );
};

const bodyWeight: Render = ({ summary }, size) => {
    const weight = summary.weight;
    if (!weight) {
        return (
            <Frame title="Peso">
                <Empty text="Registre seu peso em Corpo." />
            </Frame>
        );
    }
    const delta =
        weight.monthDeltaKg === null
            ? "kg"
            : `kg, ${weight.monthDeltaKg >= 0 ? "+" : ""}${formatNumber(weight.monthDeltaKg, 1)} no mês`;
    const value = (
        <span className="num text-[48px] leading-[0.85]">
            {formatNumber(weight.latestKg, 1, 1)}
        </span>
    );

    if (size === "small") {
        return (
            <Frame title="Peso">
                <p className="mt-auto">{value}</p>
                <p className="mt-2 text-[13px] text-ink-secondary">{delta}</p>
            </Frame>
        );
    }
    if (size === "medium") {
        return (
            <Frame title="Peso">
                <div className="mt-auto flex items-end justify-between gap-4">
                    <div>
                        <p>{value}</p>
                        <p className="mt-2 text-[13px] text-ink-secondary">{delta}</p>
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
        <Frame
            title="Peso"
            aside={<p className="text-[13px] text-ink-secondary">{weight.trend.length} pesagens</p>}
        >
            <p className="mt-3">
                <span className="num text-[64px] leading-[0.85]">
                    {formatNumber(weight.latestKg, 1, 1)}
                </span>
            </p>
            <p className="mt-2 text-[13px] text-ink-secondary">{delta}</p>
            <div className="mt-auto">
                <Sparkline
                    values={weight.trend}
                    width={300}
                    height={90}
                    label="Peso nas últimas semanas"
                />
                <div className="mt-1 flex justify-between text-[11px] text-ink-secondary">
                    <span>{formatNumber(Math.min(...weight.trend), 1, 1)} kg</span>
                    <span>{formatNumber(Math.max(...weight.trend), 1, 1)} kg</span>
                </div>
            </div>
        </Frame>
    );
};

const waist: Render = ({ summary }) => (
    <Frame title="Cintura">
        {summary.waistCm !== null ? (
            <>
                <p className="num mt-auto text-[48px] leading-[0.85]">
                    {formatNumber(summary.waistCm, 1, 1)}
                </p>
                <p className="mt-2 text-[13px] text-ink-secondary">cm</p>
            </>
        ) : (
            <Empty text="Sem medida ainda." />
        )}
    </Frame>
);

const records: Render = ({ extras }, size) => {
    const list = extras.records;
    if (list.length === 0) {
        return (
            <Frame title="Recordes">
                <Empty text="Nenhum recorde nos últimos 30 dias." />
            </Frame>
        );
    }
    const top = list[0];
    const marker = <span aria-hidden className="mt-1 size-1.5 rounded-full bg-red" />;

    if (size === "small") {
        return (
            <Frame title="Recorde" aside={marker}>
                <p className="mt-auto flex items-baseline gap-1.5">
                    <span className="num text-[48px] leading-[0.85]">
                        {formatNumber(top.loadKg)}
                    </span>
                    <span className="text-[13px] text-ink-secondary">kg</span>
                </p>
                <p className="mt-2 truncate text-[13px] text-ink-secondary">{top.exerciseName}</p>
            </Frame>
        );
    }

    const rows = (count: number) => (
        <ol>
            {list.slice(0, count).map((record) => (
                <li
                    key={record.exerciseName}
                    className="flex h-[28px] items-center justify-between gap-3 border-b border-hairline text-[13px] last:border-b-0"
                >
                    <span className="truncate">{record.exerciseName}</span>
                    <span className="shrink-0 tabular-nums text-ink-secondary">
                        {formatNumber(record.loadKg)} × {record.reps}
                    </span>
                </li>
            ))}
        </ol>
    );

    if (size === "medium") {
        return (
            <Frame
                title="Recordes"
                aside={<p className="text-[13px] text-ink-secondary">30 dias</p>}
            >
                <div className="mt-auto">{rows(3)}</div>
            </Frame>
        );
    }
    return (
        <Frame title="Recordes" aside={<p className="text-[13px] text-ink-secondary">30 dias</p>}>
            <p className="mt-3 flex items-baseline gap-2">
                <span className="num text-[56px] leading-[0.85]">{list.length}</span>
                <span className="text-[13px] text-ink-secondary">
                    recorde{list.length === 1 ? "" : "s"}
                </span>
            </p>
            <div className="mt-auto">{rows(6)}</div>
        </Frame>
    );
};

const muscleVolume: Render = ({ extras }, size) => {
    const list = extras.muscleVolume;
    if (list.length === 0) {
        return (
            <Frame title="Volume por músculo">
                <Empty text="Ainda sem séries nesta semana." />
            </Frame>
        );
    }
    const target = 10;
    const max = Math.max(target * 1.5, ...list.map((item) => item.sets));

    if (size === "small") {
        const top = list[0];
        return (
            <Frame title="Mais treinado">
                <p className="mt-auto flex items-baseline gap-1.5">
                    <span className="num text-[48px] leading-[0.85]">
                        {formatNumber(top.sets, 1)}
                    </span>
                    <span className="text-[13px] text-ink-secondary">séries</span>
                </p>
                <p className="mt-2 truncate text-[13px] text-ink-secondary">
                    {top.name}, nesta semana
                </p>
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
                    <span className="relative h-1.5 rounded-full bg-dot-off">
                        <span
                            className="absolute inset-y-0 left-0 rounded-full bg-ink"
                            style={{ width: `${(item.sets / max) * 100}%` }}
                        />
                        <span
                            aria-hidden
                            className="absolute -inset-y-1 w-px bg-red"
                            style={{ left: `${(target / max) * 100}%` }}
                        />
                    </span>
                    <span className="text-right tabular-nums">{formatNumber(item.sets, 1)}</span>
                </li>
            ))}
        </ol>
    );

    if (size === "medium") {
        return (
            <Frame
                title="Volume por músculo"
                aside={<p className="text-[13px] text-ink-secondary">séries na semana</p>}
            >
                <div className="mt-auto">{bars(4)}</div>
            </Frame>
        );
    }
    return (
        <Frame
            title="Volume por músculo"
            aside={<p className="text-[13px] text-ink-secondary">séries na semana</p>}
        >
            <div className="mt-4">{bars(11)}</div>
            <p className="mt-auto flex items-center gap-2 text-[11px] text-ink-secondary">
                <span aria-hidden className="h-3 w-px bg-red" />
                referência de {target} séries por semana
            </p>
        </Frame>
    );
};

const stagnant: Render = ({ extras }, size) => {
    const list = extras.stagnant;
    if (size === "small" || list.length === 0) {
        return (
            <Frame title="Estagnados">
                <p className="num mt-auto text-[56px] leading-[0.8]">{list.length}</p>
                <p className="mt-3 text-[13px] text-ink-secondary">
                    {list.length === 0 ? "Tudo progredindo" : `sem progredir há 3 semanas`}
                </p>
            </Frame>
        );
    }
    return (
        <Frame
            title="Estagnados"
            aside={<p className="text-[13px] text-ink-secondary">3 semanas sem progredir</p>}
        >
            <ol className="mt-auto">
                {list.slice(0, size === "medium" ? 3 : 7).map((item) => (
                    <li
                        key={item.name}
                        className="flex h-[28px] items-center justify-between gap-3 border-b border-hairline text-[13px] last:border-b-0"
                    >
                        <span className="truncate">{item.name}</span>
                        <span className="shrink-0 tabular-nums text-ink-secondary">
                            {formatNumber(item.bestKg)} kg
                        </span>
                    </li>
                ))}
            </ol>
            {size === "large" ? (
                <p className="mt-4 text-[13px] leading-snug text-ink-secondary">
                    Vale conversar com o instrutor sobre ajustar a faixa de repetições ou trocar o
                    exercício.
                </p>
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
