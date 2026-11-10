/*
 * Every home widget in the sizes it allows (DESIGN.md, "Widgets"). A widget is
 * a column with no background: the SectionLabel header, 16px, then the body
 * with 8px inner spacing. P shows the common body: a 56px Doto value with its
 * unit, a 12px 900/112 title and a 13px note. Empty widgets show the ghost value
 * in the place of the real one, one sentence and, for manual data, "+ REGISTRAR".
 */
import type { ReactNode } from "react";

import {
    WIDGET_CATALOG,
    hoursAndMinutes,
    type HomeData,
    type WidgetPlacement,
    type WidgetSize,
} from "@/modules/progress";
import { formatNumber } from "@/shared/format/numbers";
import { addDays, shortDate } from "@/shared/time/local-date";
import { cx } from "@/shared/ui/cx";
import { DotBar } from "@/shared/ui/dot-bar";
import { DotColumns, toDotRows } from "@/shared/ui/dot-columns";
import { DotNumber } from "@/shared/ui/dot-number";
import { EmptyState } from "@/shared/ui/empty-state";
import { SectionLabel } from "@/shared/ui/section-label";
import { WeekDots } from "@/shared/ui/week-dots";
import { WeightChart } from "@/shared/ui/weight-chart";

type Render = (data: HomeData, size: WidgetSize, ref: string | null) => ReactNode;

/** "−0,6" with a real minus sign, "+2,5". */
function signed(value: number, digits = 1): string {
    const text = formatNumber(Math.abs(value), digits);
    return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

function minutesText(total: number): string {
    const { hours, minutes } = hoursAndMinutes(total);
    return hours > 0 ? `${hours} h ${String(minutes).padStart(2, "0")} min` : `${minutes} min`;
}

function relativeDay(day: string, today: string): string {
    if (day === today) {
        return "hoje";
    }
    if (day === addDays(today, -1)) {
        return "ontem";
    }
    return shortDate(day);
}

function Frame({
    title,
    meta,
    accent = false,
    size,
    children,
}: {
    title: string;
    meta?: ReactNode;
    accent?: boolean;
    size: WidgetSize;
    children: ReactNode;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-label">
            <SectionLabel as="h3" accent={accent} meta={size === "small" ? undefined : meta}>
                {title}
            </SectionLabel>
            <div className="flex min-w-0 flex-col gap-inner">{children}</div>
        </div>
    );
}

/** The common P body. */
function Stat({
    value,
    unit,
    of,
    title,
    note,
    noteAccent = false,
}: {
    value: ReactNode;
    unit?: ReactNode;
    of?: ReactNode;
    title: ReactNode;
    note?: ReactNode;
    noteAccent?: boolean;
}) {
    return (
        <>
            <DotNumber as="p" size={56} unit={unit} of={of}>
                {value}
            </DotNumber>
            <p className="strong truncate text-12 uppercase">{title}</p>
            {note ? (
                <p
                    className={cx(
                        "text-13",
                        noteAccent ? "font-semibold text-accent-text" : "text-secondary",
                    )}
                >
                    {note}
                </p>
            ) : null}
        </>
    );
}

/** A name and a value on one line (records, measurements, stagnation). */
function Row({ name, value, detail }: { name: ReactNode; value: ReactNode; detail?: ReactNode }) {
    return (
        <li className="flex min-h-6 items-baseline justify-between gap-gutter text-15">
            <span className="min-w-0 truncate">{name}</span>
            <span className="flex shrink-0 items-baseline gap-inner">
                {detail ? (
                    <span className="text-13 text-secondary tabular-nums">{detail}</span>
                ) : null}
                <span className="strong tabular-nums">{value}</span>
            </span>
        </li>
    );
}

/** A row of dots, ink or off, one per flag (the last 12 weeks). */
function FlagDots({ flags, label }: { flags: readonly boolean[]; label: string }) {
    return (
        <div role="img" aria-label={label} className="flex w-full justify-between">
            {flags.map((flag, index) => (
                <span
                    key={index}
                    className={cx("size-2 rounded-full", flag ? "bg-ink" : "bg-off")}
                />
            ))}
        </div>
    );
}

const weekly: Render = ({ week, lastWorkout }, size) => {
    const missing = Math.max(0, week.goal - week.done);
    const label = `${week.done} de ${week.goal} treinos na semana`;
    if (!lastWorkout && week.done === 0) {
        return (
            <Frame title="Semana" size={size} meta={`meta ${week.goal}`}>
                <EmptyState
                    ghost="0"
                    of={week.goal}
                    sentence="Seus treinos da semana aparecem aqui."
                />
            </Frame>
        );
    }
    if (size === "large") {
        return (
            <Frame
                title="Semana"
                size={size}
                meta={missing === 0 ? "meta batida" : `falta ${missing}`}
            >
                <DotNumber as="p" size={128} of={week.goal}>
                    {week.done}
                </DotNumber>
                <div className="mt-inner">
                    <WeekDots days={week.days} label={label} />
                </div>
            </Frame>
        );
    }
    if (size === "medium") {
        return (
            <Frame
                title="Semana"
                size={size}
                meta={missing === 0 ? "meta batida" : `falta ${missing}`}
            >
                <div className="flex items-end justify-between gap-gutter">
                    <DotNumber size={56} of={week.goal}>
                        {week.done}
                    </DotNumber>
                    <div className="w-40">
                        <WeekDots days={week.days} size={8} label={label} />
                    </div>
                </div>
            </Frame>
        );
    }
    return (
        <Frame title="Semana" size={size}>
            <Stat
                value={week.done}
                of={week.goal}
                title="Treinos na semana"
                note={missing === 0 ? "meta batida" : `falta ${missing} para a meta`}
            />
        </Frame>
    );
};

const streak: Render = ({ streak: data }, size) => {
    if (data.best === 0) {
        return (
            <Frame title="Sequência" size={size}>
                <EmptyState
                    ghost="0"
                    unit="sem"
                    sentence="As semanas seguidas na meta aparecem aqui."
                />
            </Frame>
        );
    }
    return (
        <Frame title="Sequência" size={size} meta="12 semanas">
            <Stat
                value={data.current}
                unit="sem"
                title="Semanas na meta"
                note={`melhor: ${data.best} ${data.best === 1 ? "semana" : "semanas"}`}
            />
            {size === "medium" ? (
                <div className="mt-inner">
                    <FlagDots flags={data.last12} label="Metas das últimas 12 semanas" />
                </div>
            ) : null}
        </Frame>
    );
};

const record: Render = ({ records }, size) => {
    const top = records.list[0];
    if (!top) {
        return (
            <Frame title="Recorde" accent size={size}>
                <EmptyState ghost="00" unit="kg" sentence="Seus recordes aparecem aqui." />
            </Frame>
        );
    }
    if (size === "medium") {
        return (
            <Frame title="Recordes" accent size={size} meta="2 semanas">
                <ul className="flex flex-col gap-inner">
                    {records.list.slice(0, 3).map((item) => (
                        <Row
                            key={`${item.name}-${item.day}`}
                            name={item.name}
                            value={`${formatNumber(item.loadKg)} kg`}
                            detail={`× ${item.reps}`}
                        />
                    ))}
                </ul>
                {records.lastTwoWeeks > 0 ? (
                    <p className="text-13 font-semibold text-accent-text">
                        {records.lastTwoWeeks} {records.lastTwoWeeks === 1 ? "recorde" : "recordes"}{" "}
                        nas últimas 2 semanas
                    </p>
                ) : null}
            </Frame>
        );
    }
    return (
        <Frame title="Recorde" accent size={size}>
            <Stat
                value={formatNumber(top.loadKg)}
                unit="kg"
                title={top.name}
                note={
                    top.gainKg > 0 ? `${signed(top.gainKg)} kg desde a última vez` : `× ${top.reps}`
                }
                noteAccent={top.gainKg > 0}
            />
        </Frame>
    );
};

const bodyWeight: Render = ({ weight }, size) => {
    if (!weight) {
        return (
            <Frame title="Peso" size={size}>
                <EmptyState
                    ghost="00,0"
                    unit="kg"
                    sentence="Seu peso aparece aqui."
                    action="Registrar peso"
                />
            </Frame>
        );
    }
    const value = formatNumber(weight.latestKg, 1, 1);
    if (size === "large") {
        const first = weight.points[0];
        return (
            <Frame title="Peso" size={size} meta={`${weight.points.length} pesagens`}>
                <div className="flex items-baseline gap-gutter">
                    <DotNumber size={56} unit="kg">
                        {value}
                    </DotNumber>
                    {weight.changeKg !== null ? (
                        <DotNumber size={36} tone="secondary">
                            {signed(weight.changeKg)}
                        </DotNumber>
                    ) : null}
                </div>
                <div className="mt-inner">
                    <WeightChart
                        points={weight.points}
                        width={350}
                        height={150}
                        label="Peso nas últimas semanas"
                        format={(kg) => formatNumber(kg, 1, 1)}
                    />
                    {first ? (
                        <div className="mt-inner flex justify-between text-11 font-semibold text-secondary">
                            <span className="tabular-nums">
                                {shortDate(first.day)} · {formatNumber(first.value, 1, 1)}
                            </span>
                            <span className="font-black text-ink">hoje</span>
                        </div>
                    ) : null}
                </div>
            </Frame>
        );
    }
    return (
        <Frame title="Peso" size={size}>
            <Stat
                value={value}
                unit="kg"
                title="Peso"
                note={
                    weight.changeKg !== null
                        ? `${signed(weight.changeKg)} kg em 4 sem`
                        : "primeira pesagem"
                }
            />
            <WeightChart
                points={weight.points}
                width={169}
                height={40}
                compact
                label="Tendência do peso"
                format={(kg) => formatNumber(kg, 1, 1)}
            />
        </Frame>
    );
};

const measurements: Render = ({ measurements: data }, size) => {
    const { waist, chest, arm } = data;
    if (!waist && !chest && !arm) {
        return (
            <Frame title="Medidas" size={size}>
                <EmptyState
                    ghost="00"
                    unit="cm"
                    sentence="Suas medidas aparecem aqui."
                    action="Registrar medidas"
                />
            </Frame>
        );
    }
    const change = (item: { change: number | null } | null) =>
        item?.change !== null && item?.change !== undefined
            ? `${signed(item.change)} cm`
            : undefined;
    if (size === "medium") {
        const rows = [
            { name: "Cintura", item: waist },
            { name: "Peito", item: chest },
            { name: "Braço", item: arm },
        ];
        return (
            <Frame title="Medidas" size={size} meta="30 dias">
                <ul className="flex flex-col gap-inner">
                    {rows.map((row) => (
                        <Row
                            key={row.name}
                            name={row.name}
                            value={row.item ? `${formatNumber(row.item.value, 1)} cm` : "—"}
                            detail={change(row.item)}
                        />
                    ))}
                </ul>
            </Frame>
        );
    }
    return (
        <Frame title="Medidas" size={size}>
            <Stat
                value={waist ? formatNumber(waist.value, 1) : "—"}
                unit="cm"
                title="Cintura"
                note={change(waist) ? `${change(waist)} em 30 dias` : undefined}
            />
        </Frame>
    );
};

const weeklyVolume: Render = ({ weeklyVolume: data }, size) => {
    if (data.totalSets === 0) {
        return (
            <Frame title="Volume semanal" size={size}>
                <EmptyState
                    ghost="00"
                    unit="séries"
                    sentence="Suas séries da semana aparecem aqui."
                />
            </Frame>
        );
    }
    if (size === "medium") {
        return (
            <Frame title="Volume semanal" size={size} meta="séries · alvo 10">
                <ul className="flex flex-col gap-inner">
                    {data.muscles.slice(0, 6).map((muscle) => (
                        <li
                            key={muscle.name}
                            className="grid grid-cols-[64px_1fr_28px] items-center gap-gutter"
                        >
                            <span className="truncate text-13 font-semibold">{muscle.name}</span>
                            <DotBar total={14} value={muscle.sets} target={10} />
                            <span className="text-right text-13 tabular-nums">
                                {formatNumber(muscle.sets, 1)}
                            </span>
                        </li>
                    ))}
                </ul>
            </Frame>
        );
    }
    return (
        <Frame title="Volume semanal" size={size}>
            <Stat
                value={data.totalSets}
                unit="séries"
                title="Séries na semana"
                note={
                    data.muscles[0]
                        ? `mais em ${data.muscles[0].name.toLocaleLowerCase("pt-BR")}`
                        : undefined
                }
            />
        </Frame>
    );
};

const lastWorkout: Render = ({ lastWorkout: last, today }, size) => {
    if (!last) {
        return (
            <Frame title="Último treino" size={size}>
                <EmptyState ghost="00" unit="min" sentence="Seu último treino aparece aqui." />
            </Frame>
        );
    }
    if (size === "medium") {
        return (
            <Frame title="Último treino" size={size}>
                <p className="headline text-20 leading-none">{last.name}</p>
                <p className="text-13 text-secondary tabular-nums">
                    {relativeDay(last.day, today)} · {last.minutes} min ·{" "}
                    {formatNumber(last.volumeKg)} kg
                </p>
                <ul className="mt-inner flex flex-col gap-inner">
                    {last.topSets.map((set) => (
                        <Row
                            key={set.name}
                            name={set.name}
                            value={`${formatNumber(set.loadKg)} kg`}
                            detail={`× ${set.reps}`}
                        />
                    ))}
                </ul>
            </Frame>
        );
    }
    return (
        <Frame title="Último treino" size={size}>
            <Stat
                value={last.minutes}
                unit="min"
                title={last.name}
                note={relativeDay(last.day, today)}
            />
        </Frame>
    );
};

const stagnant: Render = ({ stagnant: list, lastWorkout: last }, size) => {
    if (!last) {
        return (
            <Frame title="Estagnados" size={size}>
                <EmptyState
                    ghost="0"
                    sentence="Exercícios sem progresso há 3 semanas aparecem aqui."
                />
            </Frame>
        );
    }
    if (size === "medium" && list.length > 0) {
        return (
            <Frame title="Estagnados" size={size} meta={`${list.length}`}>
                <ul className="flex flex-col gap-inner">
                    {list.slice(0, 4).map((item) => (
                        <Row
                            key={item.name}
                            name={item.name}
                            value={`parado há ${item.weeks} semanas`}
                        />
                    ))}
                </ul>
            </Frame>
        );
    }
    return (
        <Frame title="Estagnados" size={size}>
            <Stat
                value={list.length}
                title="Exercícios parados"
                note={
                    list[0]
                        ? `${list[0].name}, parado há ${list[0].weeks} semanas`
                        : "nenhum parado"
                }
            />
        </Frame>
    );
};

function Duration({ minutes }: { minutes: number }) {
    const parts = hoursAndMinutes(minutes);
    return (
        <p className="flex items-baseline gap-inner">
            {parts.hours > 0 ? (
                <DotNumber size={56} unit="h">
                    {parts.hours}
                </DotNumber>
            ) : null}
            <DotNumber size={56} unit="min">
                {parts.hours > 0 ? String(parts.minutes).padStart(2, "0") : parts.minutes}
            </DotNumber>
        </p>
    );
}

const monthTime: Render = ({ month }, size) => {
    if (month.current.minutes === 0) {
        return (
            <Frame title="Tempo no mês" size={size}>
                <EmptyState ghost="0" unit="h" sentence="O tempo treinado no mês aparece aqui." />
            </Frame>
        );
    }
    const difference = month.current.minutes - month.previous.minutes;
    return (
        <Frame title="Tempo no mês" size={size}>
            <Duration minutes={month.current.minutes} />
            <p className="strong truncate text-12 uppercase">Treinadas em {month.label}</p>
            <p className="text-13 text-secondary">
                {month.previous.minutes === 0
                    ? `nada em ${month.previousLabel}`
                    : `${difference >= 0 ? "+" : "−"}${minutesText(Math.abs(difference))} vs. ${month.previousLabel}`}
            </p>
        </Frame>
    );
};

const tonnes = (kg: number) => formatNumber(kg / 1000, 1);

const monthVolume: Render = ({ month }, size) => {
    if (month.current.volumeKg === 0) {
        return (
            <Frame title="Volume do mês" size={size}>
                <EmptyState ghost="0,0" unit="t" sentence="A carga total do mês aparece aqui." />
            </Frame>
        );
    }
    const difference = month.current.volumeKg - month.previous.volumeKg;
    const note = [
        month.previous.volumeKg > 0
            ? `${signed(difference / 1000)} t vs. ${month.previousLabel}`
            : null,
        month.bestVolume ? "melhor mês" : null,
    ]
        .filter(Boolean)
        .join(" · ");
    return (
        <Frame title="Volume do mês" size={size} meta="4 semanas">
            <Stat
                value={tonnes(month.current.volumeKg)}
                unit="t"
                title={`Carga total em ${month.label}`}
                note={note || undefined}
            />
            {size === "medium" ? (
                <div className="mt-inner w-32">
                    <DotColumns
                        values={toDotRows(month.weekVolumes, 6)}
                        rows={6}
                        label="Carga das últimas 4 semanas"
                    />
                </div>
            ) : null}
        </Frame>
    );
};

const nextIncrease: Render = ({ nextIncreases }, size) => {
    const first = nextIncreases[0];
    if (!first) {
        return (
            <Frame title="Próximo aumento" size={size}>
                <EmptyState ghost="00" unit="kg" sentence="As próximas cargas aparecem aqui." />
            </Frame>
        );
    }
    if (size === "medium") {
        return (
            <Frame title="Próximo aumento" size={size} meta={`${nextIncreases.length}`}>
                <ul className="flex flex-col gap-inner">
                    {nextIncreases.slice(0, 4).map((item) => (
                        <Row
                            key={item.name}
                            name={item.name}
                            value={`${formatNumber(item.fromKg)} → ${formatNumber(item.toKg)}`}
                        />
                    ))}
                </ul>
            </Frame>
        );
    }
    return (
        <Frame title="Próximo aumento" size={size}>
            <Stat
                value={formatNumber(first.toKg)}
                unit="kg"
                title={first.name}
                note={`de ${formatNumber(first.fromKg)} kg`}
            />
        </Frame>
    );
};

const goal: Render = ({ goals }, size) => {
    const first = goals[0];
    if (!first) {
        return (
            <Frame title="Meta" size={size}>
                <EmptyState
                    ghost="00"
                    unit="%"
                    sentence="Sua meta com prazo aparece aqui."
                    action="Criar meta"
                />
            </Frame>
        );
    }
    return (
        <Frame
            title="Meta"
            size={size}
            meta={goals.length > 1 ? `${goals.length} metas` : undefined}
        >
            <Stat
                value={first.percent}
                unit="%"
                title={first.title}
                note={
                    first.remaining > 0
                        ? `faltam ${formatNumber(first.remaining, 1)} kg`
                        : "meta alcançada"
                }
            />
            <DotBar
                total={24}
                value={(first.percent / 100) * 24}
                label={`${first.percent}% da meta`}
                size={5}
            />
            {size !== "small" && first.projection ? (
                <p className="text-13 text-secondary">
                    no ritmo atual, chega em {first.projection}
                </p>
            ) : null}
            {size === "large" && goals.length > 1 ? (
                <ul className="mt-inner flex flex-col gap-inner">
                    {goals.slice(1).map((other) => (
                        <Row key={other.id} name={other.title} value={`${other.percent}%`} />
                    ))}
                </ul>
            ) : null}
        </Frame>
    );
};

const LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

const sleep: Render = ({ habits }, size) => {
    const data = habits.sleep;
    if (data.average === null) {
        return (
            <Frame title="Sono" size={size}>
                <EmptyState
                    ghost="0,0"
                    unit="h"
                    sentence="Suas horas de sono aparecem aqui."
                    action="Registrar sono"
                />
            </Frame>
        );
    }
    return (
        <Frame title="Sono" size={size} meta={`meta ${formatNumber(data.goal, 1)} h`}>
            <Stat
                value={formatNumber(data.average, 1)}
                unit="h"
                title="Média na semana"
                note={`meta ${formatNumber(data.goal, 1)} h`}
            />
            {size === "medium" ? (
                <div className="mt-inner">
                    <DotColumns
                        values={data.week.map((hours) => Math.round(hours ?? 0))}
                        rows={Math.max(8, Math.ceil(data.goal))}
                        labels={LETTERS}
                        size={4}
                        label="Horas de sono por dia da semana"
                    />
                </div>
            ) : null}
        </Frame>
    );
};

const water: Render = ({ habits }, size) => {
    const data = habits.water;
    if (data.today === null) {
        return (
            <Frame title="Água" size={size}>
                <EmptyState
                    ghost="0,0"
                    unit="L"
                    sentence="A água de hoje aparece aqui."
                    action="Registrar água"
                />
            </Frame>
        );
    }
    return (
        <Frame title="Água" size={size}>
            <Stat
                value={formatNumber(data.today, 2)}
                unit="L"
                title="Água hoje"
                note={`meta ${formatNumber(data.goal, 2)} L`}
            />
            <DotBar
                total={10}
                value={Math.min(10, (data.today / data.goal) * 10)}
                size={6}
                label="Água de hoje contra a meta"
            />
        </Frame>
    );
};

const steps: Render = ({ habits }, size) => {
    const data = habits.steps;
    if (data.today === null) {
        return (
            <Frame title="Passos" size={size}>
                <EmptyState
                    ghost="0,0"
                    unit="mil"
                    sentence="Seus passos de hoje aparecem aqui."
                    action="Registrar passos"
                />
            </Frame>
        );
    }
    const thousands = (count: number) => formatNumber(count / 1000, 1);
    return (
        <Frame title="Passos" size={size} meta={`meta ${thousands(data.goal)} mil`}>
            <Stat
                value={thousands(data.today)}
                unit="mil"
                title="Passos hoje"
                note={`${thousands(data.week)} mil na semana`}
            />
            {size === "medium" ? (
                <p className="text-13 text-secondary">
                    {data.cardioToday
                        ? `${data.cardioToday} min de cardio hoje`
                        : "sem cardio hoje"}
                </p>
            ) : null}
        </Frame>
    );
};

const energy: Render = ({ habits }, size) => {
    const value = habits.energy.today;
    if (value === null) {
        return (
            <Frame title="Energia" size={size}>
                <EmptyState
                    ghost="0"
                    of={5}
                    sentence="Sua energia antes do treino aparece aqui."
                    action="Registrar energia"
                />
            </Frame>
        );
    }
    return (
        <Frame title="Energia" size={size}>
            <Stat value={value} of={5} title="Energia hoje" />
            <DotBar total={5} value={value} size={10} label={`Energia ${value} de 5`} />
        </Frame>
    );
};

const custom: Render = ({ habits }, size, ref) => {
    const tracker = habits.custom.find((item) => item.id === ref);
    if (!tracker) {
        return null;
    }
    const logged = tracker.days.some((day) => day.done) || tracker.today !== null;
    const goalText =
        tracker.valueType === "boolean"
            ? `${tracker.goal} dias por semana`
            : `meta ${formatNumber(tracker.goal)} ${tracker.valueType === "time" ? "min" : (tracker.unit ?? "")}`.trim();
    if (!logged) {
        return (
            <Frame title={tracker.name} size={size}>
                <EmptyState
                    ghost="0"
                    of={tracker.valueType === "boolean" ? tracker.goal : undefined}
                    sentence={goalText}
                    action="Registrar"
                />
            </Frame>
        );
    }
    return (
        <Frame title={tracker.name} size={size} meta={goalText}>
            {tracker.valueType === "boolean" ? (
                <Stat value={tracker.doneDays} of={tracker.goal} title="Dias na semana" />
            ) : (
                <Stat
                    value={formatNumber(tracker.today ?? 0)}
                    unit={tracker.valueType === "time" ? "min" : (tracker.unit ?? undefined)}
                    title="Hoje"
                    note={size === "small" ? goalText : undefined}
                />
            )}
            <div className="mt-inner">
                <WeekDots
                    days={tracker.days}
                    size={size === "medium" ? 12 : 8}
                    label={`${tracker.name} na semana`}
                />
            </div>
        </Frame>
    );
};

const monthCompare: Render = ({ month }, size) => {
    const { current, previous } = month;
    if (current.workouts === 0 && previous.workouts === 0) {
        return (
            <Frame title="Este mês" size={size}>
                <EmptyState ghost="0" sentence="Este mês contra o anterior aparece aqui." />
            </Frame>
        );
    }
    const diff = (value: number, text: (value: number) => string) =>
        `${value > 0 ? "+" : value < 0 ? "−" : ""}${text(Math.abs(value))}`;
    const rows = [
        {
            name: "Treinos",
            value: String(current.workouts),
            detail: diff(current.workouts - previous.workouts, String),
        },
        {
            name: "Tempo",
            value: minutesText(current.minutes),
            detail: diff(current.minutes - previous.minutes, minutesText),
        },
        {
            name: "Carga total",
            value: `${tonnes(current.volumeKg)} t`,
            detail: `${diff(current.volumeKg - previous.volumeKg, (kg) => tonnes(kg))} t`,
        },
        {
            name: "Recordes",
            value: String(current.records),
            detail: diff(current.records - previous.records, String),
        },
    ];
    return (
        <Frame title="Este mês" size={size} meta={`vs. ${month.previousLabel}`}>
            <ul className="flex flex-col gap-inner">
                {rows.map((row) => (
                    <Row key={row.name} name={row.name} value={row.value} detail={row.detail} />
                ))}
            </ul>
        </Frame>
    );
};

const bestHour: Render = ({ bestHour: data }, size) => {
    if (data.best === null) {
        return (
            <Frame title="Melhor horário" accent size={size}>
                <EmptyState
                    ghost="00"
                    unit="h"
                    sentence="O horário dos seus recordes aparece aqui."
                />
            </Frame>
        );
    }
    const best = data.best;
    const used = data.counts.flatMap((count, hour) => (count > 0 ? [hour] : []));
    const from = Math.max(0, Math.min(best - 3, used[0]));
    const to = Math.min(23, Math.max(best + 3, used.at(-1) ?? best));
    const hours = Array.from({ length: Math.min(12, to - from + 1) }, (_, index) => from + index);
    return (
        <Frame title="Melhor horário" accent size={size} meta={`${data.counts[best]} recordes`}>
            <Stat
                value={best}
                unit="h"
                title={`Entre ${best}h e ${best + 1}h`}
                note={`${data.counts[best]} recordes nesse horário`}
            />
            {size === "medium" ? (
                <div className="mt-inner">
                    <DotColumns
                        values={toDotRows(
                            hours.map((hour) => data.counts[hour]),
                            5,
                        )}
                        rows={5}
                        highlight={hours.indexOf(best)}
                        labels={hours.map((hour) => String(hour))}
                        label="Recordes por hora de início"
                    />
                </div>
            ) : null}
        </Frame>
    );
};

const RENDERERS: Record<WidgetPlacement["kind"], Render> = {
    weekly_goal: weekly,
    streak,
    personal_record: record,
    body_weight: bodyWeight,
    measurements,
    weekly_volume: weeklyVolume,
    last_workout: lastWorkout,
    stagnant,
    month_time: monthTime,
    month_volume: monthVolume,
    next_increase: nextIncrease,
    goal,
    sleep,
    water,
    steps,
    energy,
    custom,
    month_compare: monthCompare,
    best_hour: bestHour,
};

/** One widget in one size. Sizes it does not allow render nothing. */
export function renderWidget(
    data: HomeData,
    placement: Pick<WidgetPlacement, "kind" | "size" | "ref">,
): ReactNode {
    if (!WIDGET_CATALOG[placement.kind].sizes.includes(placement.size)) {
        return null;
    }
    return RENDERERS[placement.kind](data, placement.size, placement.ref);
}
