import { PGlite } from "@electric-sql/pglite";
import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/platform/db/drivers";
import { schema } from "@/platform/db/schema";
import { inTenant, type TenantContext } from "@/shared/db/tenant";

import { performedExercises, performedSets, workoutSessions } from "../infrastructure/schema";

// Other modules' tables only to seed the test, through the platform's schema.
const { exercises, users, workspaces } = schema;

const test = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("server-only", () => ({}));
vi.mock("@/platform/db/client", () => ({ getDb: async () => test.db }));

const { getLastSetsByExercise, getOpenSession, logSet, undoLastSet } = await import("./sessions");

let db: Database;
let me: TenantContext;
let other: TenantContext;
let exerciseIds: string[];

/*
 * The workout loaders now run in parallel and in fewer queries (one join, one
 * DISTINCT ON). These tests run the previous, sequential versions (copied below
 * as they were) on the same data and expect exactly the same result.
 */
beforeAll(async () => {
    db = drizzle(new PGlite(), { schema }) as unknown as Database;
    test.db = db;
    await migrate(db as never, { migrationsFolder: "./drizzle" });

    const [workspace, otherWorkspace] = await db
        .insert(workspaces)
        .values([
            { name: "Eu", kind: "personal" },
            { name: "Outro", kind: "personal" },
        ])
        .returning({ id: workspaces.id });
    const [user, otherUser] = await db
        .insert(users)
        .values([{ email: "eu@example.com" }, { email: "outro@example.com" }])
        .returning({ id: users.id });
    me = { workspaceId: workspace.id, userId: user.id };
    other = { workspaceId: otherWorkspace.id, userId: otherUser.id };

    const rows = await db
        .insert(exercises)
        .values(
            ["Supino", "Remada", "Prancha"].map((name) => ({
                name,
                equipment: "machine" as const,
                movementPattern: "isolation" as const,
            })),
        )
        .returning({ id: exercises.id });
    exerciseIds = rows.map((row) => row.id);
    const [e1, e2, e3] = exerciseIds;

    const day = (n: number) => new Date(Date.UTC(2026, 10, n, 12));
    // Older finished session: e1 with 3 sets, e2 with 2 sets (one deleted).
    await session(me, { startedAt: day(1), finished: true }, [
        [e1, [20, 22.5, 22.5]],
        [e2, [30, { loadKg: 32.5, deleted: true }]],
    ]);
    // Newer finished session: e1 with 2 sets, e3 trained with no sets.
    await session(me, { startedAt: day(3), finished: true }, [
        [e1, [25, 25]],
        [e3, []],
    ]);
    // The newest finished session was discarded: it never counts.
    await session(me, { startedAt: day(4), finished: true, deleted: true }, [[e2, [99]]]);
    // The open session: e1 with one set, e2 with none, e3 with two (one deleted).
    await session(me, { startedAt: day(5), finished: false }, [
        [e1, [25]],
        [e2, []],
        [e3, [{ loadKg: 0, deleted: true }, 0]],
    ]);
    // Someone else's open session, in another workspace.
    await session(other, { startedAt: day(6), finished: false }, [[e1, [100]]]);
});

type SetSeed = number | { loadKg: number; deleted: true };

async function session(
    context: TenantContext,
    options: { startedAt: Date; finished: boolean; deleted?: boolean },
    items: [string, SetSeed[]][],
) {
    const [row] = await db
        .insert(workoutSessions)
        .values({
            workspaceId: context.workspaceId,
            userId: context.userId,
            workoutLabel: "A",
            timezone: "America/Sao_Paulo",
            startedAt: options.startedAt,
            finishedAt: options.finished ? new Date(options.startedAt.getTime() + 3600_000) : null,
            deletedAt: options.deleted ? new Date() : null,
        })
        .returning({ id: workoutSessions.id });
    for (const [position, [exerciseId, sets]] of items.entries()) {
        const [performed] = await db
            .insert(performedExercises)
            .values({
                workspaceId: context.workspaceId,
                sessionId: row.id,
                exerciseId,
                position,
                prescriptionSnapshot: { sets: 3, repMin: 8, repMax: 12 } as never,
            })
            .returning({ id: performedExercises.id });
        for (const [index, seed] of sets.entries()) {
            const loadKg = typeof seed === "number" ? seed : seed.loadKg;
            await db.insert(performedSets).values({
                workspaceId: context.workspaceId,
                performedExerciseId: performed.id,
                position: index,
                setType: "working",
                loadKg: String(loadKg),
                reps: 10,
                completedAt: options.startedAt,
                deletedAt: typeof seed === "number" ? null : new Date(),
            });
        }
    }
}

describe("workout loaders", () => {
    it("loads the open session exactly as the sequential version did", async () => {
        const now = await getOpenSession(me);
        expect(now).toEqual(await previousGetOpenSession(me));
        expect(now?.exercises.map((exercise) => exercise.sets.length)).toEqual([1, 0, 1]);
        expect(await getOpenSession(other)).toEqual(await previousGetOpenSession(other));
    });

    it("loads the last sets of each exercise exactly as the sequential version did", async () => {
        const now = await getLastSetsByExercise(me, exerciseIds);
        expect(now).toEqual(await previousGetLastSetsByExercise(me, exerciseIds));
        const [e1, e2, e3] = exerciseIds;
        expect(now.get(e1)?.sets.map((set) => set.loadKg)).toEqual([25, 25]);
        expect(now.get(e2)?.sets.map((set) => set.loadKg)).toEqual([30]);
        expect(now.get(e3)?.sets).toEqual([]);
    });
});

describe("logging sets", () => {
    it("appends a set after the last one and undoes it", async () => {
        const open = await getOpenSession(me);
        const first = open!.exercises[0];
        expect(
            await logSet(me, first.performedExerciseId, {
                loadKg: 27.5,
                reps: 9,
                durationSeconds: null,
            }),
        ).toBe(true);
        let sets = (await getOpenSession(me))!.exercises[0].sets;
        expect(sets.map((set) => [set.position, set.loadKg, set.reps])).toEqual([
            [0, 25, 10],
            [1, 27.5, 9],
        ]);

        expect(await undoLastSet(me, first.performedExerciseId)).toBe(true);
        sets = (await getOpenSession(me))!.exercises[0].sets;
        expect(sets.map((set) => set.loadKg)).toEqual([25]);
    });

    it("never writes into someone else's session", async () => {
        const theirs = (await getOpenSession(other))!.exercises[0];
        const set = { loadKg: 1, reps: 1, durationSeconds: null };
        expect(await logSet(me, theirs.performedExerciseId, set)).toBe(false);
        expect(await undoLastSet(me, theirs.performedExerciseId)).toBe(false);
        expect((await getOpenSession(other))!.exercises[0].sets).toHaveLength(1);
    });
});

/* ---- The previous implementations, kept here as the reference. ---- */

function toPerformedSet(row: typeof performedSets.$inferSelect) {
    return {
        setId: row.id,
        position: row.position,
        setType: row.setType,
        loadKg: row.loadKg === null ? null : Number(row.loadKg),
        reps: row.reps,
        durationSeconds: row.durationSeconds,
    };
}

async function previousGetOpenSession(context: TenantContext) {
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

async function previousGetLastSetsByExercise(context: TenantContext, ids: readonly string[]) {
    const result = new Map<
        string,
        { performedOn: Date; sets: ReturnType<typeof toPerformedSet>[] }
    >();
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
                inArray(performedExercises.exerciseId, [...ids]),
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
