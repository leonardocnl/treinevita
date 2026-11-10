/**
 * Public API of the logging module. Other modules import only from here.
 * Execution: workout sessions, performed exercises and sets, with a snapshot of the prescription.
 */
export {
    discardOpenSession,
    finishSession,
    getLastFinishedSession,
    getLastSetsByExercise,
    getOpenSession,
    listSessionsSince,
    listSetsSince,
    logSet,
    startSession,
    undoLastSet,
    updateSet,
    type OpenSession,
    type PerformedExercise,
    type PerformedSet,
    type SessionSummary,
    type SetInput,
    type WorkoutToStart,
} from "./application/sessions";
export type { PrescriptionSnapshot } from "./infrastructure/schema";
