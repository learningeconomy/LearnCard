import path from 'path';
import esbuild from 'esbuild';
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve';

const nodeResolveExternal = (bundleEsmOnly = false) =>
    NodeResolvePlugin({
        extensions: ['.ts', '.js', '.tsx', '.jsx', '.cjs', '.mjs'],
        onResolved: resolved => {
            // These dependencies expose only ESM; CommonJS cannot require them directly.
            const esmOnly = [
                `${path.sep}cborg${path.sep}`,
                `${path.sep}@noble${path.sep}ed25519${path.sep}`,
            ];
            if (bundleEsmOnly && esmOnly.some(segment => resolved.includes(segment)))
                return resolved;
            if (resolved.includes('node_modules')) {
                return { external: true };
            }
            return resolved;
        },
    });

const configurations = [
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal(true)],
        entryPoints: ['src/index.ts'],
        format: 'cjs',
        outfile: 'dist/sss-key-manager.cjs.development.js',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal(true)],
        entryPoints: ['src/index.ts'],
        minify: true,
        format: 'cjs',
        outfile: 'dist/sss-key-manager.cjs.production.min.js',
    },
    {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: 'tsconfig.json',
        plugins: [nodeResolveExternal()],
        entryPoints: ['src/index.ts'],
        format: 'esm',
        outfile: 'dist/sss-key-manager.esm.js',
    },
];

const isWatch = process.argv.includes('--watch');

if (isWatch) {
    const contexts = await Promise.all(configurations.map(config => esbuild.context(config)));
    await Promise.all(contexts.map(ctx => ctx.watch()));
    console.log('👀 Watching for changes...');
} else {
    await Promise.all(configurations.map(config => esbuild.build(config))).catch(err => {
        console.error('❌ Build failed', err);
        process.exit(1);
    });
    console.log('✔ Build successful');
}
