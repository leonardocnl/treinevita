import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
    WIDGET_CATALOG,
    getDashboardLayout,
    getHome,
    placementKey,
    type WidgetKind,
    type WidgetSize,
} from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { Wordmark } from "@/shared/ui/wordmark";

import { startWorkoutAction } from "../_components/actions";
import { AppNav, NAV_CLEARANCE } from "../_components/app-nav";
import { ThemeToggle } from "../_components/theme-toggle";

import { Dashboard } from "./_widgets/dashboard";
import { renderWidget } from "./_widgets/widgets";

export const metadata: Metadata = { title: "Resumo · VITA" };

export default async function HomePage() {
    const context = await requireAppContext();
    const [data, layout] = await Promise.all([getHome(context), getDashboardLayout(context)]);

    // Every widget is rendered on the server in each size it allows (custom ones per
    // tracker), so editing (resizing, adding) is instant on the client.
    const renders: Record<string, Partial<Record<WidgetSize, ReactNode>>> = {};
    const placements = [
        ...(Object.keys(WIDGET_CATALOG) as WidgetKind[])
            .filter((kind) => kind !== "custom")
            .map((kind) => ({ kind, ref: null })),
        ...data.habits.custom.map((tracker) => ({ kind: "custom" as const, ref: tracker.id })),
    ];
    for (const placement of placements) {
        const key = placementKey(placement);
        renders[key] = {};
        for (const size of WIDGET_CATALOG[placement.kind].sizes) {
            renders[key][size] = renderWidget(data, { ...placement, size });
        }
    }

    const { hero } = data;
    const meta = `${hero.exerciseCount} exercícios · ~${hero.minutes} min`;
    const heroBlock = (
        <section aria-labelledby="hero-title">
            <p className="label">{hero.label}</p>
            <h1 id="hero-title" className="headline mt-inner text-58">
                {hero.name ?? "Monte sua ficha"}
            </h1>
            <p className="mt-inner text-15 text-secondary">
                {hero.name
                    ? [hero.focus, `${hero.exerciseCount} exercícios`].filter(Boolean).join(" · ")
                    : "Escolha um modelo e comece a registrar."}
            </p>
            <div className="mt-block">
                {hero.open ? (
                    <PrimaryAction href="/treino" glyph="arrow" label="Continuar" meta={meta} />
                ) : hero.name ? (
                    <form action={startWorkoutAction}>
                        <PrimaryAction type="submit" glyph="arrow" label="Começar" meta={meta} />
                    </form>
                ) : (
                    <PrimaryAction href="/comecar" glyph="arrow" label="Montar ficha" />
                )}
            </div>
        </section>
    );

    return (
        <>
            <main className={`pt-top mx-auto w-full max-w-md px-margin ${NAV_CLEARANCE}`}>
                <Dashboard
                    wordmark={<Wordmark />}
                    themeToggle={<ThemeToggle />}
                    hero={heroBlock}
                    data={data}
                    initialLayout={layout}
                    renders={renders}
                />
            </main>
            <AppNav active="resumo" />
        </>
    );
}
