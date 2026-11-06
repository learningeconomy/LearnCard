const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const yaml = require('js-yaml');
const {
    latestSource,
    eligibleSource,
    resolveRange,
} = require('../../scripts/ai-agent-staging.cjs');

const repo = { owner: 'org', repo: 'repo' };
function fixture(t) {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ai-staging-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) =>
        execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    git('init', '-b', 'main');
    git('config', 'user.name', 'fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('config', 'core.hooksPath', '/dev/null');
    git('config', 'commit.gpgsign', 'false');
    mkdirSync(path.join(cwd, '.github/workflows'), { recursive: true });
    writeFileSync(path.join(cwd, '.github/workflows/ai-agent-staging.yml'), 'fixture');
    const commit = (file, message = file) => {
        writeFileSync(path.join(cwd, file), message);
        git('add', '.');
        git('commit', '-m', message);
        return git('rev-parse', 'HEAD');
    };
    const a = commit('a');
    const b = commit('b');
    const c = commit('c');
    const workflows = {
        'deploy.yml': { id: 10, path: '.github/workflows/deploy.yml' },
        'ai-agent-staging.yml': { id: 20, path: '.github/workflows/ai-agent-staging.yml' },
    };
    const run = (id, head, kind = 'deploy.yml', extra = {}) => ({
        id,
        head_sha: head,
        run_attempt: 1,
        workflow_id: workflows[kind].id,
        path: workflows[kind].path,
        head_branch: 'main',
        event: kind === 'deploy.yml' ? 'push' : 'workflow_run',
        repository: { id: 1 },
        head_repository: { id: 1 },
        status: 'completed',
        conclusion: 'success',
        ...extra,
    });
    const source = run(100, c);
    const runs = new Map([[100, source]]);
    const jobs = new Map();
    let sourceHistory = [source];
    let history = [];
    const github = {
        rest: {
            git: { getRef: async () => ({ data: { object: { sha: git('rev-parse', 'main') } } }) },
            actions: {
                getWorkflow: async ({ workflow_id }) => ({ data: workflows[workflow_id] }),
                getWorkflowRun: async ({ run_id }) => ({ data: runs.get(run_id) }),
                listWorkflowRuns: async ({ workflow_id }) => ({
                    data: { workflow_runs: workflow_id === 10 ? sourceHistory : history },
                }),
                listJobsForWorkflowRun: async ({ run_id, filter }) => {
                    assert.equal(filter, 'latest');
                    const value = jobs.get(run_id) || [];
                    return { data: { jobs: value, total_count: value.length } };
                },
            },
        },
    };
    const delivered = (id, sha, extra = {}, step = 'success') => {
        // Metadata head deliberately differs from the revision actually deployed.
        const value = run(id, c, 'ai-agent-staging.yml', extra);
        runs.set(id, value);
        history.push(value);
        jobs.set(id, [
            {
                name: `Roll out AI Agent / Deploy AI Agent ${sha}`,
                conclusion: 'success',
                steps: [{ name: 'Record successful AI Agent rollout', conclusion: step }],
            },
        ]);
        return value;
    };
    const args = {
        github,
        repo,
        repositoryId: 1,
        runId: 100,
        attempt: 1,
        head: c,
        cwd,
        warn: () => {},
    };
    return {
        cwd,
        git,
        a,
        b,
        c,
        commit,
        run,
        runs,
        jobs,
        source,
        args,
        delivered,
        setSources: values => (sourceHistory = values),
        setHistory: values => (history = values),
    };
}

test('only the exact successful same-repository main push and attempt can hand off', async t => {
    const f = fixture(t);
    assert.equal((await eligibleSource(f.args)).current, true);
    for (const changes of [
        { event: 'pull_request' },
        { event: 'workflow_dispatch' },
        { head_branch: 'feature' },
        { conclusion: 'failure' },
        { status: 'in_progress' },
        { workflow_id: 30 },
        { path: '.github/workflows/other.yml' },
        { head_repository: { id: 2 } },
        { repository: { id: 2 } },
        { run_attempt: 2 },
        { head_sha: f.b },
    ]) {
        f.runs.set(100, { ...f.source, ...changes });
        await assert.rejects(eligibleSource(f.args), undefined, JSON.stringify(changes));
    }
});

test('newer tested staging candidate displaces an old rerun; raw main advance does not', async t => {
    const f = fixture(t);
    f.commit('untested');
    assert.equal((await eligibleSource(f.args)).current, true);
    const newer = f.run(101, f.git('rev-parse', 'HEAD'));
    f.setSources([newer, f.source]);
    assert.equal((await eligibleSource(f.args)).reason, 'newer-successful-deploy');
    newer.conclusion = 'failure';
    assert.equal((await eligibleSource(f.args)).current, true);
    f.setSources([]);
    await assert.rejects(eligibleSource(f.args), /outside bounded history/);
});

test('production and pre-separation runs do not become automatic staging rollouts', async t => {
    const f = fixture(t);
    const release = f.commit('release', 'chore(release): version packages');
    const source = f.run(101, release);
    f.runs.set(101, source);
    f.setSources([source, f.source]);
    assert.equal(
        (await eligibleSource({ ...f.args, runId: 101, head: release })).reason,
        'production-release'
    );
    assert.equal((await eligibleSource(f.args)).current, true);
    f.git('rm', '.github/workflows/ai-agent-staging.yml');
    f.git('commit', '-m', 'old workflow fixture');
    const old = f.run(102, f.git('rev-parse', 'HEAD'));
    f.runs.set(102, old);
    f.setSources([old]);
    assert.equal(
        (await eligibleSource({ ...f.args, runId: 102, head: old.head_sha })).reason,
        'pre-separation-source'
    );
});

test('source API outage fails closed before mutations', async t => {
    const f = fixture(t);
    f.args.github.rest.actions.listWorkflowRuns = async () => {
        throw new Error('unavailable');
    };
    await assert.rejects(eligibleSource(f.args), /unavailable/);
});

test('baseline uses actual delivered revision; skipped and failed B retain B-only changes for C', async t => {
    const f = fixture(t);
    f.delivered(10, f.a);
    f.delivered(11, f.b, {}, 'skipped');
    f.delivered(12, f.b, { conclusion: 'failure' });
    const result = await resolveRange(f.args);
    assert.equal(result.base, f.a);
    assert.equal(result.successfulRunId, '10');
    assert.deepEqual(f.git('diff', '--name-only', result.base, result.head).split('\n'), [
        'b',
        'c',
    ]);
});

test('choose newest delivered ancestor despite old reruns and default-branch metadata', async t => {
    const f = fixture(t);
    f.delivered(10, f.a);
    f.delivered(11, f.b);
    assert.equal((await resolveRange(f.args)).base, f.b);
    assert.equal((await resolveRange({ ...f.args, head: f.a })).base, f.a);
    f.delivered(12, f.c);
    assert.equal((await resolveRange(f.args)).base, f.c);
});

test('manual/fork/wrong-workflow/changed-attempt/incomplete jobs cannot acknowledge delivery', async t => {
    const f = fixture(t);
    f.delivered(10, f.a);
    for (const [i, extra] of [
        { event: 'workflow_dispatch' },
        { head_repository: { id: 2 } },
        { workflow_id: 99 },
        { head_branch: 'feature' },
        { path: '.github/workflows/other.yml' },
        { status: 'in_progress' },
    ].entries())
        f.delivered(20 + i, f.b, extra);
    const changed = f.delivered(30, f.b);
    f.runs.set(changed.id, { ...changed, run_attempt: 2 });
    assert.equal((await resolveRange(f.args)).base, f.a);
    f.args.github.rest.actions.listJobsForWorkflowRun = async () => ({
        data: { total_count: 100, jobs: [] },
    });
    assert.equal((await resolveRange(f.args)).source, 'full-tree');
});

test('missing or inaccessible history compares the full tree, never just HEAD~1', async t => {
    const f = fixture(t);
    for (const fail of [false, true]) {
        if (fail)
            f.args.github.rest.actions.listWorkflowRuns = async () => {
                throw new Error('private transport details');
            };
        const result = await resolveRange(f.args);
        assert.equal(result.source, 'full-tree');
        assert(f.git('diff', '--name-only', result.base, result.head).includes('a'));
        assert(!JSON.stringify(result).includes('private'));
    }
});

const root = path.resolve(__dirname, '../..');
const read = name => yaml.load(readFileSync(path.join(root, '.github/workflows', name), 'utf8'));
test('independent handoff shares target lock and approvals with manual/production; source SHA used throughout', () => {
    const core = read('deploy.yml');
    const staging = read('ai-agent-staging.yml');
    const shared = read('ai-agent-rollout.yml');
    assert.deepEqual(staging.on.workflow_run, {
        workflows: ['Deploy'],
        branches: ['main'],
        types: ['completed'],
    });
    assert.notEqual(staging.concurrency.group, core.concurrency);
    assert.equal(staging.concurrency['cancel-in-progress'], false);
    assert.doesNotMatch(core.jobs['validate-ai-agent'].if, /contains\(.*ai-agent-service/);
    for (const call of [core.jobs['deploy-ai-agent'], staging.jobs.rollout]) {
        assert.equal(call.uses, './.github/workflows/ai-agent-rollout.yml');
        assert.equal(call.secrets, 'inherit');
    }
    assert.equal(staging.jobs.rollout.name, 'Roll out AI Agent');
    const job = shared.jobs['deploy-ai-agent'];
    assert.equal(job.name, 'Deploy AI Agent ${{ inputs.revision }}');
    assert.equal(job.environment, 'learn-card-ai-agent-${{ inputs.target-environment }}');
    assert.equal(job.concurrency.group, 'deploy-ai-agent-${{ inputs.target-environment }}');
    assert.equal(job.concurrency['cancel-in-progress'], false);
    const source = JSON.stringify(job);
    assert(
        !source.includes('github.sha'),
        'workflow_run default SHA must never tag or check out an image'
    );
    const steps = job.steps;
    const gate = steps.findIndex(s => s.id === 'current');
    assert(gate > steps.findIndex(s => s.name === 'Verify Trigger native package installation'));
    for (const step of steps.slice(gate + 1))
        assert.match(step.if, /steps.current.outputs.current == 'true'/);
    assert.equal(steps.at(-1).name, 'Record successful AI Agent rollout');
    assert.equal(steps.at(-1)['continue-on-error'], undefined);
    for (const name of [
        'Reject vulnerable runtime image',
        'Require staging smoke success',
        'Verify readiness',
        'Verify observability delivery',
    ]) {
        assert(steps.some(s => s.name === name));
    }
    // #1930's optimization stays intact in the extracted job.
    assert(
        steps.findIndex(s => s.name === 'Build and push AI Agent image') <
            steps.findIndex(s => s.name === 'Wait for native registry publication')
    );
    const image = steps.find(s => s.name === 'Build and push AI Agent image');
    assert.equal(image.with['cache-to'], undefined);
    assert.equal(steps.find(s => s.name === 'Set up Docker Buildx').with.cleanup, false);
    const validateSteps = core.jobs['validate-ai-agent'].steps.slice(1);
    assert.deepEqual(
        staging.jobs.validate.steps.slice(1),
        validateSteps,
        'same AI tests in both entrypoints'
    );
});

test('Trigger receives the deployed SHA even when the workflow default SHA is newer', t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ai-trigger-sha-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const trigger = read('ai-agent-rollout.yml').jobs['deploy-ai-agent'].steps.find(
        s => s.name === 'Deploy Trigger.dev tasks'
    );
    assert.equal(trigger.env.DEPLOY_REVISION, '${{ inputs.revision }}');
    writeFileSync(path.join(cwd, 'bunx'), '#!/bin/sh\nprintf "%s\\n" "$GITHUB_SHA" "$@"\n', {
        mode: 0o755,
    });
    const result = execFileSync('bash', ['-e', '-c', trigger.run], {
        encoding: 'utf8',
        env: {
            ...process.env,
            PATH: `${cwd}:${process.env.PATH}`,
            GITHUB_SHA: 'b'.repeat(40),
            DEPLOY_REVISION: 'a'.repeat(40),
        },
    })
        .trim()
        .split('\n');
    assert.deepEqual(result, [
        'a'.repeat(40),
        'trigger',
        'deploy',
        '--env',
        'prod',
        '--skip-update-check',
    ]);
});

test('a displaced newer event is recovered by an older rerun or release worker', async t => {
    const f = fixture(t);
    const old = f.run(99, f.b);
    // Old B is the last-triggered worker, but C remains the newest tested tree.
    f.setSources([old, f.source]);
    assert.deepEqual(await latestSource(f.args), { runId: 100, attempt: 1, head: f.c });
    const release = f.commit('release', 'chore(release): version packages');
    f.setSources([f.run(101, release), old, f.source]);
    assert.equal((await latestSource(f.args)).head, f.c);
    const failed = f.commit('failed');
    f.setSources([f.run(102, failed, 'deploy.yml', { conclusion: 'failure' }), old, f.source]);
    assert.equal((await latestSource(f.args)).head, f.c);
});

test('failed/manual/fork events cannot evict a pending successful handoff', () => {
    const staging = read('ai-agent-staging.yml');
    const expression = staging.concurrency.group.trim().replace(/^\$\{\{|\}\}$/g, '');
    const vm = require('node:vm');
    const group = changes =>
        vm.runInNewContext(expression, {
            github: {
                run_id: 123,
                event: {
                    repository: { id: 1 },
                    workflow_run: {
                        conclusion: 'success',
                        event: 'push',
                        head_branch: 'main',
                        head_repository: { id: 1 },
                        ...changes,
                    },
                },
            },
            format: (value, id) => value.replace('{0}', id),
        });
    assert.equal(group({}), 'ai-agent-staging');
    for (const changes of [
        { conclusion: 'failure' },
        { event: 'workflow_dispatch' },
        { head_repository: { id: 2 } },
        { head_branch: 'other' },
    ]) {
        assert.equal(group(changes), 'ai-agent-staging-ignored-123');
    }
    assert.equal(
        staging.jobs.rollout.with['source-run-id'],
        '${{ needs.select.outputs.source-run-id }}'
    );
    assert.equal(
        staging.jobs.rollout.with['source-attempt'],
        '${{ needs.select.outputs.source-attempt }}'
    );
});

test('retrying a newer core Deploy cannot make an older revision safe to roll out again', async t => {
    const f = fixture(t);
    const newer = f.commit('newer');
    for (const conclusion of [null, 'failure', 'cancelled']) {
        f.setSources([
            f.run(101, newer, 'deploy.yml', {
                run_attempt: 2,
                status: conclusion ? 'completed' : 'in_progress',
                conclusion,
            }),
            f.source,
        ]);
        assert.equal((await eligibleSource(f.args)).reason, 'newer-deploy-retry');
    }
});
