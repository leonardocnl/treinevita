import "server-only";

import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb } from "@/platform/db/client";

import { isExpired, sessionExpiry, shouldRenew } from "../domain/session-token";
import { sessions, userProfiles, users } from "../infrastructure/schema";

const COOKIE_NAME = "vita_session";

/** Only the SHA-256 of the token is stored: a database leak does not expose live sessions. */
function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/** A new token on every sign-in, so a planted cookie can never be fixated. */
export async function createSession(userId: string): Promise<void> {
    const db = await getDb();
    const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
    const now = new Date();
    const expiresAt = sessionExpiry(now);

    await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });

    (await cookies()).set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });
}

export type CurrentUser = {
    readonly id: string;
    readonly email: string;
    readonly displayName: string | null;
    readonly timezone: string;
    /** The onboarding is done (a profile exists with its completion time). */
    readonly onboarded: boolean;
};

/** Returns the signed-in user, or null. Never throws for a missing or expired session. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) {
        return null;
    }

    const db = await getDb();
    const [row] = await db
        .select({
            sessionId: sessions.id,
            expiresAt: sessions.expiresAt,
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            timezone: users.timezone,
            onboardingCompletedAt: userProfiles.onboardingCompletedAt,
        })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(eq(sessions.tokenHash, hashToken(token)))
        .limit(1);

    const now = new Date();
    if (!row || isExpired(row.expiresAt, now)) {
        return null;
    }

    if (shouldRenew(row.expiresAt, now)) {
        await db
            .update(sessions)
            .set({ expiresAt: sessionExpiry(now), lastSeenAt: now })
            .where(eq(sessions.id, row.sessionId));
    }

    return {
        id: row.id,
        email: row.email,
        displayName: row.displayName,
        timezone: row.timezone,
        onboarded: row.onboardingCompletedAt !== null,
    };
}

export async function destroySession(): Promise<void> {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (token) {
        const db = await getDb();
        await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
    }
    store.delete(COOKIE_NAME);
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
    const db = await getDb();
    const [row] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
    return row?.id ?? null;
}
