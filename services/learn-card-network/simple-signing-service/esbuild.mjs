import { build } from 'esbuild';
import plugins from './esbuildPlugins.cjs';

const startTime = Date.now();

console.log('🎁 Building main bundle...');

const finalBuildObj = {
    entryPoints: ['src/index.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outdir: 'dist',
    target: 'node18',
    external: ['snappy', '@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'],
    plugins,
    minify: true,
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
    finalBuildObj.minify = false;
}

build(finalBuildObj).then(() => {
    console.log(`🎁 Done building main bundle! (${Date.now() - startTime}ms)`);
});
