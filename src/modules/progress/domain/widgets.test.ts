import { describe, expect, it } from "vitest";

import { sanitizeLayout } from "./widgets";

describe("sanitizeLayout", () => {
    it("keeps known kinds with supported sizes, in order", () => {
        expect(
            sanitizeLayout([
                { kind: "body_weight", size: "large" },
                { kind: "weekly_goal", size: "small" },
            ]),
        ).toEqual([
            { kind: "body_weight", size: "large" },
            { kind: "weekly_goal", size: "small" },
        ]);
    });

    it("drops unknown kinds, unsupported sizes and duplicates", () => {
        expect(
            sanitizeLayout([
                { kind: "hacked", size: "small" },
                { kind: "waist", size: "large" },
                { kind: "waist", size: "small" },
                { kind: "waist", size: "small" },
            ]),
        ).toEqual([{ kind: "waist", size: "small" }]);
    });
});
