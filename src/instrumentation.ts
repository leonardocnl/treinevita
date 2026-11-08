/** Runs once when the server starts: a misconfigured deploy fails before serving anyone. */
export async function register() {
    if (
        process.env.NEXT_RUNTIME === "nodejs" &&
        process.env.NEXT_PHASE !== "phase-production-build"
    ) {
        const { parseEnv } = await import("./platform/env");
        parseEnv(process.env);
    }
}
