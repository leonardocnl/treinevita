import {
    date,
    index,
    numeric,
    pgTable,
    smallint,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { users } from "@/modules/identity/infrastructure/schema";
import { workspaces } from "@/modules/tenancy/infrastructure/schema";
import { auditColumns, id } from "@/shared/db/columns";

import { WIDGET_KINDS, WIDGET_SIZES } from "../domain/widgets";

/**
 * Weight and body measurements. Under the LGPD these can be health data
 * (sensitive personal data), so they live in their own table and only the
 * owner reads them. A coach needs an active row in `data_consents`.
 */
export const bodyMeasurements = pgTable(
    "body_measurements",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        measuredOn: date("measured_on").notNull(),
        weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
        waistCm: numeric("waist_cm", { precision: 5, scale: 1 }),
        bodyFatPercent: numeric("body_fat_percent", { precision: 4, scale: 1 }),
        chestCm: numeric("chest_cm", { precision: 5, scale: 1 }),
        shouldersCm: numeric("shoulders_cm", { precision: 5, scale: 1 }),
        hipsCm: numeric("hips_cm", { precision: 5, scale: 1 }),
        armLeftCm: numeric("arm_left_cm", { precision: 4, scale: 1 }),
        armRightCm: numeric("arm_right_cm", { precision: 4, scale: 1 }),
        thighLeftCm: numeric("thigh_left_cm", { precision: 4, scale: 1 }),
        thighRightCm: numeric("thigh_right_cm", { precision: 4, scale: 1 }),
        calfLeftCm: numeric("calf_left_cm", { precision: 4, scale: 1 }),
        calfRightCm: numeric("calf_right_cm", { precision: 4, scale: 1 }),
        ...auditColumns(),
    },
    (table) => [
        index("body_measurements_workspace_user_date_idx").on(
            table.workspaceId,
            table.userId,
            table.measuredOn,
        ),
    ],
);

/** Explicit consent for someone else (e.g. a coach) to read a person's body data. */
export const dataConsents = pgTable("data_consents", {
    id: id(),
    workspaceId: uuid("workspace_id")
        .notNull()
        .references(() => workspaces.id, { onDelete: "cascade" }),
    subjectUserId: uuid("subject_user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    granteeUserId: uuid("grantee_user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope", { enum: ["body_measurements"] }).notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...auditColumns(),
});

/** The customizable widgets on the Summary screen, per person. */
export const dashboardWidgets = pgTable(
    "dashboard_widgets",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        kind: text("kind", { enum: WIDGET_KINDS }).notNull(),
        size: text("size", { enum: WIDGET_SIZES }).notNull(),
        position: smallint("position").notNull(),
        ...auditColumns(),
    },
    (table) => [index("dashboard_widgets_workspace_user_idx").on(table.workspaceId, table.userId)],
);
