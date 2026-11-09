/*
 * The open workout on the client. It is loaded once when the workout opens and
 * then changed locally: logging or undoing a set shows at once (optimistic) and
 * is saved in the background. Each change is an operation:
 *
 * - `start`: it joins `pending` and the screen already shows it;
 * - `done`: the server saved it, so it moves into `confirmed`;
 * - `failed`: it leaves `pending`, which rolls the screen back.
 *
 * What the screen shows is `confirmed` with the pending operations applied in
 * order. Server actions run one at a time, in the order they were sent, so
 * `confirmed` always follows what the database did.
 */
import type { ExerciseView } from "@/modules/progress";

export type LoggedSet = {
    readonly loadKg: number | null;
    readonly reps: number | null;
    readonly durationSeconds: number | null;
};

export type WorkoutExercise = Omit<ExerciseView, "doneSets"> & {
    readonly doneSets: readonly LoggedSet[];
};

export type SetOperation =
    | {
          readonly id: number;
          readonly kind: "log";
          readonly performedExerciseId: string;
          readonly set: LoggedSet;
      }
    | { readonly id: number; readonly kind: "undo"; readonly performedExerciseId: string };

export type WorkoutState = {
    readonly confirmed: readonly WorkoutExercise[];
    readonly pending: readonly SetOperation[];
};

export type WorkoutEvent = {
    readonly type: "start" | "done" | "failed";
    readonly operation: SetOperation;
};

export function applyOperation(
    exercises: readonly WorkoutExercise[],
    operation: SetOperation,
): WorkoutExercise[] {
    return exercises.map((exercise) => {
        if (exercise.performedExerciseId !== operation.performedExerciseId) {
            return exercise;
        }
        const doneSets =
            operation.kind === "log"
                ? [...exercise.doneSets, operation.set]
                : exercise.doneSets.slice(0, -1);
        return { ...exercise, doneSets };
    });
}

/** What the screen shows: the saved sets plus the ones still on their way. */
export function visibleExercises(state: WorkoutState): readonly WorkoutExercise[] {
    return state.pending.reduce<readonly WorkoutExercise[]>(applyOperation, state.confirmed);
}

export function workoutReducer(state: WorkoutState, event: WorkoutEvent): WorkoutState {
    const others = state.pending.filter((operation) => operation.id !== event.operation.id);
    switch (event.type) {
        case "start":
            return { ...state, pending: [...state.pending, event.operation] };
        case "done":
            return { confirmed: applyOperation(state.confirmed, event.operation), pending: others };
        case "failed":
            return { ...state, pending: others };
    }
}

/** A small store around the reducer, so the workout can outlive the screen that shows it. */
export type WorkoutStore = {
    readonly sessionId: string;
    getState(): WorkoutState;
    dispatch(event: WorkoutEvent): void;
    subscribe(listener: () => void): () => void;
};

export function createWorkoutStore(
    sessionId: string,
    exercises: readonly WorkoutExercise[],
): WorkoutStore {
    let state: WorkoutState = { confirmed: exercises, pending: [] };
    const listeners = new Set<() => void>();
    return {
        sessionId,
        getState: () => state,
        dispatch(event) {
            state = workoutReducer(state, event);
            listeners.forEach((listener) => listener());
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

/**
 * Shows an operation at once, sends it, then confirms it or rolls it back.
 * A thrown error (no network) counts as a failure. Resolves to whether it was saved.
 */
export async function runOperation(
    operation: SetOperation,
    dispatch: (event: WorkoutEvent) => void,
    send: (operation: SetOperation) => Promise<boolean>,
): Promise<boolean> {
    dispatch({ type: "start", operation });
    let saved = false;
    try {
        saved = await send(operation);
    } catch {
        saved = false;
    }
    dispatch({ type: saved ? "done" : "failed", operation });
    return saved;
}

/** Where the wheels open for the next set: the last set logged now, else the server's suggestion. */
export function nextSuggestion(exercise: WorkoutExercise): ExerciseView["suggested"] {
    const last = exercise.doneSets.at(-1);
    return {
        loadKg: last?.loadKg ?? exercise.suggested.loadKg,
        reps: last?.reps ?? exercise.suggested.reps,
        durationSeconds: last?.durationSeconds ?? exercise.suggested.durationSeconds,
    };
}

/** `/treino` is the list (null); `/treino/3` is the third exercise. */
export function positionFromPath(pathname: string): number | null {
    const match = /^\/treino\/(\d+)$/.exec(pathname);
    return match ? Number(match[1]) : null;
}
