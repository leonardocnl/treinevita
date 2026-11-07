import type { Metadata } from "next";
import Link from "next/link";

import { getOpenSession } from "@/modules/logging";
import { getSummary, type Summary } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { formatNumber } from "@/shared/format/numbers";
import { formatLongDate } from "@/shared/time/local-date";
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
                        <Activity activity={summary.activity} />
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
            <section aria-label="Próximo treino" className="mt-10 border-t border-hairline pt-6">
                <p className="text-[15px] text-ink-secondary">
                    Monte sua ficha em Treinos para começar.
                </p>
            </section>
        );
    }
    const names = next.exercises.map((exercise) => exercise.name);
    const preview =
        names.length > 2
            ? `${names.slice(0, 2).join(", ")} e mais ${names.length - 2}`
            : names.join(", ");

    return (
        <section
            aria-label="Próximo treino"
            className="rise-in mt-10 border-t border-hairline pt-6 md:mt-0"
            style={{ "--stagger": 4 } as React.CSSProperties}
        >
            <div className="flex items-baseline justify-between">
                <p className="text-[13px] text-ink-secondary">
                    {hasOpenSession ? "Em andamento" : "Próximo"}
                </p>
                <p className="text-[13px] text-ink-secondary">
                    <span className="num text-[15px] text-ink">{next.exerciseCount}</span>{" "}
                    exercícios
                </p>
            </div>
            <p className="mt-2 text-[40px] font-light leading-none">Treino {next.label}</p>
            <p className="mt-3 text-[15px] leading-snug text-ink-secondary">{preview}</p>
            {next.increasing.length > 0 ? (
                <p className="mt-3 flex items-center gap-2 text-[15px]">
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-red" />
                    {next.increasing.length === 1
                        ? `${next.increasing[0]} sobe de carga`
                        : `${next.increasing.length} exercícios sobem de carga`}
                </p>
            ) : null}
        </section>
    );
}

function Activity({ activity }: { activity: Summary["activity"] }) {
    const levelClass: Record<number, string> = {
        [-1]: "bg-transparent",
        0: "bg-dot-off",
        1: "bg-level-1",
        2: "bg-level-2",
        3: "bg-level-3",
    };
    const weekCount = activity.weeks.length;
    // Drop a month label that would collide with the next one (less than 3 weeks apart).
    const monthLabels = activity.monthLabels.filter(
        (month, index, all) =>
            index === all.length - 1 || all[index + 1].weekIndex - month.weekIndex >= 3,
    );

    return (
        <section
            aria-label="Atividade das últimas semanas"
            className="rise-in mt-10 border-t border-hairline pt-6"
            style={{ "--stagger": 6 } as React.CSSProperties}
        >
            <div className="flex items-baseline justify-between">
                <p className="text-[13px] text-ink-secondary">Atividade</p>
                <p className="text-[13px] text-ink-secondary">
                    <span className="num text-[15px] text-ink">{activity.trainedDays}</span> treinos
                    em {weekCount} semanas
                </p>
            </div>

            <div className="mt-4">
                <div
                    aria-hidden
                    className="grid text-[11px] text-ink-secondary"
                    style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
                >
                    {monthLabels.map((month) => (
                        <span
                            key={month.weekIndex}
                            style={{ gridColumnStart: month.weekIndex + 1 }}
                            className="whitespace-nowrap"
                        >
                            {month.label}
                        </span>
                    ))}
                </div>
                <div
                    role="img"
                    aria-label={`${activity.trainedDays} dias treinados nas últimas ${weekCount} semanas`}
                    className="mt-2 grid grid-flow-col grid-rows-7 gap-[3px]"
                    style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
                >
                    {activity.weeks.flatMap((week) =>
                        week.map((day) => (
                            <span
                                key={day.date}
                                className={`aspect-square rounded-full ${
                                    day.isToday && day.level <= 0
                                        ? "bg-transparent ring-[1.5px] ring-red ring-inset"
                                        : day.isToday
                                          ? "bg-red"
                                          : levelClass[day.level]
                                }`}
                            />
                        )),
                    )}
                </div>
                <div
                    aria-hidden
                    className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-ink-secondary"
                >
                    <span>menos</span>
                    {[0, 1, 2, 3].map((level) => (
                        <span
                            key={level}
                            className={`size-2.5 rounded-full ${levelClass[level]}`}
                        />
                    ))}
                    <span>mais</span>
                </div>
            </div>
        </section>
    );
}
