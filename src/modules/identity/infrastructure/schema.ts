import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { auditColumns, id } from "@/shared/db/columns";

/** A person who uses VITA. Profile data only; how they sign in lives in `identities`. */
export const users = pgTable(
    "users",
    {
        id: id(),
        email: text("email").notNull(),
        displayName: text("display_name"),
        timezone: text("timezone").notNull().default("America/Sao_Paulo"),
        weightUnit: text("weight_unit", { enum: ["kg", "lb"] })
            .notNull()
            .default("kg"),
        ...auditColumns(),
    },
    (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

/**
 * A way to sign in (Google today; email code or company SSO later).
 * Kept apart from `users` so new providers do not change the user model.
 */
export const identities = pgTable(
    "identities",
    {
        id: id(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        provider: text("provider", { enum: ["google"] }).notNull(),
        providerSubject: text("provider_subject").notNull(),
        ...auditColumns(),
    },
    (table) => [
        uniqueIndex("identities_provider_subject_unique").on(table.provider, table.providerSubject),
    ],
);

/**
 * Server-side sessions. Only a hash of the token is stored, so a leaked
 * database dump cannot be used to hijack sessions.
 */
export const sessions = pgTable(
    "sessions",
    {
        id: id(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        tokenHash: text("token_hash").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)],
);
