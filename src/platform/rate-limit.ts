/**
 * A best-effort, in-memory rate limiter: a fixed window per key, kept in the
 * function instance's memory (each instance counts on its own, and a cold start
 * forgets). Enough for a public route that only wakes the database.
 */
export type RateLimiter = (key: string, now?: number) => boolean;

export function createRateLimiter({
    limit,
    windowMs,
    maxKeys = 1000,
}: {
    limit: number;
    windowMs: number;
    maxKeys?: number;
}): RateLimiter {
    const windows = new Map<string, { count: number; resetAt: number }>();
    return (key, now = Date.now()) => {
        const current = windows.get(key);
        if (!current || current.resetAt <= now) {
            if (windows.size >= maxKeys) {
                // ponytail: drops every window when full; a LRU would keep the busy ones.
                windows.clear();
            }
            windows.set(key, { count: 1, resetAt: now + windowMs });
            return true;
        }
        current.count += 1;
        return current.count <= limit;
    };
}
