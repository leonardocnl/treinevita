import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";

import { DEFAULT_LAYOUT, sanitizeLayout, type WidgetPlacement } from "../domain/widgets";
import { dashboardWidgets } from "../infrastructure/schema";

/** The person's widget layout, or the default one when they never edited it. */
export async function getDashboardLayout(context: TenantContext): Promise<WidgetPlacement[]> {
    const db = await getDb();
    const rows = await db
        .select({ kind: dashboardWidgets.kind, size: dashboardWidgets.size })
        .from(dashboardWidgets)
        .where(
            and(inTenant(dashboardWidgets, context), eq(dashboardWidgets.userId, context.userId)),
        )
        .orderBy(asc(dashboardWidgets.position));

    if (rows.length === 0) {
        return [...DEFAULT_LAYOUT];
    }
    return sanitizeLayout(rows);
}

/** Replaces the layout. Input is validated against the catalog before anything is written. */
export async function saveDashboardLayout(
    context: TenantContext,
    input: readonly { kind: string; size: string }[],
): Promise<WidgetPlacement[]> {
    const layout = sanitizeLayout(input);
    const db = await getDb();
    await db.transaction(async (tx) => {
        await tx
            .delete(dashboardWidgets)
            .where(
                and(
                    inTenant(dashboardWidgets, context),
                    eq(dashboardWidgets.userId, context.userId),
                ),
            );
        if (layout.length > 0) {
            await tx.insert(dashboardWidgets).values(
                layout.map((widget, position) => ({
                    workspaceId: context.workspaceId,
                    userId: context.userId,
                    kind: widget.kind,
                    size: widget.size,
                    position,
                })),
            );
        }
    });
    return layout;
}
