/**
 * The appearance setting, kept in a cookie so the server renders the right
 * theme on the first paint (no flash). "system" follows prefers-color-scheme.
 */
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "vita_theme";

/** Anything unknown, missing or tampered with falls back to "system". */
export function parseTheme(value: string | null | undefined): Theme {
    return (THEMES as readonly string[]).includes(value ?? "") ? (value as Theme) : "system";
}
