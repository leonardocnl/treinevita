"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { devSignIn, destroySession } from "@/modules/identity";
import { discardOpenSession, finishSession, logSet, undoLastSet } from "@/modules/logging";
import { startNextWorkout } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";

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
    position: z.coerce.number().int().min(0).max(30),
    loadKg: z.coerce.number().min(0).max(1000).optional(),
    reps: z.coerce.number().int().min(0).max(100).optional(),
    durationSeconds: z.coerce.number().int().min(0).max(3600).optional(),
});

export async function logSetAction(formData: FormData): Promise<void> {
    const context = await requireAppContext();
    const parsed = setSchema.safeParse({
        performedExerciseId: formData.get("performedExerciseId"),
        position: formData.get("position"),
        loadKg: formData.get("loadKg") ?? undefined,
        reps: formData.get("reps") ?? undefined,
        durationSeconds: formData.get("durationSeconds") ?? undefined,
    });
    if (!parsed.success) {
        return;
    }
    const { performedExerciseId, loadKg, reps, durationSeconds } = parsed.data;
    await logSet(context, performedExerciseId, {
        loadKg: loadKg ?? null,
        reps: reps ?? null,
        durationSeconds: durationSeconds ?? null,
    });
    revalidatePath("/treino", "layout");
}

const exerciseSchema = z.object({ performedExerciseId: z.uuid() });

export async function undoSetAction(formData: FormData): Promise<void> {
    const context = await requireAppContext();
    const parsed = exerciseSchema.safeParse({
        performedExerciseId: formData.get("performedExerciseId"),
    });
    if (!parsed.success) {
        return;
    }
    await undoLastSet(context, parsed.data.performedExerciseId);
    revalidatePath("/treino", "layout");
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
