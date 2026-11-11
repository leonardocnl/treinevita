import { sql } from "drizzle-orm";
import {
    check,
    customType,
    numeric,
    pgTable,
    smallint,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { auditColumns, id } from "@/shared/db/columns";

import { AVATAR_MAX_BYTES, AVATAR_MIMES } from "../domain/avatar";
import { EXPERIENCES, GOALS, TRAINING_PLACES } from "../domain/profile";

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

/**
 * What the onboarding asks, one row per person. Weight and height are health
 * data under the LGPD (ADR 0011): only the owner reads them, and they never
 * reach a log. The weekly goal lives in `training_preferences`.
 */
export const userProfiles = pgTable(
    "user_profile",
    {
        id: id(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        displayName: text("display_name").notNull(),
        goal: text("goal", { enum: GOALS }).notNull(),
        experience: text("experience", { enum: EXPERIENCES }).notNull(),
        weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
        heightCm: smallint("height_cm").notNull(),
        sessionMinutes: smallint("session_minutes"),
        trainingPlace: text("training_place", { enum: TRAINING_PLACES }),
        onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
        ...auditColumns(),
    },
    (table) => [
        uniqueIndex("user_profile_user_unique").on(table.userId),
        check("user_profile_weight_range", sql`${table.weightKg} between 30 and 300`),
        check("user_profile_height_range", sql`${table.heightCm} between 100 and 250`),
    ],
);

/** Raw bytes. Read and written as hex in SQL (application/avatar.ts), the same on every driver. */
const bytea = customType<{ data: string }>({ dataType: () => "bytea" });

/**
 * The profile photo, one per person, apart from `user_profile` so reading the
 * profile never loads the image. Only the owner reads it (GET /api/avatar).
 * Replaced in place and deleted for real on "Remover foto": no copy is kept.
 */
export const userAvatars = pgTable(
    "user_avatars",
    {
        userId: uuid("user_id")
            .primaryKey()
            .references(() => users.id, { onDelete: "cascade" }),
        bytes: bytea("bytes").notNull(),
        mime: text("mime", { enum: AVATAR_MIMES }).notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        check(
            "user_avatars_size",
            sql`octet_length(${table.bytes}) <= ${sql.raw(String(AVATAR_MAX_BYTES))}`,
        ),
        check(
            "user_avatars_mime",
            sql`${table.mime} in (${sql.raw(AVATAR_MIMES.map((mime) => `'${mime}'`).join(", "))})`,
        ),
    ],
);
