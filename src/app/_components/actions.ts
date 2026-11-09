"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { devSignIn, destroySession } from "@/modules/identity";
import { discardOpenSession, finishSession, logSet, undoLastSet } from "@/modules/logging";
import { saveDashboardLayout, startNextWorkout, type WidgetPlacement } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { timed } from "@/platform/db/timing";

/*
 * Server actions are public endpoints: every one of them resolves the session
 * itself (requireAppContext), validates its input and only touches data that
 * belongs to the person's own open session.
 */

export async function devSignInAction(): Promise<void> {
    const result = await devSignIn();
    if (!result.ok) {
        redirect(`/entrar?erro=${result.reason === "missing_seed" ? "banco" : "indisponivel"}`);
    }
    redirect("/");
}

export async function signOutAction(): Promise<void> {
    await destroySession();
    redirect("/entrar");
}

export async function startWorkoutAction(): Promise<void> {
    const context = await requireAppContext();
    const sessionId = await startNextWorkout(context);
    if (!sessionId) {
        redirect("/");
    }
    redirect("/treino");
}

const setSchema = z.object({
    performedExerciseId: z.uuid(),
    loadKg: z.number().min(0).max(1000).nullable(),
    reps: z.number().int().min(0).max(100).nullable(),
    durationSeconds: z.number().int().min(0).max(3600).nullable(),
});

/*
 * Logging and undoing a set are optimistic: the workout screens already show the
 * change and only need to know whether it was saved. Nothing is revalidated, so
 * no page renders again; the Summary is revalidated when the workout ends.
 */

export async function logSetAction(input: unknown): Promise<boolean> {
    return timed("logSetAction", async () => {
        const context = await requireAppContext();
        const parsed = setSchema.safeParse(input);
        if (!parsed.success) {
            return false;
        }
        const { performedExerciseId, ...set } = parsed.data;
        return logSet(context, performedExerciseId, set);
    });
}

const exerciseSchema = z.object({ performedExerciseId: z.uuid() });

export async function undoSetAction(input: unknown): Promise<boolean> {
    return timed("undoSetAction", async () => {
        const context = await requireAppContext();
        const parsed = exerciseSchema.safeParse(input);
        if (!parsed.success) {
            return false;
        }
        return undoLastSet(context, parsed.data.performedExerciseId);
    });
}

export async function finishWorkoutAction(): Promise<void> {
    const context = await requireAppContext();
    await finishSession(context);
    revalidatePath("/", "layout");
    redirect("/");
}

export async function discardWorkoutAction(): Promise<void> {
    const context = await requireAppContext();
    await discardOpenSession(context);
    revalidatePath("/", "layout");
    redirect("/");
}

const layoutSchema = z
    .array(z.object({ kind: z.string().max(40), size: z.string().max(10) }))
    .max(30);

/** Saves the Summary widget layout; the module validates kinds and sizes against the catalog. */
export async function saveLayoutAction(layout: unknown): Promise<WidgetPlacement[]> {
    const context = await requireAppContext();
    const parsed = layoutSchema.safeParse(layout);
    if (!parsed.success) {
        return [];
    }
    const saved = await saveDashboardLayout(context, parsed.data);
    revalidatePath("/");
    return saved;
}
