import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixture = t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-test-cache-runner-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.mkdirSync(path.join(root, 'scripts/e2e-hosted'), { recursive: true });
    fs.mkdirSync(path.join(root, 'bin'));
    for (const file of [
        'scripts/run-nx-tests-with-build-cache.sh',
        'scripts/e2e-hosted/sdk-build-cache.mjs',
    ])
        fs.copyFileSync(path.join(source, file), path.join(root, file));
    fs.writeFileSync(
        path.join(root, 'spec.json'),
        JSON.stringify({
            key: 'test-inputs',
            roots: ['packages/types/dist'],
            projects: ['types'],
            preflights: [],
        })
    );
    fs.writeFileSync(
        path.join(root, 'bin/bunx'),
        `#!/usr/bin/env bash
set -euo pipefail
echo "$*" >> "$TEST_LOG"
if [[ "$*" == *run-many* ]]; then
    [[ "\u0024{FAIL_BUILD:-false}" != true ]] || exit 13
    [[ "\u0024{NO_OUTPUT:-false}" != true ]] || exit 0
    mkdir -p "$TEST_ROOT/packages/types/dist"
    echo compiled > "$TEST_ROOT/packages/types/dist/sdk.js"
elif [[ "$*" == *runtime-did-auth* ]]; then
    [[ "\u0024{FAIL_PREFLIGHT:-false}" != true ]] || exit 23
else
    [[ "\u0024{FAIL_TEST:-false}" != true ]] || exit 17
fi
`,
        { mode: 0o755 }
    );
    const env = {
        ...process.env,
        PATH: `${root}/bin:${process.env.PATH}`,
        TEST_ROOT: root,
        TEST_LOG: path.join(root, 'calls'),
        NX_TEST_BUILD_CACHE: 'true',
        NX_TEST_BUILD_SPEC: path.join(root, 'spec.json'),
        NX_TEST_BUILD_CACHE_DIR: path.join(root, 'cache'),
        NX_TEST_BUILD_CACHE_HIT: 'false',
    };
    const run = overrides => {
        const result = spawnSync(
            'bash',
            [path.join(root, 'scripts/run-nx-tests-with-build-cache.sh')],
            {
                cwd: root,
                env: { ...env, ...overrides },
                encoding: 'utf8',
            }
        );
        return result;
    };
    const calls = () => fs.readFileSync(env.TEST_LOG, 'utf8').trim().split('\n');
    return { root, env, run, calls };
};

test('cold cache snapshots builds before tests; warm hits restore files and still execute tests', t => {
    const { root, run, calls } = fixture(t);
    assert.equal(run().status, 0);
    assert.match(calls()[0], /run-many -t build -p types/);
    assert.match(calls()[1], /affected.*--skip-nx-cache.*--excludeTaskDependencies/);
    const output = path.join(root, 'packages/types/dist');
    fs.writeFileSync(path.join(output, 'sdk.js'), 'stale');
    fs.writeFileSync(path.join(output, 'removed.js'), 'stale');
    assert.equal(run({ NX_TEST_BUILD_CACHE_HIT: 'true' }).status, 0);
    assert.equal(fs.readFileSync(path.join(output, 'sdk.js'), 'utf8'), 'compiled\n');
    assert.equal(fs.existsSync(path.join(output, 'removed.js')), false);
    assert.equal(calls().filter(call => call.includes('run-many')).length, 1);
    assert.equal(calls().filter(call => call.includes('affected')).length, 2);
});

test('retries reuse only build outputs and rerun failed tests', t => {
    const { run, calls } = fixture(t);
    assert.equal(run({ FAIL_TEST: 'true' }).status, 17);
    assert.equal(run().status, 0);
    assert.equal(calls().filter(call => call.includes('run-many')).length, 1);
    assert.equal(calls().filter(call => call.includes('affected')).length, 2);
});

test('corrupt snapshots retain the ordinary dependency graph and cannot be published', t => {
    const { root, run, calls } = fixture(t);
    assert.equal(run().status, 0);
    fs.writeFileSync(path.join(root, 'cache/payload/packages/types/dist/sdk.js'), 'corrupt');
    assert.equal(run({ NX_TEST_BUILD_CACHE_HIT: 'true' }).status, 0);
    assert.doesNotMatch(calls().at(-1), /excludeTaskDependencies/);
    assert.match(calls().at(-1), /--skip-nx-cache/);
    assert.equal(fs.existsSync(path.join(root, 'cache/ready')), false);
});

test('build failures propagate without tests or a publishable snapshot', t => {
    const { root, run, calls } = fixture(t);
    assert.equal(run({ FAIL_BUILD: 'true' }).status, 13);
    assert.equal(calls().length, 1);
    assert.equal(fs.existsSync(path.join(root, 'cache/ready')), false);
});

test('snapshot failures fall back to ordinary tests with dependencies', t => {
    const { root, run, calls } = fixture(t);
    assert.equal(run({ NO_OUTPUT: 'true' }).status, 0);
    assert.doesNotMatch(calls().at(-1), /excludeTaskDependencies/);
    assert.equal(fs.existsSync(path.join(root, 'cache/ready')), false);
});

test('disabled caching executes ordinary affected tests with the quoted comparison base', t => {
    const { run, calls } = fixture(t);
    assert.equal(run({ NX_TEST_BUILD_CACHE: 'false', NX_TEST_BASE: 'origin/main~5' }).status, 0);
    assert.equal(calls().length, 1);
    assert.match(calls()[0], /--base=origin\/main~5/);
    assert.doesNotMatch(calls()[0], /excludeTaskDependencies/);
});

test('the runtime preflight reruns on warm hits and its failure blocks affected tests', t => {
    const { root, run, calls } = fixture(t);
    const specPath = path.join(root, 'spec.json');
    const spec = JSON.parse(fs.readFileSync(specPath));
    spec.preflights = ['ai-agent-service:test:runtime-did-auth'];
    fs.writeFileSync(specPath, JSON.stringify(spec));
    assert.equal(run().status, 0);
    assert.equal(run({ FAIL_PREFLIGHT: 'true' }).status, 23);
    assert.equal(calls().filter(call => call.includes('run-many')).length, 1);
    assert.equal(calls().filter(call => call.includes('runtime-did-auth')).length, 2);
    assert.equal(calls().filter(call => call.includes('affected')).length, 1);
});
