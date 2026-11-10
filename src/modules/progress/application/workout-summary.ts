import "server-only";

import { getExercisesByIds } from "@/modules/catalog";
import { getLastFinishedSession, listSessionsSince, listSetsSince } from "@/modules/logging";
import type { TenantContext } from "@/shared/db/tenant";
import { addDays, localHour, toLocalDate } from "@/shared/time/local-date";

import { findRecords, type HistorySet } from "../domain/metrics";
import { isEffectiveSet, setVolume } from "../domain/strength";

type Totals = { readonly minutes: number; readonly sets: number; readonly volumeKg: number };

export type WorkoutSummary = {
    readonly name: string;
    readonly totals: Totals;
    /** The previous session of the same workout, to compare against. */
    readonly previous: Totals | null;
    readonly records: readonly {
        readonly name: string;
        readonly loadKg: number;
        readonly reps: number;
    }[];
};

/** The workout just finished: totals, the comparison with last time and its records. */
export async function getWorkoutSummary(
    context: TenantContext & { timezone: string },
): Promise<WorkoutSummary | null> {
    const last = await getLastFinishedSession(context);
    if (!last) {
        return null;
    }
    const since = new Date(
        `${addDays(toLocalDate(last.startedAt, context.timezone), -365)}T00:00:00Z`,
    );
    const [sessions, rows] = await Promise.all([
        listSessionsSince(context, since),
        listSetsSince(context, since),
    ]);

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
    const totalsOf = (sessionId: string): Totals => {
        const session = sessions.find((item) => item.sessionId === sessionId);
        const sets = effective.filter((row) => row.sessionId === sessionId);
        return {
            minutes: session?.finishedAt
                ? Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 60000)
                : 0,
            sets: rows.filter((row) => row.sessionId === sessionId).length,
            volumeKg: Math.round(
                sets.reduce(
                    (sum, row) =>
                        sum + setVolume({ loadKg: row.set.loadKg ?? 0, reps: row.set.reps ?? 0 }),
                    0,
                ),
            ),
        };
    };
    const previous = sessions
        .filter(
            (session) =>
                session.finishedAt &&
                session.sessionId !== last.sessionId &&
                session.workoutLabel === last.workoutLabel &&
                session.startedAt < last.startedAt,
        )
        .at(-1);

    const history: HistorySet[] = effective.map((row) => ({
        exerciseId: row.exerciseId,
        sessionId: row.sessionId,
        day: toLocalDate(row.startedAt, context.timezone),
        hour: localHour(row.startedAt, context.timezone),
        loadKg: row.set.loadKg ?? 0,
        reps: row.set.reps ?? 0,
    }));
    const sessionRecords = findRecords(history).filter((record) =>
        history.some(
            (set) =>
                set.sessionId === last.sessionId &&
                set.exerciseId === record.exerciseId &&
                set.day === record.day,
        ),
    );
    const catalog = await getExercisesByIds(
        context,
        sessionRecords.map((record) => record.exerciseId),
    );

    return {
        name: `Treino ${last.workoutLabel ?? ""}`.trim(),
        totals: totalsOf(last.sessionId),
        previous: previous ? totalsOf(previous.sessionId) : null,
        records: sessionRecords.map((record) => ({
            name: catalog.get(record.exerciseId)?.name ?? "Exercício",
            loadKg: record.loadKg,
            reps: record.reps,
        })),
    };
}
