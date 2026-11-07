import { describe, expect, it } from "vitest";

import { resolveDriver } from "./drivers";

describe("resolveDriver", () => {
    it("uses Neon when DATABASE_URL is set", () => {
        expect(resolveDriver({ DATABASE_URL: "postgres://x", NODE_ENV: "production" })).toEqual({
            kind: "neon",
            url: "postgres://x",
        });
    });

    it("uses the local database in development without DATABASE_URL", () => {
        expect(resolveDriver({ NODE_ENV: "development" })).toEqual({ kind: "local" });
    });

    it("never falls back to the local database in production", () => {
        expect(() => resolveDriver({ NODE_ENV: "production" })).toThrow();
    });

    it("never falls back to the local database on Vercel", () => {
        expect(() => resolveDriver({ NODE_ENV: "development", VERCEL_ENV: "preview" })).toThrow();
    });
});
