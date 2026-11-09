import { AsyncLocalStorage } from "node:async_hooks";

/*
 * Per-request database timing. `timed(route, fn)` counts every query `fn` runs
 * and logs one line when it ends, e.g.
 *   [timing] /treino queries=4 db=38ms total=52ms
 * No user data: only the route, the query count and the times. `db` adds up the
 * time of every query, so queries running in parallel can sum to more than `total`.
 */

type Stats = { queries: number; dbMs: number };

const requests = new AsyncLocalStorage<Stats>();

export async function timed<T>(route: string, fn: () => Promise<T>): Promise<T> {
    const stats: Stats = { queries: 0, dbMs: 0 };
    const start = performance.now();
    try {
        return await requests.run(stats, fn);
    } finally {
        const total = performance.now() - start;
        console.info(
            `[timing] ${route} queries=${stats.queries} db=${Math.round(stats.dbMs)}ms total=${Math.round(total)}ms`,
        );
    }
}

/** Wraps a driver client's `query` method so every call is counted in the current request. */
export function countQueries<C extends { query: (...args: never[]) => Promise<unknown> }>(
    client: C,
): C {
    const query = client.query.bind(client) as (...args: unknown[]) => Promise<unknown>;
    client.query = (async (...args: unknown[]) => {
        const start = performance.now();
        try {
            return await query(...args);
        } finally {
            const stats = requests.getStore();
            if (stats) {
                stats.queries += 1;
                stats.dbMs += performance.now() - start;
            }
        }
    }) as C["query"];
    return client;
}
