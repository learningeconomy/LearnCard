import esbuild from 'esbuild';

await esbuild.build({
    target: 'es2020',
    bundle: true,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/impl.js',
    platform: 'node',
});
