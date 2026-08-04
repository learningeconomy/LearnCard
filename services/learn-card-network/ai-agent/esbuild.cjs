const esbuild = require('esbuild');

const startTime = Date.now();

console.log('Building AI agent service...');

const finalBuildObj = {
    entryPoints: ['src/index.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outfile: 'dist/index.js',
    target: 'node20',
    external: ['@learncard/*', '@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'],
    minify: process.env.NODE_ENV === 'production',
};

if (process.env.NODE_ENV !== 'production') {
    finalBuildObj.sourcemap = 'inline';
}

esbuild.build(finalBuildObj)
    .then(() => {
        console.log(`Done building AI agent service. (${Date.now() - startTime}ms)`);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
