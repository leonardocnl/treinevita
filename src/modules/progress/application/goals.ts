import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { getExercisesByIds } from "@/modules/catalog";
import { getLastSetsByExercise } from "@/modules/logging";
import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";

import { MAX_GOALS, goalSchema, type GoalInput, type GoalKind } from "../domain/goals";
import { goals } from "../infrastructure/schema";
import { getWeightTrend } from "./body";

export type Goal = {
    readonly id: string;
    readonly kind: GoalKind;
    readonly exerciseId: string | null;
    readonly targetValue: number;
    readonly startValue: number;
    readonly deadline: string;
};

function own(context: TenantContext) {
    return and(inTenant(goals, context), eq(goals.userId, context.userId));
}

export async function listGoals(context: TenantContext): Promise<Goal[]> {
    const db = await getDb();
    const rows = await db
        .select({
            id: goals.id,
            kind: goals.kind,
            exerciseId: goals.exerciseId,
            targetValue: goals.targetValue,
            startValue: goals.startValue,
            deadline: goals.deadline,
        })
        .from(goals)
        .where(own(context))
        .orderBy(asc(goals.deadline));
    return rows.map((row) => ({
        ...row,
        targetValue: Number(row.targetValue),
        startValue: Number(row.startValue),
    }));
}

/**
 * Creates a goal (at most 10). The exercise id from the client must be an
 * exercise this workspace can see. The start value comes from the server: the
 * latest weigh-in, or the heaviest set of the exercise's last session.
 * `today` keeps the deadline in the future.
 */
export async function createGoal(
    context: TenantContext,
    input: GoalInput,
    today: string,
): Promise<boolean> {
    const parsed = goalSchema.safeParse(input);
    if (!parsed.success || parsed.data.deadline <= today) {
        return false;
    }
    if (parsed.data.exerciseId) {
        const found = await getExercisesByIds(context, [parsed.data.exerciseId]);
        if (!found.has(parsed.data.exerciseId)) {
            return false;
        }
    }
    let startValue = 0;
    if (parsed.data.exerciseId) {
        const last = await getLastSetsByExercise(context, [parsed.data.exerciseId]);
        startValue = Math.max(
            0,
            ...(last.get(parsed.data.exerciseId)?.sets ?? []).map((set) => set.loadKg ?? 0),
        );
    } else {
        const weights = await getWeightTrend(context);
        startValue = weights?.trend.at(-1) ?? parsed.data.targetValue;
    }
    const db = await getDb();
    const existing = await db.select({ id: goals.id }).from(goals).where(own(context));
    if (existing.length >= MAX_GOALS) {
        return false;
    }
    await db.insert(goals).values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        kind: parsed.data.kind,
        exerciseId: parsed.data.exerciseId,
        targetValue: String(parsed.data.targetValue),
        startValue: String(startValue),
        deadline: parsed.data.deadline,
    });
    return true;
}

/** Soft-deletes one of the person's goals. */
export async function deleteGoal(context: TenantContext, goalId: string): Promise<boolean> {
    const db = await getDb();
    const deleted = await db
        .update(goals)
        .set({ deletedAt: new Date() })
        .where(and(own(context), eq(goals.id, goalId)))
        .returning({ id: goals.id });
    return deleted.length > 0;
}
