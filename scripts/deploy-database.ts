import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";

import { schema } from "../src/platform/db/schema";

type DeployDatabase = NeonDatabase<typeof schema>;

/**
 * Runs `task` against Neon during a deploy. Prefers the unpooled URL that the
 * Vercel Neon integration creates; refuses to run without a database URL.
 */
export async function withDeployDatabase(
    task: (db: DeployDatabase) => Promise<void>,
): Promise<void> {
    const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set; refusing to run against an unknown database.");
    }
    const pool = new Pool({ connectionString });
    try {
        await task(drizzle(pool, { schema }));
    } finally {
        await pool.end();
    }
}

export function run(name: string, task: (db: DeployDatabase) => Promise<void>): void {
    withDeployDatabase(task).then(
        () => console.log(`${name}: done.`),
        (error: unknown) => {
            console.error(`${name} failed:`, error instanceof Error ? error.message : error);
            process.exit(1);
        },
    );
}
