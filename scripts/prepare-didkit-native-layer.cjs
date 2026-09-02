#!/usr/bin/env node
/**
 * Assembles a Lambda Layer directory containing the native DIDKit addon and the
 * runtime package it requires.
 *
 * Why a layer: the native wrapper locates its binary via
 * `require.resolve('@learncard/didkit-plugin-node/package.json')` + readdir, so the
 * package must exist as a real, resolvable package on the module path — it cannot be
 * bundled by esbuild or dropped next to the handler (unlike the WASM). Lambda mounts
 * layers at /opt and puts /opt/nodejs/node_modules on NODE_PATH, which satisfies that.
 *
 * The native wrapper also imports `@learncard/didkit-plugin` at runtime for
 * `getDocumentMap()` when issuing/verifying credentials and presentations, so that
 * package must live beside it in the same layer. A package bundled into /var/task does
 * not satisfy a require() originating from /opt.
 *
 * Run from a service directory before `serverless deploy` (see the service's
 * `serverless-deploy` npm script). Output:
 * <service>/didkit-native-layer/nodejs/node_modules/@learncard/{didkit-plugin-node,didkit-plugin}/
 * — referenced by the `layers:` block in the service's serverless.yml.
 *
 * In CI, the "Build Native DIDKit Plugin" job's artifact (dist/ + index.linux-x64-gnu.node)
 * is downloaded into the native package root before deploy. Locally the .node binary is
 * usually absent — the layer then ships without it and the runtime falls back to WASM,
 * same as before this change.
 */
const fs = require('node:fs');
const path = require('node:path');

const serviceDir = process.cwd();
const layerRoot = path.join(serviceDir, 'didkit-native-layer');
const layerNodeModulesDir = path.join(layerRoot, 'nodejs', 'node_modules');

const resolvePackageRoot = packageName => {
    let dir = path.dirname(require.resolve(packageName, { paths: [serviceDir] }));

    while (dir !== path.dirname(dir)) {
        const packageJsonPath = path.join(dir, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (packageJson.name === packageName) return dir;
        }

        dir = path.dirname(dir);
    }

    throw new Error(`[didkit-layer] Could not locate package root for ${packageName}`);
};

const copyPackageDist = packageName => {
    const packageRoot = resolvePackageRoot(packageName);
    const layerPkgDir = path.join(layerNodeModulesDir, ...packageName.split('/'));

    fs.mkdirSync(layerPkgDir, { recursive: true });
    fs.copyFileSync(path.join(packageRoot, 'package.json'), path.join(layerPkgDir, 'package.json'));

    const distDir = path.join(packageRoot, 'dist');
    if (!fs.existsSync(distDir)) {
        console.error(
            `[didkit-layer] ERROR: ${distDir} does not exist — build ${packageName} first (nx ^build should have done this).`
        );
        process.exit(1);
    }

    fs.cpSync(distDir, path.join(layerPkgDir, 'dist'), { recursive: true });

    return { packageRoot, layerPkgDir };
};

fs.rmSync(layerRoot, { recursive: true, force: true });

const { packageRoot: nativePackageRoot, layerPkgDir: nativeLayerPkgDir } = copyPackageDist(
    '@learncard/didkit-plugin-node'
);
copyPackageDist('@learncard/didkit-plugin');

// napi-rs binaries look like index.linux-x64-gnu.node; the wrapper discovers them by
// readdir of the package root.
const nodeBinaries = fs
    .readdirSync(nativePackageRoot)
    .filter(f => f.startsWith('index.') && f.endsWith('.node'));

for (const binary of nodeBinaries) {
    fs.copyFileSync(path.join(nativePackageRoot, binary), path.join(nativeLayerPkgDir, binary));
}

if (nodeBinaries.length === 0) {
    console.warn(
        '[didkit-layer] WARNING: no index.*.node binary in package root — layer will ship without the native addon and the runtime will fall back to WASM. (Expected locally; in CI the didkit-native-linux-x64 artifact provides it.)'
    );
} else {
    console.log(`[didkit-layer] packaged native binaries: ${nodeBinaries.join(', ')}`);
}

console.log('[didkit-layer] packaged runtime dependency: @learncard/didkit-plugin');
console.log(`[didkit-layer] layer assembled at ${layerRoot}`);
