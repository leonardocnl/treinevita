import { describe, expect, it } from "vitest";

import { isValidState, parseAllowlist, parseGoogleClaims } from "./google-sign-in";

describe("parseAllowlist", () => {
    it("splits on commas, trims and lowercases", () => {
        const allowlist = parseAllowlist(" Owner@Example.com, other@example.com ,,");
        expect([...allowlist]).toEqual(["owner@example.com", "other@example.com"]);
    });

    it("is empty when unset, so nobody signs in", () => {
        expect(parseAllowlist().size).toBe(0);
        expect(parseAllowlist("").has("")).toBe(false);
    });
});

describe("isValidState", () => {
    it("accepts only a matching state", () => {
        expect(isValidState("abc", "abc")).toBe(true);
        expect(isValidState("abc", "abd")).toBe(false);
    });

    it("rejects a missing cookie or parameter", () => {
        expect(isValidState(undefined, "abc")).toBe(false);
        expect(isValidState("abc", null)).toBe(false);
        expect(isValidState("", "")).toBe(false);
    });
});

describe("parseGoogleClaims", () => {
    const claims = {
        aud: "client",
        sub: "123",
        email: "Owner@Example.com",
        email_verified: true,
        name: "Owner",
    };

    it("returns the identity with a lowercased email", () => {
        expect(parseGoogleClaims(claims, "client")).toEqual({
            sub: "123",
            email: "owner@example.com",
            name: "Owner",
        });
    });

    it("rejects an unverified email or another audience", () => {
        expect(parseGoogleClaims({ ...claims, email_verified: false }, "client")).toBeNull();
        expect(parseGoogleClaims(claims, "other-client")).toBeNull();
        expect(parseGoogleClaims({ ...claims, sub: "" }, "client")).toBeNull();
    });
});
