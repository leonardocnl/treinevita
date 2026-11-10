import type { MetadataRoute } from "next";

/** The web app manifest: VITA installs from Safari and opens standalone. Colors are the dark bg token, matching the icon. */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "VITA",
        short_name: "VITA",
        description: "Acompanhamento de treinos",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            {
                src: "/icons/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
