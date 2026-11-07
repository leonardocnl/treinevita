import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "@/modules/identity/infrastructure/schema";
import { auditColumns, id } from "@/shared/db/columns";

/**
 * The tenant. Every user gets a personal workspace on sign-up; a gym or a
 * personal trainer will be an `organization` workspace in the future.
 */
export const workspaces = pgTable("workspaces", {
    id: id(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["personal", "organization"] }).notNull(),
    ...auditColumns(),
});

/** Who belongs to which workspace, and with which role. */
export const workspaceMemberships = pgTable(
    "workspace_memberships",
    {
        id: id(),
        workspaceId: uuid("workspace_id")
            .notNull()
            .references(() => workspaces.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        role: text("role", { enum: ["owner", "coach", "member"] }).notNull(),
        ...auditColumns(),
    },
    (table) => [
        uniqueIndex("workspace_memberships_workspace_user_unique").on(
            table.workspaceId,
            table.userId,
        ),
    ],
);
