import { getAvatar } from "@/modules/identity";
import { requireAppContext } from "@/modules/tenancy";

/*
 * GET /api/avatar: the signed-in person's own photo, and only theirs (the user
 * comes from the session; there is no id to ask for). Private cache with an
 * ETag from updated_at, so the browser revalidates and gets a 304 until the
 * photo changes. Served with the type read from its bytes, never sniffed
 * (nosniff in next.config.ts), and sandboxed in case it is opened on its own.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
    const context = await requireAppContext();
    const avatar = await getAvatar(context);
    if (!avatar) {
        return new Response(null, {
            status: 404,
            headers: { "Cache-Control": "private, no-store" },
        });
    }
    const etag = `"${avatar.updatedAt.getTime()}"`;
    const headers = {
        "Cache-Control": "private, no-cache",
        ETag: etag,
        "Content-Type": avatar.mime,
        "Content-Security-Policy": "default-src 'none'; sandbox",
    };
    if (request.headers.get("if-none-match") === etag) {
        return new Response(null, { status: 304, headers });
    }
    return new Response(new Uint8Array(avatar.bytes), { headers });
}
