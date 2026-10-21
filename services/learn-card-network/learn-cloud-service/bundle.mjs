import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import plugins from './esbuildPlugins.cjs';

const startTime = Date.now();

console.log('🎁 Building main bundle...');

const finalBuildObj = {
    entryPoints: ['src/index.ts'],
    platform: 'node',
    bundle: true,
    metafile: true,
    format: 'cjs',
    outdir: 'dist',
    target: 'node18',
    external: ['@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'],
    plugins,
    minify: true,
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
    finalBuildObj.minify = false;
}

await build(finalBuildObj).then(result => {
    // Publish preparation verifies private helpers are not external runtime imports.
    writeFileSync(
        join(finalBuildObj.outdir, 'publish-metafile.json'),
        JSON.stringify(result.metafile)
    );
    console.log(`🎁 Done building main bundle! (${Date.now() - startTime}ms)`);
});
