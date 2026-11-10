"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
    BUILT_IN_KINDS,
    createCustomTracker,
    customTrackerSchema,
    logHabit,
} from "@/modules/habits";
import {
    MAX_WIDGETS,
    WIDGET_KINDS,
    WIDGET_SIZES,
    createGoal,
    deleteGoal,
    goalSchema,
    measurementsSchema,
    recordMeasurements,
    saveDashboardLayout,
    type WidgetPlacement,
} from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { toLocalDate } from "@/shared/time/local-date";

/*
 * The home's server actions. Each one resolves the session itself, validates
 * its whole input with zod and only touches the person's own rows: tracker,
 * goal and exercise ids sent by the client are checked again in the modules
 * (ADR 0013). Nothing here is logged: sleep, energy and body data are health data.
 */

const layoutSchema = z
    .array(
        z.object({
            kind: z.enum(WIDGET_KINDS),
            size: z.enum(WIDGET_SIZES),
            ref: z.uuid().nullable(),
        }),
    )
    .max(MAX_WIDGETS);

/** Saves the home layout: allowed kinds and sizes only, at most 24 widgets. Null when rejected. */
export async function saveLayoutAction(layout: unknown): Promise<WidgetPlacement[] | null> {
    const context = await requireAppContext();
    const parsed = layoutSchema.safeParse(layout);
    if (!parsed.success) {
        return null;
    }
    const saved = await saveDashboardLayout(context, parsed.data);
    revalidatePath("/");
    return saved;
}

const habitSchema = z.object({
    target: z.union([
        z.object({ kind: z.enum(BUILT_IN_KINDS as [string, ...string[]]) }),
        z.object({ trackerId: z.uuid() }),
    ]),
    value: z.number().finite(),
    secondary: z.number().finite().nullable(),
});

/** Logs today's value of a tracker; the module checks the range and the tracker's owner. */
export async function logHabitAction(input: unknown): Promise<boolean> {
    const context = await requireAppContext();
    const parsed = habitSchema.safeParse(input);
    if (!parsed.success) {
        return false;
    }
    const target =
        "kind" in parsed.data.target
            ? { kind: parsed.data.target.kind as (typeof BUILT_IN_KINDS)[number] }
            : { trackerId: parsed.data.target.trackerId };
    const saved = await logHabit(context, { ...parsed.data, target });
    if (saved) {
        revalidatePath("/");
    }
    return saved;
}

/** Creates a custom tracker (name 1–30 characters, at most 10). Returns its id, or null. */
export async function createTrackerAction(input: unknown): Promise<string | null> {
    const context = await requireAppContext();
    const parsed = customTrackerSchema.safeParse(input);
    if (!parsed.success) {
        return null;
    }
    const id = await createCustomTracker(context, parsed.data);
    if (id) {
        revalidatePath("/");
    }
    return id;
}

/** Today's waist, chest and arm. */
export async function recordMeasurementsAction(input: unknown): Promise<boolean> {
    const context = await requireAppContext();
    const parsed = measurementsSchema.safeParse(input);
    if (!parsed.success) {
        return false;
    }
    const saved = await recordMeasurements(
        context,
        parsed.data,
        toLocalDate(new Date(), context.timezone),
    );
    revalidatePath("/");
    return saved;
}

export async function createGoalAction(input: unknown): Promise<boolean> {
    const context = await requireAppContext();
    const parsed = goalSchema.safeParse(input);
    if (!parsed.success) {
        return false;
    }
    const saved = await createGoal(context, parsed.data, toLocalDate(new Date(), context.timezone));
    revalidatePath("/");
    return saved;
}

export async function deleteGoalAction(goalId: unknown): Promise<boolean> {
    const context = await requireAppContext();
    const parsed = z.uuid().safeParse(goalId);
    if (!parsed.success) {
        return false;
    }
    const deleted = await deleteGoal(context, parsed.data);
    revalidatePath("/");
    return deleted;
}
