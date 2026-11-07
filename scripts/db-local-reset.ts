/**
 * Recreates the local development database from scratch and fills it with
 * mock data. Never touches Neon: it only writes to ./.data/pglite.
 *
 * Usage: npm run db:local:reset
 */
import { mkdir, rm } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { doubleProgression } from "../src/modules/progress";
import { LOCAL_DATABASE_PATH } from "../src/platform/db/drivers";
import { schema } from "../src/platform/db/schema";

import {
    bodyMeasurementSeeds,
    exerciseSeeds,
    muscleGroupSeeds,
    trainingDays,
    workoutSeeds,
} from "./seed-data";

const OWNER_EMAIL = "leonardocnl.dev@gmail.com";
const TIMEZONE = "America/Sao_Paulo";

async function main() {
    if (process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL is set. This script only resets the local database; unset it first.",
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

    const muscles = await db
        .insert(schema.muscleGroups)
        .values([...muscleGroupSeeds])
        .returning();
    const muscleIdBySlug = new Map(muscles.map((muscle) => [muscle.slug, muscle.id]));

    const exerciseIdByKey = new Map<string, string>();
    for (const seed of exerciseSeeds) {
        const [exercise] = await db
            .insert(schema.exercises)
            .values({
                name: seed.name,
                equipment: seed.equipment,
                movementPattern: seed.movementPattern,
                measurement: seed.measurement ?? "load_reps",
                defaultIncrementKg: String(seed.incrementKg),
            })
            .returning();
        exerciseIdByKey.set(seed.key, exercise.id);

        const links = [
            ...seed.primary.map((slug) => ({ slug, role: "primary" as const })),
            ...(seed.secondary ?? []).map((slug) => ({ slug, role: "secondary" as const })),
        ];
        await db.insert(schema.exerciseMuscleGroups).values(
            links.map((link) => ({
                exerciseId: exercise.id,
                muscleGroupId: required(muscleIdBySlug.get(link.slug), link.slug),
                role: link.role,
            })),
        );
    }

    const [program] = await db
        .insert(schema.programs)
        .values({
            workspaceId: workspace.id,
            athleteUserId: owner.id,
            createdByUserId: owner.id,
            name: "Ficha de novembro",
            startedOn: "2026-09-28",
        })
        .returning();

    type PrescriptionState = {
        prescribedExerciseId: string;
        exerciseId: string;
        seed: (typeof workoutSeeds)[number]["exercises"][number];
        incrementKg: number;
        loadKg: number;
        reps: number;
        durationSeconds: number;
    };

    const workoutIdByLabel = new Map<string, string>();
    const stateByLabel = new Map<string, PrescriptionState[]>();

    for (const [workoutIndex, workoutSeed] of workoutSeeds.entries()) {
        const [workout] = await db
            .insert(schema.workouts)
            .values({
                workspaceId: workspace.id,
                programId: program.id,
                label: workoutSeed.label,
                position: workoutIndex,
            })
            .returning();
        workoutIdByLabel.set(workoutSeed.label, workout.id);

        const states: PrescriptionState[] = [];
        for (const [position, seed] of workoutSeed.exercises.entries()) {
            const exerciseSeed = required(
                exerciseSeeds.find((candidate) => candidate.key === seed.exercise),
                seed.exercise,
            );
            const [prescribed] = await db
                .insert(schema.prescribedExercises)
                .values({
                    workspaceId: workspace.id,
                    workoutId: workout.id,
                    exerciseId: required(exerciseIdByKey.get(seed.exercise), seed.exercise),
                    position,
                    sets: 3,
                    repMin: seed.repMin ?? null,
                    repMax: seed.repMax ?? null,
                    durationMinSeconds: seed.durationMin ?? null,
                    durationMaxSeconds: seed.durationMax ?? null,
                    restSeconds: seed.restSeconds,
                    progressionRule: exerciseSeed.incrementKg > 0 ? "double_progression" : "none",
                })
                .returning();

            states.push({
                prescribedExerciseId: prescribed.id,
                exerciseId: prescribed.exerciseId,
                seed,
                incrementKg: exerciseSeed.incrementKg,
                loadKg: seed.startLoadKg,
                reps: seed.repMin ?? 0,
                durationSeconds: seed.durationMin ?? 0,
            });
        }
        stateByLabel.set(workoutSeed.label, states);
    }

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

        const states = required(stateByLabel.get(day.label), day.label);
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

    const widgets = [
        { kind: "weekly_goal", size: "medium" },
        { kind: "body_weight", size: "small" },
        { kind: "personal_record", size: "small" },
        { kind: "next_workout", size: "medium" },
        { kind: "training_calendar", size: "small" },
        { kind: "waist", size: "small" },
    ] as const;
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
        `Local database ready at ${LOCAL_DATABASE_PATH}: 1 user, ${exerciseSeeds.length} exercises, ` +
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
