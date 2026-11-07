/** Upserts the global exercise catalog (no users, no history). Idempotent; runs on every build. */
import { upsertGlobalCatalog } from "../src/modules/catalog/infrastructure/global-catalog";

import { run } from "./deploy-database";

run("Catalog seed", async (db) => {
    await upsertGlobalCatalog(db);
});
