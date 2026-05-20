import { build } from 'esbuild';

const startTime = Date.now();

console.log('Building AI agent service...');

const finalBuildObj = {
    entryPoints: ['src/index.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outfile: 'dist/index.js',
    target: 'node20',
    external: ['@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'],
    minify: process.env.NODE_ENV === 'production',
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
}

build(finalBuildObj).then(() => {
    console.log(`Done building AI agent service. (${Date.now() - startTime}ms)`);
});
