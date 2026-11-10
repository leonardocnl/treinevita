import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";

import { THEME_COOKIE, parseTheme } from "@/shared/theme/theme";

import "./globals.css";

/**
 * Fonts are self-hosted: no request to a third party at runtime (faster, better for the LGPD).
 * Mona Sans (variable: width 75–125, weight, optical size) for all text, from the
 * official repository (github/mona-sans, SIL OFL); Doto (dot matrix) only for numbers.
 */
const mona = localFont({
    variable: "--font-mona",
    src: [{ path: "./fonts/mona-sans-vf.woff2", style: "normal" }],
    weight: "200 900",
    // The width axis, so font-stretch 100% to 125% picks the real width instead of a synthetic one.
    declarations: [{ prop: "font-stretch", value: "75% 125%" }],
    display: "swap",
});

const doto = localFont({
    variable: "--font-doto",
    src: [
        { path: "./fonts/doto-latin-full-normal.woff2", style: "normal" },
        { path: "./fonts/doto-latin-ext-full-normal.woff2", style: "normal" },
    ],
    weight: "100 900",
    display: "swap",
});

export const metadata: Metadata = {
    title: "VITA",
    description: "Acompanhamento de treinos",
    appleWebApp: {
        capable: true,
        title: "VITA",
        statusBarStyle: "default",
    },
};

const CANVAS = { light: "#f4f2f1", dark: "#0b0b0d" };

async function readTheme() {
    return parseTheme((await cookies()).get(THEME_COOKIE)?.value);
}

export async function generateViewport(): Promise<Viewport> {
    const theme = await readTheme();
    return {
        themeColor:
            theme === "system"
                ? [
                      { media: "(prefers-color-scheme: light)", color: CANVAS.light },
                      { media: "(prefers-color-scheme: dark)", color: CANVAS.dark },
                  ]
                : CANVAS[theme],
        viewportFit: "cover",
    };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const theme = await readTheme();
    return (
        <html
            lang="pt-BR"
            // The setting from Ajustes; without it, globals.css follows the system.
            data-theme={theme === "system" ? undefined : theme}
            className={`${mona.variable} ${doto.variable} h-full`}
        >
            <body className="min-h-full">{children}</body>
        </html>
    );
}
