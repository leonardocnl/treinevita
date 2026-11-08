import { describe, expect, it } from "vitest";

import { parseTheme } from "./theme";

describe("parseTheme", () => {
    it("reads the three known values", () => {
        expect(parseTheme("system")).toBe("system");
        expect(parseTheme("light")).toBe("light");
        expect(parseTheme("dark")).toBe("dark");
    });

    it("falls back to system for a missing, unknown or tampered cookie", () => {
        expect(parseTheme(undefined)).toBe("system");
        expect(parseTheme(null)).toBe("system");
        expect(parseTheme("")).toBe("system");
        expect(parseTheme("Dark")).toBe("system");
        expect(parseTheme('dark" onload="x')).toBe("system");
    });
});
