#!/usr/bin/env node
/**
 * Assembles a Lambda Layer directory containing the DIDKit packages so the native
 * addon path works in Lambda.
 *
 * Why a layer: the native wrapper locates its binary via
 * `require.resolve('@learncard/didkit-plugin-node/package.json')` + readdir, so the
 * package must exist as a real, resolvable package on the module path — it cannot be
 * bundled by esbuild or dropped next to the handler (unlike the WASM). Lambda mounts
 * layers at /opt and puts /opt/nodejs/node_modules on NODE_PATH, which satisfies that.
 *
 * Why BOTH packages: didkit-plugin-node's dist lazily requires
 * `@learncard/didkit-plugin` at runtime (issuePresentation/verifyPresentation delegate
 * getDocumentMap to it — see dist/plugin.js). With only the native package in the
 * layer, that require fails and every VP-verifying route (auth context creation!)
 * 500s: "Cannot find module '@learncard/didkit-plugin'" (staging incident follow-up,
 * 2026-07-02). Node's parent-dir walk from the layer package reaches
 * /opt/nodejs/node_modules, so a sibling copy resolves it. Both packages' dist
 * bundles are self-contained (relative requires + node builtins only — verified
 * against single- AND double-quoted requires across .js and .cjs).
 *
 * Run from a service directory before `serverless deploy` (see the service's
 * `serverless-deploy` npm script). Output: <service>/didkit-native-layer/nodejs/
 * node_modules/@learncard/… — referenced by the `layers:` block in the service's
 * serverless.yml.
 *
 * In CI, the "Build Native DIDKit Plugin" job's artifact (dist/ +
 * index.linux-x64-gnu.node) is downloaded into the didkit-plugin-node package root
 * before deploy. Locally the .node binary is usually absent — the layer then ships
 * without it and the runtime falls back to WASM, same as before this change.
 */
const fs = require('node:fs');
const path = require('node:path');

const serviceDir = process.cwd();
const layerRoot = path.join(serviceDir, 'didkit-native-layer');
const layerModules = path.join(layerRoot, 'nodejs', 'node_modules');

// Locate a package's on-disk root. `require.resolve('<name>/package.json')` is the
// obvious way, but a package whose `exports` map doesn't expose "./package.json"
// (e.g. @learncard/didkit-plugin) throws ERR_PACKAGE_PATH_NOT_EXPORTED — so fall back
// to resolving the entry point and walking up to the nearest package.json.
const resolvePackageRoot = name => {
    try {
        return path.dirname(require.resolve(`${name}/package.json`, { paths: [serviceDir] }));
    } catch {
        let dir = path.dirname(require.resolve(name, { paths: [serviceDir] }));
        while (!fs.existsSync(path.join(dir, 'package.json'))) {
            const parent = path.dirname(dir);
            if (parent === dir) throw new Error(`Cannot locate package root for ${name}`);
            dir = parent;
        }
        return dir;
    }
};

// name → whether to also copy napi binaries (index.*.node) from the package root
const LAYER_PACKAGES = [
    { name: '@learncard/didkit-plugin-node', nodeBinaries: true },
    { name: '@learncard/didkit-plugin', nodeBinaries: false },
];

fs.rmSync(layerRoot, { recursive: true, force: true });

for (const { name, nodeBinaries } of LAYER_PACKAGES) {
    const packageRoot = resolvePackageRoot(name);
    const dest = path.join(layerModules, ...name.split('/'));
    fs.mkdirSync(dest, { recursive: true });

    fs.copyFileSync(path.join(packageRoot, 'package.json'), path.join(dest, 'package.json'));

    const distDir = path.join(packageRoot, 'dist');
    if (!fs.existsSync(distDir)) {
        console.error(
            `[didkit-layer] ERROR: ${distDir} does not exist — build ${name} first (nx ^build should have done this).`
        );
        process.exit(1);
    }
    fs.cpSync(distDir, path.join(dest, 'dist'), { recursive: true });

    if (nodeBinaries) {
        // napi-rs binaries look like index.linux-x64-gnu.node; the wrapper discovers
        // them by readdir of the package root.
        const binaries = fs
            .readdirSync(packageRoot)
            .filter(f => f.startsWith('index.') && f.endsWith('.node'));

        for (const binary of binaries) {
            fs.copyFileSync(path.join(packageRoot, binary), path.join(dest, binary));
        }

        if (binaries.length === 0) {
            console.warn(
                `[didkit-layer] WARNING: no index.*.node binary in ${name} — layer will ship without the native addon and the runtime will fall back to WASM. (Expected locally; in CI the didkit-native-linux-x64 artifact provides it.)`
            );
        } else {
            console.log(`[didkit-layer] ${name}: packaged native binaries: ${binaries.join(', ')}`);
        }
    }
    console.log(`[didkit-layer] ${name}: packaged (dist + package.json)`);
}

console.log(`[didkit-layer] layer assembled at ${layerRoot}`);
