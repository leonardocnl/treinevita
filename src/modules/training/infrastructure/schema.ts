import {
    date,
    index,
    integer,
    numeric,
    pgTable,
    smallint,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { exercises } from "@/modules/catalog/infrastructure/schema";
import { users } from "@/modules/identity/infrastructure/schema";
import { workspaces } from "@/modules/tenancy/infrastructure/schema";
import { auditColumns, id } from "@/shared/db/columns";

/** A training plan (the "ficha"). Only one is active per person at a time. */
export const programs = pgTable(
    "programs",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        athleteUserId: uuid("athlete_user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdByUserId: uuid("created_by_user_id")
            .notNull()
            .references(() => users.id),
        name: text("name").notNull(),
        status: text("status", { enum: ["active", "archived"] })
            .notNull()
            .default("active"),
        startedOn: date("started_on").notNull(),
        archivedAt: timestamp("archived_at", { withTimezone: true }),
        ...auditColumns(),
    },
    (table) => [index("programs_workspace_athlete_idx").on(table.workspaceId, table.athleteUserId)],
);

/** One day of the plan: A, B, C... */
export const workouts = pgTable(
    "workouts",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        programId: uuid("program_id")
            .notNull()
            .references(() => programs.id, { onDelete: "cascade" }),
        label: text("label").notNull(),
        position: smallint("position").notNull(),
        ...auditColumns(),
    },
    (table) => [uniqueIndex("workouts_program_label_unique").on(table.programId, table.label)],
);

/** What the plan asks for in each exercise. */
export const prescribedExercises = pgTable(
    "prescribed_exercises",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        workoutId: uuid("workout_id")
            .notNull()
            .references(() => workouts.id, { onDelete: "cascade" }),
        exerciseId: uuid("exercise_id")
            .notNull()
            .references(() => exercises.id),
        position: smallint("position").notNull(),
        sets: smallint("sets").notNull(),
        repMin: smallint("rep_min"),
        repMax: smallint("rep_max"),
        durationMinSeconds: integer("duration_min_seconds"),
        durationMaxSeconds: integer("duration_max_seconds"),
        restSeconds: integer("rest_seconds"),
        progressionRule: text("progression_rule", { enum: ["double_progression", "none"] })
            .notNull()
            .default("double_progression"),
        loadIncrementKg: numeric("load_increment_kg", { precision: 5, scale: 2 }),
        videoUrl: text("video_url"),
        notes: text("notes"),
        ...auditColumns(),
    },
    (table) => [index("prescribed_exercises_workout_idx").on(table.workoutId)],
);

/** Personal training preferences, such as the weekly goal. */
export const trainingPreferences = pgTable(
    "training_preferences",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        weeklyGoal: smallint("weekly_goal").notNull().default(3),
        ...auditColumns(),
    },
    (table) => [
        uniqueIndex("training_preferences_workspace_user_unique").on(
            table.workspaceId,
            table.userId,
        ),
    ],
);
