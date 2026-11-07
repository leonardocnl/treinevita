import {
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    smallint,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { exercises } from "@/modules/catalog/infrastructure/schema";
import { users } from "@/modules/identity/infrastructure/schema";
import { workspaces } from "@/modules/tenancy/infrastructure/schema";
import { prescribedExercises, workouts } from "@/modules/training/infrastructure/schema";
import { auditColumns, id } from "@/shared/db/columns";

/** Copy of the prescription at the moment of training. Editing the plan never rewrites history. */
export type PrescriptionSnapshot = {
    sets: number;
    repMin: number | null;
    repMax: number | null;
    durationMinSeconds: number | null;
    durationMaxSeconds: number | null;
    progressionRule: "double_progression" | "none";
    loadIncrementKg: number | null;
};

export const workoutSessions = pgTable(
    "workout_sessions",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        workoutId: uuid("workout_id").references(() => workouts.id, { onDelete: "set null" }),
        workoutLabel: text("workout_label"),
        timezone: text("timezone").notNull(),
        startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
        finishedAt: timestamp("finished_at", { withTimezone: true }),
        ...auditColumns(),
    },
    (table) => [
        index("workout_sessions_workspace_user_started_idx").on(
            table.workspaceId,
            table.userId,
            table.startedAt,
        ),
    ],
);

export const performedExercises = pgTable(
    "performed_exercises",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        sessionId: uuid("session_id")
            .notNull()
            .references(() => workoutSessions.id, { onDelete: "cascade" }),
        exerciseId: uuid("exercise_id")
            .notNull()
            .references(() => exercises.id),
        prescribedExerciseId: uuid("prescribed_exercise_id").references(
            () => prescribedExercises.id,
            { onDelete: "set null" },
        ),
        position: smallint("position").notNull(),
        prescriptionSnapshot: jsonb("prescription_snapshot").$type<PrescriptionSnapshot>(),
        ...auditColumns(),
    },
    (table) => [
        index("performed_exercises_session_idx").on(table.sessionId),
        index("performed_exercises_exercise_idx").on(table.workspaceId, table.exerciseId),
    ],
);

export const performedSets = pgTable(
    "performed_sets",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        performedExerciseId: uuid("performed_exercise_id")
            .notNull()
            .references(() => performedExercises.id, { onDelete: "cascade" }),
        position: smallint("position").notNull(),
        setType: text("set_type", { enum: ["warmup", "working", "drop", "failure"] })
            .notNull()
            .default("working"),
        loadKg: numeric("load_kg", { precision: 6, scale: 2 }),
        reps: smallint("reps"),
        durationSeconds: integer("duration_seconds"),
        repsInReserve: smallint("reps_in_reserve"),
        completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
        ...auditColumns(),
    },
    (table) => [index("performed_sets_exercise_idx").on(table.performedExerciseId)],
);
