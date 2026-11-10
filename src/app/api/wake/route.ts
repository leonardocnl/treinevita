import { sql } from "drizzle-orm";

import { getDb } from "@/platform/db/client";
import { createRateLimiter } from "@/platform/rate-limit";

/*
 * GET /api/wake: the app shell calls it once when it loads, without waiting,
 * so the suspended free Neon database starts waking while the person still
 * looks at the screen. It runs `SELECT 1`, returns 204 with no body, holds no
 * data and needs no session. Rate-limited per IP in memory (best effort).
 */
export const dynamic = "force-dynamic";

const allow = createRateLimiter({ limit: 6, windowMs: 60_000 });

function clientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

export async function GET(request: Request): Promise<Response> {
    const headers = { "Cache-Control": "no-store" };
    if (!allow(clientIp(request))) {
        return new Response(null, { status: 429, headers });
    }
    try {
        const db = await getDb();
        await db.execute(sql`select 1`);
    } catch {
        // Waking is best effort: a failure here only means the next real query waits.
    }
    return new Response(null, { status: 204, headers });
}
