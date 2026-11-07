import { and, eq, isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * Who is acting and inside which workspace.
 *
 * Every repository function that reads or writes domain data receives this
 * object. There is no way to query domain tables without it, so a workspace
 * can never see another workspace's rows by accident.
 */
export type TenantContext = {
    readonly workspaceId: string;
    readonly userId: string;
};

type ScopedTable = {
    workspaceId: PgColumn;
    deletedAt: PgColumn;
};

/** Filter that limits a query to the current workspace and hides soft-deleted rows. */
export function inTenant(table: ScopedTable, context: TenantContext): SQL {
    const condition = and(eq(table.workspaceId, context.workspaceId), isNull(table.deletedAt));
    if (!condition) {
        throw new Error("Could not build tenant filter");
    }
    return condition;
}
