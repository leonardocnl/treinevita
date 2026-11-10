import "server-only";

import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";

import {
    performedExercises,
    performedSets,
    workoutSessions,
    type PrescriptionSnapshot,
} from "../infrastructure/schema";

export type SessionSummary = {
    readonly sessionId: string;
    readonly workoutLabel: string | null;
    readonly startedAt: Date;
    readonly finishedAt: Date | null;
};

export type PerformedSet = {
    readonly setId: string;
    readonly position: number;
    readonly setType: "warmup" | "working" | "drop" | "failure";
    readonly loadKg: number | null;
    readonly reps: number | null;
    readonly durationSeconds: number | null;
};

export type PerformedExercise = {
    readonly performedExerciseId: string;
    readonly exerciseId: string;
    readonly position: number;
    readonly prescription: PrescriptionSnapshot | null;
    readonly sets: readonly PerformedSet[];
};

export type OpenSession = SessionSummary & {
    readonly exercises: readonly PerformedExercise[];
};

/** What the training module hands over to start a session. */
export type WorkoutToStart = {
    readonly workoutId: string;
    readonly label: string;
    readonly exercises: readonly {
        readonly prescribedExerciseId: string;
        readonly exerciseId: string;
        readonly snapshot: PrescriptionSnapshot;
    }[];
};

export async function listSessionsSince(
    context: TenantContext,
    since: Date,
): Promise<SessionSummary[]> {
    const db = await getDb();
    const rows = await db
        .select({
            sessionId: workoutSessions.id,
            workoutLabel: workoutSessions.workoutLabel,
            startedAt: workoutSessions.startedAt,
            finishedAt: workoutSessions.finishedAt,
        })
        .from(workoutSessions)
        .where(
            and(
                inTenant(workoutSessions, context),
                eq(workoutSessions.userId, context.userId),
                gte(workoutSessions.startedAt, since),
            ),
        )
        .orderBy(asc(workoutSessions.startedAt));
    return rows;
}

/** The latest finished session. Read once per request (React cache): several widgets ask for it. */
export const getLastFinishedSession = cache(
    async (context: TenantContext): Promise<SessionSummary | null> => {
        const db = await getDb();
        const [row] = await db
            .select({
                sessionId: workoutSessions.id,
                workoutLabel: workoutSessions.workoutLabel,
                startedAt: workoutSessions.startedAt,
                finishedAt: workoutSessions.finishedAt,
            })
            .from(workoutSessions)
            .where(
                and(
                    inTenant(workoutSessions, context),
                    eq(workoutSessions.userId, context.userId),
                    isNotNull(workoutSessions.finishedAt),
                ),
            )
            .orderBy(desc(workoutSessions.startedAt))
            .limit(1);
        return row ?? null;
    },
);

/**
 * The session in progress (started and not finished), with its exercises and sets.
 * Two queries in parallel: the session, and its exercises joined with their sets.
 */
export async function getOpenSession(context: TenantContext): Promise<OpenSession | null> {
    const db = await getDb();
    const isOpen = and(
        inTenant(workoutSessions, context),
        eq(workoutSessions.userId, context.userId),
        isNull(workoutSessions.finishedAt),
    );
    const latestOpenId = db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(isOpen)
        .orderBy(desc(workoutSessions.startedAt))
        .limit(1);

    const [[session], rows] = await Promise.all([
        db
            .select({
                sessionId: workoutSessions.id,
                workoutLabel: workoutSessions.workoutLabel,
                startedAt: workoutSessions.startedAt,
                finishedAt: workoutSessions.finishedAt,
            })
            .from(workoutSessions)
            .where(isOpen)
            .orderBy(desc(workoutSessions.startedAt))
            .limit(1),
        db
            .select({ exercise: performedExercises, set: performedSets })
            .from(performedExercises)
            .leftJoin(
                performedSets,
                and(
                    eq(performedSets.performedExerciseId, performedExercises.id),
                    inTenant(performedSets, context),
                ),
            )
            .where(
                and(
                    inTenant(performedExercises, context),
                    inArray(performedExercises.sessionId, latestOpenId),
                ),
            )
            .orderBy(asc(performedExercises.position), asc(performedSets.position)),
    ]);

    if (!session) {
        return null;
    }

    const exercises = new Map<string, PerformedExercise & { sets: PerformedSet[] }>();
    for (const { exercise, set } of rows) {
        let entry = exercises.get(exercise.id);
        if (!entry) {
            entry = {
                performedExerciseId: exercise.id,
                exerciseId: exercise.exerciseId,
                position: exercise.position,
                prescription: exercise.prescriptionSnapshot ?? null,
                sets: [],
            };
            exercises.set(exercise.id, entry);
        }
        if (set) {
            entry.sets.push(toPerformedSet(set));
        }
    }
    return { ...session, exercises: [...exercises.values()] };
}

/**
 * For each exercise, the sets of the most recent finished session in which it
 * was trained. Feeds the "last time" line and the progression decision.
 */
export async function getLastSetsByExercise(
    context: TenantContext,
    exerciseIds: readonly string[],
): Promise<Map<string, { performedOn: Date; sets: PerformedSet[] }>> {
    const result = new Map<string, { performedOn: Date; sets: PerformedSet[] }>();
    if (exerciseIds.length === 0) {
        return result;
    }

    const db = await getDb();
    // The latest finished performance of each exercise (DISTINCT ON), joined with its sets: one query.
    const latest = db
        .selectDistinctOn([performedExercises.exerciseId], { id: performedExercises.id })
        .from(performedExercises)
        .innerJoin(workoutSessions, eq(workoutSessions.id, performedExercises.sessionId))
        .where(
            and(
                inTenant(performedExercises, context),
                inArray(performedExercises.exerciseId, [...exerciseIds]),
                eq(workoutSessions.userId, context.userId),
                isNotNull(workoutSessions.finishedAt),
                isNull(workoutSessions.deletedAt),
            ),
        )
        .orderBy(performedExercises.exerciseId, desc(workoutSessions.startedAt));

    const rows = await db
        .select({
            exerciseId: performedExercises.exerciseId,
            startedAt: workoutSessions.startedAt,
            set: performedSets,
        })
        .from(performedExercises)
        .innerJoin(workoutSessions, eq(workoutSessions.id, performedExercises.sessionId))
        .leftJoin(
            performedSets,
            and(
                eq(performedSets.performedExerciseId, performedExercises.id),
                inTenant(performedSets, context),
            ),
        )
        .where(inArray(performedExercises.id, latest))
        .orderBy(asc(performedSets.position));

    for (const row of rows) {
        let entry = result.get(row.exerciseId);
        if (!entry) {
            entry = { performedOn: row.startedAt, sets: [] };
            result.set(row.exerciseId, entry);
        }
        if (row.set) {
            entry.sets.push(toPerformedSet(row.set));
        }
    }
    return result;
}

/** Every set logged since a date (discarded sessions left out), for records, volume and stagnation. */
export async function listSetsSince(
    context: TenantContext,
    since: Date,
): Promise<{ exerciseId: string; sessionId: string; startedAt: Date; set: PerformedSet }[]> {
    const db = await getDb();
    const rows = await db
        .select({
            exerciseId: performedExercises.exerciseId,
            sessionId: workoutSessions.id,
            startedAt: workoutSessions.startedAt,
            set: performedSets,
        })
        .from(performedSets)
        .innerJoin(performedExercises, eq(performedExercises.id, performedSets.performedExerciseId))
        .innerJoin(workoutSessions, eq(workoutSessions.id, performedExercises.sessionId))
        .where(
            and(
                inTenant(performedSets, context),
                inTenant(workoutSessions, context),
                eq(workoutSessions.userId, context.userId),
                gte(workoutSessions.startedAt, since),
            ),
        );
    return rows.map((row) => ({
        exerciseId: row.exerciseId,
        sessionId: row.sessionId,
        startedAt: row.startedAt,
        set: toPerformedSet(row.set),
    }));
}

export async function startSession(
    context: TenantContext & { timezone: string },
    workout: WorkoutToStart,
): Promise<string> {
    const existing = await getOpenSession(context);
    if (existing) {
        return existing.sessionId;
    }

    const db = await getDb();
    return db.transaction(async (tx) => {
        const [session] = await tx
            .insert(workoutSessions)
            .values({
                workspaceId: context.workspaceId,
                userId: context.userId,
                workoutId: workout.workoutId,
                workoutLabel: workout.label,
                timezone: context.timezone,
                startedAt: new Date(),
            })
            .returning({ id: workoutSessions.id });

        if (workout.exercises.length > 0) {
            await tx.insert(performedExercises).values(
                workout.exercises.map((exercise, position) => ({
                    workspaceId: context.workspaceId,
                    sessionId: session.id,
                    exerciseId: exercise.exerciseId,
                    prescribedExerciseId: exercise.prescribedExerciseId,
                    position,
                    prescriptionSnapshot: exercise.snapshot,
                })),
            );
        }
        return session.id;
    });
}

export type SetInput = {
    readonly loadKg: number | null;
    readonly reps: number | null;
    readonly durationSeconds: number | null;
};

/** Joins a performed exercise to the person's open session in this workspace, or to nothing. */
function inOpenSession(context: TenantContext) {
    return and(
        eq(workoutSessions.id, performedExercises.sessionId),
        inTenant(workoutSessions, context),
        eq(workoutSessions.userId, context.userId),
        isNull(workoutSessions.finishedAt),
    );
}

/**
 * Logs the next set of an exercise in the open session. The exercise must
 * belong to the person's open session in this workspace; otherwise nothing is written.
 * Two queries: the ownership check (with the set count), then the insert.
 */
export async function logSet(
    context: TenantContext,
    performedExerciseId: string,
    input: SetInput,
): Promise<boolean> {
    const db = await getDb();
    const [exercise] = await db
        .select({ setCount: count(performedSets.id) })
        .from(performedExercises)
        .innerJoin(workoutSessions, inOpenSession(context))
        .leftJoin(
            performedSets,
            and(
                eq(performedSets.performedExerciseId, performedExercises.id),
                inTenant(performedSets, context),
            ),
        )
        .where(
            and(
                inTenant(performedExercises, context),
                eq(performedExercises.id, performedExerciseId),
            ),
        )
        .groupBy(performedExercises.id);
    if (!exercise) {
        return false;
    }

    await db.insert(performedSets).values({
        workspaceId: context.workspaceId,
        performedExerciseId,
        position: exercise.setCount,
        setType: "working",
        loadKg: input.loadKg === null ? null : String(input.loadKg),
        reps: input.reps,
        durationSeconds: input.durationSeconds,
        completedAt: new Date(),
    });
    return true;
}

/** Removes the last logged set of an exercise in the open session (undo), in one query. */
export async function undoLastSet(
    context: TenantContext,
    performedExerciseId: string,
): Promise<boolean> {
    const db = await getDb();
    const lastSet = db
        .select({ id: performedSets.id })
        .from(performedSets)
        .innerJoin(performedExercises, eq(performedExercises.id, performedSets.performedExerciseId))
        .innerJoin(workoutSessions, inOpenSession(context))
        .where(
            and(
                inTenant(performedSets, context),
                inTenant(performedExercises, context),
                eq(performedSets.performedExerciseId, performedExerciseId),
            ),
        )
        .orderBy(desc(performedSets.position))
        .limit(1);
    const deleted = await db
        .delete(performedSets)
        .where(and(inTenant(performedSets, context), inArray(performedSets.id, lastSet)))
        .returning({ id: performedSets.id });
    return deleted.length > 0;
}

/**
 * Corrects a logged set (by its position) of an exercise in the open session.
 * The exercise must belong to the person's open session; otherwise nothing changes.
 */
export async function updateSet(
    context: TenantContext,
    performedExerciseId: string,
    position: number,
    input: SetInput,
): Promise<boolean> {
    const db = await getDb();
    const owned = db
        .select({ id: performedExercises.id })
        .from(performedExercises)
        .innerJoin(workoutSessions, inOpenSession(context))
        .where(
            and(
                inTenant(performedExercises, context),
                eq(performedExercises.id, performedExerciseId),
            ),
        );
    const updated = await db
        .update(performedSets)
        .set({
            loadKg: input.loadKg === null ? null : String(input.loadKg),
            reps: input.reps,
            durationSeconds: input.durationSeconds,
        })
        .where(
            and(
                inTenant(performedSets, context),
                eq(performedSets.position, position),
                inArray(performedSets.performedExerciseId, owned),
            ),
        )
        .returning({ id: performedSets.id });
    return updated.length > 0;
}

export async function finishSession(context: TenantContext): Promise<boolean> {
    const session = await getOpenSession(context);
    if (!session) {
        return false;
    }
    const db = await getDb();
    await db
        .update(workoutSessions)
        .set({ finishedAt: new Date() })
        .where(and(inTenant(workoutSessions, context), eq(workoutSessions.id, session.sessionId)));
    return true;
}

/** Cancels the open session (soft delete), e.g. when it was started by mistake. */
export async function discardOpenSession(context: TenantContext): Promise<boolean> {
    const session = await getOpenSession(context);
    if (!session) {
        return false;
    }
    const db = await getDb();
    await db
        .update(workoutSessions)
        .set({ deletedAt: new Date() })
        .where(and(inTenant(workoutSessions, context), eq(workoutSessions.id, session.sessionId)));
    return true;
}

function toPerformedSet(row: typeof performedSets.$inferSelect): PerformedSet {
    return {
        setId: row.id,
        position: row.position,
        setType: row.setType,
        loadKg: row.loadKg === null ? null : Number(row.loadKg),
        reps: row.reps,
        durationSeconds: row.durationSeconds,
    };
}
