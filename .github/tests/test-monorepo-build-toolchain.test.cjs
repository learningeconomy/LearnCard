const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const dockerfile = readFileSync(path.resolve(__dirname, '../../Dockerfile.monorepo'), 'utf8');

// Dockerfile contract only; the ARM64 EC2 E2E build is the real check.
const installRuns = source =>
    source
        .replace(/\\\r?\n/g, ' ')
        .split('\n')
        .filter(line => /^RUN .*bun install/.test(line));

const checkToolchain = source => {
    const runs = installRuns(source);
    assert.equal(runs.length, 2, 'Expect the dependencies and backend-dependencies installs');
    for (const run of runs) {
        const install = run.indexOf('bun install');
        const setup = run.slice(0, install);
        const packages = setup.match(/apt-get install\s+([^&]+)/)?.[1].trim().split(/\s+/);
        assert.ok(packages, 'Install the native toolchain before bun install');
        for (const name of ['python3', 'make', 'g++']) {
            assert.ok(packages.includes(name), `node-gyp needs ${name}`);
        }
        assert.match(run.slice(install), /apt-get purge -y --auto-remove python3 make g\+\+/);
        assert.match(run.slice(install), /rm -rf \/var\/lib\/apt\/lists\/\*/);
    }
};

test('monorepo installs have the native toolchain and drop it in the same layer', () => {
    checkToolchain(dockerfile);
});

test('rejects a missing native build dependency', () => {
    for (const name of ['python3', 'make', 'g++']) {
        assert.throws(() => checkToolchain(dockerfile.replace(`--no-install-recommends python3 make g++`, `--no-install-recommends ${['python3', 'make', 'g++'].filter(n => n !== name).join(' ')}`)));
    }
});

test('rejects an install without the toolchain', () => {
    assert.throws(() => checkToolchain(dockerfile.replace(/apt-get install[^&]*&& bun install \\\n/, 'bun install \\\n')));
});
