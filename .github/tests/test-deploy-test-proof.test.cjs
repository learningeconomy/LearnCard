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
            f.proof.version = 3;
        },
        f => {
            f.proof.version = 1;
        },
        f => {
            f.proof.allProjects = [];
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

test('queue and Deploy base mismatches stay rejected and are visible separately', async t => {
    const f = fixture(t);
    // B tested M -> A+B while Deploy has advanced to A -> A+B, or the
    // inverse timing: queue tests use A while Deploy still starts from M.
    for (const [queueBase, deployBase] of [
        [base, 'c'.repeat(40)],
        ['c'.repeat(40), base],
    ]) {
        f.proof.base = queueBase;
        assert.deepEqual(await f.resolve({ base: deployBase }), {
            reused: false,
            reason: 'comparison-base-mismatch',
        });
    }
    // A base difference must not hide a second contract mismatch in the tally.
    f.proof.runtime.node = 'v22.1.0';
    assert.deepEqual(await f.resolve(), { reused: false, reason: 'proof-mismatch' });
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

const addTestProject = (g, project, root = `packages/${project}`) => {
    g.graph.nodes[project] = { data: { root } };
    g.graph.dependencies[project] = [];
    const id = `${project}:test`;
    g.tasks.tasks[id] = { id, target: { project, target: 'test' }, cache: false };
    g.tasks.dependencies[id] = [];
};
const record = f => {
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
};

test('mixed deployment reuses only audited tests and keeps native-capable tests fresh', async t => {
    const f = fixture(t);
    addTestProject(f.graph, 'network-brain-service', 'services/learn-card-network/brain-service');
    f.graph.graph.dependencies['network-brain-service'] = [
        { target: 'npm:@learncard/didkit-plugin-node' },
    ];
    record(f);
    assert.equal(f.proof.version, 2);
    assert.deepEqual(f.proof.projects, ['escrow-enclave-app']);
    assert.deepEqual(f.proof.tasks, ['escrow-enclave-app:test']);
    assert.deepEqual(await f.resolve(), {
        reused: false,
        reason: 'partial-matching-queue-proof',
        runId: 100,
        attempt: 2,
        projects: ['escrow-enclave-app'],
        remainingProjects: ['network-brain-service'],
    });
});

test('each audited project must independently pass dependency and task prerequisite checks', async t => {
    for (const mutate of [
        g => g.graph.dependencies.core.push({ target: 'npm:@learncard/didkit-plugin-node' }),
        g => g.tasks.dependencies['core:test'].push('missing:build'),
        g => {
            g.tasks.tasks['core:test'].cache = true;
        },
        g => {
            g.tasks.tasks['core:test'].target.configuration = 'other';
        },
        g => {
            g.tasks.tasks['core:test'].continuous = true;
        },
        g => {
            g.graph.nodes.core.data.root = 'packages/other';
        },
        g => g.tasks.dependencies['core:test'].push('escrow-enclave-app:test'),
    ]) {
        const f = fixture(t);
        addTestProject(f.graph, 'core', roots.core);
        mutate(f.graph);
        record(f);
        assert.deepEqual(f.proof.projects, ['escrow-enclave-app']);
        assert.deepEqual((await f.resolve()).remainingProjects, ['core']);
    }
});

test('mixed proof includes audited build prerequisites and binds the whole test selection', async t => {
    const f = fixture(t);
    addTestProject(f.graph, 'core', roots.core);
    addTestProject(f.graph, 'outside');
    f.graph.graph.dependencies.core = [{ target: 'types' }];
    f.graph.tasks.tasks['types:build'] = {
        id: 'types:build',
        target: { project: 'types', target: 'build' },
    };
    f.graph.tasks.dependencies['types:build'] = [];
    f.graph.tasks.dependencies['core:test'] = ['types:build'];
    record(f);
    assert.deepEqual(f.proof.tasks, ['core:test', 'escrow-enclave-app:test', 'types:build']);
    assert.deepEqual((await f.resolve()).projects, ['core', 'escrow-enclave-app']);
    addTestProject(f.graph, 'another-outside');
    assert.deepEqual(await f.resolve(), { reused: false, reason: 'proof-mismatch' });
});

test('large mixed graphs can prove a small audited closure without auditing unrelated tests', async t => {
    const f = fixture(t);
    for (let i = 0; i < 110; i++) addTestProject(f.graph, `outside-${i}`);
    record(f);
    assert.deepEqual(f.proof.tasks, ['escrow-enclave-app:test']);
    assert.equal((await f.resolve()).remainingProjects.length, 110);
});

test('ambiguous duplicate test configurations and entirely unaudited graphs cannot skip tests', async t => {
    const f = fixture(t);
    f.graph.tasks.tasks['escrow-enclave-app:test:other'] = {
        id: 'escrow-enclave-app:test:other',
        target: { project: 'escrow-enclave-app', target: 'test', configuration: 'other' },
        cache: false,
    };
    f.graph.tasks.dependencies['escrow-enclave-app:test:other'] = [];
    assert.throws(() => record(f), /unsupported-test-scope/);
    assert.deepEqual(await f.resolve(), { reused: false, reason: 'unsupported-test-scope' });
    f.graph = graph();
    f.graph.tasks.tasks = {};
    f.graph.tasks.dependencies = {};
    addTestProject(f.graph, 'outside');
    assert.throws(() => record(f), /unsupported-test-scope/);
    assert.deepEqual(await f.resolve(), { reused: false, reason: 'unsupported-test-scope' });
});

test('failed or mismatched mixed proofs never expose projects for exclusion', async t => {
    for (const mutate of [
        f => {
            f.proof.base = 'c'.repeat(40);
        },
        f => {
            f.proof.runtime.node = 'v22.1.0';
        },
        f => {
            f.proof.allProjects = ['escrow-enclave-app'];
        },
        f => {
            f.job.conclusion = 'failure';
        },
        f => {
            f.proof.projects.push('outside');
        },
    ]) {
        const f = fixture(t);
        addTestProject(f.graph, 'outside');
        record(f);
        mutate(f);
        const result = await f.resolve();
        assert.equal(result.reused, false);
        assert.equal(result.projects, undefined);
        assert.notEqual(result.reason, 'partial-matching-queue-proof');
    }
});

test('downloaded allProjects must exactly match the current selection before any exclusion', async t => {
    for (const mutate of [
        proof => {
            delete proof.allProjects;
        },
        proof => {
            proof.allProjects = [];
        },
        proof => {
            proof.allProjects = ['escrow-enclave-app'];
        },
        proof => {
            proof.allProjects.push('injected');
        },
        proof => {
            proof.allProjects = 'escrow-enclave-app,outside';
        },
    ]) {
        const f = fixture(t);
        addTestProject(f.graph, 'outside');
        record(f);
        mutate(f.proof);
        assert.deepEqual(await f.resolve(), { reused: false, reason: 'proof-mismatch' });
    }
});

test('shared prerequisites and cycles terminate without dropping the audited closure', async t => {
    const f = fixture(t);
    addTestProject(f.graph, 'core', roots.core);
    for (const project of ['types', 'helpers']) {
        const id = `${project}:build`;
        f.graph.tasks.tasks[id] = { id, target: { project, target: 'build' } };
        f.graph.tasks.dependencies[id] = [];
    }
    f.graph.tasks.dependencies['core:test'] = ['helpers:build', 'types:build'];
    f.graph.tasks.dependencies['helpers:build'] = ['types:build'];
    record(f);
    assert.deepEqual(f.proof.tasks, [
        'core:test',
        'escrow-enclave-app:test',
        'helpers:build',
        'types:build',
    ]);
    assert.equal((await f.resolve()).reused, true);
    // The visitor terminates even on a cycle; only a successful real queue run
    // can supply reusable evidence, so this graph fixture alone never grants it.
    f.graph.tasks.dependencies['types:build'] = ['helpers:build'];
    record(f);
    assert.deepEqual(f.proof.tasks, [
        'core:test',
        'escrow-enclave-app:test',
        'helpers:build',
        'types:build',
    ]);
    f.graph.tasks.dependencies['types:build'].push('outside:build');
    record(f);
    assert.deepEqual(f.proof.projects, ['escrow-enclave-app']);
    assert.deepEqual((await f.resolve()).remainingProjects, ['core']);
});
