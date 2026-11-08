/**
 * Sanitizer for the third-party exercise drawings (Everkinetic), run by the
 * import script before anything is written to `public/` (ADR 0011, A08).
 *
 * Allowlist, not denylist: only basic shapes and presentation attributes
 * survive. Scripts, event handlers, `style`, `foreignObject`, links,
 * external references and any value with `url(` are dropped, as are
 * comments, text, CDATA, doctypes and processing instructions. The output is
 * rebuilt from scratch, never copied through.
 *
 * With `recolor`, white fills (the drawing's background) are removed and every
 * other fill or stroke becomes `currentColor`, so the line art follows the
 * app's ink color and theme.
 */

const ELEMENTS = new Set([
    "svg",
    "g",
    "path",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "rect",
]);

const ATTRIBUTES = new Set([
    "viewBox",
    "d",
    "points",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "width",
    "height",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "fill-rule",
    "clip-rule",
    "transform",
    "opacity",
    "fill-opacity",
    "stroke-opacity",
]);

/** Numbers, path commands, colors, keywords and transform functions; no quotes, no markup. */
const SAFE_VALUE = /^[a-zA-Z0-9#.,\s()%+-]*$/;
const UNSAFE_VALUE = /url\s*\(|javascript|expression|data:/i;
const WHITE = /^(#fff|#ffffff|white)$/i;

const TOKEN =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\?[\s\S]*?\?>|<\/\s*([a-zA-Z][\w:.-]*)\s*>|<([a-zA-Z][\w:.-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|<|[^<]+/g;

const ATTRIBUTE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

type Open = { name: string; kept: boolean };

export function sanitizeSvg(input: string, options: { recolor?: boolean } = {}): string {
    const out: string[] = [];
    const stack: Open[] = [];
    let seenRoot = false;

    for (const match of input.matchAll(TOKEN)) {
        const [, closing, opening, rawAttributes = "", selfClosing] = match;

        if (closing !== undefined) {
            const index = stack.findLastIndex((entry) => entry.name === closing);
            if (index === -1) {
                continue;
            }
            for (const entry of stack.splice(index).reverse()) {
                if (entry.kept) {
                    out.push(`</${entry.name}>`);
                }
            }
            continue;
        }

        if (opening === undefined) {
            // Text, comments, CDATA, doctypes, processing instructions, stray "<".
            continue;
        }

        const parentKept = stack.every((entry) => entry.kept);
        const isRoot = opening === "svg" && !seenRoot;
        let kept = parentKept && ELEMENTS.has(opening) && (seenRoot || isRoot);
        let attributes = "";

        if (kept) {
            const result = rebuildAttributes(rawAttributes, isRoot, options.recolor === true);
            kept = result !== null;
            attributes = result ?? "";
        }
        if (kept && isRoot) {
            seenRoot = true;
        }

        if (selfClosing) {
            if (kept) {
                out.push(`<${opening}${attributes}/>`);
            }
            continue;
        }
        stack.push({ name: opening, kept });
        if (kept) {
            out.push(`<${opening}${attributes}>`);
        }
    }

    for (const entry of stack.reverse()) {
        if (entry.kept) {
            out.push(`</${entry.name}>`);
        }
    }
    return out.join("");
}

/** The allowed attributes, quoted again; null when the element must go (a white fill). */
function rebuildAttributes(raw: string, isRoot: boolean, recolor: boolean): string | null {
    const parts: string[] = isRoot ? [' xmlns="http://www.w3.org/2000/svg"'] : [];
    for (const [, name, double, single, bare] of raw.matchAll(ATTRIBUTE)) {
        let value = (double ?? single ?? bare ?? "").trim();
        if (!ATTRIBUTES.has(name) || !SAFE_VALUE.test(value) || UNSAFE_VALUE.test(value)) {
            continue;
        }
        if (isRoot && (name === "width" || name === "height")) {
            // Sized by CSS through the viewBox.
            continue;
        }
        if (recolor && (name === "fill" || name === "stroke")) {
            if (name === "fill" && WHITE.test(value)) {
                return null;
            }
            if (value !== "none") {
                value = "currentColor";
            }
        }
        parts.push(` ${name}="${value}"`);
    }
    return parts.join("");
}
