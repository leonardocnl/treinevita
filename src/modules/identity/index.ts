/**
 * Public API of the identity module. Other modules import only from here.
 * Users, sign-in identities (Google) and server-side sessions.
 */
export { devSignIn, isDevSignInAvailable } from "./application/dev-sign-in";
export {
    finishGoogleSignIn,
    startGoogleSignIn,
    type GoogleSignInResult,
} from "./application/google-sign-in";
export {
    createSession,
    destroySession,
    getCurrentUser,
    type CurrentUser,
} from "./application/sessions";
export { getProfile, saveProfile, type Profile } from "./application/profile";
export {
    getAvatar,
    getAvatarVersion,
    removeAvatar,
    saveAvatar,
    type Avatar,
} from "./application/avatar";
export { AVATAR_MAX_BYTES } from "./domain/avatar";
export {
    EXPERIENCES,
    GOALS,
    HEIGHT_CM,
    NAME_MAX,
    SESSION_MINUTES,
    TRAINING_PLACES,
    WEEKLY_GOAL,
    WEIGHT_KG,
    onboardingRedirect,
    profileSchema,
    type Experience,
    type Goal,
    type ProfileInput,
    type SessionMinutes,
    type TrainingPlace,
} from "./domain/profile";
