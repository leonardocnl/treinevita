import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
