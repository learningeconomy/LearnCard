import path from 'path';

import esbuild from 'esbuild';
import fs from 'fs/promises';

const buildOptions = {
    // target: 'es6',
    target: 'es2020',
    sourcemap: true,
    external: ['isomorphic-fetch', 'isomorphic-webcrypto', '@learncard/core', '@learncard/didkit-plugin', '@learncard/init', '@learncard/lca-api-client', '@learncard/types'],
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
        outfile: 'dist/lca-api-plugin.cjs.development.js',
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
        outfile: 'dist/lca-api-plugin.cjs.production.min.js',
        ...buildOptions,
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/lca-api-plugin.esm.js',
        ...buildOptions,
    },
];

function asyncRimraf(dirPath) {
    return fs.rm(dirPath, { recursive: true, force: true });
}

function main() {
    Promise.all(
        configurations.map(config => {
            var dir = config.outdir || path.dirname(config.outfile);
            asyncRimraf(dir).catch(() => {
                console.log('Unable to delete directory', dir);
            });
        })
    ).then(() => {
        Promise.all(configurations.map(config => esbuild.build(config)))
            .then(async () => {
                console.log('✔ Build successful');
                process.exit(0);
            })
            .catch(err => {
                console.error('❌ Build failed');
                process.exit(1);
            });
    });
}

main();
