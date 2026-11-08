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
import { formatLongDate } from "@/shared/time/local-date";
import { Icon } from "@/shared/ui/icons";
import { RoundAction } from "@/shared/ui/round-action";
import { Label } from "@/shared/ui/text";
import { Wordmark } from "@/shared/ui/wordmark";

import { startWorkoutAction } from "../_components/actions";
import { AppDock } from "../_components/app-dock";
import { SettingsButton } from "../_components/settings-button";

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

    const action = openSession ? (
        <RoundAction
            href="/treino"
            aria-label={`Continuar treino ${openSession.workoutLabel ?? ""}`}
        >
            <Icon name="play" />
        </RoundAction>
    ) : summary.nextWorkout ? (
        <form action={startWorkoutAction}>
            <RoundAction type="submit" aria-label={`Começar treino ${summary.nextWorkout.label}`}>
                <Icon name="play" />
            </RoundAction>
        </form>
    ) : null;

    return (
        <>
            <main className="mx-auto w-full max-w-5xl px-5 pb-32 pt-[max(env(safe-area-inset-top),52px)] md:px-10 md:pt-16">
                <Dashboard
                    header={
                        <div>
                            <Wordmark label="VITA" />
                            <Label weight="normal" className="mt-3">
                                {formatLongDate(summary.today)}
                            </Label>
                        </div>
                    }
                    settings={<SettingsButton />}
                    initialLayout={layout}
                    catalog={WIDGET_CATALOG}
                    renders={renders}
                />
            </main>
            <AppDock active="resumo" action={action} />
        </>
    );
}
