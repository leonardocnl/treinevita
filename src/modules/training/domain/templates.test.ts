import { describe, expect, it } from "vitest";

import {
    TEMPLATES,
    TEMPLATE_IDS,
    addExercise,
    buildDraft,
    clearDraft,
    programChoiceSchema,
    removeExercise,
    replaceExercise,
    resolveDays,
    suggestTemplate,
} from "./templates";

const isDuration = (slug: string) => slug === "front_plank";

describe("templates", () => {
    it("never repeat an exercise in a day", () => {
        for (const template of Object.values(TEMPLATES)) {
            for (const day of template.days) {
                const slugs = day.exercises.map((exercise) => exercise.slug);
                expect(new Set(slugs).size).toBe(slugs.length);
            }
        }
    });

    it("build a draft with the template's days and exercises", () => {
        const draft = buildDraft("upper_lower");
        expect(draft.days.map((day) => day.label)).toEqual(["A", "B"]);
        expect(draft.days[0].title).toBe("Superior");
        expect(draft.days[0].slugs[0]).toBe("barbell_bench_press");
    });

    it("suggest a template from the answers", () => {
        const base = { goal: "hypertrophy", experience: "intermediate", trainingPlace: null };
        expect(suggestTemplate(base)).toBe("abc");
        expect(suggestTemplate({ ...base, trainingPlace: "home" })).toBe("full_body");
        expect(suggestTemplate({ ...base, goal: "strength" })).toBe("upper_lower");
        expect(suggestTemplate({ ...base, experience: "advanced" })).toBe("push_pull_legs");
        expect(suggestTemplate({ ...base, experience: "beginner" })).toBe("full_body");
    });

    it("remove, swap and add exercises without touching other days", () => {
        const draft = buildDraft("abc");
        const removed = removeExercise(draft, 0, 0);
        expect(removed.days[0].slugs).toHaveLength(7);
        expect(removed.days[1]).toBe(draft.days[1]);

        const swapped = replaceExercise(draft, 0, 0, "machine_chest_press");
        expect(swapped.days[0].slugs[0]).toBe("machine_chest_press");

        const added = addExercise(clearDraft(draft), 2, "front_plank");
        expect(added.days[2].slugs).toEqual(["front_plank"]);
        expect(addExercise(added, 2, "front_plank").days[2].slugs).toEqual(["front_plank"]);
    });
});

describe("clearDraft (Limpar ficha)", () => {
    it("keeps every day and empties all of them", () => {
        for (const id of TEMPLATE_IDS) {
            const cleared = clearDraft(buildDraft(id));
            expect(cleared.days).toHaveLength(TEMPLATES[id].days.length);
            expect(cleared.days.every((day) => day.slugs.length === 0)).toBe(true);
            expect(cleared.templateId).toBe(id);
        }
    });

    it("cannot be saved until every day has an exercise again", () => {
        const days = clearDraft(buildDraft("abc")).days.map((day) => day.slugs);
        expect(
            programChoiceSchema.safeParse({ kind: "template", templateId: "abc", days }).success,
        ).toBe(false);
    });
});

describe("resolveDays", () => {
    it("keeps the template prescription and gives defaults to new exercises", () => {
        const draft = replaceExercise(buildDraft("abc"), 0, 1, "front_plank");
        const days = resolveDays(
            "abc",
            draft.days.map((day) => day.slugs),
            isDuration,
        );
        expect(days?.[0].exercises[0]).toMatchObject({
            slug: "incline_machine_press",
            restSeconds: 90,
        });
        expect(days?.[0].exercises[1]).toMatchObject({ slug: "front_plank", durationMin: 30 });
        expect(days?.[1].exercises[1]).toMatchObject({ slug: "wide_machine_pulldown" });
    });

    it("rejects days that do not fit the template or repeat an exercise", () => {
        expect(resolveDays("abc", [["leg_extension"]], isDuration)).toBeNull();
        expect(
            resolveDays(
                "upper_lower",
                [["leg_extension", "leg_extension"], ["floor_crunch"]],
                isDuration,
            ),
        ).toBeNull();
    });
});
