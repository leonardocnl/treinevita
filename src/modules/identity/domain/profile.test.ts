import { describe, expect, it } from "vitest";

import { onboardingRedirect, profileSchema } from "./profile";

const valid = {
    displayName: "Leonardo",
    goal: "hypertrophy",
    experience: "intermediate",
    weeklyGoal: 3,
    weightKg: 63,
    heightCm: 175,
    sessionMinutes: null,
    trainingPlace: null,
};

const parse = (patch: Record<string, unknown>) =>
    profileSchema.safeParse({ ...valid, ...patch }).success;

describe("profileSchema", () => {
    it("accepts a complete profile, with or without the optional answers", () => {
        expect(parse({})).toBe(true);
        expect(parse({ sessionMinutes: 45, trainingPlace: "home" })).toBe(true);
    });

    it("keeps weight between 30 and 300 kg, in half kilos", () => {
        expect(parse({ weightKg: 30 })).toBe(true);
        expect(parse({ weightKg: 300 })).toBe(true);
        expect(parse({ weightKg: 62.5 })).toBe(true);
        expect(parse({ weightKg: 29.5 })).toBe(false);
        expect(parse({ weightKg: 300.5 })).toBe(false);
        expect(parse({ weightKg: 62.3 })).toBe(false);
        expect(parse({ weightKg: "63" })).toBe(false);
    });

    it("keeps height between 100 and 250 cm, whole numbers", () => {
        expect(parse({ heightCm: 100 })).toBe(true);
        expect(parse({ heightCm: 250 })).toBe(true);
        expect(parse({ heightCm: 99 })).toBe(false);
        expect(parse({ heightCm: 251 })).toBe(false);
        expect(parse({ heightCm: 175.5 })).toBe(false);
    });

    it("trims the name and keeps it between 1 and 40 characters", () => {
        expect(profileSchema.parse({ ...valid, displayName: "  Ana  " }).displayName).toBe("Ana");
        expect(parse({ displayName: "   " })).toBe(false);
        expect(parse({ displayName: "a".repeat(40) })).toBe(true);
        expect(parse({ displayName: "a".repeat(41) })).toBe(false);
    });

    it("accepts only the known choices", () => {
        expect(parse({ goal: "bulking" })).toBe(false);
        expect(parse({ experience: "pro" })).toBe(false);
        expect(parse({ sessionMinutes: 50 })).toBe(false);
        expect(parse({ trainingPlace: "park" })).toBe(false);
        expect(parse({ weeklyGoal: 0 })).toBe(false);
        expect(parse({ weeklyGoal: 8 })).toBe(false);
    });
});

describe("onboardingRedirect", () => {
    it("sends to /comecar while the onboarding is not done", () => {
        expect(onboardingRedirect({ onboarded: false, onOnboardingRoute: false })).toBe("/comecar");
    });

    it("keeps the person on /comecar until it is done", () => {
        expect(onboardingRedirect({ onboarded: false, onOnboardingRoute: true })).toBeNull();
    });

    it("sends home from /comecar once it is done", () => {
        expect(onboardingRedirect({ onboarded: true, onOnboardingRoute: true })).toBe("/");
    });

    it("lets an onboarded person use the app", () => {
        expect(onboardingRedirect({ onboarded: true, onOnboardingRoute: false })).toBeNull();
    });
});
