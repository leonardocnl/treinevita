/**
 * Mock history for local development: six weeks of plausible training on
 * top of the starter program. Every number here is fictional.
 */

/**
 * Load of the first mock session per exercise (slug in the global catalog).
 * `stuck` simulates an exercise that stopped progressing (stagnation warning).
 */
export const MOCK_START: Record<string, { loadKg: number; stuck?: true }> = {
    incline_machine_press: { loadKg: 25 },
    neutral_machine_row: { loadKg: 30 },
    machine_shoulder_press: { loadKg: 20, stuck: true },
    leg_extension: { loadKg: 30 },
    lying_leg_curl: { loadKg: 25 },
    machine_triceps: { loadKg: 20 },
    seated_calf_raise: { loadKg: 20 },
    back_extension: { loadKg: 0 },
    barbell_bench_press: { loadKg: 20 },
    wide_machine_pulldown: { loadKg: 35 },
    reverse_pec_deck: { loadKg: 15 },
    concentration_curl: { loadKg: 8 },
    horizontal_leg_press: { loadKg: 60 },
    seated_leg_curl: { loadKg: 25 },
    hip_abduction: { loadKg: 30 },
    front_plank: { loadKg: 0 },
    dumbbell_stiff: { loadKg: 12 },
    leg_press_45: { loadKg: 80 },
    machine_chest_press: { loadKg: 27.5 },
    neutral_cable_row: { loadKg: 30 },
    ez_bar_curl: { loadKg: 14 },
    skull_crusher: { loadKg: 12 },
    cable_lateral_raise: { loadKg: 5 },
    floor_crunch: { loadKg: 0 },
};

export function trainingDays(): { date: string; label: string; skipExercises: number }[] {
    const days: { date: string; label: string; skipExercises: number }[] = [];
    const firstMonday = new Date(Date.UTC(2026, 6, 20));
    const skipped = new Set([
        "2026-08-07",
        "2026-08-26",
        "2026-09-11",
        "2026-09-14",
        "2026-10-16",
        "2026-11-06",
    ]);
    let rotation = 0;
    const labels = ["A", "B", "C"];

    for (let week = 0; week < 16; week += 1) {
        for (const offset of [0, 2, 4]) {
            const day = new Date(firstMonday);
            day.setUTCDate(firstMonday.getUTCDate() + week * 7 + offset);
            const date = day.toISOString().slice(0, 10);
            if (skipped.has(date)) {
                continue;
            }
            // Deterministic variety: some sessions end early (fewer exercises).
            const hash = [...date].reduce((sum, char) => sum + char.charCodeAt(0) * 7, 0);
            const skipExercises = hash % 5 === 0 ? 3 : hash % 3 === 0 ? 1 : 0;
            days.push({ date, label: labels[rotation % 3], skipExercises });
            rotation += 1;
        }
    }
    return days;
}

/** Weekly weigh-ins (Saturday mornings). */
export const bodyMeasurementSeeds = [
    { measuredOn: "2026-10-03", weightKg: 61.6, waistCm: 76.0, bodyFatPercent: 14.5 },
    { measuredOn: "2026-10-10", weightKg: 61.9, waistCm: 76.0 },
    { measuredOn: "2026-10-17", weightKg: 62.1, waistCm: 76.2 },
    { measuredOn: "2026-10-24", weightKg: 62.4, waistCm: 76.3 },
    { measuredOn: "2026-10-31", weightKg: 62.6, waistCm: 76.3 },
    { measuredOn: "2026-11-07", weightKg: 63.0, waistCm: 76.5 },
];
