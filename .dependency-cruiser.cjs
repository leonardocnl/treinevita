/**
 * Architecture rules, checked on every commit and in CI.
 * See docs/adr/0001-modular-monolith.md.
 */
const MODULES = "^src/modules/([^/]+)/";

module.exports = {
    forbidden: [
        {
            name: "no-circular",
            severity: "error",
            comment: "Circular imports hide coupling and break tree shaking.",
            from: {},
            to: { circular: true },
        },
        {
            name: "module-public-api-only",
            severity: "error",
            comment:
                "A module may only use another module through its index.ts. " +
                "Exception: table files may reference other modules' tables for foreign keys (ADR 0003).",
            from: { path: `${MODULES}`, pathNot: `${MODULES}infrastructure/schema\\.ts$` },
            to: {
                path: "^src/modules/([^/]+)/.+",
                pathNot: ["^src/modules/$1/", "^src/modules/[^/]+/index\\.ts$"],
            },
        },
        {
            name: "schema-foreign-keys-only",
            severity: "error",
            comment:
                "Table files may only import other modules' table files, nothing else from them.",
            from: { path: `${MODULES}infrastructure/schema\\.ts$` },
            to: {
                path: "^src/modules/([^/]+)/.+",
                pathNot: ["^src/modules/$1/", "^src/modules/[^/]+/infrastructure/schema\\.ts$"],
            },
        },
        {
            name: "domain-is-pure",
            severity: "error",
            comment: "Domain code has no framework, database or other layers.",
            from: { path: `${MODULES}domain/` },
            to: {
                path: [
                    "^src/modules/[^/]+/(application|infrastructure|ui)/",
                    "^src/platform/",
                    "^src/app/",
                    "node_modules/(next|react|react-dom|drizzle-orm|@neondatabase)/",
                ],
            },
        },
        {
            name: "shared-does-not-know-modules",
            severity: "error",
            comment: "shared/ is generic: it never imports modules, platform or routes.",
            from: { path: "^src/shared/" },
            to: { path: ["^src/modules/", "^src/platform/", "^src/app/"] },
        },
        {
            name: "modules-do-not-import-routes",
            severity: "error",
            from: { path: "^src/modules/" },
            to: { path: "^src/app/" },
        },
        {
            name: "not-to-test-from-production",
            severity: "error",
            from: { pathNot: "\\.test\\.ts$" },
            to: { path: "\\.test\\.ts$" },
        },
    ],
    options: {
        doNotFollow: { path: "node_modules" },
        tsPreCompilationDeps: true,
        tsConfig: { fileName: "tsconfig.json" },
        enhancedResolveOptions: {
            exportsFields: ["exports"],
            conditionNames: ["import", "require", "node", "default", "types"],
        },
    },
};
