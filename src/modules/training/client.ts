/**
 * The part of the training public API that is safe in the browser: pure
 * template and draft code, no database or server imports. Client components
 * import from here; everything else uses index.ts.
 */
export {
    MAX_EXERCISES_PER_DAY,
    addExercise,
    buildDraft,
    clearDraft,
    removeExercise,
    replaceExercise,
    suggestTemplate,
    type Prescription,
    type ProgramChoice,
    type ProgramDraft,
    type ProgramTemplate,
    type TemplateId,
} from "./domain/templates";
