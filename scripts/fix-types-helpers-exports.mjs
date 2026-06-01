#!/usr/bin/env node
// Generic migration: apply the dual-format exports fix to any package using
// the mixedEntrypoint pattern that isn't a workspace plugin (those are
// handled by fix-plugin-exports.mjs and fix-plugin-types-cts.mjs).
//
// Currently targets:
//   - packages/learn-card-types     (@learncard/types)
//   - packages/learn-card-helpers   (@learncard/helpers)
//
// Both ship the same broken shape that caused the smoketest regression:
//   "main": "./dist/index.js"   ← conditional CJS shim, opaque to cjs-module-lexer
//   "module": "./dist/X.esm.js" ← bundler-only field, Node ESM ignores it
//   (no "exports")              ← Node ESM falls back to main → SyntaxError
//
// Applies the same fix as the plugins: type: module, .cjs extensions,
// condition-first exports map with .d.cts types for the require side.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = ['packages/learn-card-types', 'packages/learn-card-helpers'];

for (const rel of TARGETS) {
    const dir = path.join(ROOT, rel);
    const pkgPath = path.join(dir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    if (pkg.exports?.['.']?.import && typeof pkg.exports['.'].import === 'object') {
        console.log(`SKIP ${rel}: already migrated`);
        continue;
    }

    const esmPath = pkg.module;
    const m = esmPath.match(/^\.\/dist\/(.+)\.esm\.js$/);
    if (!m) {
        console.log(`SKIP ${rel}: unexpected module field: ${esmPath}`);
        continue;
    }
    const base = m[1];

    // Build new package.json with stable key ordering.
    const ordered = [
        'name','version','description','type','main','module','exports','files','scripts',
        'author','license','homepage','repository','bugs','devDependencies','peerDependencies',
        'types','dependencies','sideEffects',
    ];
    const newPkg = {};
    for (const k of ordered) {
        if (k === 'type') { newPkg.type = 'module'; continue; }
        if (k === 'main') { newPkg.main = './dist/index.cjs'; continue; }
        if (k === 'module') { newPkg.module = esmPath; continue; }
        if (k === 'exports') {
            newPkg.exports = {
                '.': {
                    import: {
                        types: './dist/index.d.ts',
                        default: esmPath,
                    },
                    require: {
                        types: './dist/index.d.cts',
                        default: './dist/index.cjs',
                    },
                },
            };
            continue;
        }
        if (k in pkg) newPkg[k] = pkg[k];
    }
    for (const k of Object.keys(pkg)) {
        if (!(k in newPkg)) newPkg[k] = pkg[k];
    }

    // Patch scripts.build:
    //   1. mixedEntypoint → ./dist/index.cjs (was index.js)
    //   2. append `&& shx cp ./dist/index.d.ts ./dist/index.d.cts`
    if (typeof newPkg.scripts?.build === 'string') {
        let b = newPkg.scripts.build.replace('./dist/index.js', './dist/index.cjs');
        if (!b.includes('index.d.cts')) {
            b = b.replace(/(tsc --p tsconfig(?:\.build)?\.json)$/, '$1 && shx cp ./dist/index.d.ts ./dist/index.d.cts');
        }
        newPkg.scripts.build = b;
    }

    fs.writeFileSync(pkgPath, JSON.stringify(newPkg, null, 4) + '\n');

    // Patch scripts/build.mjs — CJS outfiles .js → .cjs
    const buildScriptPath = path.join(dir, 'scripts', 'build.mjs');
    if (fs.existsSync(buildScriptPath)) {
        let s = fs.readFileSync(buildScriptPath, 'utf8');
        s = s
            .replace(`${base}.cjs.development.js`, `${base}.cjs.development.cjs`)
            .replace(`${base}.cjs.production.min.js`, `${base}.cjs.production.min.cjs`);
        fs.writeFileSync(buildScriptPath, s);
    }

    // Patch scripts/mixedEntypoint.js — require targets .js → .cjs
    const mePath = path.join(dir, 'scripts', 'mixedEntypoint.js');
    if (fs.existsSync(mePath)) {
        let s = fs.readFileSync(mePath, 'utf8');
        s = s
            .replace(`./${base}.cjs.development.js`, `./${base}.cjs.development.cjs`)
            .replace(`./${base}.cjs.production.min.js`, `./${base}.cjs.production.min.cjs`);
        fs.writeFileSync(mePath, s);
    }

    console.log(`PATCHED ${rel} (base=${base})`);
}
