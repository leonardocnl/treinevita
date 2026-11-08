import { describe, expect, it } from "vitest";

import { GLOBAL_EXERCISES } from "@/modules/catalog/infrastructure/global-catalog";
import { TEMPLATES } from "@/modules/training/domain/templates";

/** The program templates live in training and the catalog seed in catalog; they must agree. */
describe("global catalog seed", () => {
    it("has every exercise the program templates use", () => {
        const catalog = new Set(GLOBAL_EXERCISES.map((exercise) => exercise.slug));
        const missing = Object.values(TEMPLATES)
            .flatMap((template) => template.days.flatMap((day) => day.exercises))
            .map((exercise) => exercise.slug)
            .filter((slug) => !catalog.has(slug));
        expect(missing).toEqual([]);
    });
});
