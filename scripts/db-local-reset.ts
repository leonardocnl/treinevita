/**
 * Recreates the local development database from scratch and fills it with
 * mock data. Never touches Neon: it only writes to ./.data/pglite, and it
 * refuses to run on Vercel or in production.
 *
 * Usage: npm run db:local:reset
 */
import { mkdir, rm } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { upsertGlobalCatalog } from "../src/modules/catalog/infrastructure/global-catalog";
import { doubleProgression } from "../src/modules/progress/domain/progression";
import { DEFAULT_LAYOUT } from "../src/modules/progress/domain/widgets";
import {
    insertStarterProgram,
    STARTER_WORKOUTS,
} from "../src/modules/training/infrastructure/starter-program";
import { LOCAL_DATABASE_PATH, type Database } from "../src/platform/db/drivers";
import { schema } from "../src/platform/db/schema";
import { isProductionEnv } from "../src/platform/env";

import { bodyMeasurementSeeds, MOCK_START, trainingDays } from "./seed-data";

const OWNER_EMAIL = "leonardocnl.dev@gmail.com";
const TIMEZONE = "America/Sao_Paulo";

async function main() {
    if (process.env.DATABASE_URL || isProductionEnv(process.env)) {
        throw new Error(
            "This script only resets the local database. Unset DATABASE_URL; it never runs on Vercel or in production.",
        );
    }

    await rm(LOCAL_DATABASE_PATH, { recursive: true, force: true });
    await mkdir(LOCAL_DATABASE_PATH, { recursive: true });
    const client = new PGlite(LOCAL_DATABASE_PATH);
    const db = drizzle(client, { schema });

    await migrate(db, { migrationsFolder: "./drizzle" });

    const [owner] = await db
        .insert(schema.users)
        .values({ email: OWNER_EMAIL, displayName: "Leonardo", timezone: TIMEZONE })
        .returning();

    const [workspace] = await db
        .insert(schema.workspaces)
        .values({ name: "Leonardo", kind: "personal" })
        .returning();

    await db
        .insert(schema.workspaceMemberships)
        .values({ workspaceId: workspace.id, userId: owner.id, role: "owner" });

    await db
        .insert(schema.trainingPreferences)
        .values({ workspaceId: workspace.id, userId: owner.id, weeklyGoal: 3 });

    const context = { workspaceId: workspace.id, userId: owner.id };
    const exercises = await upsertGlobalCatalog(db as unknown as Database);
    const program = await insertStarterProgram(
        db as unknown as Database,
        context,
        exercises,
        "2026-07-20",
    );

    const workoutIdByLabel = new Map(program.map((workout) => [workout.label, workout.workoutId]));
    const stateByLabel = new Map(
        program.map((workout) => {
            const plan = required(
                STARTER_WORKOUTS.find((candidate) => candidate.label === workout.label),
                workout.label,
            );
            const states = workout.prescriptions.map((prescription, position) => {
                const seed = {
                    ...plan.exercises[position],
                    stuck: MOCK_START[prescription.slug]?.stuck,
                };
                return {
                    prescribedExerciseId: prescription.id,
                    exerciseId: prescription.exerciseId,
                    seed,
                    incrementKg: required(exercises.get(prescription.slug), prescription.slug)
                        .incrementKg,
                    loadKg: required(MOCK_START[prescription.slug], prescription.slug).loadKg,
                    reps: seed.repMin ?? 0,
                    durationSeconds: seed.durationMin ?? 0,
                };
            });
            return [workout.label, states];
        }),
    );

    let sessionCount = 0;
    let setCount = 0;

    for (const day of trainingDays()) {
        const startedAt = new Date(`${day.date}T07:30:00-03:00`);
        const [session] = await db
            .insert(schema.workoutSessions)
            .values({
                workspaceId: workspace.id,
                userId: owner.id,
                workoutId: required(workoutIdByLabel.get(day.label), day.label),
                workoutLabel: day.label,
                timezone: TIMEZONE,
                startedAt,
                finishedAt: new Date(startedAt.getTime() + 55 * 60 * 1000),
            })
            .returning();
        sessionCount += 1;

        const allStates = required(stateByLabel.get(day.label), day.label);
        const states = allStates.slice(0, allStates.length - day.skipExercises);
        for (const [position, state] of states.entries()) {
            const { seed } = state;
            const [performed] = await db
                .insert(schema.performedExercises)
                .values({
                    workspaceId: workspace.id,
                    sessionId: session.id,
                    exerciseId: state.exerciseId,
                    prescribedExerciseId: state.prescribedExerciseId,
                    position,
                    prescriptionSnapshot: {
                        sets: 3,
                        repMin: seed.repMin ?? null,
                        repMax: seed.repMax ?? null,
                        durationMinSeconds: seed.durationMin ?? null,
                        durationMaxSeconds: seed.durationMax ?? null,
                        progressionRule: state.incrementKg > 0 ? "double_progression" : "none",
                        loadIncrementKg: null,
                    },
                })
                .returning();

            const isDuration = seed.durationMin !== undefined;
            const lastSetReps =
                state.reps === seed.repMax
                    ? state.reps
                    : Math.max(seed.repMin ?? 0, state.reps - 1);
            const repsPerSet = [state.reps, state.reps, lastSetReps];
            const sets = [0, 1, 2].map((setIndex) => ({
                workspaceId: workspace.id,
                performedExerciseId: performed.id,
                position: setIndex,
                setType: "working" as const,
                loadKg: isDuration ? null : String(state.loadKg),
                reps: isDuration ? null : repsPerSet[setIndex],
                durationSeconds: isDuration ? state.durationSeconds : null,
                completedAt: new Date(
                    startedAt.getTime() + (position * 6 + setIndex * 2) * 60 * 1000,
                ),
            }));
            await db.insert(schema.performedSets).values(sets);
            setCount += sets.length;

            advance(state, repsPerSet);
        }
    }

    await db.insert(schema.bodyMeasurements).values(
        bodyMeasurementSeeds.map((measurement) => ({
            workspaceId: workspace.id,
            userId: owner.id,
            measuredOn: measurement.measuredOn,
            weightKg: String(measurement.weightKg),
            waistCm: String(measurement.waistCm),
            bodyFatPercent:
                "bodyFatPercent" in measurement ? String(measurement.bodyFatPercent) : null,
        })),
    );

    const widgets = DEFAULT_LAYOUT;
    await db.insert(schema.dashboardWidgets).values(
        widgets.map((widget, position) => ({
            workspaceId: workspace.id,
            userId: owner.id,
            kind: widget.kind,
            size: widget.size,
            position,
        })),
    );

    await client.close();

    console.log(
        `Local database ready at ${LOCAL_DATABASE_PATH}: 1 user, ${exercises.size} exercises, ` +
            `${sessionCount} sessions, ${setCount} sets, ${bodyMeasurementSeeds.length} weigh-ins.`,
    );
}

/** Moves the mock athlete forward using the real progression rule of the app. */
function advance(
    state: {
        seed: { repMin?: number; repMax?: number; durationMax?: number; stuck?: boolean };
        incrementKg: number;
        loadKg: number;
        reps: number;
        durationSeconds: number;
    },
    repsPerSet: number[],
) {
    const { seed } = state;
    if (seed.durationMax !== undefined) {
        state.durationSeconds = Math.min(seed.durationMax, state.durationSeconds + 5);
        return;
    }
    if (seed.stuck || state.incrementKg === 0) {
        state.reps = Math.min(seed.repMax ?? state.reps, state.reps + (seed.stuck ? 0 : 1));
        return;
    }

    const decision = doubleProgression({
        lastSets: repsPerSet.map((reps) => ({ loadKg: state.loadKg, reps, setType: "working" })),
        range: { min: seed.repMin ?? 0, max: seed.repMax ?? 0 },
        incrementKg: state.incrementKg,
    });

    if (decision?.kind === "increase") {
        state.loadKg = decision.loadKg;
        state.reps = seed.repMin ?? state.reps;
        return;
    }
    state.reps = Math.min(seed.repMax ?? state.reps, state.reps + 1);
}

function required<T>(value: T | undefined, label: string): T {
    if (value === undefined) {
        throw new Error(`Missing seed reference: ${label}`);
    }
    return value;
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
