/**
 * Only an absolute https link may leave the app: anything else (javascript:,
 * data:, http:, a relative path, a malformed value) becomes null, so a bad
 * value in the database can never run script or downgrade to plain http.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }
    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" && url.hostname !== "" ? url.href : null;
    } catch {
        return null;
    }
}
