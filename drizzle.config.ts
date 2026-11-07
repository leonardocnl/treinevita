import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

/**
 * With DATABASE_URL: Neon. Without it: the local PGlite database created by
 * `npm run db:local:reset`, so `npm run db:studio` browses the mock data.
 */
export default databaseUrl
    ? defineConfig({
          dialect: "postgresql",
          schema: "./src/modules/*/infrastructure/schema.ts",
          out: "./drizzle",
          dbCredentials: { url: databaseUrl },
          strict: true,
          verbose: true,
      })
    : defineConfig({
          dialect: "postgresql",
          driver: "pglite",
          schema: "./src/modules/*/infrastructure/schema.ts",
          out: "./drizzle",
          dbCredentials: { url: "./.data/pglite" },
          strict: true,
          verbose: true,
      });
