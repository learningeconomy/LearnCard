const assert = require('node:assert/strict');
const { test } = require('node:test');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const {
    selection,
    createProof,
    resolveReuse,
    readArchive,
    artifactName,
} = require('../../scripts/deploy-test-proof.cjs');

const base = 'a'.repeat(40);
const head = 'b'.repeat(40);
const runtime = { os: 'linux', arch: 'x64', node: 'v24.12.0', bun: '1.4.4' };
const roots = {
    'escrow-enclave-app': 'services/escrow-enclave-app',
    types: 'packages/learn-card-types',
    helpers: 'packages/learn-card-helpers',
    core: 'packages/learn-card-core',
    'nx-run-command': 'tools/executors/workspace/run-command',
};
const graph = () => ({
    graph: {
        nodes: Object.fromEntries(
            Object.entries(roots).map(([name, root]) => [name, { data: { root } }])
        ),
        dependencies: Object.fromEntries(Object.keys(roots).map(name => [name, []])),
    },
    tasks: {
        dependencies: { 'escrow-enclave-app:test': [] },
        tasks: {
            'escrow-enclave-app:test': {
                id: 'escrow-enclave-app:test',
                target: { project: 'escrow-enclave-app', target: 'test' },
                cache: false,
            },
        },
    },
});

const fixture = t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'deploy-proof-test-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    writeFileSync(path.join(cwd, '.nvmrc'), runtime.node);
    writeFileSync(
        path.join(cwd, 'package.json'),
        JSON.stringify({ packageManager: `bun@${runtime.bun}` })
    );
    const f = {
        cwd,
        graph: graph(),
        calls: [],
        run: {
            id: 100,
            workflow_id: 9,
            head_sha: head,
            event: 'merge_group',
            head_branch: `gh-readonly-queue/main/pr-1-${base}`,
            repository: { id: 1 },
            head_repository: { id: 1 },
            status: 'completed',
            conclusion: 'success',
            run_attempt: 2,
        },
        job: {
            name: 'Test',
            status: 'completed',
            conclusion: 'success',
            steps: [
                'Test retry reporting contract',
                'Run tests',
                'Summarize test retries',
                'Record queue test proof',
                'Publish queue test proof',
            ].map(name => ({ name, conclusion: 'success' })),
        },
    };
    f.proof = createProof({
        graph: f.graph,
        base,
        head,
        repository: 'learningeconomy/LearnCard',
        repositoryId: 1,
        runId: 100,
        attempt: 2,
        actualRuntime: { ...runtime },
    });
    f.artifact = {
        id: 88,
        name: artifactName(100, 2),
        expired: false,
        size_in_bytes: 500,
        workflow_run: { id: 100, head_sha: head, repository_id: 1 },
    };
    f.zip = text => {
        const file = path.join(cwd, 'fixture.zip');
        execFileSync(
            'python3',
            [
                '-c',
                'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],"w",zipfile.ZIP_DEFLATED); z.writestr("queue-test-proof.json",sys.stdin.buffer.read()); z.close()',
                file,
            ],
            { input: text ?? JSON.stringify(f.proof), stdio: ['pipe', 'pipe', 'pipe'] }
        );
        return readFileSync(file);
    };
    const responses = {
        getWorkflow: () => ({ id: 9, path: '.github/workflows/test.yml' }),
        listWorkflowRuns: () => ({
            total_count: f.runs?.length ?? 1,
            workflow_runs: f.runs ?? [f.run],
        }),
        listJobsForWorkflowRunAttempt: () => ({ total_count: 1, jobs: [f.job] }),
        listWorkflowRunArtifacts: () => ({
            total_count: f.artifacts?.length ?? 1,
            artifacts: f.artifacts ?? [f.artifact],
        }),
        downloadArtifact: () => f.bytes ?? f.zip(),
        getWorkflowRun: () => f.latest ?? f.run,
    };
    const actions = Object.fromEntries(
        Object.entries(responses).map(([name, response]) => [
            name,
            async args => {
                f.calls.push({ name, args });
                if (f.errorAt === name)
                    throw new Error('private API error that must not be printed');
                return { data: response() };
            },
        ])
    );
    f.resolve = overrides =>
        resolveReuse({
            github: { rest: { actions } },
            repo: { owner: 'learningeconomy', repo: 'LearnCard' },
            repositoryId: 1,
            base,
            head,
            graph: f.graph,
            cwd,
            ...overrides,
        });
    return f;
};

test('trusted exact-range proof restores only a successful latest queue Test verdict', async t => {
    const f = fixture(t);
    assert.deepEqual(await f.resolve(), {
        reused: true,
        reason: 'matching-queue-proof',
        runId: 100,
        attempt: 2,
        projects: ['escrow-enclave-app'],
    });
    assert.ok(f.calls.every(call => call.args.request.timeout === 4000));
    assert.equal(
        f.calls.find(c => c.name === 'listJobsForWorkflowRunAttempt').args.attempt_number,
        2
    );
    assert.deepEqual(readArchive(f.zip()), f.proof);
});

test('different deployment range, target selection, runtime and protocol retain full tests', async t => {
    for (const mutate of [
        f => {
            f.proof.base = 'c'.repeat(40);
        },
        f => {
            f.proof.head = 'c'.repeat(40);
        },
        f => {
            f.proof.projects = [];
        },
        f => {
            f.proof.projects.push('escrow-enclave-app');
        },
        f => {
            f.proof.tasks = [];
        },
        f => {
            f.proof.runtime.node = 'v22.1.0';
        },
        f => {
            f.proof.runtime.bun = '1.0.0';
        },
        f => {
            f.proof.runtime.os = 'darwin';
        },
        f => {
            f.proof.version = 2;
        },
        f => {
            f.proof.extra = 'unexpected';
        },
        f => {
            f.proof.repositoryId = 2;
        },
        f => {
            f.proof.event = 'pull_request';
        },
        f => {
            f.proof.attempt = 1;
        },
    ]) {
        const f = fixture(t);
        mutate(f);
        assert.deepEqual(await f.resolve(), { reused: false, reason: 'proof-mismatch' });
    }
});

test('PR, fork, other-branch, incomplete, failed and older-green runs cannot authorize reuse', async t => {
    for (const patch of [
        { event: 'pull_request' },
        { head_repository: { id: 2 } },
        { repository: { id: 2 } },
        { head_branch: 'gh-readonly-queue/other/pr-1' },
        { workflow_id: 8 },
        { status: 'in_progress', conclusion: null },
        { conclusion: 'failure' },
        { conclusion: 'cancelled' },
    ]) {
        const f = fixture(t);
        Object.assign(f.run, patch);
        assert.equal((await f.resolve()).reused, false);
    }
    const f = fixture(t);
    f.runs = [
        { ...f.run, id: 99 },
        { ...f.run, conclusion: 'failure' },
    ];
    assert.equal((await f.resolve()).reason, 'queue-run-not-successful');
    assert.ok(!f.calls.some(c => c.name === 'downloadArtifact'));
    f.runs = [];
    assert.equal((await f.resolve()).reason, 'no-queue-run');
});

test('a failed test, retry summary or optional proof publication cannot be reused', async t => {
    for (const conclusion of ['failure', 'cancelled', 'skipped', null]) {
        const f = fixture(t);
        f.job.conclusion = conclusion;
        assert.equal((await f.resolve()).reason, 'test-job-not-successful');
    }
    for (let i = 0; i < 5; i++) {
        const f = fixture(t);
        f.job.steps[i].conclusion = 'failure';
        assert.equal((await f.resolve()).reason, 'incomplete-test-proof');
    }
    const f = fixture(t);
    f.job.steps = [];
    assert.equal((await f.resolve()).reused, false);
});

test('a full-tree fallback or identical base/head cannot authorize reuse', async t => {
    const f = fixture(t);
    for (const unsupportedBase of [
        '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
        head,
        'origin/main',
    ]) {
        assert.equal((await f.resolve({ base: unsupportedBase })).reason, 'invalid-range');
    }
    assert.equal(f.calls.length, 0);
});

test('expired, ambiguous, missing, oversized, corrupt or wrongly bound artifacts fall back', async t => {
    for (const patch of [
        { expired: true },
        { size_in_bytes: 1024 * 1024 + 1 },
        { workflow_run: { id: 101, head_sha: head, repository_id: 1 } },
    ]) {
        const f = fixture(t);
        Object.assign(f.artifact, patch);
        assert.equal((await f.resolve()).reused, false);
    }
    for (const mode of [
        'missing',
        'duplicate',
        'corrupt',
        'oversized',
        'invalid-json',
        'inflated',
    ]) {
        const f = fixture(t);
        if (mode === 'missing') f.artifacts = [];
        if (mode === 'duplicate') f.artifacts = [f.artifact, f.artifact];
        if (mode === 'corrupt') f.bytes = Buffer.from('untrusted content, never executable');
        if (mode === 'oversized') f.bytes = Buffer.alloc(1024 * 1024 + 1);
        if (mode === 'invalid-json') f.bytes = f.zip('{');
        if (mode === 'inflated') f.bytes = f.zip(' '.repeat(256 * 1024));
        assert.equal((await f.resolve()).reused, false, mode);
    }
});

test('API failures and an attempt changing during download retain tests without raw errors', async t => {
    for (const name of [
        'getWorkflow',
        'listWorkflowRuns',
        'listJobsForWorkflowRunAttempt',
        'listWorkflowRunArtifacts',
        'downloadArtifact',
        'getWorkflowRun',
    ]) {
        const f = fixture(t);
        f.errorAt = name;
        assert.deepEqual(await f.resolve(), { reused: false, reason: 'proof-unavailable' });
    }
    const f = fixture(t);
    f.latest = { ...f.run, run_attempt: 3 };
    assert.equal((await f.resolve()).reason, 'queue-run-changed');
});

test('native-capable dependencies, unknown prerequisites and cached tests are outside the audited boundary', () => {
    for (const mutate of [
        g => {
            g.graph.dependencies['escrow-enclave-app'].push({ target: 'dynamic-loader-plugin' });
        },
        g => {
            g.graph.dependencies['escrow-enclave-app'].push({
                target: 'npm:@learncard/didkit-plugin-node',
            });
        },
        g => {
            g.tasks.tasks['native:build'] = {
                id: 'native:build',
                target: { project: 'didkit-plugin-node', target: 'build' },
            };
        },
        g => {
            g.tasks.tasks['escrow-enclave-app:test'].cache = true;
        },
        g => {
            g.tasks.tasks['escrow-enclave-app:test'].target.target = 'deploy';
        },
        g => {
            g.graph.nodes['escrow-enclave-app'].data.root = 'services/other';
        },
        g => {
            delete g.graph.dependencies['escrow-enclave-app'];
        },
        g => {
            g.tasks.dependencies['escrow-enclave-app:test'] = ['native:build'];
        },
        g => {
            delete g.tasks.dependencies;
        },
    ]) {
        const g = graph();
        mutate(g);
        assert.throws(() => selection(g), /unsupported-test-scope/);
    }
    assert.throws(() => selection({}), /unsupported-test-scope/);
    assert.throws(() => selection({ ...graph(), tasks: { tasks: {} } }), /unsupported-test-scope/);
});
