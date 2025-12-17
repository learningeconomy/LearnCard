import { build } from 'esbuild';
import plugins from './esbuildPlugins.cjs';
import { sourceMapsEnabled } from 'process';

const startTime = Date.now();

console.log('🎁 Building main bundle...');

const finalBuildObj = {
    entryPoints: ['src/docker-entry.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outdir: 'build',
    target: 'node20',
    external: ['@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm', 'p-limit'],
    plugins,
    minify: true,
    sourcemap: true,
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
    finalBuildObj.minify = false;
}

build(finalBuildObj).then(() => {
    console.log(`🎁 Done building main bundle! (${Date.now() - startTime}ms)`);
});
