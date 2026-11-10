import { describe, expect, it } from "vitest";

import {
    createWorkoutStore,
    runOperation,
    visibleExercises,
    type SetOperation,
    type WorkoutExercise,
} from "./workout-state";

function exercise(id: string, loads: number[]): WorkoutExercise {
    return {
        performedExerciseId: id,
        doneSets: loads.map((loadKg) => ({ loadKg, reps: 10, durationSeconds: null })),
    } as unknown as WorkoutExercise;
}

const loadsOf = (exercises: readonly WorkoutExercise[]) =>
    exercises.map((item) => item.doneSets.map((set) => set.loadKg));

const log = (id: number, loadKg: number): SetOperation => ({
    id,
    kind: "log",
    performedExerciseId: "a",
    set: { loadKg, reps: 10, durationSeconds: null },
});

/** A server that answers when told to, so the test sees the screen in between. */
function deferredServer() {
    const calls: { operation: SetOperation; answer: (saved: boolean | Error) => void }[] = [];
    const send = (operation: SetOperation) =>
        new Promise<boolean>((resolve, reject) => {
            calls.push({
                operation,
                answer: (saved) => (saved instanceof Error ? reject(saved) : resolve(saved)),
            });
        });
    return { calls, send };
}

describe("optimistic set log", () => {
    it("shows the set at once and keeps it when the server saves it", async () => {
        const store = createWorkoutStore("s", [exercise("a", [20]), exercise("b", [])]);
        const server = deferredServer();

        const saving = runOperation(log(1, 22.5), store.dispatch, server.send);
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[20, 22.5], []]);
        expect(loadsOf(store.getState().confirmed)).toEqual([[20], []]);

        server.calls[0].answer(true);
        expect(await saving).toBe(true);
        expect(store.getState().pending).toEqual([]);
        expect(loadsOf(store.getState().confirmed)).toEqual([[20, 22.5], []]);
    });

    it("rolls back when the server refuses or the network fails", async () => {
        const store = createWorkoutStore("s", [exercise("a", [20])]);
        const server = deferredServer();

        const refused = runOperation(log(1, 22.5), store.dispatch, server.send);
        const offline = runOperation(log(2, 25), store.dispatch, server.send);
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[20, 22.5, 25]]);

        server.calls[0].answer(false);
        expect(await refused).toBe(false);
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[20, 25]]);

        server.calls[1].answer(new Error("Failed to fetch"));
        expect(await offline).toBe(false);
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[20]]);
        expect(store.getState().pending).toEqual([]);
    });

    it("undoes optimistically and follows the server's order", async () => {
        const store = createWorkoutStore("s", [exercise("a", [20, 22.5])]);
        const server = deferredServer();
        const undo: SetOperation = { id: 2, kind: "undo", performedExerciseId: "a" };

        // A log that fails, then an undo that the server applies to the last saved set.
        const logging = runOperation(log(1, 25), store.dispatch, server.send);
        const undoing = runOperation(undo, store.dispatch, server.send);
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[20, 22.5]]);

        server.calls[0].answer(false);
        await logging;
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[20]]);

        server.calls[1].answer(true);
        await undoing;
        expect(loadsOf(store.getState().confirmed)).toEqual([[20]]);
    });

    it("tells its listeners about every change", async () => {
        const store = createWorkoutStore("s", [exercise("a", [])]);
        let changes = 0;
        const stop = store.subscribe(() => changes++);
        await runOperation(log(1, 20), store.dispatch, async () => true);
        stop();
        await runOperation(log(2, 20), store.dispatch, async () => true);
        expect(changes).toBe(2);
    });
});

describe("editing a set", () => {
    it("replaces only that set, at once, and rolls back when the save fails", async () => {
        const store = createWorkoutStore("s", [exercise("a", [40, 42.5])]);
        const server = deferredServer();
        const edit: SetOperation = {
            id: 9,
            kind: "edit",
            performedExerciseId: "a",
            index: 0,
            set: { loadKg: 45, reps: 8, durationSeconds: null },
        };
        const running = runOperation(edit, store.dispatch, server.send);
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[45, 42.5]]);
        server.calls[0].answer(false);
        await running;
        expect(loadsOf(visibleExercises(store.getState()))).toEqual([[40, 42.5]]);
    });
});
