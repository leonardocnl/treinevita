import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getWorkoutSummary } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { formatNumber } from "@/shared/format/numbers";
import { BottomBar } from "@/shared/ui/bottom-bar";
import { Dot } from "@/shared/ui/dot";
import { DotNumber } from "@/shared/ui/dot-number";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { SectionLabel } from "@/shared/ui/section-label";

export const metadata: Metadata = { title: "Treino concluído · VITA" };

function signed(value: number, unit: string): string {
    if (value === 0) {
        return `igual`;
    }
    return `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))} ${unit}`;
}

/** The summary of the workout just finished: hero numbers, the comparison with last time and its records. */
export default async function WorkoutDonePage() {
    const context = await requireAppContext();
    const summary = await getWorkoutSummary(context);
    if (!summary) {
        redirect("/");
    }
    const { totals, previous, records } = summary;
    const tonnes = totals.volumeKg >= 1000;
    const rows = previous
        ? [
              {
                  name: "Duração",
                  value: `${totals.minutes} min`,
                  detail: signed(totals.minutes - previous.minutes, "min"),
              },
              {
                  name: "Séries",
                  value: String(totals.sets),
                  detail: signed(totals.sets - previous.sets, ""),
              },
              {
                  name: "Carga total",
                  value: `${formatNumber(totals.volumeKg)} kg`,
                  detail: signed(totals.volumeKg - previous.volumeKg, "kg"),
              },
          ]
        : [];

    return (
        <>
            <main className="pt-top mx-auto w-full max-w-md px-margin pb-[calc(max(34px,env(safe-area-inset-bottom))+112px)]">
                <p className="label mt-section">Treino concluído</p>
                <h1 className="headline mt-inner text-58">{summary.name}</h1>

                <div className="mt-block grid grid-cols-2 gap-x-gutter gap-y-block">
                    <DotNumber as="p" size={56} unit="min">
                        {totals.minutes}
                    </DotNumber>
                    <DotNumber as="p" size={56} unit="séries">
                        {totals.sets}
                    </DotNumber>
                    <div className="col-span-2">
                        <DotNumber as="p" size={56} unit={tonnes ? "t" : "kg"}>
                            {tonnes
                                ? formatNumber(totals.volumeKg / 1000, 1)
                                : formatNumber(totals.volumeKg)}
                        </DotNumber>
                        <p className="strong mt-inner text-12 uppercase">Carga total</p>
                    </div>
                </div>

                {rows.length > 0 ? (
                    <section className="mt-section">
                        <SectionLabel>Contra a última vez</SectionLabel>
                        <ul className="mt-label flex flex-col gap-inner">
                            {rows.map((row) => (
                                <li
                                    key={row.name}
                                    className="flex items-baseline justify-between gap-gutter text-15"
                                >
                                    <span>{row.name}</span>
                                    <span className="flex items-baseline gap-inner">
                                        <span className="text-13 text-secondary tabular-nums">
                                            {row.detail}
                                        </span>
                                        <span className="strong tabular-nums">{row.value}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {records.length > 0 ? (
                    <section className="mt-section">
                        <SectionLabel accent meta={String(records.length)}>
                            Recordes
                        </SectionLabel>
                        <ul className="mt-label flex flex-col gap-inner">
                            {records.map((record) => (
                                <li
                                    key={record.name}
                                    className="flex items-center justify-between gap-gutter text-15"
                                >
                                    <span className="flex min-w-0 items-center gap-inner">
                                        <Dot size={6} tone="accent" />
                                        <span className="truncate">{record.name}</span>
                                    </span>
                                    <span className="strong tabular-nums">
                                        {formatNumber(record.loadKg)} kg × {record.reps}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </main>
            <BottomBar>
                <PrimaryAction href="/" glyph="check" label="Concluir" meta={summary.name} />
            </BottomBar>
        </>
    );
}
