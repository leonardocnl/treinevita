import "server-only";

import { eq, sql } from "drizzle-orm";

import { getDb } from "@/platform/db/client";
import type { TenantContext } from "@/shared/db/tenant";

import { checkAvatar, type AvatarMime } from "../domain/avatar";
import { userAvatars } from "../infrastructure/schema";

/*
 * The signed-in person's own photo. Always keyed by the session's user, never
 * by an id from the client, so nobody can read or replace someone else's.
 */

export type Avatar = { bytes: Buffer; mime: AvatarMime; updatedAt: Date };

/** When the photo last changed (its version), or null without one. Does not load the bytes. */
export async function getAvatarVersion(context: TenantContext): Promise<Date | null> {
    const db = await getDb();
    const [row] = await db
        .select({ updatedAt: userAvatars.updatedAt })
        .from(userAvatars)
        .where(eq(userAvatars.userId, context.userId))
        .limit(1);
    return row?.updatedAt ?? null;
}

export async function getAvatar(context: TenantContext): Promise<Avatar | null> {
    const db = await getDb();
    const [row] = await db
        .select({
            hex: sql<string>`encode(${userAvatars.bytes}, 'hex')`,
            mime: userAvatars.mime,
            updatedAt: userAvatars.updatedAt,
        })
        .from(userAvatars)
        .where(eq(userAvatars.userId, context.userId))
        .limit(1);
    return row
        ? { bytes: Buffer.from(row.hex, "hex"), mime: row.mime, updatedAt: row.updatedAt }
        : null;
}

/** Replaces the photo. False when the bytes are not an accepted image or are too large. */
export async function saveAvatar(context: TenantContext, bytes: Uint8Array): Promise<boolean> {
    const checked = checkAvatar(bytes);
    if (!checked.ok) {
        return false;
    }
    const db = await getDb();
    const values = {
        bytes: sql`decode(${Buffer.from(bytes).toString("hex")}, 'hex')`,
        mime: checked.mime,
        updatedAt: new Date(),
    };
    await db
        .insert(userAvatars)
        .values({ userId: context.userId, ...values })
        .onConflictDoUpdate({ target: userAvatars.userId, set: values });
    return true;
}

/** "Remover foto": deletes the row for real, so the image is gone. */
export async function removeAvatar(context: TenantContext): Promise<void> {
    const db = await getDb();
    await db.delete(userAvatars).where(eq(userAvatars.userId, context.userId));
}
