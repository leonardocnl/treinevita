import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // PGlite (local development database) ships WebAssembly; keep it out of the server bundle.
    serverExternalPackages: ["@electric-sql/pglite"],
    cacheComponents: true,
    partialPrefetching: true,
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
