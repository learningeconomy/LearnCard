#!/usr/bin/env node
// STATUS: ALREADY APPLIED. One-shot migration codemod kept in-tree as
// documentation / reusable template. Idempotent (skips packages already on the
// nested-condition shape) and not wired into any build or CI step.
//
// Second-pass migration: harden the dual-format exports map so TypeScript
// consumers under `moduleResolution: "node16"` / `"NodeNext"` get the correct
// types for the CJS resolution they actually use.
//
// Why this is needed
// ------------------
// After step 1 (fix-plugin-exports.mjs), every plugin declared:
//
//   "type": "module",
//   "exports": {
//     ".": {
//       "types":   "./dist/index.d.ts",   // ← treated as ESM types
//       "import":  "./dist/x-plugin.esm.js",
//       "require": "./dist/index.cjs"
//     }
//   }
//
// With `"type": "module"`, TypeScript interprets `index.d.ts` as ESM types.
// But the `require` condition resolves to `index.cjs` (CJS). So a TS consumer
// using `require()` gets ESM-flavored types describing a CJS module — a.k.a.
// the "FalseESM" failure publint and @arethetypeswrong/cli both flag.
//
// The standard fix is condition-first nesting with separate `.d.cts` types:
//
//   "exports": {
//     ".": {
//       "import":  { "types": "./dist/index.d.ts",  "default": "./dist/x-plugin.esm.js" },
//       "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
//     }
//   }
//
// And the build copies `dist/index.d.ts` → `dist/index.d.cts` so both
// resolution flavors have a matching declarations file. The `.cts` content is
// identical — only the file extension matters for TS module-detection.
//
// Idempotent: detects and skips plugins already on the new shape.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS_DIR = path.join(ROOT, 'packages/plugins');

const SKIP = new Set([
    'didkit-plugin-node', // N-API native, single tsc-compiled CJS output, no dual format
]);

for (const name of fs.readdirSync(PLUGINS_DIR)) {
    if (SKIP.has(name)) continue;

    const dir = path.join(PLUGINS_DIR, name);
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.type !== 'module' || !pkg.exports?.['.']) continue;

    const dot = pkg.exports['.'];

    // Already split (object-valued conditions)?
    if (
        dot.import &&
        typeof dot.import === 'object' &&
        dot.require &&
        typeof dot.require === 'object'
    ) {
        // Already migrated.
        continue;
    }

    // Old shape: flat. Extract the bundle paths.
    const esmPath = typeof dot.import === 'string' ? dot.import : pkg.module;
    const cjsPath = typeof dot.require === 'string' ? dot.require : './dist/index.cjs';
    const typesPath = dot.types || './dist/index.d.ts';
    const cjsTypesPath = typesPath.replace(/\.d\.ts$/, '.d.cts');

    // Rewrite to the condition-first nested shape.
    pkg.exports = {
        '.': {
            import: {
                types: typesPath,
                default: esmPath,
            },
            require: {
                types: cjsTypesPath,
                default: cjsPath,
            },
        },
    };

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');

    // Add `shx cp dist/index.d.ts dist/index.d.cts` to the build script if
    // it's not already there. We chain it after tsc so the .d.ts exists.
    if (typeof pkg.scripts?.build === 'string') {
        if (!pkg.scripts.build.includes('index.d.cts')) {
            // The build pattern is `... && tsc --p tsconfig.json`. Append the copy.
            pkg.scripts.build = pkg.scripts.build.replace(
                /(tsc --p tsconfig(?:\.build)?\.json)$/,
                '$1 && shx cp ./dist/index.d.ts ./dist/index.d.cts',
            );
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
        }
    }

    console.log(`PATCHED ${name}`);
}
