import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import test from 'node:test';

const sha = 'a'.repeat(40);
const base = 'b'.repeat(40);
const observer = resolve('scripts/e2e-hosted/observe-queue-batch.mjs');
const snapshot = {
    data: {
        repository: {
            mergeQueue: {
                entries: {
                    pageInfo: { hasNextPage: false },
                    nodes: [
                        {
                            position: 1,
                            state: 'AWAITING_CHECKS',
                            solo: false,
                            headCommit: { oid: sha },
                            baseCommit: { oid: base },
                            pullRequest: { number: 42 },
                        },
                    ],
                },
            },
        },
    },
};

const run = ({
    response = JSON.stringify(snapshot),
    fail = false,
    eventSha = sha,
    extraEnv = {},
} = {}) => {
    const dir = mkdtempSync(join(tmpdir(), 'lc-queue-observation-'));
    try {
        const eventPath = join(dir, 'event.json');
        const summaryPath = join(dir, 'summary.md');
        const gh = join(dir, 'gh');
        writeFileSync(
            eventPath,
            JSON.stringify({ merge_group: { head_sha: eventSha, base_ref: 'refs/heads/main' } })
        );
        writeFileSync(
            gh,
            fail
                ? '#!/bin/sh\necho sensitive-example >&2\nexit 1\n'
                : `#!/bin/sh\ncase "$*" in *configuration*) echo forbidden >&2; exit 1;; esac\nprintf '%s' '${response}'\n`
        );
        chmodSync(gh, 0o755);
        const result = spawnSync(process.execPath, [observer], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${dir}:${process.env.PATH}`,
                GITHUB_EVENT_NAME: 'merge_group',
                GITHUB_EVENT_PATH: eventPath,
                GITHUB_REPOSITORY: 'learningeconomy/LearnCard',
                GITHUB_SHA: sha,
                GITHUB_STEP_SUMMARY: summaryPath,
                ...extraEnv,
            },
        });
        return { ...result, summary: readFileSync(summaryPath, 'utf8') };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
};

test('reports exact current queue candidate without making a gating decision', () => {
    const result = run();
    assert.equal(result.status, 0);
    assert.match(result.stdout, /"classification":"observed_candidate"/);
    assert.match(result.stdout, /"queuePolicy":"unknown"/);
    assert.match(result.summary, /neither is E2E proof or authorizes skipping tests/);
});

test('fails closed as unknown on API failure without leaking command output', () => {
    const result = run({ fail: true });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /"reason":"observation_failed"/);
    assert.doesNotMatch(result.stdout + result.stderr + result.summary, /sensitive-example/);
});

test('does not query or classify a mismatched event SHA', () => {
    const result = run({ eventSha: 'c'.repeat(40) });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /"reason":"event_sha_mismatch"/);
});

test('treats GraphQL errors as unknown even with partial data', () => {
    const result = run({
        response: JSON.stringify({ ...snapshot, errors: [{ message: 'partial' }] }),
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /"reason":"queue_unavailable"/);
});

test('compares the previous candidate in a real Git checkout without asserting proof', () => {
    const repo = mkdtempSync(join(tmpdir(), 'lc-queue-observer-git-'));
    const git = (...args) =>
        execFileSync('git', args, {
            cwd: repo,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    try {
        git('init', '--quiet', '-b', 'main');
        writeFileSync(join(repo, 'first.txt'), 'first');
        git('add', 'first.txt');
        git(
            '-c',
            'user.name=Test',
            '-c',
            'user.email=test@example.invalid',
            'commit',
            '--quiet',
            '-m',
            'first'
        );
        const previous = git('rev-parse', 'HEAD');
        writeFileSync(join(repo, 'second.txt'), 'second');
        git('add', 'second.txt');
        git(
            '-c',
            'user.name=Test',
            '-c',
            'user.email=test@example.invalid',
            'commit',
            '--quiet',
            '-m',
            'second'
        );
        const head = git('rev-parse', 'HEAD');
        const s = structuredClone(snapshot);
        s.data.repository.mergeQueue.entries.nodes = [
            {
                position: 1,
                state: 'AWAITING_CHECKS',
                solo: false,
                headCommit: { oid: previous },
                baseCommit: { oid: base },
                pullRequest: { number: 41 },
            },
            {
                position: 2,
                state: 'AWAITING_CHECKS',
                solo: false,
                headCommit: { oid: head },
                baseCommit: { oid: previous },
                pullRequest: { number: 42 },
            },
        ];
        const result = run({
            response: JSON.stringify(s),
            eventSha: head,
            extraEnv: { GITHUB_SHA: head, GITHUB_WORKSPACE: repo },
        });
        assert.equal(result.status, 0);
        assert.match(result.stdout, /"classification":"different_source_tree"/);
        assert.match(result.stdout, /"notProof":true/);
        assert.match(result.stdout, /"changedPathCount":1/);
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
});
