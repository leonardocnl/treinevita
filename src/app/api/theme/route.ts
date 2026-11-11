import { cookies } from "next/headers";
import { z } from "zod";

import { getCurrentUser } from "@/modules/identity";
import { THEMES, themeCookie } from "@/shared/theme/theme";

/*
 * POST /api/theme {"theme": "light" | "dark" | "system"}: stores the appearance
 * in the vita_theme cookie, read by the root layout on the next render. A route
 * handler, not a server action, so the top toggle does not refresh the router
 * (see theme-toggle.tsx). Needs a session; JSON only, so a cross-site form
 * cannot send it without a CORS preflight. Nothing is revalidated: the screen
 * already shows the theme.
 */
export const dynamic = "force-dynamic";

const bodySchema = z.object({ theme: z.enum(THEMES) });

export async function POST(request: Request): Promise<Response> {
    const headers = { "Cache-Control": "no-store" };
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
        return new Response(null, { status: 415, headers });
    }
    if (!(await getCurrentUser())) {
        return new Response(null, { status: 401, headers });
    }
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return new Response(null, { status: 400, headers });
    }
    const cookie = themeCookie(parsed.data.theme, process.env.NODE_ENV === "production");
    (await cookies()).set(cookie.name, cookie.value, cookie.options);
    return new Response(null, { status: 204, headers });
}
