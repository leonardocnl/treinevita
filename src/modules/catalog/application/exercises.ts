import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { getDb } from "@/platform/db/client";
import type { TenantContext } from "@/shared/db/tenant";

import { exerciseMuscleGroups, exercises, muscleGroups } from "../infrastructure/schema";

export type CatalogExercise = {
    readonly id: string;
    readonly name: string;
    readonly measurement: "load_reps" | "duration";
    readonly defaultIncrementKg: number;
    readonly videoUrl: string | null;
    readonly muscles: readonly { slug: string; name: string; role: "primary" | "secondary" }[];
};

/** Global exercises plus the workspace's own ones, by id. */
export async function getExercisesByIds(
    context: TenantContext,
    ids: readonly string[],
): Promise<Map<string, CatalogExercise>> {
    const result = new Map<string, CatalogExercise>();
    if (ids.length === 0) {
        return result;
    }

    const db = await getDb();
    const rows = await db
        .select({
            id: exercises.id,
            name: exercises.name,
            measurement: exercises.measurement,
            defaultIncrementKg: exercises.defaultIncrementKg,
            videoUrl: exercises.videoUrl,
        })
        .from(exercises)
        .where(
            and(
                inArray(exercises.id, [...ids]),
                isNull(exercises.deletedAt),
                or(isNull(exercises.workspaceId), eq(exercises.workspaceId, context.workspaceId)),
            ),
        );

    const muscleRows = await db
        .select({
            exerciseId: exerciseMuscleGroups.exerciseId,
            role: exerciseMuscleGroups.role,
            slug: muscleGroups.slug,
            name: muscleGroups.name,
        })
        .from(exerciseMuscleGroups)
        .innerJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
        .where(inArray(exerciseMuscleGroups.exerciseId, [...ids]));

    for (const row of rows) {
        result.set(row.id, {
            id: row.id,
            name: row.name,
            measurement: row.measurement,
            defaultIncrementKg: Number(row.defaultIncrementKg),
            videoUrl: row.videoUrl,
            muscles: muscleRows
                .filter((muscle) => muscle.exerciseId === row.id)
                .map((muscle) => ({ slug: muscle.slug, name: muscle.name, role: muscle.role })),
        });
    }

    return result;
}
