/** Applies pending Drizzle migrations to Neon. Runs on every Vercel build. */
import { migrate } from "drizzle-orm/neon-serverless/migrator";

import { run } from "./deploy-database";

run("Migrations", (db) => migrate(db, { migrationsFolder: "./drizzle" }));
