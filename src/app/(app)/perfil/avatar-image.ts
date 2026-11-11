/*
 * Prepares a chosen photo in the browser before it is sent: crops the center
 * square, shrinks it to 512px and re-encodes it. Drawing on a canvas keeps
 * only the pixels, so EXIF (and the location in it) never leaves the phone.
 * WebP where the browser can encode it; iPhone Safari cannot and gives JPEG.
 */
const SIDE = 512;
const MAX_BYTES = 300 * 1024;

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** The photo to upload, or null when the file cannot be read as an image. */
export async function prepareAvatar(file: File): Promise<Blob | null> {
    // createImageBitmap applies the EXIF orientation, so the photo is upright.
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
        return null;
    }
    const crop = Math.min(bitmap.width, bitmap.height);
    const side = Math.min(SIDE, crop);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext("2d");
    if (!context) {
        bitmap.close();
        return null;
    }
    context.imageSmoothingQuality = "high";
    context.drawImage(
        bitmap,
        (bitmap.width - crop) / 2,
        (bitmap.height - crop) / 2,
        crop,
        crop,
        0,
        0,
        side,
        side,
    );
    bitmap.close();
    for (const quality of [0.85, 0.7, 0.5]) {
        const webp = await encode(canvas, "image/webp", quality);
        const blob =
            webp?.type === "image/webp" ? webp : await encode(canvas, "image/jpeg", quality);
        if (blob && blob.size <= MAX_BYTES) {
            return blob;
        }
    }
    return null;
}
