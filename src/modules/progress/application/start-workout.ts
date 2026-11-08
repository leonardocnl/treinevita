import "server-only";

import { getLastFinishedSession, startSession } from "@/modules/logging";
import { getActiveProgram, nextWorkoutInRotation } from "@/modules/training";
import type { TenantContext } from "@/shared/db/tenant";

/**
 * Starts the next workout of the rotation (or a chosen one) and returns the
 * session id. Lives here because it joins planning and execution.
 */
export async function startNextWorkout(
    context: TenantContext & { timezone: string },
    label?: string,
): Promise<string | null> {
    const program = await getActiveProgram(context);
    if (!program) {
        return null;
    }
    const lastSession = await getLastFinishedSession(context);
    const workout = label
        ? program.workouts.find((candidate) => candidate.label === label)
        : nextWorkoutInRotation(program, lastSession?.workoutLabel ?? null);
    if (!workout) {
        return null;
    }

    return startSession(context, {
        workoutId: workout.workoutId,
        label: workout.label,
        exercises: workout.exercises.map((exercise) => ({
            prescribedExerciseId: exercise.prescribedExerciseId,
            exerciseId: exercise.exerciseId,
            snapshot: {
                sets: exercise.sets,
                repMin: exercise.repMin,
                repMax: exercise.repMax,
                durationMinSeconds: exercise.durationMinSeconds,
                durationMaxSeconds: exercise.durationMaxSeconds,
                progressionRule: exercise.progressionRule,
                loadIncrementKg: exercise.incrementKg,
            },
        })),
    });
}
