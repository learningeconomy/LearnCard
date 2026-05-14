import path from 'path';

import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import fs from 'fs/promises';

const buildOptions = {
    // target: 'es6',
    target: 'es2020',
    sourcemap: true,
    external: ['isomorphic-fetch', 'isomorphic-webcrypto', '@learncard/core', '@learncard/types'],
};

const configurations = [
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        format: 'cjs',
        outfile: 'dist/didkit-plugin.cjs.development.js',
        ...buildOptions,
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        minify: true,
        format: 'cjs',
        outfile: 'dist/didkit-plugin.cjs.production.min.js',
        ...buildOptions,
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [
            copy({
                assets: [{ keepStructure: true, from: ['./src/didkit/pkg/*'], to: ['./didkit'] }],
            }),
        ],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/didkit-plugin.esm.js',
        ...buildOptions,
    },
];

function asyncRimraf(dirPath) {
    return fs.rm(dirPath, { recursive: true, force: true });
}

await Promise.all(
    configurations.map(async config => {
        var dir = config.outdir || path.dirname(config.outfile);
        await asyncRimraf(dir).catch(() => {
            console.log('Unable to delete directory', dir);
        });
    })
);

await Promise.all(configurations.map(config => esbuild.build(config))).catch(err => {
    console.error('❌ Build failed');
    process.exit(1);
});

// Cleanup: esbuild-plugin-copy@1.6.0 has a bug where, with `keepStructure: true` and a
// `*` glob (not `/**/*`), it runs BOTH mergeCopyHandler AND keepStructureCopyHandler.
// The merge handler parses the destination string `./didkit` as a file path with no
// extension and dumps every matched file at the dist/ root in addition to dist/didkit/.
// One of those duplicated files is the wasm-pack-emitted `pkg/package.json`, which
// declares `"type": "module"`. When that lands at `dist/package.json`, Node treats
// every `.js` file in dist/ as ESM — including the CJS mixed entrypoint `dist/index.js`
// (`module.exports = require(...)`), causing
//   ReferenceError: module is not defined
// in any ESM consumer (e.g. the tests/e2e Vitest suite which has `"type": "module"`).
//
// Removing only `dist/package.json` is the minimal targeted fix: it leaves
// `dist/didkit/package.json` (correctly marking the wasm-pack JS wrapper as ESM)
// intact and preserves the duplicate `dist/didkit_wasm_bg.wasm` that backend services
// (lca-api, learn-cloud-service) intentionally import via
// `@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm`.
await fs.rm('dist/package.json', { force: true });

console.log('✔ Build successful');
process.exit(0);
