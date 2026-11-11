import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("legacy routes", () => {
    it("sends the old Corpo tab to Perfil, permanently", async () => {
        const redirects = (await nextConfig.redirects?.()) ?? [];
        expect(redirects).toContainEqual({
            source: "/corpo",
            destination: "/perfil",
            permanent: true,
        });
        expect(redirects).toContainEqual({
            source: "/corpo/:path*",
            destination: "/perfil",
            permanent: true,
        });
    });

    it("sends the old Ajustes screen to Perfil, permanently", async () => {
        const redirects = (await nextConfig.redirects?.()) ?? [];
        expect(redirects).toContainEqual({
            source: "/ajustes",
            destination: "/perfil",
            permanent: true,
        });
    });
});
