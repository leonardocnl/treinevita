import { describe, expect, it } from "vitest";

import { safeExternalUrl } from "./external-url";

describe("safeExternalUrl", () => {
    it("keeps absolute https links", () => {
        expect(safeExternalUrl("https://example.com/supino")).toBe("https://example.com/supino");
    });

    it("drops empty, relative, http and script links", () => {
        expect(safeExternalUrl(null)).toBeNull();
        expect(safeExternalUrl("")).toBeNull();
        expect(safeExternalUrl("/treino/1")).toBeNull();
        expect(safeExternalUrl("http://example.com")).toBeNull();
        expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
        expect(safeExternalUrl("data:text/html,<script>")).toBeNull();
        expect(safeExternalUrl("JaVaScRiPt:alert(1)")).toBeNull();
    });
});
