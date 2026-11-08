import "server-only";

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";

import { getDb, type Database } from "@/platform/db/client";
import type { TenantContext } from "@/shared/db/tenant";

import { exerciseMuscleGroups, exercises, muscleGroups } from "../infrastructure/schema";

/** The start and end drawings of an exercise, as public file paths. */
export type ExerciseMedia = { readonly start: string; readonly end: string };

export type CatalogExercise = {
    readonly id: string;
    readonly name: string;
    readonly measurement: "load_reps" | "duration";
    readonly defaultIncrementKg: number;
    readonly videoUrl: string | null;
    readonly media: ExerciseMedia | null;
    readonly muscles: readonly { slug: string; name: string; role: "primary" | "secondary" }[];
};

// Media paths end up inside a CSS url(); only paths written by the import script pass.
const MEDIA_PATH = /^\/exercises\/[a-z0-9_]+\/(start|end)\.svg$/;

function toMedia(row: {
    mediaSource: "everkinetic" | "none" | "own";
    mediaStartPath: string | null;
    mediaEndPath: string | null;
}): ExerciseMedia | null {
    if (
        row.mediaSource === "none" ||
        !row.mediaStartPath ||
        !row.mediaEndPath ||
        !MEDIA_PATH.test(row.mediaStartPath) ||
        !MEDIA_PATH.test(row.mediaEndPath)
    ) {
        return null;
    }
    return { start: row.mediaStartPath, end: row.mediaEndPath };
}

const mediaColumns = {
    mediaSource: exercises.mediaSource,
    mediaStartPath: exercises.mediaStartPath,
    mediaEndPath: exercises.mediaEndPath,
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
            ...mediaColumns,
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
            media: toMedia(row),
            muscles: muscleRows
                .filter((muscle) => muscle.exerciseId === row.id)
                .map((muscle) => ({ slug: muscle.slug, name: muscle.name, role: muscle.role })),
        });
    }

    return result;
}

export type GlobalExerciseRef = {
    readonly id: string;
    readonly incrementKg: number;
    readonly measurement: "load_reps" | "duration";
};

/** Global exercises by slug (the keys of the seeded catalog). Pass `db` inside a transaction. */
export async function getGlobalExercisesBySlug(
    context: TenantContext,
    slugs: readonly string[],
    db?: Database,
): Promise<Map<string, GlobalExerciseRef>> {
    const rows = await (db ?? (await getDb()))
        .select({
            id: exercises.id,
            slug: exercises.slug,
            incrementKg: exercises.defaultIncrementKg,
            measurement: exercises.measurement,
        })
        .from(exercises)
        .where(
            and(
                inArray(exercises.slug, [...slugs]),
                isNull(exercises.workspaceId),
                isNull(exercises.deletedAt),
            ),
        );
    return new Map(
        rows.map((row) => [
            String(row.slug),
            { id: row.id, incrementKg: Number(row.incrementKg), measurement: row.measurement },
        ]),
    );
}

export type CatalogEntry = {
    readonly slug: string;
    readonly name: string;
    readonly primaryMuscles: readonly { readonly slug: string; readonly name: string }[];
    readonly media: ExerciseMedia | null;
};

/** The global catalog for choosing exercises (onboarding review), sorted by name. */
export async function listGlobalExercises(): Promise<CatalogEntry[]> {
    const db = await getDb();
    const rows = await db
        .select({
            id: exercises.id,
            slug: exercises.slug,
            name: exercises.name,
            ...mediaColumns,
        })
        .from(exercises)
        .where(and(isNull(exercises.workspaceId), isNull(exercises.deletedAt)))
        .orderBy(asc(exercises.name));
    const primaries = await db
        .select({
            exerciseId: exerciseMuscleGroups.exerciseId,
            slug: muscleGroups.slug,
            name: muscleGroups.name,
        })
        .from(exerciseMuscleGroups)
        .innerJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
        .where(eq(exerciseMuscleGroups.role, "primary"));

    return rows.flatMap((row) => {
        if (!row.slug) {
            return [];
        }
        return [
            {
                slug: row.slug,
                name: row.name,
                primaryMuscles: primaries
                    .filter((muscle) => muscle.exerciseId === row.id)
                    .map(({ slug, name }) => ({ slug, name })),
                media: toMedia(row),
            },
        ];
    });
}
