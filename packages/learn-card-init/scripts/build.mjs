import path from 'path';


import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve';
import fs from 'fs/promises';

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
        'cipher-base',
        // Workspace packages — externalized for deduplication
        '@learncard/chapi-plugin',
        '@learncard/core',
        '@learncard/crypto-plugin',
        '@learncard/didkey-plugin',
        '@learncard/didkit-plugin',
        '@learncard/didkit-plugin-node',
        '@learncard/did-web-plugin',
        '@learncard/dynamic-loader-plugin',
        '@learncard/encryption-plugin',
        '@learncard/ethereum-plugin',
        '@learncard/expiration-plugin',
        '@learncard/helpers',
        '@learncard/learn-card-plugin',
        '@learncard/learn-cloud-plugin',
        '@learncard/network-plugin',
        '@learncard/types',
        '@learncard/vc-api-plugin',
        '@learncard/vc-plugin',
        '@learncard/vc-templates-plugin',
        '@learncard/vpqr-plugin',
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
        outfile: 'dist/init.cjs.development.cjs',
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
        outfile: 'dist/init.cjs.production.min.cjs',
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
        outfile: 'dist/init.esm.js',
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

console.log('✔ Build successful');
process.exit(0);
