/**
 * Public API of the training module. Other modules import only from here.
 * Planning: programs (the "ficha"), workouts A/B/C, prescribed exercises and weekly goal.
 */
export {
    getActiveProgram,
    getWeeklyGoal,
    nextWorkoutInRotation,
    type ActiveProgram,
    type PrescribedExercise,
    type Workout,
} from "./application/programs";
