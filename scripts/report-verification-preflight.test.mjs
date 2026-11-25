import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import yaml from 'js-yaml';
import { preflightFailureMessage } from './report-verification-preflight.mjs';

test('publishes a fixed prerequisite label without private event fields or raw diagnostics', () => {
    const log = [
        'private path /tmp/private-seed and https://internal.invalid',
        JSON.stringify({
            event: 'preflight-failure',
            check: 'docker-daemon',
            error: 'PRIVATE_TOKEN',
            path: '/tmp/private',
        }),
        'Error: secret',
    ].join('\n');
    const result = preflightFailureMessage(log);
    assert.match(result, /checking Docker daemon availability and proxy configuration/);
    assert.doesNotMatch(result, /PRIVATE|\/tmp|https:|Error:/);
});

test('unknown, missing and malformed events fail closed to a fixed generic message', () => {
    for (const log of [
        '',
        'not JSON',
        '{"event":',
        'null',
        JSON.stringify({ event: 'other', check: 'disk-space' }),
        JSON.stringify({ event: 'preflight-failure', check: '::warning::PRIVATE_TOKEN' }),
        JSON.stringify({ event: 'preflight-failure', check: '__proto__' }),
    ]) {
        const result = preflightFailureMessage(log);
        assert.match(result, /before a prerequisite could be identified/);
        assert.doesNotMatch(result, /PRIVATE|::warning/);
    }
});

test('workflow-style execution prints only the fixed annotation', t => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lc-preflight-report-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'preflight.log');
    writeFileSync(file, 'PRIVATE_PATH\n{"event":"preflight-failure","check":"disk-space"}\nSECRET');
    const child = spawnSync(process.execPath, ['scripts/report-verification-preflight.mjs', file], {
        encoding: 'utf8',
    });
    assert.equal(child.status, 0);
    assert.match(
        child.stdout,
        /^::error title=Verification preflight::Verification preflight failed while checking available disk space and host resources\./
    );
    assert.doesNotMatch(child.stdout + child.stderr, /PRIVATE_PATH|SECRET/);
});

test('actual workflow shell keeps diagnostics private and preserves the failed command status', t => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lc-preflight-shell-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    writeFileSync(
        path.join(dir, 'bun'),
        '#!/bin/sh\nprintf \'%s\\n\' \'{"event":"preflight-failure","check":"docker-trust"}\'\nprintf \'%s\\n\' \'PRIVATE_TOKEN\' >&2\nexit 42\n',
        { mode: 0o700 }
    );
    const workflow = yaml.load(readFileSync('.github/workflows/verification.yml', 'utf8'));
    const step = workflow.jobs.runtime.steps.find(row => row.name === 'Check local prerequisites');
    assert.equal(step['continue-on-error'], undefined);
    assert.match(step.run, /--preflight --json/);
    const child = spawnSync('bash', ['-e', '-c', step.run], {
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, PRIVATE_LOG_DIR: dir },
        encoding: 'utf8',
    });
    assert.equal(child.status, 42);
    assert.match(child.stdout, /checking trusted local Docker socket and configuration/);
    assert.doesNotMatch(child.stdout + child.stderr, /PRIVATE_TOKEN/);
    assert.match(readFileSync(path.join(dir, 'preflight.log'), 'utf8'), /PRIVATE_TOKEN/);
});

test('real CLI emits the fixed failed check before rethrowing a controlled preflight failure', () => {
    // Stop before any Docker or browser probes, on Linux as well as developer hosts.
    const child = spawnSync(
        'bun',
        ['run', '--cwd', 'apps/learn-card-app', 'lc', 'verify', 'doctor', '--preflight', '--json'],
        {
            env: { ...process.env, LC_VERIFY_NODE: '/nonexistent-learncard-preflight-node' },
            encoding: 'utf8',
            timeout: 20_000,
        }
    );
    assert.equal(child.error, undefined);
    assert.notEqual(child.status, 0);
    const events = child.stdout
        .split('\n')
        .flatMap(line => {
            try {
                return [JSON.parse(line)];
            } catch {
                return [];
            }
        })
        .filter(event => event?.event === 'preflight-failure');
    assert.deepEqual(events, [
        {
            event: 'preflight-failure',
            check: process.platform === 'linux' ? 'node-version' : 'platform',
        },
    ]);
});
