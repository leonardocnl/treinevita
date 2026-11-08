"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getProfile, profileSchema, saveProfile } from "@/modules/identity";
import { recordBodyWeight } from "@/modules/progress";
import { requireAppContext, requireOnboardingContext } from "@/modules/tenancy";
import { applyProgramChoice, programChoiceSchema, setWeeklyGoal } from "@/modules/training";
import { THEMES, THEME_COOKIE } from "@/shared/theme/theme";
import { toLocalDate } from "@/shared/time/local-date";

/*
 * Server actions are public endpoints: each one resolves the session itself,
 * validates its whole input with zod and writes only the signed-in person's
 * own rows (ADR 0011). Nothing here is logged: weight and height are health data.
 */

export type ActionResult = { error: string } | undefined;

const onboardingSchema = z.object({ profile: profileSchema, program: programChoiceSchema });

class InvalidProgramChoice extends Error {}

/** Saves every onboarding answer and the program in one transaction, then goes home. */
export async function completeOnboardingAction(input: unknown): Promise<ActionResult> {
    const context = await requireOnboardingContext();
    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Confira as respostas e tente de novo." };
    }
    const { weeklyGoal, ...profile } = parsed.data.profile;
    try {
        await saveProfile(context, profile, async (db, tenant) => {
            await setWeeklyGoal(db, tenant, weeklyGoal);
            await recordBodyWeight(
                db,
                tenant,
                profile.weightKg,
                toLocalDate(new Date(), context.timezone),
            );
            const applied = await applyProgramChoice(
                db,
                { ...tenant, timezone: context.timezone },
                parsed.data.program,
            );
            if (!applied) {
                // Rolls the whole transaction back.
                throw new InvalidProgramChoice();
            }
        });
    } catch (error) {
        if (error instanceof InvalidProgramChoice) {
            return { error: "Não deu para salvar essa ficha. Revise os exercícios." };
        }
        throw error;
    }
    revalidatePath("/", "layout");
    redirect("/");
}

/** Saves the profile edited in Ajustes; a new weight also becomes today's weigh-in. */
export async function updateProfileAction(input: unknown): Promise<ActionResult> {
    const context = await requireAppContext();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Confira o valor e tente de novo." };
    }
    const { weeklyGoal, ...profile } = parsed.data;
    const before = await getProfile(context);
    await saveProfile(context, profile, async (db, tenant) => {
        await setWeeklyGoal(db, tenant, weeklyGoal);
        if (before?.weightKg !== profile.weightKg) {
            await recordBodyWeight(
                db,
                tenant,
                profile.weightKg,
                toLocalDate(new Date(), context.timezone),
            );
        }
    });
    revalidatePath("/", "layout");
    return undefined;
}

const themeSchema = z.enum(THEMES);

/** Stores the appearance in a cookie, read by the root layout on every render. */
export async function setThemeAction(input: unknown): Promise<void> {
    await requireAppContext();
    const parsed = themeSchema.safeParse(input);
    if (!parsed.success) {
        return;
    }
    (await cookies()).set(THEME_COOKIE, parsed.data, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/", "layout");
}
