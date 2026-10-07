import { build } from 'esbuild';
import plugins from './esbuildPlugins.cjs';

const startTime = Date.now();

console.log('🎁 Building vc-api-service bundle...');

const finalBuildObj = {
    entryPoints: ['src/index.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outdir: 'dist',
    target: 'node20',
    external: ['@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm', 'p-limit'],
    plugins,
    minify: true,
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
    finalBuildObj.minify = false;
}

build(finalBuildObj).then(() => {
    console.log(`🎁 Done building vc-api-service bundle! (${Date.now() - startTime}ms)`);
});
