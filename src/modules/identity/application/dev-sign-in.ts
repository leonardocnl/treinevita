import "server-only";

import { resolveDriver } from "@/platform/db/drivers";

import { createSession, findUserIdByEmail } from "./sessions";

/**
 * Development-only shortcut: sign in as the owner of the local mock database
 * without Google. Available only when running `next dev` against the local
 * PGlite database; everywhere else it reports itself as unavailable.
 */
export function isDevSignInAvailable(): boolean {
    if (process.env.NODE_ENV !== "development") {
        return false;
    }
    try {
        return resolveDriver(process.env).kind === "local";
    } catch {
        return false;
    }
}

export const DEV_OWNER_EMAIL = "leonardocnl.dev@gmail.com";

export async function devSignIn(): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (!isDevSignInAvailable()) {
        return { ok: false, reason: "unavailable" };
    }
    const userId = await findUserIdByEmail(DEV_OWNER_EMAIL);
    if (!userId) {
        return { ok: false, reason: "missing_seed" };
    }
    await createSession(userId);
    return { ok: true };
}
