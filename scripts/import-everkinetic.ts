/**
 * Imports the Everkinetic exercise drawings (CC BY-SA 4.0) for the global
 * catalog. Run by hand; the output is committed, so builds never download.
 *
 * 1. Reads the dataset at a pinned commit, downloaded once into .cache/.
 * 2. Matches each catalog exercise by name and equipment, or through the
 *    reviewed map in src/modules/catalog/data/everkinetic-map.ts.
 * 3. Sanitizes and recolors every SVG (currentColor), then writes
 *    public/exercises/<slug>/start.svg and end.svg.
 * 4. Writes the list of drawn slugs for the catalog seed and prints the
 *    exercises with no drawing.
 *
 * Usage: npm run catalog:import-drawings
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { EVERKINETIC_MAP } from "../src/modules/catalog/data/everkinetic-map";
import { sanitizeSvg } from "../src/modules/catalog/domain/svg";
import {
    GLOBAL_EXERCISES,
    type GlobalExercise,
} from "../src/modules/catalog/infrastructure/global-catalog";

const COMMIT = "446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6";
const SOURCE = `https://raw.githubusercontent.com/everkinetic/data/${COMMIT}`;
const CACHE = join(".cache", "everkinetic", COMMIT);
const OUTPUT = join("public", "exercises");
const DRAWN_LIST = join("src", "modules", "catalog", "data", "everkinetic-drawings.ts");
const MAX_SVG_BYTES = 512 * 1024;

type EverkineticExercise = { id_num: string; name: string; equipment?: string[] };

/** A file of the dataset at the pinned commit; null when it does not exist. */
async function fetchCached(path: string): Promise<string | null> {
    const file = join(CACHE, path);
    const missing = `${file}.missing`;
    try {
        return await readFile(file, "utf8");
    } catch {}
    try {
        await readFile(missing);
        return null;
    } catch {}

    const response = await fetch(`${SOURCE}/${path}`);
    await mkdir(dirname(file), { recursive: true });
    if (response.status === 404) {
        await writeFile(missing, "");
        return null;
    }
    if (!response.ok) {
        throw new Error(`Download failed (${response.status}): ${path}`);
    }
    const body = await response.text();
    await writeFile(file, body);
    return body;
}

const stem = (word: string) => word.replace(/s$/, "");
const words = (text: string) =>
    text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .map(stem);

const EQUIPMENT_WORDS: Record<GlobalExercise["equipment"], string[]> = {
    machine: ["machine"],
    barbell: ["barbell"],
    dumbbell: ["dumbbell"],
    cable: ["cable"],
    bodyweight: ["body"],
    other: [],
};

/** Everkinetic exercises whose name and equipment hold every word of the slug, shortest first. */
function candidates(exercise: GlobalExercise, dataset: EverkineticExercise[]): string[] {
    const wanted = words(exercise.slug);
    const equipmentWords = EQUIPMENT_WORDS[exercise.equipment];
    return dataset
        .filter((candidate) => {
            const equipment = words((candidate.equipment ?? []).join(" "));
            const available = new Set([...words(candidate.name), ...equipment]);
            return (
                wanted.every((word) => available.has(word)) &&
                equipmentWords.every((word) => equipment.includes(word))
            );
        })
        .sort((a, b) => words(a.name).length - words(b.name).length)
        .map((candidate) => candidate.name);
}

async function drawings(
    name: string,
    dataset: EverkineticExercise[],
): Promise<{ start: string; end: string } | null> {
    // A few names appear twice in the dataset, only one of them with drawings.
    const entries = dataset.filter((candidate) => candidate.name === name);
    if (entries.length === 0) {
        throw new Error(`Unknown Everkinetic exercise in the map: ${name}`);
    }
    let start: string | null = null;
    let end: string | null = null;
    for (const entry of entries) {
        // Everkinetic names the poses "relaxation" (start) and "tension" (end).
        [start, end] = await Promise.all([
            fetchCached(`dist/svg/${entry.id_num}-relaxation.svg`),
            fetchCached(`dist/svg/${entry.id_num}-tension.svg`),
        ]);
        if (start && end) {
            break;
        }
    }
    if (!start || !end) {
        return null;
    }
    if (start.length > MAX_SVG_BYTES || end.length > MAX_SVG_BYTES) {
        throw new Error(`Drawing too large: ${name}`);
    }
    return {
        start: sanitizeSvg(start, { recolor: true }),
        end: sanitizeSvg(end, { recolor: true }),
    };
}

async function main() {
    const json = await fetchCached("exercises.json");
    if (!json) {
        throw new Error("exercises.json not found at the pinned commit");
    }
    const dataset = JSON.parse(json) as EverkineticExercise[];

    await rm(OUTPUT, { recursive: true, force: true });
    const drawn: string[] = [];
    const missing: string[] = [];

    for (const exercise of GLOBAL_EXERCISES) {
        const names =
            exercise.slug in EVERKINETIC_MAP
                ? [EVERKINETIC_MAP[exercise.slug]].filter((name): name is string => name !== null)
                : candidates(exercise, dataset);

        let match: { name: string; start: string; end: string } | null = null;
        for (const name of names) {
            const svg = await drawings(name, dataset);
            if (svg) {
                match = { name, ...svg };
                break;
            }
        }
        if (!match) {
            missing.push(`${exercise.slug} (${exercise.name})`);
            continue;
        }

        const folder = join(OUTPUT, exercise.slug);
        await mkdir(folder, { recursive: true });
        await writeFile(join(folder, "start.svg"), `${match.start}\n`);
        await writeFile(join(folder, "end.svg"), `${match.end}\n`);
        drawn.push(exercise.slug);
        console.log(`  ${exercise.slug} ← ${match.name}`);
    }

    drawn.sort();
    await writeFile(
        DRAWN_LIST,
        [
            "/**",
            " * Generated by scripts/import-everkinetic.ts: the global exercises with",
            " * Everkinetic drawings in public/exercises/<slug>/. Do not edit by hand.",
            " */",
            "export const EVERKINETIC_DRAWINGS: readonly string[] = [",
            ...drawn.map((slug) => `    "${slug}",`),
            "];",
            "",
        ].join("\n"),
    );

    console.log(`\n${drawn.length} of ${GLOBAL_EXERCISES.length} exercises have drawings.`);
    if (missing.length > 0) {
        console.log(`\nNo drawing (${missing.length}):`);
        for (const line of missing) {
            console.log(`  ${line}`);
        }
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
