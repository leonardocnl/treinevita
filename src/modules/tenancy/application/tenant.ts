import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/identity";
import { getDb, type Database } from "@/platform/db/client";
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
function personalMembership(db: Database, userId: string) {
    return db
        .select({ workspaceId: workspaceMemberships.workspaceId })
        .from(workspaceMemberships)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMemberships.workspaceId))
        .where(
            and(
                eq(workspaceMemberships.userId, userId),
                eq(workspaces.kind, "personal"),
                isNull(workspaceMemberships.deletedAt),
                isNull(workspaces.deletedAt),
            ),
        )
        .limit(1);
}

/**
 * Creates the person's personal workspace on first sign-in and runs `onCreate`
 * (e.g. the starter program) in the same transaction. A per-user advisory lock
 * keeps two simultaneous first sign-ins from creating two workspaces.
 */
export async function ensurePersonalWorkspace(
    user: { readonly id: string; readonly displayName: string | null },
    onCreate: (db: Database, context: TenantContext) => Promise<void>,
): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user.id}))`);
        const [existing] = await personalMembership(tx, user.id);
        if (existing) {
            return;
        }
        const [workspace] = await tx
            .insert(workspaces)
            .values({ name: user.displayName ?? "Pessoal", kind: "personal" })
            .returning({ id: workspaces.id });
        await tx
            .insert(workspaceMemberships)
            .values({ workspaceId: workspace.id, userId: user.id, role: "owner" });
        await onCreate(tx, { workspaceId: workspace.id, userId: user.id });
    });
}

export async function requireAppContext(): Promise<AppContext> {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/entrar");
    }

    const [membership] = await personalMembership(await getDb(), user.id);

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
