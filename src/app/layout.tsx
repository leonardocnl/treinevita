import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

/**
 * Archivo (variable, with width and weight axes) is self-hosted: no request to
 * Google at runtime, which is faster and better for privacy (LGPD).
 * Body text uses the system font (SF Pro on Apple devices).
 */
const archivo = localFont({
    variable: "--font-archivo",
    src: [
        { path: "./fonts/archivo-latin-wdth-normal.woff2", style: "normal" },
        { path: "./fonts/archivo-latin-ext-wdth-normal.woff2", style: "normal" },
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
        { media: "(prefers-color-scheme: light)", color: "#ede8e6" },
        { media: "(prefers-color-scheme: dark)", color: "#141416" },
    ],
    viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR" className={`${archivo.variable} h-full`}>
            <body className="min-h-full">{children}</body>
        </html>
    );
}
