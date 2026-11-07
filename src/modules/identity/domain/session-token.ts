/** Session lifetime: 30 days, renewed while the person keeps using the app. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Renew the expiry when less than this is left, so active people stay signed in. */
export const SESSION_RENEW_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export function sessionExpiry(now: Date): Date {
    return new Date(now.getTime() + SESSION_TTL_MS);
}

export function shouldRenew(expiresAt: Date, now: Date): boolean {
    return expiresAt.getTime() - now.getTime() < SESSION_RENEW_WINDOW_MS;
}

export function isExpired(expiresAt: Date, now: Date): boolean {
    return expiresAt.getTime() <= now.getTime();
}
