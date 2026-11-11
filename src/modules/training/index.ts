/**
 * Public API of the training module. Other modules import only from here.
 * Planning: programs (the "ficha"), workouts A/B/C, prescribed exercises,
 * program templates and the weekly goal.
 */
export {
    applyProgramChoice,
    getActiveProgram,
    getWeeklyGoal,
    nextWorkoutInRotation,
    programRest,
    setProgramRest,
    setWeeklyGoal,
    type ActiveProgram,
    type PrescribedExercise,
    type Workout,
} from "./application/programs";
export {
    MAX_EXERCISES_PER_DAY,
    TEMPLATES,
    TEMPLATE_IDS,
    addExercise,
    buildDraft,
    clearDraft,
    programChoiceSchema,
    removeExercise,
    replaceExercise,
    suggest,
    suggestTemplate,
    type ProgramChoice,
    type ProgramDraft,
    type ProgramTemplate,
    type TemplateId,
} from "./domain/templates";
