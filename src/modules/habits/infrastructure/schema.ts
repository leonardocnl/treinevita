import { date, index, numeric, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { users } from "@/modules/identity/infrastructure/schema";
import { workspaces } from "@/modules/tenancy/infrastructure/schema";
import { auditColumns, id } from "@/shared/db/columns";

import { TRACKER_KINDS, VALUE_TYPES } from "../domain/trackers";

/**
 * A manual tracker of a person: one row per built-in kind (sleep, water, steps,
 * energy) once used, plus up to 10 custom ones. Sleep and energy are health-related
 * data (LGPD): only the owner reads them, and they are never logged.
 */
export const habitTrackers = pgTable(
    "habit_trackers",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        kind: text("kind", { enum: TRACKER_KINDS }).notNull(),
        /** Custom trackers only. */
        name: text("name"),
        valueType: text("value_type", { enum: VALUE_TYPES }),
        unit: text("unit"),
        goal: numeric("goal", { precision: 9, scale: 2 }).notNull(),
        ...auditColumns(),
    },
    (table) => [
        index("habit_trackers_workspace_user_idx").on(table.workspaceId, table.userId),
        // One live row per built-in kind and person.
        uniqueIndex("habit_trackers_built_in_unique")
            .on(table.workspaceId, table.userId, table.kind)
            .where(sql`${table.kind} <> 'custom' AND ${table.deletedAt} IS NULL`),
    ],
);

/** One entry per tracker and day: logging again replaces the day's value. */
export const habitEntries = pgTable(
    "habit_entries",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        trackerId: uuid("tracker_id")
            .notNull()
            .references(() => habitTrackers.id, { onDelete: "cascade" }),
        day: date("day").notNull(),
        value: numeric("value", { precision: 9, scale: 2 }).notNull(),
        /** Steps only: cardio minutes of the day. */
        secondary: numeric("secondary", { precision: 9, scale: 2 }),
        ...auditColumns(),
    },
    (table) => [
        uniqueIndex("habit_entries_tracker_day_unique")
            .on(table.trackerId, table.day)
            .where(sql`${table.deletedAt} IS NULL`),
        index("habit_entries_workspace_day_idx").on(table.workspaceId, table.day),
    ],
);
