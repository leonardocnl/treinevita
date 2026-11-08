import "server-only";

import { getExercisesByIds, type ExerciseMedia } from "@/modules/catalog";
import { getLastSetsByExercise, type OpenSession, type PerformedSet } from "@/modules/logging";
import type { TenantContext } from "@/shared/db/tenant";

import { progressionStrategies, type LoadDecision } from "../domain/progression";

export type ExerciseView = {
    readonly performedExerciseId: string;
    readonly exerciseId: string;
    readonly position: number;
    readonly name: string;
    readonly measurement: "load_reps" | "duration";
    readonly videoUrl: string | null;
    readonly media: ExerciseMedia | null;
    readonly targetSets: number;
    readonly repMin: number | null;
    readonly repMax: number | null;
    readonly durationMinSeconds: number | null;
    readonly durationMaxSeconds: number | null;
    readonly incrementKg: number;
    readonly doneSets: readonly PerformedSet[];
    readonly lastTime: {
        readonly performedOn: Date;
        readonly sets: readonly PerformedSet[];
    } | null;
    readonly decision: LoadDecision | null;
    /** Where the wheel opens for the next set. */
    readonly suggested: {
        readonly loadKg: number;
        readonly reps: number;
        readonly durationSeconds: number;
    };
};

export type WorkoutView = {
    readonly sessionId: string;
    readonly label: string;
    readonly startedAt: Date;
    readonly exercises: readonly ExerciseView[];
};

/**
 * Everything the workout screens need, with the progression already decided:
 * the wheel opens on the right load and the screen only asks when in doubt.
 */
export async function getWorkoutView(
    context: TenantContext,
    session: OpenSession,
): Promise<WorkoutView> {
    const exerciseIds = session.exercises.map((exercise) => exercise.exerciseId);
    const [catalog, history] = await Promise.all([
        getExercisesByIds(context, exerciseIds),
        getLastSetsByExercise(context, exerciseIds),
    ]);

    const exercises = session.exercises.map((exercise): ExerciseView => {
        const info = catalog.get(exercise.exerciseId);
        const prescription = exercise.prescription;
        const lastTime = history.get(exercise.exerciseId) ?? null;
        const incrementKg = prescription?.loadIncrementKg ?? info?.defaultIncrementKg ?? 2.5;
        const repMin = prescription?.repMin ?? null;
        const repMax = prescription?.repMax ?? null;

        let decision: LoadDecision | null = null;
        if (lastTime && repMin !== null && repMax !== null) {
            decision = progressionStrategies[prescription?.progressionRule ?? "double_progression"](
                {
                    lastSets: lastTime.sets
                        .filter((set) => set.loadKg !== null && set.reps !== null)
                        .map((set) => ({
                            loadKg: set.loadKg ?? 0,
                            reps: set.reps ?? 0,
                            setType: set.setType,
                        })),
                    range: { min: repMin, max: repMax },
                    incrementKg,
                },
            );
        }

        const previousInSession = exercise.sets.at(-1);
        const lastDuration = lastTime?.sets.at(-1)?.durationSeconds ?? null;
        const suggested = {
            loadKg:
                previousInSession?.loadKg ?? decision?.loadKg ?? lastTime?.sets.at(-1)?.loadKg ?? 0,
            reps:
                previousInSession?.reps ??
                (decision?.kind === "increase"
                    ? (repMin ?? 10)
                    : (lastTime?.sets[0]?.reps ?? repMin ?? 10)),
            durationSeconds:
                previousInSession?.durationSeconds ??
                lastDuration ??
                prescription?.durationMinSeconds ??
                30,
        };

        return {
            performedExerciseId: exercise.performedExerciseId,
            exerciseId: exercise.exerciseId,
            position: exercise.position,
            name: info?.name ?? "Exercício",
            measurement: info?.measurement ?? "load_reps",
            videoUrl: info?.videoUrl ?? null,
            media: info?.media ?? null,
            targetSets: prescription?.sets ?? 3,
            repMin,
            repMax,
            durationMinSeconds: prescription?.durationMinSeconds ?? null,
            durationMaxSeconds: prescription?.durationMaxSeconds ?? null,
            incrementKg,
            doneSets: exercise.sets,
            lastTime,
            decision,
            suggested,
        };
    });

    return {
        sessionId: session.sessionId,
        label: session.workoutLabel ?? "",
        startedAt: session.startedAt,
        exercises,
    };
}
