import path from 'path';

import esbuild from 'esbuild';
import fs from 'fs/promises';

/**
 * Build configuration mirrors `packages/plugins/render-method/scripts/build.mjs` and
 * `packages/credential-library/scripts/build.mjs` — CJS dev, CJS prod-min, ESM. Declarations
 * are emitted separately by `tsc --p tsconfig.json` (see package.json `build` script).
 *
 * React, react-dom, and consumer-supplied types are externalized so the consumer's bundler
 * de-dupes them. CodeMirror, Mustache, and DOMPurify are bundled because they ARE the
 * value of this package and consumers should not have to install them transitively.
 */
const buildOptions = {
    target: 'es2020',
    sourcemap: true,
    external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@learncard/types',
    ],
    jsx: 'automatic',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
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
        outfile: 'dist/render-method-designer.cjs.development.js',
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
        outfile: 'dist/render-method-designer.cjs.production.min.js',
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
        outfile: 'dist/render-method-designer.esm.js',
        ...buildOptions,
    },
];

function asyncRimraf(dirPath) {
    return fs.rm(dirPath, { recursive: true, force: true });
}

await Promise.all(
    configurations.map(async config => {
        const dir = config.outdir || path.dirname(config.outfile);
        await asyncRimraf(dir).catch(() => {
            console.log('Unable to delete directory', dir);
        });
    })
);

await Promise.all(configurations.map(config => esbuild.build(config))).catch(() => {
    console.error('❌ Build failed');
    process.exit(1);
});

console.log('✔ Build successful');
process.exit(0);
