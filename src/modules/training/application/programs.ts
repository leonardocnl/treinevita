import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { getExercisesByIds, getGlobalExercisesBySlug, type ExerciseMedia } from "@/modules/catalog";
import { getDb, type Database } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";
import { toLocalDate } from "@/shared/time/local-date";

import {
    prescribedExercises,
    programs,
    trainingPreferences,
    workouts,
} from "../infrastructure/schema";
import { resolveDays, TEMPLATES, type ProgramChoice } from "../domain/templates";
import { insertProgram } from "../infrastructure/starter-program";

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
    /** The prescription's own link, or else the catalog's reference page. */
    readonly referenceUrl: string | null;
    readonly media: ExerciseMedia | null;
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
                        referenceUrl: row.videoUrl ?? exercise?.referenceUrl ?? null,
                        media: exercise?.media ?? null,
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

/** Sets the weekly goal (the one the Semana widget counts). Pass the caller's transaction. */
export async function setWeeklyGoal(
    db: Database,
    context: TenantContext,
    weeklyGoal: number,
): Promise<void> {
    await db
        .insert(trainingPreferences)
        .values({ workspaceId: context.workspaceId, userId: context.userId, weeklyGoal })
        .onConflictDoUpdate({
            target: [trainingPreferences.workspaceId, trainingPreferences.userId],
            set: { weeklyGoal, updatedAt: new Date() },
        });
}

/**
 * Applies the program chosen in the onboarding, inside the caller's
 * transaction. "keep" leaves the active program as it is; a template archives
 * the active program and creates the new one. Every slug is checked against
 * the global catalog. Returns false when the choice is not valid.
 */
export async function applyProgramChoice(
    db: Database,
    context: TenantContext & { timezone: string },
    choice: ProgramChoice,
): Promise<boolean> {
    const [active] = await db
        .select({ id: programs.id })
        .from(programs)
        .where(
            and(
                inTenant(programs, context),
                eq(programs.athleteUserId, context.userId),
                eq(programs.status, "active"),
            ),
        );

    if (choice.kind === "keep") {
        return active !== undefined;
    }

    const catalog = await getGlobalExercisesBySlug(context, choice.days.flat(), db);
    if (choice.days.flat().some((slug) => !catalog.has(slug))) {
        return false;
    }
    const days = resolveDays(
        choice.templateId,
        choice.days,
        (slug) => catalog.get(slug)?.measurement === "duration",
    );
    if (!days) {
        return false;
    }

    const now = new Date();
    await db
        .update(programs)
        .set({ status: "archived", archivedAt: now })
        .where(
            and(
                inTenant(programs, context),
                eq(programs.athleteUserId, context.userId),
                eq(programs.status, "active"),
            ),
        );
    await insertProgram(
        db,
        context,
        {
            name: TEMPLATES[choice.templateId].name,
            days,
            startedOn: toLocalDate(now, context.timezone),
        },
        catalog,
    );
    return true;
}
