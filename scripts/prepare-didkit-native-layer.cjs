#!/usr/bin/env node
/**
 * Assembles a Lambda Layer directory containing @learncard/didkit-plugin-node so the
 * native DIDKit addon is resolvable in Lambda.
 *
 * Why a layer: the native wrapper locates its binary via
 * `require.resolve('@learncard/didkit-plugin-node/package.json')` + readdir, so the
 * package must exist as a real, resolvable package on the module path — it cannot be
 * bundled by esbuild or dropped next to the handler (unlike the WASM). Lambda mounts
 * layers at /opt and puts /opt/nodejs/node_modules on NODE_PATH, which satisfies that.
 *
 * Run from a service directory before `serverless deploy` (see the service's
 * `serverless-deploy` npm script). Output: <service>/didkit-native-layer/nodejs/
 * node_modules/@learncard/didkit-plugin-node/ — referenced by the `layers:` block in
 * the service's serverless.yml.
 *
 * The compiled dist/ only requires its own relative files + node builtins (the
 * @learncard/* imports are type-only), so the layer needs just this one package.
 * In CI, the "Build Native DIDKit Plugin" job's artifact (dist/ + index.linux-x64-gnu.node)
 * is downloaded into the package root before deploy. Locally the .node binary is
 * usually absent — the layer then ships without it and the runtime falls back to WASM,
 * same as before this change.
 */
const fs = require('node:fs');
const path = require('node:path');

const serviceDir = process.cwd();
const layerRoot = path.join(serviceDir, 'didkit-native-layer');
const layerPkgDir = path.join(layerRoot, 'nodejs', 'node_modules', '@learncard', 'didkit-plugin-node');

const packageRoot = path.dirname(
    require.resolve('@learncard/didkit-plugin-node/package.json', { paths: [serviceDir] })
);

fs.rmSync(layerRoot, { recursive: true, force: true });
fs.mkdirSync(layerPkgDir, { recursive: true });

fs.copyFileSync(path.join(packageRoot, 'package.json'), path.join(layerPkgDir, 'package.json'));

const distDir = path.join(packageRoot, 'dist');
if (!fs.existsSync(distDir)) {
    console.error(
        `[didkit-layer] ERROR: ${distDir} does not exist — build @learncard/didkit-plugin-node first (nx ^build should have done this).`
    );
    process.exit(1);
}
fs.cpSync(distDir, path.join(layerPkgDir, 'dist'), { recursive: true });

// napi-rs binaries look like index.linux-x64-gnu.node; the wrapper discovers them by
// readdir of the package root.
const nodeBinaries = fs
    .readdirSync(packageRoot)
    .filter(f => f.startsWith('index.') && f.endsWith('.node'));

for (const binary of nodeBinaries) {
    fs.copyFileSync(path.join(packageRoot, binary), path.join(layerPkgDir, binary));
}

if (nodeBinaries.length === 0) {
    console.warn(
        '[didkit-layer] WARNING: no index.*.node binary in package root — layer will ship without the native addon and the runtime will fall back to WASM. (Expected locally; in CI the didkit-native-linux-x64 artifact provides it.)'
    );
} else {
    console.log(`[didkit-layer] packaged native binaries: ${nodeBinaries.join(', ')}`);
}
console.log(`[didkit-layer] layer assembled at ${layerRoot}`);
