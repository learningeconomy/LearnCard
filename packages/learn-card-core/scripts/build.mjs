import path from 'path';
import fs from 'fs/promises';

import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve';
import rimraf from 'rimraf';

const nodeResolveExternal = NodeResolvePlugin({
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.cjs', '.mjs'],
    onResolved: (resolved) => {
        if (resolved.includes('node_modules')) {
            return {
                external: true,
            };
        }
        return resolved;
    },
});

const buildOptions = {
    // target: 'es6',
    target: 'es2020',
    sourcemap: true,
    external: [
        'fs',
        'path',
        'crypto',
        'process',
        'abortcontroller-polyfill',
        'abort-controller',
        'isomorphic-fetch',
        'isomorphic-webcrypto',
        'cross-fetch',
        'ethers',
    ],
};

const configurations = [
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        incremental: true,
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        format: 'cjs',
        outfile: 'dist/core.cjs.development.js',
        ...buildOptions
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        incremental: true,
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        minify: true,
        format: 'cjs',
        outfile: 'dist/core.cjs.production.min.js',
        ...buildOptions
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        incremental: true,
        tsconfig: 'tsconfig.json',
        plugins: [
            copy({ assets: [{ keepStructure: true, from: ['./src/didkit/pkg/*'], to: ['./didkit'] }] }),
        ],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/core.esm.js',
        ...buildOptions
    },
];

function asyncRimraf(path) {
    return new Promise((resolve, reject) => {
        rimraf(path, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function main() {
    Promise.all(
        configurations.map((config) => {
            var dir = config.outdir || path.dirname(config.outfile);
            asyncRimraf(dir).catch(() => {
                console.log('Unable to delete directory', dir);
            });
        }),
    ).then(() => {
        Promise.all(configurations.map((config) => esbuild.build(config)))
            .then(async () => {
                console.log('✔ Build successful');
                process.exit(0);
            })
            .catch((err) => {
                console.error('❌ Build failed');
                process.exit(1);
            });
    });
}

main();