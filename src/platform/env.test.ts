import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const production = {
    NODE_ENV: "production",
    DATABASE_URL: "postgres://user:secret-value@host/db",
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "secret-value",
    ALLOWED_EMAILS: "owner@example.com",
    APP_URL: "https://treinevita.vercel.app",
};

describe("parseEnv", () => {
    it("accepts a complete production environment", () => {
        expect(parseEnv(production).APP_URL).toBe("https://treinevita.vercel.app");
    });

    it("fails fast in production naming the variable, never the values", () => {
        const env = { ...production, GOOGLE_CLIENT_ID: "", APP_URL: "not a url" };
        expect(() => parseEnv(env)).toThrow("GOOGLE_CLIENT_ID, APP_URL");
        expect(() => parseEnv(env)).not.toThrow(/secret-value/);
    });

    it("treats Vercel as production even without NODE_ENV", () => {
        expect(() => parseEnv({ VERCEL: "1" })).toThrow("DATABASE_URL");
    });

    it("allows a bare development environment", () => {
        expect(parseEnv({ NODE_ENV: "development", APP_URL: "" })).toEqual({});
    });
});
