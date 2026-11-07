import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/identity";
import { getDb } from "@/platform/db/client";
import type { TenantContext } from "@/shared/db/tenant";

import { workspaceMemberships, workspaces } from "../infrastructure/schema";

export type AppContext = TenantContext & {
    readonly timezone: string;
    readonly displayName: string | null;
};

/**
 * The entry point of every signed-in screen: who is acting and in which
 * workspace. Sends to the sign-in screen when there is no valid session.
 * For now the personal workspace is used; choosing among several comes with B2B.
 */
export async function requireAppContext(): Promise<AppContext> {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/entrar");
    }

    const db = await getDb();
    const [membership] = await db
        .select({ workspaceId: workspaceMemberships.workspaceId })
        .from(workspaceMemberships)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMemberships.workspaceId))
        .where(
            and(
                eq(workspaceMemberships.userId, user.id),
                eq(workspaces.kind, "personal"),
                isNull(workspaceMemberships.deletedAt),
                isNull(workspaces.deletedAt),
            ),
        )
        .limit(1);

    if (!membership) {
        redirect("/entrar");
    }

    return {
        workspaceId: membership.workspaceId,
        userId: user.id,
        timezone: user.timezone,
        displayName: user.displayName,
    };
}
