import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { schema } from "./schema";

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
    return drizzle(new PGlite(path), { schema }) as unknown as Database;
}

/** Neon (production and preview). */
export async function createNeonDatabase(connectionString: string): Promise<Database> {
    const { Pool } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    return drizzle(new Pool({ connectionString }), { schema }) as unknown as Database;
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
