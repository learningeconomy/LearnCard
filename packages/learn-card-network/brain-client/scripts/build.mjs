import path from 'path';

import esbuild from 'esbuild';
import fs from 'fs/promises';

// Bundle helpers and their dependencies in every format. Externalizing node_modules
// leaves the CJS bundle requiring helper dependencies that the client does not declare.
// Default esbuild resolution selects the ESM helpers build and tree-shakes unused code.
// Keep declared tRPC dependencies external in every format, preserving their module identity.
const configurations = [
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        entryPoints: ['src/index.ts'],
        external: ['@trpc/client', '@trpc/server'],
        format: 'cjs',
        outfile: 'dist/brain-client.cjs.development.cjs',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        entryPoints: ['src/index.ts'],
        minify: true,
        external: ['@trpc/client', '@trpc/server'],
        format: 'cjs',
        outfile: 'dist/brain-client.cjs.production.min.cjs',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        entryPoints: ['src/index.ts'],
        format: 'esm',
        external: ['@trpc/client', '@trpc/server'],
        outfile: 'dist/brain-client.esm.js',
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
