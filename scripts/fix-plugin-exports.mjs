#!/usr/bin/env node
// One-shot migration: align all mixedEntrypoint-style plugins with the
// claimable-boosts/ethereum/render-method/simple-signing pattern so Node ESM
// consumers (e.g. @learncard/init's published ESM bundle) can find named
// exports on @learncard/* plugins.
//
// For each plugin:
//   - package.json: add `"type": "module"`, set main → ./dist/index.cjs, add `exports` map
//   - scripts/build.mjs: rename CJS outfiles .js → .cjs
//   - scripts/mixedEntypoint.js: update require() targets .js → .cjs
//
// Idempotent: skips plugins that already have an `exports` field.
import fs from 'node:fs';
import path from 'node:path';

const PLUGINS_DIR = path.resolve('packages/plugins');
const SKIP = new Set([
    'claimable-boosts', // already fixed
    'ethereum',         // already fixed
    'render-method',    // already fixed
    'simple-signing-plugin', // already fixed
    'didkit-plugin-node',    // different build (N-API, tsc-compiled, no mixedEntrypoint)
]);

const entries = fs.readdirSync(PLUGINS_DIR);

for (const name of entries) {
    if (SKIP.has(name)) continue;
    const dir = path.join(PLUGINS_DIR, name);
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.exports) {
        console.log(`SKIP ${name}: already has exports`);
        continue;
    }
    if (!pkg.module || typeof pkg.module !== 'string') {
        console.log(`SKIP ${name}: no module field`);
        continue;
    }

    // pkg.module looks like "./dist/crypto-plugin.esm.js"
    // Derive base "crypto-plugin"
    const esmFile = pkg.module; // keep as-is
    const m = esmFile.match(/^\.\/dist\/(.+)\.esm\.js$/);
    if (!m) {
        console.log(`SKIP ${name}: unexpected module field: ${esmFile}`);
        continue;
    }
    const base = m[1];

    // Build new package.json with stable key ordering similar to claimable-boosts.
    const newPkg = {};
    for (const [k, v] of Object.entries(pkg)) {
        newPkg[k] = v;
        if (k === 'description') {
            newPkg.type = 'module';
            newPkg.main = './dist/index.cjs';
            newPkg.module = esmFile;
            newPkg.exports = {
                '.': {
                    types: './dist/index.d.ts',
                    import: esmFile,
                    require: './dist/index.cjs',
                },
            };
        }
    }
    // Remove duplicate keys we just re-set
    delete newPkg.main;
    delete newPkg.module;
    // Re-add in correct order: keep our injected ones (already there). Now strip
    // the OLD main/module that appeared later in iteration. Easier: rebuild.
    const finalPkg = {};
    const ordered = ['name','version','description','type','main','module','exports','files','scripts','author','license','homepage','repository','bugs','devDependencies','peerDependencies','types','dependencies','sideEffects'];
    for (const k of ordered) {
        if (k === 'type') { finalPkg.type = 'module'; continue; }
        if (k === 'main') { finalPkg.main = './dist/index.cjs'; continue; }
        if (k === 'module') { finalPkg.module = esmFile; continue; }
        if (k === 'exports') {
            finalPkg.exports = {
                '.': {
                    types: './dist/index.d.ts',
                    import: esmFile,
                    require: './dist/index.cjs',
                },
            };
            continue;
        }
        if (k in pkg) finalPkg[k] = pkg[k];
    }
    // Add any leftover keys not in the canonical ordering
    for (const k of Object.keys(pkg)) {
        if (!(k in finalPkg)) finalPkg[k] = pkg[k];
    }

    fs.writeFileSync(pkgPath, JSON.stringify(finalPkg, null, 4) + '\n');

    // Patch build.mjs: rename CJS outfiles
    const buildPath = path.join(dir, 'scripts', 'build.mjs');
    if (fs.existsSync(buildPath)) {
        let build = fs.readFileSync(buildPath, 'utf8');
        const before = build;
        build = build
            .replace(`${base}.cjs.development.js`, `${base}.cjs.development.cjs`)
            .replace(`${base}.cjs.production.min.js`, `${base}.cjs.production.min.cjs`);
        if (build !== before) fs.writeFileSync(buildPath, build);
    }

    // Patch mixedEntypoint.js
    const mePath = path.join(dir, 'scripts', 'mixedEntypoint.js');
    if (fs.existsSync(mePath)) {
        let me = fs.readFileSync(mePath, 'utf8');
        const before = me;
        me = me
            .replace(`./${base}.cjs.development.js`, `./${base}.cjs.development.cjs`)
            .replace(`./${base}.cjs.production.min.js`, `./${base}.cjs.production.min.cjs`);
        if (me !== before) fs.writeFileSync(mePath, me);
    }

    // Patch package.json scripts.build: change `cp ./scripts/mixedEntypoint.js ./dist/index.js`
    // to `cp ./scripts/mixedEntypoint.js ./dist/index.cjs`
    if (finalPkg.scripts && typeof finalPkg.scripts.build === 'string') {
        const newBuild = finalPkg.scripts.build.replace(
            './dist/index.js',
            './dist/index.cjs',
        );
        if (newBuild !== finalPkg.scripts.build) {
            finalPkg.scripts.build = newBuild;
            fs.writeFileSync(pkgPath, JSON.stringify(finalPkg, null, 4) + '\n');
        }
    }

    console.log(`PATCHED ${name} (base=${base})`);
}
