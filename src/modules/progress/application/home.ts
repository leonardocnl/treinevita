import "server-only";

import { getExercisesByIds } from "@/modules/catalog";
import { getHabits, weekEntries, averageOf, isDayDone, type Entry } from "@/modules/habits";
import {
    getLastSetsByExercise,
    getOpenSession,
    listSessionsSince,
    listSetsSince,
} from "@/modules/logging";
import { getActiveProgram, getWeeklyGoal, nextWorkoutInRotation } from "@/modules/training";
import type { TenantContext } from "@/shared/db/tenant";
import {
    addDays,
    localHour,
    monthName,
    shortDate,
    shortMonthName,
    startOfMonth,
    startOfWeek,
    toLocalDate,
} from "@/shared/time/local-date";

import { goalPercent, goalRemaining, projectGoal, type Point } from "../domain/goals";
import {
    STAGNATION_WEEKS,
    bestHour,
    estimateMinutes,
    findRecords,
    nextSessionOrdinal,
    weekStreak,
    weeksSinceProgress,
    type HistorySet,
    type MonthTotals,
    type WeeklyTop,
} from "../domain/metrics";
import { progressionStrategies } from "../domain/progression";
import { isEffectiveSet, setVolume } from "../domain/strength";
import { weeklySetsByMuscle } from "../domain/volume";
import { WEEKDAY_LETTERS } from "../domain/week";
import { listBodyRows, type BodyRow } from "./body";
import { listGoals } from "./goals";

type Context = TenantContext & { timezone: string };

export type Day = { readonly letter: string; readonly done: boolean; readonly isToday: boolean };
export type Change = { readonly value: number; readonly change: number | null };

export type HomeData = {
    readonly today: string;
    readonly hero: {
        readonly open: boolean;
        readonly label: string;
        readonly name: string | null;
        readonly focus: string | null;
        readonly exerciseCount: number;
        readonly minutes: number;
    };
    readonly week: { readonly done: number; readonly goal: number; readonly days: readonly Day[] };
    readonly streak: {
        readonly current: number;
        readonly best: number;
        readonly last12: readonly boolean[];
    };
    readonly records: {
        readonly list: readonly {
            readonly name: string;
            readonly loadKg: number;
            readonly reps: number;
            readonly gainKg: number;
            readonly day: string;
        }[];
        readonly lastTwoWeeks: number;
    };
    readonly weight: {
        readonly latestKg: number;
        readonly changeKg: number | null;
        readonly points: readonly Point[];
    } | null;
    readonly measurements: {
        readonly waist: Change | null;
        readonly chest: Change | null;
        readonly arm: Change | null;
    };
    readonly weeklyVolume: {
        readonly muscles: readonly { readonly name: string; readonly sets: number }[];
        readonly totalSets: number;
    };
    readonly lastWorkout: {
        readonly name: string;
        readonly day: string;
        readonly minutes: number;
        readonly volumeKg: number;
        readonly topSets: readonly {
            readonly name: string;
            readonly loadKg: number;
            readonly reps: number;
        }[];
    } | null;
    readonly stagnant: readonly { readonly name: string; readonly weeks: number }[];
    readonly month: {
        readonly label: string;
        readonly previousLabel: string;
        readonly current: MonthTotals;
        readonly previous: MonthTotals;
        readonly bestVolume: boolean;
        /** Volume of the last 4 weeks, oldest first. */
        readonly weekVolumes: readonly number[];
    };
    readonly nextIncreases: readonly {
        readonly name: string;
        readonly fromKg: number;
        readonly toKg: number;
    }[];
    readonly goals: readonly {
        readonly id: string;
        readonly title: string;
        readonly percent: number;
        readonly remaining: number;
        readonly projection: string | null;
    }[];
    readonly goalExercises: readonly { readonly id: string; readonly name: string }[];
    readonly habits: {
        readonly sleep: {
            readonly average: number | null;
            readonly goal: number;
            readonly week: readonly (number | null)[];
        };
        readonly water: { readonly today: number | null; readonly goal: number };
        readonly steps: {
            readonly today: number | null;
            readonly week: number;
            readonly cardioToday: number | null;
            readonly goal: number;
        };
        readonly energy: { readonly today: number | null };
        readonly custom: readonly {
            readonly id: string;
            readonly name: string;
            readonly valueType: "boolean" | "number" | "time";
            readonly unit: string | null;
            readonly goal: number;
            readonly today: number | null;
            readonly days: readonly Day[];
            readonly doneDays: number;
        }[];
    };
    readonly bestHour: { readonly counts: readonly number[]; readonly best: number | null };
};

const EMPTY_MONTH: MonthTotals = { workouts: 0, minutes: 0, volumeKg: 0, records: 0 };

/**
 * Everything the home shows, from one batch of queries in parallel: the hero
 * and every widget, computed in memory by the domain functions.
 */
export async function getHome(context: Context): Promise<HomeData> {
    const today = toLocalDate(new Date(), context.timezone);
    const weekStart = startOfWeek(today);
    const yearAgo = addDays(weekStart, -7 * 52);
    const since = new Date(`${addDays(yearAgo, -1)}T00:00:00Z`);

    const [sessions, rows, program, weeklyGoal, openSession, body, habits, goals] =
        await Promise.all([
            listSessionsSince(context, since),
            listSetsSince(context, since),
            getActiveProgram(context),
            getWeeklyGoal(context),
            getOpenSession(context),
            listBodyRows(context, today, 120),
            getHabits(context, addDays(today, -14)),
            listGoals(context),
        ]);

    const finished = sessions.filter((session) => session.finishedAt !== null);
    const sessionDay = new Map(
        sessions.map((session) => [
            session.sessionId,
            toLocalDate(session.startedAt, context.timezone),
        ]),
    );
    const minutesOf = (session: (typeof sessions)[number]) =>
        session.finishedAt
            ? Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 60000)
            : 0;

    const effective = rows.filter(
        (row) =>
            row.set.loadKg !== null &&
            row.set.reps !== null &&
            isEffectiveSet({
                loadKg: row.set.loadKg,
                reps: row.set.reps,
                setType: row.set.setType,
            }),
    );
    const programIds =
        program?.workouts.flatMap((workout) =>
            workout.exercises.map((exercise) => exercise.exerciseId),
        ) ?? [];
    const exerciseIds = [...new Set([...effective.map((row) => row.exerciseId), ...programIds])];
    const [catalog, lastSets] = await Promise.all([
        getExercisesByIds(context, exerciseIds),
        getLastSetsByExercise(context, [...new Set(programIds)]),
    ]);
    const nameOf = (id: string) => catalog.get(id)?.name ?? "Exercício";

    // Week and streak: trained days counted from finished sessions.
    const trainedDays = new Set(finished.map((session) => sessionDay.get(session.sessionId) ?? ""));
    const daysOfWeek = (start: string) =>
        Array.from({ length: 7 }, (_, index) => addDays(start, index));
    const thisWeek = daysOfWeek(weekStart);
    const done = thisWeek.filter((day) => day <= today && trainedDays.has(day)).length;
    const weeks = Array.from({ length: 53 }, (_, index) => {
        const start = addDays(weekStart, -7 * (52 - index));
        return { start, trained: daysOfWeek(start).filter((day) => trainedDays.has(day)).length };
    });
    const streak = weekStreak(weeks, weeklyGoal);

    // Records, from every effective set with its session day and start hour.
    const startedAt = new Map(sessions.map((session) => [session.sessionId, session.startedAt]));
    const history: HistorySet[] = effective.map((row) => ({
        exerciseId: row.exerciseId,
        sessionId: row.sessionId,
        day: sessionDay.get(row.sessionId) ?? toLocalDate(row.startedAt, context.timezone),
        hour: localHour(startedAt.get(row.sessionId) ?? row.startedAt, context.timezone),
        loadKg: row.set.loadKg ?? 0,
        reps: row.set.reps ?? 0,
    }));
    const records = findRecords(history);
    const twoWeeksAgo = addDays(today, -14);

    // Body
    const weightRows = body.filter((row) => row.weightKg !== null);
    const latestWeight = weightRows.at(-1);
    const weight = latestWeight
        ? {
              latestKg: latestWeight.weightKg ?? 0,
              changeKg: changeOver(weightRows, "weightKg", 28),
              points: weightRows
                  .slice(-30)
                  .map((row) => ({ day: row.day, value: row.weightKg ?? 0 })),
          }
        : null;
    const measure = (field: "waistCm" | "chestCm" | "armCm"): Change | null => {
        const withValue = body.filter((row) => row[field] !== null);
        const last = withValue.at(-1);
        return last ? { value: last[field] ?? 0, change: changeOver(withValue, field, 30) } : null;
    };

    // Weekly volume per muscle
    const muscleNames = new Map<string, string>();
    const thisWeekSets = effective.filter(
        (row) => (sessionDay.get(row.sessionId) ?? "") >= weekStart,
    );
    const totals = weeklySetsByMuscle(
        thisWeekSets.map((row) => {
            const muscles = catalog.get(row.exerciseId)?.muscles ?? [];
            for (const muscle of muscles) {
                muscleNames.set(muscle.slug, shortMuscle(muscle.name));
            }
            return {
                loadKg: row.set.loadKg ?? 0,
                reps: row.set.reps ?? 0,
                setType: row.set.setType,
                muscles: muscles.map((muscle) => ({ slug: muscle.slug, role: muscle.role })),
            };
        }),
    );

    // Last workout
    const last = finished.at(-1);
    let lastWorkout: HomeData["lastWorkout"] = null;
    if (last) {
        const sets = effective.filter((row) => row.sessionId === last.sessionId);
        const heaviest = new Map<string, { loadKg: number; reps: number }>();
        for (const row of sets) {
            const best = heaviest.get(row.exerciseId);
            if (!best || (row.set.loadKg ?? 0) > best.loadKg) {
                heaviest.set(row.exerciseId, {
                    loadKg: row.set.loadKg ?? 0,
                    reps: row.set.reps ?? 0,
                });
            }
        }
        lastWorkout = {
            name: `Treino ${last.workoutLabel ?? ""}`.trim(),
            day: sessionDay.get(last.sessionId) ?? today,
            minutes: minutesOf(last),
            volumeKg: Math.round(sets.reduce((sum, row) => sum + volumeOf(row.set), 0)),
            topSets: [...heaviest.entries()]
                .filter(([, best]) => best.loadKg > 0)
                .sort((a, b) => b[1].loadKg - a[1].loadKg)
                .slice(0, 3)
                .map(([id, best]) => ({ name: nameOf(id), ...best })),
        };
    }

    // Stagnation: program exercises trained in the last 2 weeks, without progress for 3+ weeks.
    const tops = new Map<string, Map<string, WeeklyTop>>();
    for (const set of history) {
        const week = startOfWeek(set.day);
        const byWeek = tops.get(set.exerciseId) ?? new Map<string, WeeklyTop>();
        const current = byWeek.get(week);
        if (
            !current ||
            set.loadKg > current.loadKg ||
            (set.loadKg === current.loadKg && set.reps > current.reps)
        ) {
            byWeek.set(week, { weekStart: week, loadKg: set.loadKg, reps: set.reps });
        }
        tops.set(set.exerciseId, byWeek);
    }
    const stagnant = [...new Set(programIds)]
        .flatMap((id) => {
            const byWeek = [...(tops.get(id)?.values() ?? [])];
            const recent = byWeek.some(
                (week) => week.weekStart >= startOfWeek(addDays(today, -14)),
            );
            const weeksStill = weeksSinceProgress(byWeek, today);
            return recent && weeksStill !== null && weeksStill >= STAGNATION_WEEKS
                ? [{ name: nameOf(id), weeks: weeksStill }]
                : [];
        })
        .sort((a, b) => b.weeks - a.weeks);

    // Months
    const monthStart = startOfMonth(today);
    const previousStart = startOfMonth(addDays(monthStart, -1));
    const monthOf = (day: string) => day.slice(0, 7);
    const totalsByMonth = new Map<string, MonthTotals>();
    const bump = (month: string, change: Partial<MonthTotals>) => {
        const current = totalsByMonth.get(month) ?? EMPTY_MONTH;
        totalsByMonth.set(month, {
            workouts: current.workouts + (change.workouts ?? 0),
            minutes: current.minutes + (change.minutes ?? 0),
            volumeKg: current.volumeKg + (change.volumeKg ?? 0),
            records: current.records + (change.records ?? 0),
        });
    };
    for (const session of finished) {
        bump(monthOf(sessionDay.get(session.sessionId) ?? today), {
            workouts: 1,
            minutes: minutesOf(session),
        });
    }
    for (const row of effective) {
        bump(monthOf(sessionDay.get(row.sessionId) ?? today), { volumeKg: volumeOf(row.set) });
    }
    for (const record of records) {
        bump(monthOf(record.day), { records: 1 });
    }
    const currentMonth = totalsByMonth.get(monthOf(monthStart)) ?? EMPTY_MONTH;
    const previousMonth = totalsByMonth.get(monthOf(previousStart)) ?? EMPTY_MONTH;
    const otherVolumes = [...totalsByMonth.entries()]
        .filter(([month]) => month !== monthOf(monthStart))
        .map(([, totalsOfMonth]) => totalsOfMonth.volumeKg);
    const weekVolumes = [3, 2, 1, 0].map((back) => {
        const start = addDays(weekStart, -7 * back);
        const end = addDays(start, 7);
        return effective
            .filter((row) => {
                const day = sessionDay.get(row.sessionId) ?? "";
                return day >= start && day < end;
            })
            .reduce((sum, row) => sum + volumeOf(row.set), 0);
    });

    // Next increases: what the progression rule raises next time.
    const nextIncreases = (program?.workouts ?? [])
        .flatMap((workout) => workout.exercises)
        .flatMap((exercise) => {
            const lastTime = lastSets.get(exercise.exerciseId);
            if (!lastTime || exercise.repMin === null || exercise.repMax === null) {
                return [];
            }
            const decision = progressionStrategies[exercise.progressionRule]({
                lastSets: lastTime.sets
                    .filter((set) => set.loadKg !== null && set.reps !== null)
                    .map((set) => ({
                        loadKg: set.loadKg ?? 0,
                        reps: set.reps ?? 0,
                        setType: set.setType,
                    })),
                range: { min: exercise.repMin, max: exercise.repMax },
                incrementKg: exercise.incrementKg,
            });
            const fromKg = Math.max(0, ...lastTime.sets.map((set) => set.loadKg ?? 0));
            return decision?.kind === "increase" && decision.loadKg > fromKg
                ? [{ name: exercise.name, fromKg, toKg: decision.loadKg }]
                : [];
        })
        .filter(
            (item, index, list) => list.findIndex((other) => other.name === item.name) === index,
        );

    // Goals
    const goalViews = goals.map((goal) => {
        let current = goal.startValue;
        let points: Point[] = [];
        let subject = "Peso";
        if (goal.kind === "body_weight") {
            current = weight?.latestKg ?? goal.startValue;
            points = weightRows
                .slice(-12)
                .map((row) => ({ day: row.day, value: row.weightKg ?? 0 }));
        } else if (goal.exerciseId) {
            subject = nameOf(goal.exerciseId);
            const byWeek = [...(tops.get(goal.exerciseId)?.values() ?? [])].sort((a, b) =>
                a.weekStart.localeCompare(b.weekStart),
            );
            current = Math.max(goal.startValue, ...byWeek.map((week) => week.loadKg));
            points = byWeek.slice(-12).map((week) => ({ day: week.weekStart, value: week.loadKg }));
        }
        const projected = projectGoal(points, goal.targetValue);
        return {
            id: goal.id,
            title: `${subject} ${formatKg(goal.targetValue)} kg até ${shortDate(goal.deadline)}`,
            percent: goalPercent(goal.startValue, current, goal.targetValue),
            remaining: goalRemaining(goal.startValue, current, goal.targetValue),
            projection: projected
                ? `${monthName(projected).toLocaleLowerCase("pt-BR")}${projected.slice(0, 4) !== today.slice(0, 4) ? ` de ${projected.slice(0, 4)}` : ""}`
                : null,
        };
    });

    // Habits
    const trackerOf = (kind: string) => habits.trackers.find((tracker) => tracker.kind === kind);
    const entriesOf = (id: string | undefined): readonly Entry[] =>
        id ? (habits.entries[id] ?? []) : [];
    const todayOf = (id: string | undefined) =>
        entriesOf(id).find((entry) => entry.day === today) ?? null;
    const sleep = trackerOf("sleep");
    const sleepWeek = weekEntries(entriesOf(sleep?.id), thisWeek);
    const steps = trackerOf("steps");
    const stepsToday = todayOf(steps?.id);
    const toDays = (doneFlags: readonly boolean[]): Day[] =>
        thisWeek.map((day, index) => ({
            letter: WEEKDAY_LETTERS[index],
            done: doneFlags[index],
            isToday: day === today,
        }));

    // Hero
    const nextWorkout = program
        ? openSession
            ? (program.workouts.find((workout) => workout.label === openSession.workoutLabel) ??
              null)
            : nextWorkoutInRotation(program, finished.at(-1)?.workoutLabel ?? null)
        : null;
    const pastMinutes = finished
        .filter((session) => session.workoutLabel === nextWorkout?.label)
        .map(minutesOf);
    const totalSets = nextWorkout?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;

    return {
        today,
        hero: {
            open: openSession !== null,
            label: openSession
                ? "Em andamento"
                : `Hoje · ${nextSessionOrdinal(done)} sessão da semana`,
            name: nextWorkout
                ? `Treino ${nextWorkout.label}`
                : openSession
                  ? `Treino ${openSession.workoutLabel ?? ""}`
                  : null,
            focus: nextWorkout
                ? workoutFocus(
                      nextWorkout.exercises.map((exercise) => exercise.exerciseId),
                      catalog,
                  )
                : null,
            exerciseCount: nextWorkout?.exercises.length ?? openSession?.exercises.length ?? 0,
            minutes: estimateMinutes(pastMinutes, totalSets),
        },
        week: {
            done,
            goal: weeklyGoal,
            days: toDays(thisWeek.map((day) => trainedDays.has(day))),
        },
        streak: { ...streak, last12: weeks.slice(-12).map((week) => week.trained >= weeklyGoal) },
        records: {
            list: records.slice(0, 6).map((record) => ({
                name: nameOf(record.exerciseId),
                loadKg: record.loadKg,
                reps: record.reps,
                gainKg: record.gainKg,
                day: record.day,
            })),
            lastTwoWeeks: records.filter((record) => record.day > twoWeeksAgo).length,
        },
        weight,
        measurements: {
            waist: measure("waistCm"),
            chest: measure("chestCm"),
            arm: measure("armCm"),
        },
        weeklyVolume: {
            muscles: [...totals.entries()]
                .map(([slug, sets]) => ({ name: muscleNames.get(slug) ?? slug, sets }))
                .sort((a, b) => b.sets - a.sets),
            totalSets: thisWeekSets.length,
        },
        lastWorkout,
        stagnant,
        month: {
            label: shortMonthName(today),
            previousLabel: monthName(previousStart).toLocaleLowerCase("pt-BR"),
            current: currentMonth,
            previous: previousMonth,
            bestVolume:
                currentMonth.volumeKg > 0 &&
                otherVolumes.every((volume) => currentMonth.volumeKg > volume),
            weekVolumes,
        },
        nextIncreases,
        goals: goalViews,
        goalExercises: [...new Set(programIds)].map((id) => ({ id, name: nameOf(id) })),
        habits: {
            sleep: {
                average: averageOf(sleepWeek),
                goal: sleep?.goal ?? 8,
                week: sleepWeek.map((entry) => entry?.value ?? null),
            },
            water: {
                today: todayOf(trackerOf("water")?.id)?.value ?? null,
                goal: trackerOf("water")?.goal ?? 2.5,
            },
            steps: {
                today: stepsToday?.value ?? null,
                week: weekEntries(entriesOf(steps?.id), thisWeek).reduce(
                    (sum, entry) => sum + (entry?.value ?? 0),
                    0,
                ),
                cardioToday: stepsToday?.secondary ?? null,
                goal: steps?.goal ?? 8000,
            },
            energy: { today: todayOf(trackerOf("energy")?.id)?.value ?? null },
            custom: habits.trackers
                .filter((tracker) => tracker.kind === "custom")
                .map((tracker) => {
                    const valueType = tracker.valueType ?? "number";
                    const flags = weekEntries(entriesOf(tracker.id), thisWeek).map((entry) =>
                        isDayDone(entry, valueType, tracker.goal),
                    );
                    return {
                        id: tracker.id,
                        name: tracker.name ?? "Personalizado",
                        valueType,
                        unit: tracker.unit,
                        goal: tracker.goal,
                        today: todayOf(tracker.id)?.value ?? null,
                        days: toDays(flags),
                        doneDays: flags.filter(Boolean).length,
                    };
                }),
        },
        bestHour: bestHour(records.map((record) => record.hour)),
    };
}

function volumeOf(set: { loadKg: number | null; reps: number | null }): number {
    return setVolume({ loadKg: set.loadKg ?? 0, reps: set.reps ?? 0 });
}

/** The change of a value against the first reading at least `days` days before the latest. */
function changeOver(
    rows: readonly BodyRow[],
    field: "weightKg" | "waistCm" | "chestCm" | "armCm",
    days: number,
): number | null {
    const last = rows.at(-1);
    if (!last || rows.length < 2) {
        return null;
    }
    const from = addDays(last.day, -days);
    const reference = rows.find((row) => row.day >= from && row !== last) ?? rows[0];
    if (reference === last) {
        return null;
    }
    return Math.round(((last[field] ?? 0) - (reference[field] ?? 0)) * 10) / 10;
}

/** "Ombro (lateral)" reads as "ombro". */
function shortMuscle(name: string): string {
    return name.replace(/\s*\(.*\)$/, "");
}

/** "Costas e bíceps": the two primary muscles a workout trains the most. */
function workoutFocus(
    exerciseIds: readonly string[],
    catalog: Map<string, { muscles: readonly { name: string; role: string }[] }>,
): string | null {
    const counts = new Map<string, number>();
    for (const id of exerciseIds) {
        for (const muscle of catalog.get(id)?.muscles ?? []) {
            if (muscle.role === "primary") {
                const name = shortMuscle(muscle.name).toLocaleLowerCase("pt-BR");
                counts.set(name, (counts.get(name) ?? 0) + 1);
            }
        }
    }
    const top = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name);
    if (top.length === 0) {
        return null;
    }
    const text = top.join(" e ");
    return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
}

function formatKg(value: number): string {
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
