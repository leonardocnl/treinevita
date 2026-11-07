import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getOpenSession } from "@/modules/logging";
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
import { PlayIcon } from "@/shared/ui/icons";

import { startWorkoutAction } from "../_components/actions";
import { AppDock } from "../_components/app-dock";
import { roundActionClass } from "../_components/primary-action";

import { Dashboard } from "./_widgets/dashboard";
import { WIDGET_RENDERERS } from "./_widgets/widgets";

export const metadata: Metadata = { title: "Resumo · VITA" };

export default async function SummaryPage() {
    const context = await requireAppContext();
    const openSession = await getOpenSession(context);
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
        <Link
            href="/treino"
            aria-label={`Continuar treino ${openSession.workoutLabel ?? ""}`}
            className={roundActionClass}
        >
            <PlayIcon size={18} />
        </Link>
    ) : summary.nextWorkout ? (
        <form action={startWorkoutAction}>
            <button
                type="submit"
                aria-label={`Começar treino ${summary.nextWorkout.label}`}
                className={roundActionClass}
            >
                <PlayIcon size={18} />
            </button>
        </form>
    ) : null;

    return (
        <>
            <main className="mx-auto w-full max-w-5xl px-5 pb-32 pt-[max(env(safe-area-inset-top),52px)] md:px-10 md:pt-16">
                <Dashboard
                    header={
                        <div>
                            <p className="num text-[20px]" aria-label="VITA">
                                vita
                            </p>
                            <p className="mt-3 text-[15px] font-normal">
                                {formatLongDate(summary.today)}
                            </p>
                        </div>
                    }
                    initialLayout={layout}
                    catalog={WIDGET_CATALOG}
                    renders={renders}
                />
            </main>
            <AppDock active="resumo" action={action} />
        </>
    );
}
