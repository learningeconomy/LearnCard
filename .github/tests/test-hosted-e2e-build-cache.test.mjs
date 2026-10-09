import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { inputKey, restore, snapshot } from '../../scripts/e2e-hosted/sdk-build-cache.mjs';

const fixture = t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-output-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const workspace = path.join(root, 'workspace');
    const cache = path.join(root, 'cache');
    const output = 'packages/example/dist';
    fs.mkdirSync(path.join(workspace, output), { recursive: true });
    fs.writeFileSync(path.join(workspace, output, 'sdk.js'), 'compiled');
    fs.chmodSync(path.join(workspace, output, 'sdk.js'), 0o755);
    return { workspace, cache, output, spec: { key: 'exact-input-key', roots: [output] } };
};

test('restores complete output and executable permissions, removing stale files', t => {
    const { workspace, cache, output, spec } = fixture(t);
    snapshot(workspace, cache, spec);
    fs.writeFileSync(path.join(workspace, output, 'sdk.js'), 'stale');
    fs.writeFileSync(path.join(workspace, output, 'removed.js'), 'stale');
    restore(workspace, cache, spec);
    assert.equal(fs.readFileSync(path.join(workspace, output, 'sdk.js'), 'utf8'), 'compiled');
    assert.equal(fs.statSync(path.join(workspace, output, 'sdk.js')).mode & 0o777, 0o755);
    assert.equal(fs.existsSync(path.join(workspace, output, 'removed.js')), false);
});

test('rejects corrupt, missing, extra, linked, and identity-mismatched outputs before replacement', t => {
    const { workspace, cache, output, spec } = fixture(t);
    for (const mutation of ['corrupt', 'missing', 'extra', 'symlink', 'identity']) {
        snapshot(workspace, cache, spec);
        const file = path.join(cache, 'payload', output, 'sdk.js');
        if (mutation === 'corrupt') fs.writeFileSync(file, 'tampered');
        if (mutation === 'missing') fs.rmSync(file);
        if (mutation === 'extra')
            fs.writeFileSync(path.join(cache, 'payload', output, 'extra.js'), 'extra');
        if (mutation === 'symlink') {
            fs.rmSync(file);
            fs.symlinkSync('/etc/hosts', file);
        }
        assert.throws(() =>
            restore(
                workspace,
                cache,
                mutation === 'identity' ? { ...spec, key: 'other-inputs' } : spec
            )
        );
        assert.equal(fs.readFileSync(path.join(workspace, output, 'sdk.js'), 'utf8'), 'compiled');
    }
});

test('keys change for dependency source, compiler config, lockfile, runtime, and build environment', t => {
    const { workspace } = fixture(t);
    const files = ['transitive.ts', 'tsconfig.json', 'bun.lock'];
    for (const file of files) fs.writeFileSync(path.join(workspace, file), 'original');
    const configuration = { bun: '1.4.2', node: '24.12.0', platform: 'linux-x64', NODE_ENV: '' };
    const original = inputKey(workspace, files, configuration);
    for (const file of files) {
        fs.writeFileSync(path.join(workspace, file), 'changed');
        assert.notEqual(inputKey(workspace, files, configuration), original);
        fs.writeFileSync(path.join(workspace, file), 'original');
    }
    for (const name of Object.keys(configuration)) {
        assert.notEqual(
            inputKey(workspace, files, { ...configuration, [name]: 'changed' }),
            original
        );
    }
    assert.equal(inputKey(workspace, [...files].reverse(), configuration), original);
});

test('snapshot refuses symlinks instead of caching data outside the output contract', t => {
    const { workspace, cache, output, spec } = fixture(t);
    fs.symlinkSync('/etc/hosts', path.join(workspace, output, 'outside'));
    assert.throws(() => snapshot(workspace, cache, spec));
});

test('keys include submodule revisions with initialized or absent directories', t => {
    const { workspace } = fixture(t);
    execFileSync('git', ['init', '-q'], { cwd: workspace });
    const setRevision = revision =>
        execFileSync(
            'git',
            ['update-index', '--add', '--cacheinfo', `160000,${revision},lib/didkit`],
            { cwd: workspace }
        );
    setRevision('1'.repeat(40));
    const first = inputKey(workspace, ['lib/didkit'], {});
    fs.mkdirSync(path.join(workspace, 'lib/didkit'), { recursive: true });
    assert.equal(inputKey(workspace, ['lib/didkit'], {}), first);
    setRevision('2'.repeat(40));
    assert.notEqual(inputKey(workspace, ['lib/didkit'], {}), first);
});
