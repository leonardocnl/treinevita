/**
 * Aggregates every module's tables for the Drizzle client and migrations.
 * Each module owns its own `infrastructure/schema.ts`; this file only re-exports.
 */
import * as catalog from "@/modules/catalog/infrastructure/schema";
import * as identity from "@/modules/identity/infrastructure/schema";
import * as logging from "@/modules/logging/infrastructure/schema";
import * as progress from "@/modules/progress/infrastructure/schema";
import * as tenancy from "@/modules/tenancy/infrastructure/schema";
import * as training from "@/modules/training/infrastructure/schema";

export const schema = {
    ...identity,
    ...tenancy,
    ...catalog,
    ...training,
    ...logging,
    ...progress,
};
