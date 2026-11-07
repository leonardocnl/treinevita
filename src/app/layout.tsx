import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

/**
 * Fonts are self-hosted: no request to Google at runtime (faster, better for the LGPD).
 * Inter (variable) for text; Doto (variable dot-matrix) only for numbers.
 */
const inter = localFont({
    variable: "--font-inter",
    src: [
        { path: "./fonts/inter-latin-wght-normal.woff2", style: "normal" },
        { path: "./fonts/inter-latin-ext-wght-normal.woff2", style: "normal" },
    ],
    weight: "100 900",
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

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f4f2f1" },
        { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
    ],
    viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR" className={`${inter.variable} ${doto.variable} h-full`}>
            <body className="min-h-full">{children}</body>
        </html>
    );
}
