import type { Metadata } from "next";
import Link from "next/link";

import { getOpenSession } from "@/modules/logging";
import { getSummary, type Summary } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { formatNumber } from "@/shared/format/numbers";
import { formatLongDate, monthName } from "@/shared/time/local-date";
import { ArrowUpIcon } from "@/shared/ui/icons";
import { Sparkline } from "@/shared/ui/sparkline";
import { WeekRing } from "@/shared/ui/week-ring";

import { startWorkoutAction } from "../_components/actions";
import { AppDock } from "../_components/app-dock";
import { PrimaryActionContent, primaryActionClass } from "../_components/primary-action";

export const metadata: Metadata = { title: "Resumo · VITA" };

export default async function SummaryPage() {
    const context = await requireAppContext();
    const openSession = await getOpenSession(context);
    const summary = await getSummary(context, openSession !== null);

    return (
        <>
            <main className="mx-auto w-full max-w-5xl px-5 pb-48 pt-[max(env(safe-area-inset-top),56px)] md:px-8">
                <header className="flex flex-col gap-1 px-1">
                    <h1 className="text-[34px] font-bold leading-tight">Resumo</h1>
                    <p className="text-[15px] text-ink-secondary">
                        {formatLongDate(summary.today)}
                    </p>
                </header>

                <section
                    aria-label="Widgets"
                    className="mt-6 grid grid-cols-2 gap-3.5 md:grid-cols-4"
                >
                    <WeekWidget week={summary.week} />
                    <WeightWidget weight={summary.weight} />
                    <RecordWidget record={summary.record} />
                    <NextWorkoutWidget next={summary.nextWorkout} />
                    <CalendarWidget calendar={summary.calendar} />
                    <WaistWidget waistCm={summary.waistCm} />
                </section>
            </main>

            <AppDock
                active="resumo"
                action={
                    openSession ? (
                        <Link href="/treino" className={primaryActionClass}>
                            <PrimaryActionContent
                                title={`Continuar treino ${openSession.workoutLabel ?? ""}`}
                                subtitle="Treino em andamento"
                            />
                        </Link>
                    ) : summary.nextWorkout ? (
                        <form action={startWorkoutAction}>
                            <button type="submit" className={primaryActionClass}>
                                <PrimaryActionContent
                                    title={`Começar treino ${summary.nextWorkout.label}`}
                                    subtitle={`${summary.nextWorkout.exerciseCount} exercícios`}
                                />
                            </button>
                        </form>
                    ) : null
                }
            />
        </>
    );
}

function Widget({
    title,
    wide = false,
    stagger,
    children,
}: {
    title: string;
    wide?: boolean;
    stagger: number;
    children: React.ReactNode;
}) {
    return (
        <article
            style={{ "--stagger": stagger } as React.CSSProperties}
            className={`glass rise-in flex h-40 flex-col rounded-widget p-4 ${wide ? "col-span-2" : ""}`}
        >
            <h2 className="text-[13px] font-semibold text-ink-secondary">{title}</h2>
            {children}
        </article>
    );
}

function WeekWidget({ week }: { week: Summary["week"] }) {
    const missing = Math.max(week.goal - week.done, 0);
    return (
        <article
            style={{ "--stagger": 0 } as React.CSSProperties}
            className="glass rise-in col-span-2 flex h-40 items-center gap-5 rounded-widget px-5"
        >
            <WeekRing done={week.done} goal={week.goal} />
            <div className="flex flex-col gap-1">
                <h2 className="text-[13px] font-semibold text-ink-secondary">Semana</h2>
                <p className="numeric text-[40px] font-extrabold leading-none">
                    {week.done} de {week.goal}
                </p>
                <p className="text-[15px] text-ink-secondary">
                    {missing === 0
                        ? "Meta da semana batida"
                        : `Falta${missing > 1 ? "m" : ""} ${missing} treino${missing > 1 ? "s" : ""}`}
                </p>
            </div>
        </article>
    );
}

function WeightWidget({ weight }: { weight: Summary["weight"] }) {
    return (
        <Widget title="Peso" stagger={1}>
            {weight ? (
                <div className="mt-auto flex flex-col gap-2">
                    <p className="numeric text-[34px] font-extrabold leading-none">
                        {formatNumber(weight.latestKg, 1, 1)}
                        <span className="font-sans text-[15px] font-semibold text-ink-secondary">
                            {" "}
                            kg
                        </span>
                    </p>
                    <Sparkline values={weight.trend} label="Peso nas últimas semanas" />
                </div>
            ) : (
                <p className="mt-auto text-[15px] text-ink-secondary">Registre seu peso em Corpo</p>
            )}
        </Widget>
    );
}

function RecordWidget({ record }: { record: Summary["record"] }) {
    return (
        <Widget title="Recorde da semana" stagger={2}>
            {record ? (
                <div className="mt-auto flex flex-col gap-1">
                    <p className="numeric text-[34px] font-extrabold leading-none">
                        {formatNumber(record.loadKg)}
                        <span className="font-sans text-[15px] font-semibold text-ink-secondary">
                            {" "}
                            kg
                        </span>
                    </p>
                    <p className="line-clamp-2 text-[15px] leading-snug">{record.exerciseName}</p>
                </div>
            ) : (
                <p className="mt-auto text-[15px] text-ink-secondary">
                    Nenhum recorde ainda nesta semana
                </p>
            )}
        </Widget>
    );
}

function NextWorkoutWidget({ next }: { next: Summary["nextWorkout"] }) {
    return (
        <Widget title="Próximo treino" wide stagger={3}>
            {next ? (
                <div className="mt-auto flex flex-col gap-3">
                    <p className="numeric text-[34px] font-extrabold leading-none">
                        Treino {next.label}
                    </p>
                    <p className="flex items-center gap-2 text-[15px]">
                        {next.increasing.length > 0 ? (
                            <>
                                <ArrowUpIcon size={16} className="shrink-0 text-red" />
                                <span className="line-clamp-1">
                                    {next.increasing.length === 1
                                        ? `${next.increasing[0]} sobe de carga`
                                        : `${next.increasing.length} exercícios sobem de carga`}
                                </span>
                            </>
                        ) : (
                            <span className="text-ink-secondary">
                                {next.exerciseCount} exercícios
                            </span>
                        )}
                    </p>
                </div>
            ) : (
                <p className="mt-auto text-[15px] text-ink-secondary">Monte sua ficha em Treinos</p>
            )}
        </Widget>
    );
}

function CalendarWidget({ calendar }: { calendar: Summary["calendar"] }) {
    const colors: Record<string, string> = {
        trained: "bg-ink",
        today: "bg-red",
        missed: "bg-track",
        future: "bg-track opacity-40",
    };
    return (
        <Widget title={monthName(calendar.monthStart)} stagger={4}>
            <div
                className="mt-3 grid grid-cols-7 gap-1.5"
                role="img"
                aria-label="Dias treinados no mês"
            >
                {Array.from({ length: calendar.leadingBlanks }, (_, index) => (
                    <span key={`blank-${index}`} />
                ))}
                {calendar.days.map((day) => (
                    <span key={day.date} className={`h-3 rounded-full ${colors[day.state]}`} />
                ))}
            </div>
        </Widget>
    );
}

function WaistWidget({ waistCm }: { waistCm: number | null }) {
    return (
        <Widget title="Cintura" stagger={5}>
            {waistCm !== null ? (
                <p className="numeric mt-auto text-[34px] font-extrabold leading-none">
                    {formatNumber(waistCm, 1, 1)}
                    <span className="font-sans text-[15px] font-semibold text-ink-secondary">
                        {" "}
                        cm
                    </span>
                </p>
            ) : (
                <p className="mt-auto text-[15px] text-ink-secondary">Sem medida ainda</p>
            )}
        </Widget>
    );
}
