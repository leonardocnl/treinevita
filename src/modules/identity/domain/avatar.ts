/**
 * The profile photo. The browser crops it square, shrinks it to 512px and
 * re-encodes it (WebP, or JPEG where the browser cannot encode WebP), which
 * also drops EXIF and the location. The server trusts none of that: it reads
 * the file's first bytes to learn what it really is, whatever its name or
 * content type say, and takes only these images, up to 300 KB.
 */
export const AVATAR_MIMES = ["image/webp", "image/jpeg", "image/png"] as const;
export type AvatarMime = (typeof AVATAR_MIMES)[number];

export const AVATAR_MAX_BYTES = 300 * 1024;

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
    return signature.every((byte, index) => bytes[offset + index] === byte);
}

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

/** What the bytes are, from their signature; null when they are not an accepted image. */
export function sniffAvatar(bytes: Uint8Array): AvatarMime | null {
    if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) {
        return "image/webp";
    }
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
        return "image/jpeg";
    }
    if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return "image/png";
    }
    return null;
}

/** The photo to store, or why not. */
export function checkAvatar(
    bytes: Uint8Array,
): { ok: true; mime: AvatarMime } | { ok: false; reason: "empty" | "too_large" | "not_image" } {
    if (bytes.length === 0) {
        return { ok: false, reason: "empty" };
    }
    if (bytes.length > AVATAR_MAX_BYTES) {
        return { ok: false, reason: "too_large" };
    }
    const mime = sniffAvatar(bytes);
    return mime ? { ok: true, mime } : { ok: false, reason: "not_image" };
}
