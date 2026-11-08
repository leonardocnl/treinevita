import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/platform/db/client";
import type { TenantContext } from "@/shared/db/tenant";

import type { ProfileInput, SessionMinutes } from "../domain/profile";
import { userProfiles } from "../infrastructure/schema";

/** The stored profile; the weekly goal belongs to training and is not part of it. */
export type Profile = Omit<ProfileInput, "weeklyGoal">;

/** The signed-in person's own profile. Always keyed by the session's user, never by a client id. */
export async function getProfile(context: TenantContext): Promise<Profile | null> {
    const db = await getDb();
    const [row] = await db
        .select()
        .from(userProfiles)
        .where(and(eq(userProfiles.userId, context.userId), isNull(userProfiles.deletedAt)))
        .limit(1);
    if (!row) {
        return null;
    }
    return {
        displayName: row.displayName,
        goal: row.goal,
        experience: row.experience,
        weightKg: Number(row.weightKg),
        heightCm: row.heightCm,
        sessionMinutes: row.sessionMinutes as SessionMinutes | null,
        trainingPlace: row.trainingPlace,
    };
}

/**
 * Saves the profile and marks the onboarding as done (the first time), then
 * runs `alsoInTransaction` (weekly goal, program, first weigh-in) in the same
 * transaction: either everything is saved or nothing is.
 * `input` must already be validated with `profileSchema`.
 */
export async function saveProfile(
    context: TenantContext,
    input: Profile,
    alsoInTransaction: (db: Database, context: TenantContext) => Promise<void>,
): Promise<void> {
    const db = await getDb();
    const values = {
        displayName: input.displayName,
        goal: input.goal,
        experience: input.experience,
        weightKg: String(input.weightKg),
        heightCm: input.heightCm,
        sessionMinutes: input.sessionMinutes,
        trainingPlace: input.trainingPlace,
    };
    await db.transaction(async (tx) => {
        await tx
            .insert(userProfiles)
            .values({ ...values, userId: context.userId, onboardingCompletedAt: new Date() })
            .onConflictDoUpdate({
                target: userProfiles.userId,
                set: {
                    ...values,
                    onboardingCompletedAt: sql`coalesce(${userProfiles.onboardingCompletedAt}, now())`,
                    updatedAt: new Date(),
                },
            });
        await alsoInTransaction(tx, context);
    });
}
