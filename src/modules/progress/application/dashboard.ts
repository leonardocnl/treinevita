import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { ownCustomTrackerIds } from "@/modules/habits";
import { getDb } from "@/platform/db/client";
import { inTenant, type TenantContext } from "@/shared/db/tenant";

import {
    DEFAULT_LAYOUT,
    isValidLayout,
    sanitizeLayout,
    type WidgetPlacement,
} from "../domain/widgets";
import { dashboardWidgets } from "../infrastructure/schema";

function own(context: TenantContext) {
    return and(inTenant(dashboardWidgets, context), eq(dashboardWidgets.userId, context.userId));
}

/**
 * The person's home layout, or the default one when they never edited it.
 * Rows saved by the v1 catalog are migrated here (old kinds mapped, unknown dropped).
 */
export async function getDashboardLayout(context: TenantContext): Promise<WidgetPlacement[]> {
    const db = await getDb();
    const rows = await db
        .select({
            kind: dashboardWidgets.kind,
            size: dashboardWidgets.size,
            ref: dashboardWidgets.ref,
        })
        .from(dashboardWidgets)
        .where(own(context))
        .orderBy(asc(dashboardWidgets.position));

    if (rows.length === 0) {
        return [...DEFAULT_LAYOUT];
    }
    const refs = rows.flatMap((row) => (row.ref ? [row.ref] : []));
    return sanitizeLayout(rows, await ownCustomTrackerIds(context, refs));
}

/**
 * Replaces the layout. Rejected unless every widget is a v2 kind with an
 * allowed size (at most 24) and every custom tracker id belongs to the person.
 */
export async function saveDashboardLayout(
    context: TenantContext,
    input: readonly { kind: string; size: string; ref: string | null }[],
): Promise<WidgetPlacement[] | null> {
    if (!isValidLayout(input)) {
        return null;
    }
    const refs = input.flatMap((item) => (item.ref ? [item.ref] : []));
    const owned = await ownCustomTrackerIds(context, refs);
    if (refs.some((ref) => !owned.has(ref))) {
        return null;
    }
    const layout = sanitizeLayout(input, owned);
    const db = await getDb();
    await db.transaction(async (tx) => {
        await tx.delete(dashboardWidgets).where(own(context));
        if (layout.length > 0) {
            await tx.insert(dashboardWidgets).values(
                layout.map((widget, position) => ({
                    workspaceId: context.workspaceId,
                    userId: context.userId,
                    kind: widget.kind,
                    size: widget.size,
                    ref: widget.ref,
                    position,
                })),
            );
        }
    });
    return layout;
}
