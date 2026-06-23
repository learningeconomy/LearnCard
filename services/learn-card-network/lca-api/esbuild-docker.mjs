import { build } from 'esbuild';
import plugins from './esbuildPlugins.cjs';

const startTime = Date.now();

console.log('🎁 Building main bundle...');

const finalBuildObj = {
    entryPoints: ['src/docker-entry.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outdir: 'dist',
    target: 'node18',
    external: [
        'snappy',
        '@learncard/init',
        '@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm',
        '@learncard/didkit-plugin-node',
        '@learncard/didkit-plugin',
        'p-limit',
    ],
    plugins,
    minify: true,
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
    finalBuildObj.minify = false;
}

await build(finalBuildObj).then(() => {
    console.log(`🎁 Done building main bundle! (${Date.now() - startTime}ms)`);
});
