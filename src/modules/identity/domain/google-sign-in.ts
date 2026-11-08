import { z } from "zod";

/** `ALLOWED_EMAILS`: comma-separated, trimmed, case-insensitive. */
export function parseAllowlist(raw = ""): ReadonlySet<string> {
    return new Set(
        raw
            .split(",")
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean),
    );
}

/** The `state` echoed by Google must match the one stored in the cookie. */
export function isValidState(expected: string | undefined, received: string | null): boolean {
    return Boolean(expected) && expected === received;
}

export type GoogleClaims = { sub: string; email: string; name: string | null };

/** Accepts only ID tokens issued for our client with a verified email. */
export function parseGoogleClaims(claims: unknown, clientId: string): GoogleClaims | null {
    const result = z
        .object({
            aud: z.literal(clientId),
            sub: z.string().min(1),
            email: z.email(),
            email_verified: z.literal(true),
            name: z.string().optional(),
        })
        .safeParse(claims);
    if (!result.success) {
        return null;
    }
    const { sub, email, name } = result.data;
    return { sub, email: email.toLowerCase(), name: name ?? null };
}
