import path from 'path';

import esbuild from 'esbuild';
import rimraf from 'rimraf';

const buildOptions = {
    // target: 'es6',
    target: 'es2020',
    sourcemap: true,
    external: ['isomorphic-fetch', 'isomorphic-webcrypto'],
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
        outfile: 'dist/ler-rs-plugin.cjs.development.js',
        ...buildOptions,
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
        outfile: 'dist/ler-rs-plugin.cjs.production.min.js',
        ...buildOptions,
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        incremental: true,
        tsconfig: 'tsconfig.json',
        plugins: [],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/ler-rs-plugin.esm.js',
        ...buildOptions,
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
