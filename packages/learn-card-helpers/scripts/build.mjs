import path from 'path';
import fs from 'fs/promises';

import esbuild from 'esbuild';
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve';


const nodeResolveExternal = NodeResolvePlugin({
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.cjs', '.mjs'],
    onResolved: resolved => {
        if (resolved.includes('node_modules')) {
            return {
                external: true,
            };
        }
        return resolved;
    },
});

// platform: 'node' on the CJS builds makes esbuild emit the
// `0 && (module.exports = {...})` annotation that Node's cjs-module-lexer reads
// to expose named exports to ESM importers. Without it, named imports of this
// package fail under Node ESM.
const configurations = [
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal],
        entryPoints: ['src/index.ts'],
        format: 'cjs',
        platform: 'node',
        outfile: 'dist/helpers.cjs.development.cjs',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal],
        entryPoints: ['src/index.ts'],
        minify: true,
        format: 'cjs',
        platform: 'node',
        outfile: 'dist/helpers.cjs.production.min.cjs',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/helpers.esm.js',
    },
];

function asyncRimraf(path) {
    return fs.rm(path, { recursive: true, force: true });
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

console.log('✔ Build successful');
process.exit(0);
