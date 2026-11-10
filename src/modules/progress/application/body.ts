import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";
import { addDays } from "@/shared/time/local-date";

import { bodyMeasurements } from "../infrastructure/schema";

export type BodyRow = {
    readonly day: string;
    readonly weightKg: number | null;
    readonly waistCm: number | null;
    readonly chestCm: number | null;
    readonly armCm: number | null;
};

/** Weigh-ins and measurements of the last `days` days, oldest first. Health data: never log it. */
export async function listBodyRows(
    context: TenantContext,
    today: string,
    days: number,
): Promise<BodyRow[]> {
    const db = await getDb();
    const since = addDays(today, -days);
    const rows = await db
        .select({
            day: bodyMeasurements.measuredOn,
            weightKg: bodyMeasurements.weightKg,
            waistCm: bodyMeasurements.waistCm,
            chestCm: bodyMeasurements.chestCm,
            armRightCm: bodyMeasurements.armRightCm,
            armLeftCm: bodyMeasurements.armLeftCm,
        })
        .from(bodyMeasurements)
        .where(
            and(inTenant(bodyMeasurements, context), eq(bodyMeasurements.userId, context.userId)),
        )
        .orderBy(desc(bodyMeasurements.measuredOn))
        .limit(200);
    const number = (value: string | null) => (value === null ? null : Number(value));
    return rows
        .filter((row) => row.day >= since)
        .reverse()
        .map((row) => ({
            day: row.day,
            weightKg: number(row.weightKg),
            waistCm: number(row.waistCm),
            chestCm: number(row.chestCm),
            armCm: number(row.armRightCm ?? row.armLeftCm),
        }));
}

/** The latest weigh-ins (up to 8, oldest first), for Perfil. */
export async function getWeightTrend(
    context: TenantContext & { timezone?: string },
): Promise<{ trend: number[] } | null> {
    const db = await getDb();
    const rows = await db
        .select({ weightKg: bodyMeasurements.weightKg })
        .from(bodyMeasurements)
        .where(
            and(inTenant(bodyMeasurements, context), eq(bodyMeasurements.userId, context.userId)),
        )
        .orderBy(desc(bodyMeasurements.measuredOn))
        .limit(8);
    const trend = rows
        .filter((row) => row.weightKg !== null)
        .map((row) => Number(row.weightKg))
        .reverse();
    return trend.length === 0 ? null : { trend };
}

const centimeters = z.number().min(20).max(250).multipleOf(0.5);

export const measurementsSchema = z.object({
    waistCm: centimeters,
    chestCm: centimeters,
    armCm: z.number().min(10).max(80).multipleOf(0.5),
});
export type MeasurementsInput = z.infer<typeof measurementsSchema>;

/** Today's waist, chest and arm (one row per day: a second entry replaces the first). */
export async function recordMeasurements(
    context: TenantContext,
    input: MeasurementsInput,
    day: string,
): Promise<boolean> {
    const parsed = measurementsSchema.safeParse(input);
    if (!parsed.success) {
        return false;
    }
    const values = {
        waistCm: String(parsed.data.waistCm),
        chestCm: String(parsed.data.chestCm),
        armRightCm: String(parsed.data.armCm),
    };
    const db = await getDb();
    const [existing] = await db
        .select({ id: bodyMeasurements.id })
        .from(bodyMeasurements)
        .where(
            and(
                inTenant(bodyMeasurements, context),
                eq(bodyMeasurements.userId, context.userId),
                eq(bodyMeasurements.measuredOn, day),
            ),
        )
        .limit(1);
    if (existing) {
        await db
            .update(bodyMeasurements)
            .set(values)
            .where(and(inTenant(bodyMeasurements, context), eq(bodyMeasurements.id, existing.id)));
    } else {
        await db.insert(bodyMeasurements).values({
            workspaceId: context.workspaceId,
            userId: context.userId,
            measuredOn: day,
            ...values,
        });
    }
    return true;
}
