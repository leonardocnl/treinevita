import { z } from "zod";

const required = z.string().trim().min(1);

const schema = z.object({
    DATABASE_URL: z.url(),
    GOOGLE_CLIENT_ID: required,
    GOOGLE_CLIENT_SECRET: required,
    ALLOWED_EMAILS: required,
    APP_URL: z.url(),
});

export type Env = Partial<z.infer<typeof schema>>;

type RawEnv = Record<string, string | undefined>;

export function isProductionEnv(env: RawEnv): boolean {
    return env.NODE_ENV === "production" || env.VERCEL !== undefined;
}

/**
 * Validates the environment. In production every variable is required; in
 * development they are optional (local database, dev sign-in). The error names
 * the broken variables and never includes their values.
 */
export function parseEnv(env: RawEnv): Env {
    const present = Object.fromEntries(Object.entries(env).filter(([, value]) => value));
    const result = (isProductionEnv(env) ? schema : schema.partial()).safeParse(present);
    if (!result.success) {
        const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
        throw new Error(`Missing or invalid environment variables: ${names.join(", ")}.`);
    }
    return result.data;
}
