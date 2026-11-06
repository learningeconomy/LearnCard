/* global require, module, process, Buffer, console */
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS deployment script. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const verifyLayer = (layerRoot, nodeMajor = Number(process.versions.node.split('.')[0])) => {
    assert.equal(nodeMajor, 24, 'Lambda deployment must run with Node 24');
    assert.equal(process.platform, 'linux', 'Lambda native layer requires Linux');
    assert.equal(process.arch, 'x64', 'Lambda native layer requires x86_64');
    const modules = path.join(layerRoot, 'nodejs/node_modules/@learncard');
    const native = path.join(modules, 'didkit-plugin-node');
    const binary = path.join(native, 'index.linux-x64-gnu.node');
    assert.ok(fs.existsSync(binary), 'Missing Lambda Linux x64 GNU DIDKit addon');
    const binaryNames = fs.readdirSync(native).filter(name => name.endsWith('.node'));
    assert.deepEqual(
        binaryNames,
        ['index.linux-x64-gnu.node'],
        'Layer must contain only the Lambda addon'
    );
    for (const pkg of ['didkit-plugin-node', 'didkit-plugin']) {
        const directory = path.join(modules, pkg);
        const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
        assert.ok(
            fs.existsSync(path.resolve(directory, manifest.main)),
            `Missing ${pkg} runtime entry`
        );
    }
    // Node 24 Lambda uses AL2023/glibc 2.34. Reject Ubuntu-built artifacts
    // requiring newer libc symbols before Serverless can change the stack.
    const versions = execFileSync('readelf', ['--version-info', binary], { encoding: 'utf8' });
    for (const match of versions.matchAll(/GLIBC_(\d+)\.(\d+)/g)) {
        assert.ok(
            Number(match[1]) < 2 || (Number(match[1]) === 2 && Number(match[2]) <= 34),
            `Addon requires ${match[0]}, newer than Lambda AL2023`
        );
    }
    // Exercise stable N-API with a deterministic synthetic key; never log key material.
    const addon = require(binary);
    const key = addon.generateEd25519KeyFromBytes(Buffer.alloc(32, 1));
    assert.match(addon.keyToDid('key', key), /^did:key:/);
};

module.exports = { verifyLayer };
if (require.main === module) {
    verifyLayer(path.resolve('didkit-native-layer'));
    console.log('Node 24 native layer ABI, libc and package checks passed');
}
