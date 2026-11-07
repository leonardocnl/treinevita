import type { Metadata } from "next";
import Link from "next/link";

import { getOpenSession } from "@/modules/logging";
import { getSummary, type Summary } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { formatNumber } from "@/shared/format/numbers";
import { formatLongDate, monthName } from "@/shared/time/local-date";
import { DotRing } from "@/shared/ui/dot-ring";
import { PlayIcon } from "@/shared/ui/icons";

import { startWorkoutAction } from "../_components/actions";
import { AppDock } from "../_components/app-dock";
import { roundActionClass } from "../_components/primary-action";

export const metadata: Metadata = { title: "Resumo · VITA" };

export default async function SummaryPage() {
    const context = await requireAppContext();
    const openSession = await getOpenSession(context);
    const summary = await getSummary(context, openSession !== null);

    const action = openSession ? (
        <Link
            href="/treino"
            aria-label={`Continuar treino ${openSession.workoutLabel ?? ""}`}
            className={roundActionClass}
        >
            <PlayIcon size={20} />
        </Link>
    ) : summary.nextWorkout ? (
        <form action={startWorkoutAction}>
            <button
                type="submit"
                aria-label={`Começar treino ${summary.nextWorkout.label}`}
                className={roundActionClass}
            >
                <PlayIcon size={20} />
            </button>
        </form>
    ) : null;

    return (
        <>
            <main className="mx-auto w-full max-w-5xl px-6 pb-36 pt-[max(env(safe-area-inset-top),52px)] md:px-10 md:pt-16">
                <header className="flex items-baseline justify-between">
                    <p className="text-[15px] font-normal">{formatLongDate(summary.today)}</p>
                    <p className="num text-[20px]" aria-label="VITA">
                        vita
                    </p>
                </header>

                <div className="md:mt-6 md:grid md:grid-cols-[1.1fr_1fr] md:gap-14">
                    <div>
                        <WeekHero week={summary.week} />
                        <Metrics
                            weight={summary.weight}
                            record={summary.record}
                            waistCm={summary.waistCm}
                        />
                    </div>
                    <div className="md:pt-10">
                        <NextWorkout
                            next={summary.nextWorkout}
                            hasOpenSession={summary.hasOpenSession}
                        />
                        <Calendar calendar={summary.calendar} />
                    </div>
                </div>
            </main>

            <AppDock active="resumo" action={action} />
        </>
    );
}

function WeekHero({ week }: { week: Summary["week"] }) {
    const missing = Math.max(week.goal - week.done, 0);
    const caption =
        missing === 0
            ? "Meta da semana batida."
            : `Falta${missing > 1 ? "m" : ""} ${missing} treino${missing > 1 ? "s" : ""} esta semana.`;

    return (
        <section aria-label="Semana" className="rise-in mt-7">
            <p className="text-[15px] text-ink-secondary">Esta semana</p>
            <div className="mt-3 flex items-end justify-between gap-4">
                <p className="num text-[112px] leading-[0.8]">
                    {week.done}
                    <span className="text-dot-off">/{week.goal}</span>
                </p>
                <DotRing done={week.done} goal={week.goal} size={100} />
            </div>
            <p className="mt-4 text-[15px] text-ink-secondary">{caption}</p>
        </section>
    );
}

function Metrics({
    weight,
    record,
    waistCm,
}: {
    weight: Summary["weight"];
    record: Summary["record"];
    waistCm: number | null;
}) {
    const delta =
        weight?.monthDeltaKg !== null && weight?.monthDeltaKg !== undefined
            ? `${weight.monthDeltaKg >= 0 ? "+" : ""}${formatNumber(weight.monthDeltaKg, 1)} no mês`
            : "kg";

    return (
        <section
            aria-label="Números"
            className="rise-in mt-9 grid grid-cols-3"
            style={{ "--stagger": 2 } as React.CSSProperties}
        >
            <Metric
                label="Peso"
                value={weight ? formatNumber(weight.latestKg, 1, 1) : "—"}
                detail={weight ? delta : "Registre em Corpo"}
            />
            <Metric
                label="Recorde"
                value={record ? formatNumber(record.loadKg) : "—"}
                detail={record ? record.exerciseName : "Nenhum ainda"}
                marker={record !== null}
                divider
            />
            <Metric
                label="Cintura"
                value={waistCm !== null ? formatNumber(waistCm, 1, 1) : "—"}
                detail="cm"
                divider
            />
        </section>
    );
}

function Metric({
    label,
    value,
    detail,
    marker = false,
    divider = false,
    className = "",
}: {
    label: string;
    value: string;
    detail: string;
    marker?: boolean;
    divider?: boolean;
    className?: string;
}) {
    return (
        <div
            className={`flex min-w-0 flex-col gap-2 ${divider ? "border-l border-hairline pl-5" : "pr-5"} ${className}`}
        >
            <p className="flex items-center gap-2 text-[13px] text-ink-secondary">
                {label}
                {marker ? <span aria-hidden className="size-1.5 rounded-full bg-red" /> : null}
            </p>
            <p className="num text-[36px] leading-[0.9]">{value}</p>
            <p className="truncate text-[13px] text-ink-secondary">{detail}</p>
        </div>
    );
}

function NextWorkout({
    next,
    hasOpenSession,
}: {
    next: Summary["nextWorkout"];
    hasOpenSession: boolean;
}) {
    if (!next) {
        return (
            <section className="panel mt-9 rounded-[28px] p-6">
                <p className="text-[15px] text-on-panel-secondary">
                    Monte sua ficha em Treinos para começar.
                </p>
            </section>
        );
    }
    const increasingText =
        next.increasing.length === 0
            ? `${next.exerciseCount} exercícios`
            : next.increasing.length === 1
              ? `${next.increasing[0]} sobe de carga`
              : `${next.increasing.length} exercícios sobem de carga`;

    return (
        <section
            aria-label="Próximo treino"
            className="panel rise-in mt-9 flex items-end justify-between gap-6 rounded-[28px] px-6 py-6 md:mt-0"
            style={{ "--stagger": 4 } as React.CSSProperties}
        >
            <div className="flex min-w-0 flex-col gap-2">
                <p className="text-[13px] text-on-panel-secondary">
                    {hasOpenSession ? "Em andamento" : "Próximo"}
                </p>
                <p className="text-[30px] font-normal leading-none">Treino {next.label}</p>
                <p className="mt-1 truncate text-[13px] text-on-panel-secondary">
                    {increasingText}
                </p>
            </div>
            <ul aria-hidden className="grid shrink-0 grid-cols-4 gap-1.5">
                {next.exercises.map((exercise, index) => (
                    <li
                        key={index}
                        className={`size-2 rounded-full ${exercise.increases ? "bg-red" : "bg-on-panel"}`}
                    />
                ))}
            </ul>
        </section>
    );
}

function Calendar({ calendar }: { calendar: Summary["calendar"] }) {
    const trained = calendar.days.filter((day) => day.state === "trained").length;
    const colors: Record<string, string> = {
        trained: "bg-ink",
        today: "bg-red",
        missed: "bg-dot-off",
        future: "bg-hairline",
    };

    return (
        <section
            aria-label="Calendário do mês"
            className="rise-in mt-8"
            style={{ "--stagger": 6 } as React.CSSProperties}
        >
            <div className="flex items-baseline justify-between text-[15px]">
                <p className="font-normal">{monthName(calendar.monthStart)}</p>
                <p className="text-ink-secondary">
                    {trained} treino{trained === 1 ? "" : "s"}
                </p>
            </div>
            <div
                className="mt-3.5 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-[7px]"
                role="img"
                aria-label={`${trained} dias treinados no mês`}
            >
                {calendar.days.map((day) => (
                    <span
                        key={day.date}
                        className={`aspect-square rounded-full ${colors[day.state]}`}
                    />
                ))}
            </div>
        </section>
    );
}
