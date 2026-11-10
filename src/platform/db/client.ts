import "server-only";

import { createLocalDatabase, createNeonDatabase, resolveDriver, type Database } from "./drivers";

/**
 * Single database entry point for the app.
 *
 * Neon in preview and production; a local PGlite database in development when
 * DATABASE_URL is not set (see `npm run db:local:reset`).
 */
// Kept on globalThis, not in a module variable: in development Next loads this
// module more than once (route handlers and pages are separate bundles, and hot
// reload re-runs it). Two PGlite instances on one folder overwrite each other
// and corrupt the local database.
const holder = globalThis as typeof globalThis & { __vitaDb?: Promise<Database> };

export function getDb(): Promise<Database> {
    if (!holder.__vitaDb) {
        const driver = resolveDriver(process.env);
        holder.__vitaDb =
            driver.kind === "neon" ? createNeonDatabase(driver.url) : createLocalDatabase();
    }
    return holder.__vitaDb;
}

export type { Database };
