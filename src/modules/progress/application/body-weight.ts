import "server-only";

import { and, eq } from "drizzle-orm";

import type { Database } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";

import { bodyMeasurements } from "../infrastructure/schema";

/**
 * Records the person's weight for a day (one weigh-in per day: a second one
 * replaces the first). Pass the caller's transaction. Health data: never log it.
 */
export async function recordBodyWeight(
    db: Database,
    context: TenantContext,
    weightKg: number,
    measuredOn: string,
): Promise<void> {
    const [existing] = await db
        .select({ id: bodyMeasurements.id })
        .from(bodyMeasurements)
        .where(
            and(
                inTenant(bodyMeasurements, context),
                eq(bodyMeasurements.userId, context.userId),
                eq(bodyMeasurements.measuredOn, measuredOn),
            ),
        )
        .limit(1);
    if (existing) {
        await db
            .update(bodyMeasurements)
            .set({ weightKg: String(weightKg) })
            .where(eq(bodyMeasurements.id, existing.id));
        return;
    }
    await db.insert(bodyMeasurements).values({
        workspaceId: context.workspaceId,
        userId: context.userId,
        measuredOn,
        weightKg: String(weightKg),
    });
}
