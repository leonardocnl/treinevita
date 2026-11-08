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
