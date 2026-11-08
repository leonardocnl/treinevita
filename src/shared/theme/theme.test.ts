import { describe, expect, it } from "vitest";

import { THEME_COOKIE, parseTheme, themeCookie, toggledTheme } from "./theme";

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

describe("toggledTheme", () => {
    it("flips an explicit theme", () => {
        expect(toggledTheme("light", true)).toBe("dark");
        expect(toggledTheme("dark", false)).toBe("light");
    });

    it("flips what the system shows when following the system", () => {
        expect(toggledTheme("system", true)).toBe("light");
        expect(toggledTheme("system", false)).toBe("dark");
    });
});

describe("themeCookie", () => {
    it("writes the same vita_theme cookie the root layout reads", () => {
        const cookie = themeCookie("dark", true);
        expect(cookie.name).toBe(THEME_COOKIE);
        expect(cookie.value).toBe("dark");
        expect(parseTheme(cookie.value)).toBe("dark");
    });

    it("is httpOnly, lax, site wide and lasts a year", () => {
        expect(themeCookie("light", true).options).toEqual({
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 31_536_000,
        });
    });

    it("is secure only when asked (production)", () => {
        expect(themeCookie("system", false).options.secure).toBe(false);
    });
});
