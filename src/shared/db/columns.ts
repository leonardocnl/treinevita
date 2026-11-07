import { timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/**
 * Primary key shared by every table: UUID v7.
 * v7 ids are time-ordered (good for indexes) and not enumerable (nobody can
 * guess the next id by adding 1).
 */
export const id = () =>
    uuid("id")
        .primaryKey()
        .$defaultFn(() => uuidv7());

export const createdAt = () =>
    timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
    timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date());

/** Soft delete: rows are hidden, never physically removed by the app. */
export const deletedAt = () => timestamp("deleted_at", { withTimezone: true });

export const auditColumns = () => ({
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
});
