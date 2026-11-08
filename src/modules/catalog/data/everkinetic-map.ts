/**
 * Reviewed matches between the global catalog (slug) and Everkinetic
 * exercises (their `name`), for what `scripts/import-everkinetic.ts` cannot
 * match on its own by name and equipment. `null` means reviewed: Everkinetic
 * has no drawing of this movement, so the exercise keeps only the YouTube link.
 */
export const EVERKINETIC_MAP: Readonly<Record<string, string | null>> = {
    // Machine version not drawn; the Smith incline press has the same pose.
    incline_machine_press: "smith-machine-incline-bench-press",
    machine_chest_press: "machine-bench-press",
    machine_triceps: "triceps-extensions-using-machine",
    back_extension: "hyperextensions",
    hip_abduction: "thigh-abductor",
    // Dumbbell deadlift with soft knees, the same hinge as the stiff.
    dumbbell_stiff: "dumbbell-dead-lifts",
    leg_press_45: "leg-press",
    neutral_cable_row: "seated-cable-rows",
    // Close-grip barbell extension on an incline bench.
    skull_crusher: "incline-triceps-extension-with-barbell",
    floor_crunch: "crunches",

    // The machine row is not drawn (only the T-bar and cable rows).
    neutral_machine_row: null,
    // seated-shoulder-press-machine exists without drawings.
    machine_shoulder_press: null,
    // wide-grip-lat-pull-down exists without drawings.
    wide_machine_pulldown: null,
    // butterfly-machine (reverse) is not drawn; the cable versions are another pose.
    reverse_pec_deck: null,
    // Only the 45° leg press is drawn.
    horizontal_leg_press: null,
    // Only the side plank is drawn.
    front_plank: null,
    // Only the dumbbell lateral raise is drawn.
    cable_lateral_raise: null,
};
