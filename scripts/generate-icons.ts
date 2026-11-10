/**
 * Generates the app icons from the owner's source icon (brand/icon/icon.png,
 * 1024 × 1024, square corners, solid background) and writes them to public/icons
 * and src/app/favicon.ico. The outputs are committed; run again when the icon changes.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 */
import { mkdir, writeFile } from "node:fs/promises";

import sharp from "sharp";

const SOURCE = "brand/icon/icon.png";
const OUT = "public/icons";

async function main() {
    await mkdir(OUT, { recursive: true });
    const source = sharp(SOURCE);
    const { width, height } = await source.metadata();
    if (width !== 1024 || height !== 1024) {
        throw new Error(`Expected a 1024 × 1024 icon, got ${width} × ${height}.`);
    }
    // The solid background, from the top-left pixel: the maskable icon's safe-area padding uses it.
    const { data } = await sharp(SOURCE)
        .extract({ left: 0, top: 0, width: 1, height: 1 })
        .raw()
        .toBuffer({ resolveWithObject: true });
    const background = { r: data[0], g: data[1], b: data[2], alpha: 1 };

    const sizes: [string, number][] = [
        ["apple-touch-icon.png", 180],
        ["icon-192.png", 192],
        ["icon-512.png", 512],
        ["favicon-16.png", 16],
        ["favicon-32.png", 32],
    ];
    for (const [name, size] of sizes) {
        await sharp(SOURCE)
            .resize(size, size)
            .png({ compressionLevel: 9 })
            .toFile(`${OUT}/${name}`);
    }

    // Maskable: the icon at 80% inside the 512 canvas, so launchers can crop to any shape (40% safe zone radius).
    const inner = await sharp(SOURCE).resize(410, 410).png().toBuffer();
    await sharp({ create: { width: 512, height: 512, channels: 4, background } })
        .composite([{ input: inner, gravity: "center" }])
        .png({ compressionLevel: 9 })
        .toFile(`${OUT}/icon-maskable-512.png`);

    // favicon.ico: an ICO container holding one 32 × 32 PNG (supported by every current browser).
    const png = await sharp(SOURCE).resize(32, 32).png().toBuffer();
    const header = Buffer.alloc(22);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header.writeUInt8(32, 6);
    header.writeUInt8(32, 7);
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);
    await writeFile("src/app/favicon.ico", Buffer.concat([header, png]));
    console.log("Icons written to", OUT);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
