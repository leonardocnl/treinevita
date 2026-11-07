import { index, numeric, pgTable, primaryKey, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { workspaces } from "@/modules/tenancy/infrastructure/schema";
import { auditColumns, id } from "@/shared/db/columns";

export const muscleGroups = pgTable(
    "muscle_groups",
    {
        id: id(),
        slug: text("slug").notNull(),
        name: text("name").notNull(),
    },
    (table) => [uniqueIndex("muscle_groups_slug_unique").on(table.slug)],
);

/**
 * Exercise catalog. `workspace_id` null means a global (system) exercise;
 * otherwise it is a custom exercise that only that workspace sees.
 */
export const exercises = pgTable(
    "exercises",
    {
        id: id(),
        workspaceId: uuid("workspace_id").references(() => workspaces.id, {
            onDelete: "cascade",
        }),
        name: text("name").notNull(),
        equipment: text("equipment", {
            enum: ["machine", "barbell", "dumbbell", "cable", "bodyweight", "other"],
        }).notNull(),
        movementPattern: text("movement_pattern", {
            enum: [
                "horizontal_push",
                "vertical_push",
                "horizontal_pull",
                "vertical_pull",
                "squat",
                "hinge",
                "lunge",
                "isolation",
                "core",
            ],
        }).notNull(),
        measurement: text("measurement", { enum: ["load_reps", "duration"] })
            .notNull()
            .default("load_reps"),
        demoImagePath: text("demo_image_path"),
        videoUrl: text("video_url"),
        defaultIncrementKg: numeric("default_increment_kg", { precision: 5, scale: 2 })
            .notNull()
            .default("2.5"),
        ...auditColumns(),
    },
    (table) => [index("exercises_workspace_idx").on(table.workspaceId)],
);

export const exerciseMuscleGroups = pgTable(
    "exercise_muscle_groups",
    {
        exerciseId: uuid("exercise_id")
            .notNull()
            .references(() => exercises.id, { onDelete: "cascade" }),
        muscleGroupId: uuid("muscle_group_id")
            .notNull()
            .references(() => muscleGroups.id, { onDelete: "cascade" }),
        role: text("role", { enum: ["primary", "secondary"] }).notNull(),
    },
    (table) => [primaryKey({ columns: [table.exerciseId, table.muscleGroupId] })],
);
