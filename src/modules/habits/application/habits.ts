import "server-only";

import { and, asc, eq, gte, inArray } from "drizzle-orm";

import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";
import { toLocalDate } from "@/shared/time/local-date";

import {
    DEFAULT_GOALS,
    MAX_CUSTOM_TRACKERS,
    RANGES,
    customTrackerSchema,
    isValidGoal,
    isValidValue,
    rangeFor,
    type BuiltInKind,
    type CustomTrackerInput,
    type Entry,
    type TrackerKind,
    type ValueType,
} from "../domain/trackers";
import { habitEntries, habitTrackers } from "../infrastructure/schema";

export type Tracker = {
    readonly id: string;
    readonly kind: TrackerKind;
    readonly name: string | null;
    readonly valueType: ValueType | null;
    readonly unit: string | null;
    readonly goal: number;
};

export type Habits = {
    readonly trackers: readonly Tracker[];
    /** Entries per tracker id, oldest first. */
    readonly entries: Readonly<Record<string, readonly Entry[]>>;
};

function ownTrackers(context: TenantContext) {
    return and(inTenant(habitTrackers, context), eq(habitTrackers.userId, context.userId));
}

/** The person's trackers and their entries since a day (YYYY-MM-DD). Health data: never log it. */
export async function getHabits(context: TenantContext, since: string): Promise<Habits> {
    const db = await getDb();
    const trackerRows = await db
        .select({
            id: habitTrackers.id,
            kind: habitTrackers.kind,
            name: habitTrackers.name,
            valueType: habitTrackers.valueType,
            unit: habitTrackers.unit,
            goal: habitTrackers.goal,
        })
        .from(habitTrackers)
        .where(ownTrackers(context))
        .orderBy(asc(habitTrackers.createdAt));

    const trackers = trackerRows.map((row) => ({ ...row, goal: Number(row.goal) }));
    if (trackers.length === 0) {
        return { trackers, entries: {} };
    }
    const entryRows = await db
        .select({
            trackerId: habitEntries.trackerId,
            day: habitEntries.day,
            value: habitEntries.value,
            secondary: habitEntries.secondary,
        })
        .from(habitEntries)
        .where(
            and(
                inTenant(habitEntries, context),
                inArray(
                    habitEntries.trackerId,
                    trackers.map((tracker) => tracker.id),
                ),
                gte(habitEntries.day, since),
            ),
        )
        .orderBy(asc(habitEntries.day));

    const entries: Record<string, Entry[]> = {};
    for (const row of entryRows) {
        (entries[row.trackerId] ??= []).push({
            day: row.day,
            value: Number(row.value),
            secondary: row.secondary === null ? null : Number(row.secondary),
        });
    }
    return { trackers, entries };
}

export type LogHabitInput = {
    /** A built-in kind, or the id of one of the person's custom trackers. */
    readonly target: { readonly kind: BuiltInKind } | { readonly trackerId: string };
    readonly value: number;
    /** Steps only: cardio minutes. */
    readonly secondary: number | null;
};

/**
 * Logs today's value of a tracker (one entry per day: logging again replaces it).
 * The day comes from the server in the person's time zone, never from the client.
 * A custom tracker id must belong to the person; values outside the range are rejected.
 */
export async function logHabit(
    context: TenantContext & { timezone: string },
    input: LogHabitInput,
): Promise<boolean> {
    const db = await getDb();
    const tracker =
        "kind" in input.target
            ? await ensureBuiltIn(context, input.target.kind)
            : await findCustom(context, input.target.trackerId);
    if (!tracker) {
        return false;
    }
    if (!isValidValue(input.value, rangeFor(tracker.kind, tracker.valueType))) {
        return false;
    }
    const secondary = tracker.kind === "steps" ? input.secondary : null;
    if (secondary !== null && !isValidValue(secondary, RANGES.cardio)) {
        return false;
    }

    const day = toLocalDate(new Date(), context.timezone);
    const [existing] = await db
        .select({ id: habitEntries.id })
        .from(habitEntries)
        .where(
            and(
                inTenant(habitEntries, context),
                eq(habitEntries.trackerId, tracker.id),
                eq(habitEntries.day, day),
            ),
        )
        .limit(1);
    const values = {
        value: String(input.value),
        secondary: secondary === null ? null : String(secondary),
    };
    if (existing) {
        await db
            .update(habitEntries)
            .set(values)
            .where(and(inTenant(habitEntries, context), eq(habitEntries.id, existing.id)));
    } else {
        await db.insert(habitEntries).values({
            workspaceId: context.workspaceId,
            trackerId: tracker.id,
            day,
            ...values,
        });
    }
    return true;
}

/**
 * Creates a custom tracker (at most 10 per person) and returns its id, or null
 * when the input is invalid or the limit is reached.
 */
export async function createCustomTracker(
    context: TenantContext,
    input: CustomTrackerInput,
): Promise<string | null> {
    const parsed = customTrackerSchema.safeParse(input);
    if (!parsed.success || !isValidGoal(parsed.data)) {
        return null;
    }
    const db = await getDb();
    const existing = await db
        .select({ id: habitTrackers.id })
        .from(habitTrackers)
        .where(and(ownTrackers(context), eq(habitTrackers.kind, "custom")));
    if (existing.length >= MAX_CUSTOM_TRACKERS) {
        return null;
    }
    const [row] = await db
        .insert(habitTrackers)
        .values({
            workspaceId: context.workspaceId,
            userId: context.userId,
            kind: "custom",
            name: parsed.data.name,
            valueType: parsed.data.valueType,
            unit: parsed.data.valueType === "number" ? (parsed.data.unit ?? null) : null,
            goal: String(parsed.data.goal),
        })
        .returning({ id: habitTrackers.id });
    return row.id;
}

/** Which of these ids are custom trackers of the person (to check ids sent by the client). */
export async function ownCustomTrackerIds(
    context: TenantContext,
    ids: readonly string[],
): Promise<Set<string>> {
    if (ids.length === 0) {
        return new Set();
    }
    const db = await getDb();
    const rows = await db
        .select({ id: habitTrackers.id })
        .from(habitTrackers)
        .where(
            and(
                ownTrackers(context),
                eq(habitTrackers.kind, "custom"),
                inArray(habitTrackers.id, [...ids]),
            ),
        );
    return new Set(rows.map((row) => row.id));
}

async function findCustom(context: TenantContext, trackerId: string): Promise<Tracker | null> {
    const db = await getDb();
    const [row] = await db
        .select({
            id: habitTrackers.id,
            kind: habitTrackers.kind,
            name: habitTrackers.name,
            valueType: habitTrackers.valueType,
            unit: habitTrackers.unit,
            goal: habitTrackers.goal,
        })
        .from(habitTrackers)
        .where(
            and(
                ownTrackers(context),
                eq(habitTrackers.id, trackerId),
                eq(habitTrackers.kind, "custom"),
            ),
        )
        .limit(1);
    return row ? { ...row, goal: Number(row.goal) } : null;
}

/** The person's row of a built-in kind, created with the default goal on first use. */
async function ensureBuiltIn(context: TenantContext, kind: BuiltInKind): Promise<Tracker> {
    const db = await getDb();
    const find = () =>
        db
            .select({
                id: habitTrackers.id,
                kind: habitTrackers.kind,
                name: habitTrackers.name,
                valueType: habitTrackers.valueType,
                unit: habitTrackers.unit,
                goal: habitTrackers.goal,
            })
            .from(habitTrackers)
            .where(and(ownTrackers(context), eq(habitTrackers.kind, kind)))
            .limit(1);
    let [row] = await find();
    if (!row) {
        await db
            .insert(habitTrackers)
            .values({
                workspaceId: context.workspaceId,
                userId: context.userId,
                kind,
                goal: String(DEFAULT_GOALS[kind]),
            })
            .onConflictDoNothing();
        [row] = await find();
    }
    return { ...row, goal: Number(row.goal) };
}
