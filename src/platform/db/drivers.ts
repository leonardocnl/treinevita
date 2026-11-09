import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { schema } from "./schema";
import { countQueries } from "./timing";

/** The database type every repository uses, whatever the driver behind it. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Folder of the local development database (PGlite, a real Postgres compiled to WebAssembly). */
export const LOCAL_DATABASE_PATH = "./.data/pglite";

/**
 * Local database for development and tests. It is real Postgres, so the same
 * migrations, types and future Row-Level Security policies work unchanged.
 */
export async function createLocalDatabase(path = LOCAL_DATABASE_PATH): Promise<Database> {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path, { recursive: true });
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    return drizzle(countQueries(new PGlite(path)), { schema }) as unknown as Database;
}

/**
 * Neon (production and preview). Every one-shot query goes over HTTP: one round
 * trip, no connection to set up. HTTP has no interactive transactions, so
 * `transaction()` (first sign-in, saving the profile or the dashboard layout)
 * runs on a single WebSocket pool, opened on first use and shared afterwards.
 */
export async function createNeonDatabase(connectionString: string): Promise<Database> {
    const { neon, Pool } = await import("@neondatabase/serverless");
    const http = await import("drizzle-orm/neon-http");
    const ws = await import("drizzle-orm/neon-serverless");
    const db = http.drizzle(countQueries(neon(connectionString)), {
        schema,
    }) as unknown as Database;
    let pooled: Database | undefined;
    db.transaction = ((...args: Parameters<Database["transaction"]>) => {
        pooled ??= ws.drizzle(countQueries(new Pool({ connectionString })), {
            schema,
        }) as unknown as Database;
        return pooled.transaction(...args);
    }) as Database["transaction"];
    return db;
}

/**
 * Which driver to use:
 * - `DATABASE_URL` set → Neon.
 * - not set, outside production → local PGlite.
 * - not set in production → error (production never falls back to a local database).
 */
export function resolveDriver(env: {
    DATABASE_URL?: string;
    NODE_ENV?: string;
    VERCEL_ENV?: string;
}): { kind: "neon"; url: string } | { kind: "local" } {
    if (env.DATABASE_URL) {
        return { kind: "neon", url: env.DATABASE_URL };
    }
    const isProduction = env.NODE_ENV === "production" || env.VERCEL_ENV !== undefined;
    if (isProduction) {
        throw new Error("DATABASE_URL is required outside local development.");
    }
    return { kind: "local" };
}
