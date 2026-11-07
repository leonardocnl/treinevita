import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { getExercisesByIds } from "@/modules/catalog";
import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";

import {
    prescribedExercises,
    programs,
    trainingPreferences,
    workouts,
} from "../infrastructure/schema";

export type PrescribedExercise = {
    readonly prescribedExerciseId: string;
    readonly exerciseId: string;
    readonly name: string;
    readonly measurement: "load_reps" | "duration";
    readonly position: number;
    readonly sets: number;
    readonly repMin: number | null;
    readonly repMax: number | null;
    readonly durationMinSeconds: number | null;
    readonly durationMaxSeconds: number | null;
    readonly restSeconds: number | null;
    readonly progressionRule: "double_progression" | "none";
    readonly incrementKg: number;
    readonly videoUrl: string | null;
};

export type Workout = {
    readonly workoutId: string;
    readonly label: string;
    readonly position: number;
    readonly exercises: readonly PrescribedExercise[];
};

export type ActiveProgram = {
    readonly programId: string;
    readonly name: string;
    readonly workouts: readonly Workout[];
};

/** The person's active plan with every workout and prescription, or null when there is none. */
export async function getActiveProgram(context: TenantContext): Promise<ActiveProgram | null> {
    const db = await getDb();
    const [program] = await db
        .select({ id: programs.id, name: programs.name })
        .from(programs)
        .where(
            and(
                inTenant(programs, context),
                eq(programs.athleteUserId, context.userId),
                eq(programs.status, "active"),
            ),
        )
        .limit(1);

    if (!program) {
        return null;
    }

    const workoutRows = await db
        .select({ id: workouts.id, label: workouts.label, position: workouts.position })
        .from(workouts)
        .where(and(inTenant(workouts, context), eq(workouts.programId, program.id)))
        .orderBy(asc(workouts.position));

    const prescriptionRows =
        workoutRows.length === 0
            ? []
            : await db
                  .select()
                  .from(prescribedExercises)
                  .where(
                      and(
                          inTenant(prescribedExercises, context),
                          inArray(
                              prescribedExercises.workoutId,
                              workoutRows.map((workout) => workout.id),
                          ),
                      ),
                  )
                  .orderBy(asc(prescribedExercises.position));

    const catalog = await getExercisesByIds(
        context,
        prescriptionRows.map((row) => row.exerciseId),
    );

    return {
        programId: program.id,
        name: program.name,
        workouts: workoutRows.map((workout) => ({
            workoutId: workout.id,
            label: workout.label,
            position: workout.position,
            exercises: prescriptionRows
                .filter((row) => row.workoutId === workout.id)
                .map((row) => {
                    const exercise = catalog.get(row.exerciseId);
                    return {
                        prescribedExerciseId: row.id,
                        exerciseId: row.exerciseId,
                        name: exercise?.name ?? "Exercício",
                        measurement: exercise?.measurement ?? "load_reps",
                        position: row.position,
                        sets: row.sets,
                        repMin: row.repMin,
                        repMax: row.repMax,
                        durationMinSeconds: row.durationMinSeconds,
                        durationMaxSeconds: row.durationMaxSeconds,
                        restSeconds: row.restSeconds,
                        progressionRule: row.progressionRule,
                        incrementKg: Number(
                            row.loadIncrementKg ?? exercise?.defaultIncrementKg ?? 2.5,
                        ),
                        videoUrl: row.videoUrl ?? exercise?.videoUrl ?? null,
                    };
                }),
        })),
    };
}

export async function getWeeklyGoal(context: TenantContext): Promise<number> {
    const db = await getDb();
    const [row] = await db
        .select({ weeklyGoal: trainingPreferences.weeklyGoal })
        .from(trainingPreferences)
        .where(
            and(
                inTenant(trainingPreferences, context),
                eq(trainingPreferences.userId, context.userId),
            ),
        )
        .limit(1);
    return row?.weeklyGoal ?? 3;
}

/** Next workout in the A → B → C rotation, after the last one trained. */
export function nextWorkoutInRotation(
    program: ActiveProgram,
    lastLabel: string | null,
): Workout | null {
    if (program.workouts.length === 0) {
        return null;
    }
    const index = program.workouts.findIndex((workout) => workout.label === lastLabel);
    return program.workouts[(index + 1) % program.workouts.length];
}
