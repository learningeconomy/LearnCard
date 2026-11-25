const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const dockerfile = readFileSync(
    path.resolve(__dirname, '../../services/learn-card-network/ai-agent/Dockerfile'),
    'utf8'
);

// This is a Dockerfile contract, not a substitute for the real ARM64 image build.
const checkToolchain = source => {
    const stages = source.replace(/\\\r?\n/g, ' ').split(/^FROM /m).slice(1);
    assert.equal(stages.length, 2, 'Keep separate build and runtime stages');
    const [build, runtime] = stages;
    assert.match(
        build,
        /^--platform=\$BUILDPLATFORM \S+ AS build\s/i,
        'Build the arch-independent bundle natively, not under QEMU'
    );
    const install = build.indexOf('bun install --frozen-lockfile');
    assert.ok(install >= 0, 'Keep the frozen dependency install');
    const setup = build.slice(0, install);
    const packages = setup.match(/apt-get install\s+([^&\n]+)/)?.[1].trim().split(/\s+/);
    assert.ok(packages, 'Install the native toolchain before Bun dependencies');
    for (const name of ['python3', 'make', 'g++']) {
        assert.ok(packages.includes(name), `Build stage needs ${name} for node-gyp`);
    }
    assert.match(setup, /rm -rf \/var\/lib\/apt\/lists\/\*/);
    assert.match(runtime, /^oven\/bun:\S+-alpine\s/);
    assert.doesNotMatch(runtime, /apt-get|apk add[^\n]*(?:python3|make|g\+\+)/);
    assert.match(runtime, /^USER bun$/m, 'Keep the runtime unprivileged');
};

test('AI image installs native build tools before dependencies, outside the runtime', () => {
    checkToolchain(dockerfile);
});

test('rejects each missing native build dependency', () => {
    for (const name of ['python3', 'make', 'g++']) {
        assert.throws(() => checkToolchain(dockerfile.replace(` ${name}`, '')));
    }
});

test('rejects toolchain installation after the frozen install', () => {
    const toolchain = dockerfile.match(/^RUN apt-get update[\s\S]*?\n\n/m)[0];
    const misplaced = dockerfile
        .replace(toolchain, '')
        .replace('RUN bun run --cwd', `${toolchain}RUN bun run --cwd`);
    assert.throws(() => checkToolchain(misplaced));
});

test('rejects installing the build toolchain in the runtime image', () => {
    assert.throws(() => checkToolchain(`${dockerfile}\nRUN apk add python3 make g++\n`));
});
