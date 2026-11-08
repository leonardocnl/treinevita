import "server-only";

import { createHash } from "node:crypto";

import { decodeIdToken, generateCodeVerifier, generateState, Google } from "arctic";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb } from "@/platform/db/client";
import { parseEnv } from "@/platform/env";

import {
    isValidState,
    parseAllowlist,
    parseGoogleClaims,
    type GoogleClaims,
} from "../domain/google-sign-in";
import { identities, users } from "../infrastructure/schema";

const CALLBACK_PATH = "/api/auth/google/callback";
const STATE_COOKIE = "vita_oauth_state";
const VERIFIER_COOKIE = "vita_oauth_verifier";
const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 10 * 60,
} as const;

function googleConfig() {
    const env = parseEnv(process.env);
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.APP_URL) {
        return null;
    }
    return {
        clientId: env.GOOGLE_CLIENT_ID,
        allowlist: parseAllowlist(env.ALLOWED_EMAILS),
        client: new Google(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            new URL(CALLBACK_PATH, env.APP_URL).toString(),
        ),
    };
}

/** Stores `state` and the PKCE verifier in short-lived cookies; returns Google's consent URL. */
export async function startGoogleSignIn(): Promise<URL | null> {
    const config = googleConfig();
    if (!config) {
        return null;
    }
    const state = generateState();
    const verifier = generateCodeVerifier();
    const store = await cookies();
    store.set(STATE_COOKIE, state, cookieOptions);
    store.set(VERIFIER_COOKIE, verifier, cookieOptions);
    return config.client.createAuthorizationURL(state, verifier, ["openid", "email", "profile"]);
}

export type GoogleSignInResult =
    | { ok: true; user: { id: string; displayName: string | null } }
    | { ok: false; reason: "denied" | "failed" };

/** Validates Google's answer and returns the allowed user, created on first sign-in. */
export async function finishGoogleSignIn(params: URLSearchParams): Promise<GoogleSignInResult> {
    const store = await cookies();
    const expectedState = store.get(STATE_COOKIE)?.value;
    const verifier = store.get(VERIFIER_COOKIE)?.value;
    store.delete({ name: STATE_COOKIE, path: cookieOptions.path });
    store.delete({ name: VERIFIER_COOKIE, path: cookieOptions.path });

    const config = googleConfig();
    const code = params.get("code");
    if (!config || !code || !verifier || !isValidState(expectedState, params.get("state"))) {
        return failure("invalid_request");
    }

    let claims: GoogleClaims | null;
    try {
        const tokens = await config.client.validateAuthorizationCode(code, verifier);
        claims = parseGoogleClaims(decodeIdToken(tokens.idToken()), config.clientId);
    } catch {
        return failure("token_exchange");
    }
    if (!claims) {
        return failure("invalid_claims");
    }
    if (!config.allowlist.has(claims.email)) {
        return failure("not_allowed", claims.email);
    }
    return { ok: true, user: { id: await findOrCreateUser(claims), displayName: claims.name } };
}

/** Matches by Google `sub`; on first sign-in links (or creates) the user with that email. */
async function findOrCreateUser(claims: GoogleClaims): Promise<string> {
    const db = await getDb();
    return db.transaction(async (tx) => {
        const [identity] = await tx
            .select({ userId: identities.userId })
            .from(identities)
            .where(
                and(eq(identities.provider, "google"), eq(identities.providerSubject, claims.sub)),
            )
            .limit(1);
        if (identity) {
            return identity.userId;
        }
        const [user] = await tx
            .insert(users)
            .values({ email: claims.email, displayName: claims.name })
            .onConflictDoUpdate({ target: users.email, set: { updatedAt: new Date() } })
            .returning({ id: users.id });
        await tx
            .insert(identities)
            .values({ userId: user.id, provider: "google", providerSubject: claims.sub });
        return user.id;
    });
}

/** A09: log the reason and a hash of the email, never tokens, codes or the email itself. */
function failure(reason: string, email?: string): GoogleSignInResult {
    const emailHash = email && createHash("sha256").update(email).digest("hex").slice(0, 12);
    console.warn(JSON.stringify({ event: "sign_in_failed", reason, emailHash }));
    return { ok: false, reason: reason === "not_allowed" ? "denied" : "failed" };
}
