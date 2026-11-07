import "server-only";

import { and, asc, desc, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";

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

export async function getLastFinishedSession(
    context: TenantContext,
): Promise<SessionSummary | null> {
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
}

/** The session in progress (started and not finished), with its exercises and sets. */
export async function getOpenSession(context: TenantContext): Promise<OpenSession | null> {
    const db = await getDb();
    const [session] = await db
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
                isNull(workoutSessions.finishedAt),
            ),
        )
        .orderBy(desc(workoutSessions.startedAt))
        .limit(1);

    if (!session) {
        return null;
    }

    const exerciseRows = await db
        .select()
        .from(performedExercises)
        .where(
            and(
                inTenant(performedExercises, context),
                eq(performedExercises.sessionId, session.sessionId),
            ),
        )
        .orderBy(asc(performedExercises.position));

    const setRows =
        exerciseRows.length === 0
            ? []
            : await db
                  .select()
                  .from(performedSets)
                  .where(
                      and(
                          inTenant(performedSets, context),
                          inArray(
                              performedSets.performedExerciseId,
                              exerciseRows.map((row) => row.id),
                          ),
                      ),
                  )
                  .orderBy(asc(performedSets.position));

    return {
        ...session,
        exercises: exerciseRows.map((row) => ({
            performedExerciseId: row.id,
            exerciseId: row.exerciseId,
            position: row.position,
            prescription: row.prescriptionSnapshot ?? null,
            sets: setRows.filter((set) => set.performedExerciseId === row.id).map(toPerformedSet),
        })),
    };
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
    const rows = await db
        .select({
            exerciseId: performedExercises.exerciseId,
            performedExerciseId: performedExercises.id,
            startedAt: workoutSessions.startedAt,
        })
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
        .orderBy(desc(workoutSessions.startedAt));

    const latest = new Map<string, { performedExerciseId: string; startedAt: Date }>();
    for (const row of rows) {
        if (!latest.has(row.exerciseId)) {
            latest.set(row.exerciseId, row);
        }
    }

    const performedIds = [...latest.values()].map((entry) => entry.performedExerciseId);
    const setRows =
        performedIds.length === 0
            ? []
            : await db
                  .select()
                  .from(performedSets)
                  .where(
                      and(
                          inTenant(performedSets, context),
                          inArray(performedSets.performedExerciseId, performedIds),
                      ),
                  )
                  .orderBy(asc(performedSets.position));

    for (const [exerciseId, entry] of latest) {
        result.set(exerciseId, {
            performedOn: entry.startedAt,
            sets: setRows
                .filter((set) => set.performedExerciseId === entry.performedExerciseId)
                .map(toPerformedSet),
        });
    }
    return result;
}

/** All effective sets since a date, for records and weekly volume. */
export async function listSetsSince(
    context: TenantContext,
    since: Date,
): Promise<{ exerciseId: string; startedAt: Date; set: PerformedSet }[]> {
    const db = await getDb();
    const rows = await db
        .select({
            exerciseId: performedExercises.exerciseId,
            startedAt: workoutSessions.startedAt,
            set: performedSets,
        })
        .from(performedSets)
        .innerJoin(performedExercises, eq(performedExercises.id, performedSets.performedExerciseId))
        .innerJoin(workoutSessions, eq(workoutSessions.id, performedExercises.sessionId))
        .where(
            and(
                inTenant(performedSets, context),
                eq(workoutSessions.userId, context.userId),
                gte(workoutSessions.startedAt, since),
            ),
        );
    return rows.map((row) => ({
        exerciseId: row.exerciseId,
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

/**
 * Logs the next set of an exercise in the open session. The exercise must
 * belong to the person's open session in this workspace; otherwise nothing is written.
 */
export async function logSet(
    context: TenantContext,
    performedExerciseId: string,
    input: SetInput,
): Promise<boolean> {
    const session = await getOpenSession(context);
    const exercise = session?.exercises.find(
        (item) => item.performedExerciseId === performedExerciseId,
    );
    if (!session || !exercise) {
        return false;
    }

    const db = await getDb();
    await db.insert(performedSets).values({
        workspaceId: context.workspaceId,
        performedExerciseId,
        position: exercise.sets.length,
        setType: "working",
        loadKg: input.loadKg === null ? null : String(input.loadKg),
        reps: input.reps,
        durationSeconds: input.durationSeconds,
        completedAt: new Date(),
    });
    return true;
}

/** Removes the last logged set of an exercise in the open session (undo). */
export async function undoLastSet(
    context: TenantContext,
    performedExerciseId: string,
): Promise<boolean> {
    const session = await getOpenSession(context);
    const exercise = session?.exercises.find(
        (item) => item.performedExerciseId === performedExerciseId,
    );
    const last = exercise?.sets.at(-1);
    if (!last) {
        return false;
    }
    const db = await getDb();
    await db
        .delete(performedSets)
        .where(and(inTenant(performedSets, context), eq(performedSets.id, last.setId)));
    return true;
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
