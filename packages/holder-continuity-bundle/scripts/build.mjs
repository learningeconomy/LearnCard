import path from 'path';

import esbuild from 'esbuild';
import fs from 'fs/promises';

const buildOptions = {
    target: 'es2020',
    sourcemap: true,
    external: ['@learncard/init', '@learncard/sss-key-manager', '@learncard/types', 'jszip'],
};

const configurations = [
    {
        keepNames: true,
        bundle: true,
        platform: 'node',
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        format: 'cjs',
        outfile: 'dist/holder-continuity.cjs.development.js',
        ...buildOptions,
    },
    {
        keepNames: true,
        bundle: true,
        platform: 'node',
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        minify: true,
        format: 'cjs',
        outfile: 'dist/holder-continuity.cjs.production.min.js',
        ...buildOptions,
    },
    {
        keepNames: true,
        bundle: true,
        platform: 'node',
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/holder-continuity.esm.js',
        ...buildOptions,
    },
];

const asyncRimraf = dirPath => fs.rm(dirPath, { recursive: true, force: true });

await Promise.all(
    configurations.map(async config => {
        const dir = config.outdir || path.dirname(config.outfile);
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
