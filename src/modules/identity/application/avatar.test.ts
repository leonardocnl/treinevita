import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/platform/db/drivers";
import { schema } from "@/platform/db/schema";
import type { TenantContext } from "@/shared/db/tenant";

const test = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("server-only", () => ({}));
vi.mock("@/platform/db/client", () => ({ getDb: async () => test.db }));

const { getAvatar, getAvatarVersion, removeAvatar, saveAvatar } = await import("./avatar");

const jpeg = (fill: number) => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, fill, 0, 255, 128]);

let me: TenantContext;
let other: TenantContext;

beforeAll(async () => {
    const db = drizzle(new PGlite(), { schema }) as unknown as Database;
    test.db = db;
    await migrate(db as never, { migrationsFolder: "./drizzle" });
    const [workspace] = await db
        .insert(schema.workspaces)
        .values({ name: "Eu", kind: "personal" })
        .returning({ id: schema.workspaces.id });
    const [user, otherUser] = await db
        .insert(schema.users)
        .values([{ email: "eu@example.com" }, { email: "outro@example.com" }])
        .returning({ id: schema.users.id });
    me = { workspaceId: workspace.id, userId: user.id };
    other = { workspaceId: workspace.id, userId: otherUser.id };
});

describe("avatar repository", () => {
    it("stores the bytes exactly, replaces them, and keeps each person's own", async () => {
        expect(await saveAvatar(me, jpeg(1))).toBe(true);
        expect(await getAvatar(other)).toBeNull();

        expect(await saveAvatar(me, jpeg(2))).toBe(true);
        const avatar = await getAvatar(me);
        expect(avatar?.mime).toBe("image/jpeg");
        expect([...(avatar?.bytes ?? [])]).toEqual([...jpeg(2)]);
        expect(await getAvatarVersion(me)).toEqual(avatar?.updatedAt);
    });

    it("refuses what is not an image, whatever it says it is", async () => {
        expect(await saveAvatar(other, new TextEncoder().encode("<svg onload=alert(1)>"))).toBe(
            false,
        );
        expect(await getAvatar(other)).toBeNull();
    });

    it("removes the photo for real", async () => {
        await removeAvatar(me);
        expect(await getAvatar(me)).toBeNull();
        expect(await getAvatarVersion(me)).toBeNull();
    });
});
