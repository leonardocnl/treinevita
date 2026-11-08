import { describe, expect, it } from "vitest";

import { setsLabel } from "./numbers";

describe("setsLabel", () => {
    it("uses the singular when the target is one set", () => {
        expect(setsLabel(1, 1)).toBe("1 de 1 série");
        expect(setsLabel(0, 1)).toBe("0 de 1 série");
    });

    it("uses the plural for any other target", () => {
        expect(setsLabel(2, 4)).toBe("2 de 4 séries");
        expect(setsLabel(0, 3)).toBe("0 de 3 séries");
        expect(setsLabel(4, 4)).toBe("4 de 4 séries");
    });
});
