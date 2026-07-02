const path = require('node:path');
const fs = require('node:fs');

const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');

const forceCjsSodiumWrapperPlugin = {
    name: 'force-cjs-sodium-wrapper',
    setup(build) {
        build.onResolve({ filter: /^libsodium-wrappers$/ }, () => ({
            path: require.resolve('libsodium-wrappers'),
        }));
    },
};

// The DIDKit WASM binary is marked `external`, so esbuild never bundles it. It used
// to reach the Lambda via serverless `package.patterns` copying it out of
// `node_modules`, but those globs are service-relative and match nothing under Bun
// workspaces (the package is a hoisted symlink at the repo root), so the file never
// entered the artifact and every DIDKit path 500'd with MODULE_NOT_FOUND.
//
// Copy the WASM into esbuild's output dir at build time (when `node_modules` still
// resolves). serverless-esbuild packages every non-`node_modules` file from the build
// dir into each function zip, so it ships next to the handler and is loaded relative
// to `__dirname` at runtime (see src/helpers/learnCard.helpers.ts).
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

module.exports = [
    forceCjsSodiumWrapperPlugin,
    copyDidkitWasmPlugin,
    sentryEsbuildPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
    }),
];
