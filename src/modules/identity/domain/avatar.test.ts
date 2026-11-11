import { describe, expect, it } from "vitest";

import { AVATAR_MAX_BYTES, checkAvatar } from "./avatar";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("checkAvatar", () => {
    it("reads the real type from the first bytes", () => {
        expect(checkAvatar(text("RIFF\0\0\0\0WEBPVP8 "))).toEqual({ ok: true, mime: "image/webp" });
        expect(checkAvatar(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({
            ok: true,
            mime: "image/jpeg",
        });
        expect(checkAvatar(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toEqual({
            ok: true,
            mime: "image/png",
        });
    });

    it("refuses anything else, whatever it claims to be", () => {
        expect(checkAvatar(text("<svg xmlns='http://www.w3.org/2000/svg'/>")).ok).toBe(false);
        expect(checkAvatar(text("<html><script>alert(1)</script>")).ok).toBe(false);
        expect(checkAvatar(text("RIFF\0\0\0\0WAVEfmt ")).ok).toBe(false);
        expect(checkAvatar(text("GIF89a")).ok).toBe(false);
        expect(checkAvatar(bytes())).toEqual({ ok: false, reason: "empty" });
    });

    it("refuses a photo over 300 KB", () => {
        const big = new Uint8Array(AVATAR_MAX_BYTES + 1);
        big.set([0xff, 0xd8, 0xff]);
        expect(checkAvatar(big)).toEqual({ ok: false, reason: "too_large" });
        expect(checkAvatar(big.subarray(0, AVATAR_MAX_BYTES)).ok).toBe(true);
    });
});
