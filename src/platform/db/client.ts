import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";

import { schema } from "./schema";

/**
 * Single database entry point.
 *
 * The Pool driver (WebSocket) is used instead of the HTTP driver because it
 * supports interactive transactions, which the tenant context needs to set
 * per-transaction settings once Row-Level Security is turned on (ADR 0002).
 */
let database: NeonDatabase<typeof schema> | undefined;

export function getDb(): NeonDatabase<typeof schema> {
    if (database) {
        return database;
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    }

    database = drizzle(new Pool({ connectionString }), { schema });
    return database;
}

export type Database = NeonDatabase<typeof schema>;
