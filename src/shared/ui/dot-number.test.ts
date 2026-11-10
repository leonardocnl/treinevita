import { describe, expect, it } from "vitest";
import type { ComponentProps } from "react";

import type { DotNumber } from "./dot-number";

type Props = ComponentProps<typeof DotNumber>;

describe("DotNumber props", () => {
    it("allow only 36px and up, and never a red tone", () => {
        const ok: Props = { children: "3", size: 56, tone: "secondary" };
        // @ts-expect-error Doto is never under 36px.
        const small: Props = { children: "3", size: 20 };
        // @ts-expect-error Doto numbers are never red.
        const red: Props = { children: "3", size: 56, tone: "accent" };
        // @ts-expect-error No class prop to sneak a color in.
        const styled: Props = { children: "3", size: 56, className: "text-accent" };
        expect([ok, small, red, styled]).toHaveLength(4);
    });
});
