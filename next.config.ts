import type { NextConfig } from "next";

/** Baseline security headers for every response (ADR 0010). */
const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
];

const nextConfig: NextConfig = {
    headers: async () => [{ source: "/:path*", headers: securityHeaders }],
    // Corpo became part of Perfil; old links and home-screen bookmarks land there.
    redirects: async () => [
        { source: "/corpo", destination: "/perfil", permanent: true },
        { source: "/corpo/:path*", destination: "/perfil", permanent: true },
    ],
    // Every screen depends on who is signed in, so pages render per request.
    // Cache Components stay off until there is public, cacheable content (ADR 0009).
    cacheComponents: false,
    // PGlite (local development database) ships WebAssembly; keep it out of the server bundle.
    serverExternalPackages: ["@electric-sql/pglite"],
    turbopack: {
        rules: {
            "*.css": {
                loaders: ["@tailwindcss/turbopack"],
                as: "*.css",
            },
        },
    },
};

export default nextConfig;
