import { build } from 'esbuild';
import wasmPlugin from './esbuildWasmPlugin.cjs';

const startTime = Date.now();

console.log('🎁 Building main bundle...');

const finalBuildObj = {
    entryPoints: ['src/index.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outdir: 'dist',
    target: 'node18',
    external: ['bson'],
    plugins: wasmPlugin,
    minify: true,
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
    finalBuildObj.minify = false;
}

await build(finalBuildObj).then(() => {
    console.log(`🎁 Done building main bundle! (${Date.now() - startTime}ms)`);
});
