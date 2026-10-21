const path = require('node:path');
const fs = require('node:fs');

// The encryption plugin depends on libsodium-wrappers, whose package `exports`
// map can resolve to an ESM build that esbuild's CJS output can't `require`.
// Force the CJS entry so the bundled Lambda handler loads it correctly.
const forceCjsSodiumWrapperPlugin = {
    name: 'force-cjs-sodium-wrapper',
    setup(build) {
        build.onResolve({ filter: /^libsodium-wrappers$/ }, () => ({
            path: require.resolve('libsodium-wrappers'),
        }));
    },
};

// The DIDKit WASM binary is marked `external`, so esbuild never bundles it.
// Copy it into esbuild's output dir at build time (when `node_modules` still
// resolves) so it ships next to the handler and is loaded relative to
// `__dirname` at runtime (see src/learn-card.ts). This mirrors brain-service:
// under Bun workspaces the package is a hoisted symlink, so serverless
// `package.patterns` globs match nothing and the file would otherwise never
// enter the artifact.
const copyDidkitWasmPlugin = {
    name: 'copy-didkit-wasm',
    setup(build) {
        build.onEnd(() => {
            const { outdir, outfile } = build.initialOptions;
            const outDir = outdir || (outfile && path.dirname(outfile));
            if (!outDir) return;

            const src = require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm');
            fs.mkdirSync(outDir, { recursive: true });
            fs.copyFileSync(src, path.join(outDir, 'didkit_wasm_bg.wasm'));
        });
    },
};

module.exports = [forceCjsSodiumWrapperPlugin, copyDidkitWasmPlugin];
