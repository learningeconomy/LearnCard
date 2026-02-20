import path from 'path';

import esbuild from 'esbuild';
import fs from 'fs/promises';

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
        'isomorphic-webcrypto',
        'cross-fetch',
        '@learncard/types',
    ],
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
        outfile: 'dist/core.cjs.development.cjs',
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
        outfile: 'dist/core.cjs.production.min.cjs',
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
        outfile: 'dist/core.esm.js',
        ...buildOptions,
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
