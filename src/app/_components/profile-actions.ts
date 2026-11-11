"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
    AVATAR_MAX_BYTES,
    getProfile,
    profileSchema,
    removeAvatar,
    saveAvatar,
    saveProfile,
} from "@/modules/identity";
import { recordBodyWeight } from "@/modules/progress";
import { requireAppContext, requireOnboardingContext } from "@/modules/tenancy";
import {
    applyProgramChoice,
    programChoiceSchema,
    setProgramRest,
    setWeeklyGoal,
} from "@/modules/training";
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

/** Saves the profile edited in Perfil; a new weight also becomes today's weigh-in. */
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

const weightSchema = profileSchema.shape.weightKg;

/** "Registrar peso" in Perfil: today's weigh-in, which also becomes the profile's weight. */
export async function recordWeightAction(input: unknown): Promise<ActionResult> {
    const context = await requireAppContext();
    const parsed = weightSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Confira o peso e tente de novo." };
    }
    const profile = await getProfile(context);
    if (!profile) {
        return { error: "Termine o cadastro antes de registrar o peso." };
    }
    await saveProfile(context, { ...profile, weightKg: parsed.data }, async (db, tenant) => {
        await recordBodyWeight(db, tenant, parsed.data, toLocalDate(new Date(), context.timezone));
    });
    revalidatePath("/", "layout");
    return undefined;
}

/** The rest wheel in Perfil: 30 s to 5 min, in 15 s steps. */
const restSchema = z.number().int().min(30).max(300).multipleOf(15);

/** "Descanso" in Perfil: the same rest for every exercise of the active plan. */
export async function setRestAction(input: unknown): Promise<ActionResult> {
    const context = await requireAppContext();
    const parsed = restSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Confira o descanso e tente de novo." };
    }
    await setProgramRest(context, parsed.data);
    revalidatePath("/", "layout");
    return undefined;
}

/*
 * The profile photo. The browser has already cropped, shrunk and re-encoded
 * it; here only the size and the real bytes count (identity/domain/avatar.ts).
 * Server actions take at most 1 MB, so nothing bigger is even read.
 */
export async function uploadAvatarAction(form: FormData): Promise<ActionResult> {
    const context = await requireAppContext();
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0 || file.size > AVATAR_MAX_BYTES) {
        return { error: "Escolha uma imagem de até 300 KB." };
    }
    const saved = await saveAvatar(context, new Uint8Array(await file.arrayBuffer()));
    if (!saved) {
        return { error: "Esse arquivo não é uma imagem que dê para usar." };
    }
    revalidatePath("/perfil");
    return undefined;
}

export async function removeAvatarAction(): Promise<ActionResult> {
    const context = await requireAppContext();
    await removeAvatar(context);
    revalidatePath("/perfil");
    return undefined;
}
