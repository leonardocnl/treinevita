import { z } from "zod";

/**
 * The person's profile, asked once in the onboarding and editable in Ajustes.
 * Weight and height are health data (LGPD, ADR 0011): only what the app uses,
 * never logged.
 */
export const GOALS = ["hypertrophy", "strength", "conditioning", "health"] as const;
export const EXPERIENCES = ["beginner", "intermediate", "advanced"] as const;
export const SESSION_MINUTES = [30, 45, 60, 90] as const;
export const TRAINING_PLACES = ["full_gym", "basic_gym", "home"] as const;

export type Goal = (typeof GOALS)[number];
export type Experience = (typeof EXPERIENCES)[number];
export type SessionMinutes = (typeof SESSION_MINUTES)[number];
export type TrainingPlace = (typeof TRAINING_PLACES)[number];

export const WEIGHT_KG = { min: 30, max: 300 } as const;
export const HEIGHT_CM = { min: 100, max: 250 } as const;
export const WEEKLY_GOAL = { min: 1, max: 7 } as const;
export const NAME_MAX = 40;

export const profileSchema = z.object({
    displayName: z.string().trim().min(1).max(NAME_MAX),
    goal: z.enum(GOALS),
    experience: z.enum(EXPERIENCES),
    weeklyGoal: z.number().int().min(WEEKLY_GOAL.min).max(WEEKLY_GOAL.max),
    // Half-kilo steps, the same as the wheel.
    weightKg: z
        .number()
        .min(WEIGHT_KG.min)
        .max(WEIGHT_KG.max)
        .refine((value) => Number.isInteger(value * 2)),
    heightCm: z.number().int().min(HEIGHT_CM.min).max(HEIGHT_CM.max),
    sessionMinutes: z.literal([...SESSION_MINUTES]).nullable(),
    trainingPlace: z.enum(TRAINING_PLACES).nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/**
 * Where a signed-in person must go: to the onboarding while it is not done,
 * away from it once it is. `null` means stay.
 */
export function onboardingRedirect({
    onboarded,
    onOnboardingRoute,
}: {
    onboarded: boolean;
    onOnboardingRoute: boolean;
}): "/comecar" | "/" | null {
    if (!onboarded && !onOnboardingRoute) {
        return "/comecar";
    }
    if (onboarded && onOnboardingRoute) {
        return "/";
    }
    return null;
}
