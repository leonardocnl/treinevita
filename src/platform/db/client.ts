import "server-only";

import { createLocalDatabase, createNeonDatabase, resolveDriver, type Database } from "./drivers";

/**
 * Single database entry point for the app.
 *
 * Neon in preview and production; a local PGlite database in development when
 * DATABASE_URL is not set (see `npm run db:local:reset`).
 */
let database: Promise<Database> | undefined;

export function getDb(): Promise<Database> {
    if (!database) {
        const driver = resolveDriver(process.env);
        database = driver.kind === "neon" ? createNeonDatabase(driver.url) : createLocalDatabase();
    }
    return database;
}

export type { Database };
