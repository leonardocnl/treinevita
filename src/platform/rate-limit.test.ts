import { describe, expect, it } from "vitest";

import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
    it("allows up to the limit per window and key, then refuses until the window resets", () => {
        const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
        expect(allow("a", 0)).toBe(true);
        expect(allow("a", 10)).toBe(true);
        expect(allow("a", 20)).toBe(false);
        expect(allow("b", 20)).toBe(true);
        expect(allow("a", 1000)).toBe(true);
    });

    it("never grows past its key limit", () => {
        const allow = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
        allow("a", 0);
        allow("b", 0);
        expect(allow("c", 0)).toBe(true);
        expect(allow("a", 0)).toBe(true);
    });
});
