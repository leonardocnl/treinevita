import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getLastFinishedSession, getOpenSession } from "@/modules/logging";
import {
    WIDGET_CATALOG,
    getDashboardExtras,
    getDashboardLayout,
    getSummary,
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
import { WIDGET_RENDERERS } from "./_widgets/widgets";
import { Welcome } from "./welcome";

export const metadata: Metadata = { title: "Resumo · VITA" };

export default async function SummaryPage() {
    const context = await requireAppContext();
    const [openSession, lastSession] = await Promise.all([
        getOpenSession(context),
        getLastFinishedSession(context),
    ]);
    if (!lastSession) {
        return <Welcome context={context} hasOpenSession={openSession !== null} />;
    }
    const [summary, extras, layout] = await Promise.all([
        getSummary(context, openSession !== null),
        getDashboardExtras(context),
        getDashboardLayout(context),
    ]);

    // Every widget is rendered on the server in each size it supports, so editing
    // (resizing, adding) is instant on the client.
    const renders: Record<string, Partial<Record<WidgetSize, ReactNode>>> = {};
    for (const kind of Object.keys(WIDGET_CATALOG) as WidgetKind[]) {
        renders[kind] = {};
        for (const size of WIDGET_CATALOG[kind].sizes) {
            renders[kind][size] = WIDGET_RENDERERS[kind]({ summary, extras }, size);
        }
    }

    const hero = openSession ? (
        <PrimaryAction
            href="/treino"
            glyph="arrow"
            label="Continuar"
            meta={`Treino ${openSession.workoutLabel ?? ""}`}
        />
    ) : summary.nextWorkout ? (
        <form action={startWorkoutAction}>
            <PrimaryAction
                type="submit"
                glyph="arrow"
                label="Começar"
                meta={`Treino ${summary.nextWorkout.label} · ${summary.nextWorkout.exerciseCount} exercícios`}
            />
        </form>
    ) : null;

    return (
        <>
            <main className={`pt-top mx-auto w-full max-w-md px-margin ${NAV_CLEARANCE}`}>
                <Dashboard
                    header={<Wordmark />}
                    themeToggle={<ThemeToggle />}
                    initialLayout={layout}
                    catalog={WIDGET_CATALOG}
                    renders={renders}
                    hero={hero}
                />
            </main>
            <AppNav active="resumo" />
        </>
    );
}
