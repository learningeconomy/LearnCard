import path from 'path';

import esbuild from 'esbuild';
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve';
import rimraf from 'rimraf';

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

const configurations = [
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        incremental: true,
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal],
        entryPoints: ['src/index.ts'],
        format: 'cjs',
        outfile: 'dist/brain-client.cjs.development.js',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        incremental: true,
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal],
        entryPoints: ['src/index.ts'],
        minify: true,
        format: 'cjs',
        outfile: 'dist/brain-client.cjs.production.min.js',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        incremental: true,
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/brain-client.esm.js',
    },
];

function asyncRimraf(path) {
    return new Promise((resolve, reject) => {
        rimraf(path, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
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
