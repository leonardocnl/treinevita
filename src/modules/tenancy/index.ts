/**
 * Public API of the tenancy module. Other modules import only from here.
 * Workspaces (the tenant), memberships and roles (owner, coach, member).
 */
export {
    ensurePersonalWorkspace,
    requireAppContext,
    requireOnboardingContext,
    type AppContext,
} from "./application/tenant";
