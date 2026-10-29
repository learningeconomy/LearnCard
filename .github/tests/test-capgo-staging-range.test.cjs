const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');
const { resolveCapgoStagingRange } = require('../../scripts/resolve-capgo-staging-range.cjs');

const root = path.resolve(__dirname, '../..');
const source = readFileSync(path.join(root, '.github/workflows/capgo-staging.yml'), 'utf8');
const workflow = yaml.load(source);
const app = 'apps/learn-card-app/src/app.ts';
const backend = 'services/example/index.ts';
const fixture = t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'learncard-capgo-range-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) =>
        execFileSync(
            'git',
            ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args],
            {
                cwd,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
            }
        ).trim();
    git('init', '-b', 'main');
    git('config', 'user.name', 'Capgo range fixture');
    git('config', 'user.email', 'capgo-range@example.invalid');
    const commit = (message, files = {}) => {
        for (const [file, content] of Object.entries(files)) {
            const target = path.join(cwd, file);
            mkdirSync(path.dirname(target), { recursive: true });
            writeFileSync(target, content);
        }
        git('add', '.');
        git('commit', '--allow-empty', '-m', message);
        return git('rev-parse', 'HEAD');
    };
    const a = commit('A uploaded', { [app]: 'version A', [backend]: 'backend A' });
    const warnings = [];
    const calls = [];
    const jobCalls = [];
    const options = (runs, jobs = {}) => ({
        repo: { owner: 'learningeconomy', repo: 'LearnCard' },
        head: git('rev-parse', 'HEAD'),
        runId: 9999,
        cwd,
        warn: message => warnings.push(message),
        github: {
            rest: {
                actions: {
                    listWorkflowRuns: async query => {
                        calls.push(query);
                        if (runs instanceof Error) throw runs;
                        return { data: { workflow_runs: runs } };
                    },
                    listJobsForWorkflowRun: async query => {
                        jobCalls.push(query);
                        const result = jobs[query.run_id] ?? [];
                        if (result instanceof Error) throw result;
                        return { data: { jobs: result, total_count: result.length } };
                    },
                },
            },
        },
    });
    return { cwd, git, commit, a, warnings, calls, jobCalls, options };
};
const run = (head_sha, id = 1, overrides = {}) => ({
    id,
    head_sha,
    head_branch: 'main',
    event: 'push',
    conclusion: 'success',
    ...overrides,
});
const uploaded = head_sha => ({
    name: 'Upload staging bundle / Upload CapGo Bundle',
    head_sha,
    conclusion: 'success',
    steps: ['Upload bundle (CapGo)', 'Set channel default (CapGo)'].map(name => ({
        name,
        conclusion: 'success',
    })),
});

test('cancelled B app change survives C backend change and a green no-upload run', async t => {
    const f = fixture(t);
    const b = f.commit('B cancelled', { [app]: 'version B' });
    const c = f.commit('C backend only', { [backend]: 'backend C' });
    const range = await resolveCapgoStagingRange(
        f.options([run(c, 3), run(b, 2, { conclusion: 'cancelled' }), run(f.a)], {
            1: [uploaded(f.a)],
            3: [{ name: 'Upload staging bundle', conclusion: 'skipped' }],
        })
    );
    assert.equal(range.base, f.a);
    assert.equal(range.head, c);
    assert.equal(range.workflow, 'capgo-staging.yml');
    assert.equal(range.source, 'successful-deploy');
    assert.deepEqual(f.git('diff', '--name-only', b, c).split('\n'), [backend]);
    assert.deepEqual(f.git('diff', '--name-only', range.base, c).split('\n').sort(), [
        app,
        backend,
    ]);
    assert.equal(f.calls[0].workflow_id, 'capgo-staging.yml');
    assert.deepEqual(
        f.jobCalls.map(call => call.run_id),
        [3, 1]
    );

    // Execute the real workflow shell with a small Nx transport stub. The stub
    // asserts the forwarded range and uses real Git to simulate project output.
    const bashEnv = path.join(f.cwd, 'bash-env');
    const output = path.join(f.cwd, 'output');
    writeFileSync(
        bashEnv,
        `bunx() {
      [[ "$*" == "nx show projects --affected --base=$NX_BASE --head=$NX_HEAD" ]] || return 9
      if git diff --name-only "$NX_BASE" "$NX_HEAD" | grep -q '^apps/learn-card-app/'; then
        echo learn-card-app
      fi
    }\n`
    );
    execFileSync(
        'bash',
        ['-e', '-c', workflow.jobs.decide.steps.find(s => s.id === 'affected').run],
        {
            cwd: f.cwd,
            env: {
                ...process.env,
                BASH_ENV: bashEnv,
                NX_BASE: range.base,
                NX_HEAD: c,
                GITHUB_OUTPUT: output,
            },
            stdio: 'pipe',
        }
    );
    assert.match(readFileSync(output, 'utf8'), /affected=true/);
    const gate = workflow.jobs.decide.steps
        .find(s => s.id === 'gate')
        .run.replaceAll('${{ steps.release_check.outputs.is_release }}', 'false')
        .replaceAll('${{ steps.affected.outputs.affected }}', 'true');
    execFileSync('bash', ['-e', '-c', gate], {
        cwd: f.cwd,
        env: { ...process.env, GITHUB_OUTPUT: output },
        stdio: 'pipe',
    });
    assert.match(readFileSync(output, 'utf8'), /should_deploy=true/);
});

for (const kind of [
    'skipped',
    'failed-upload',
    'failed-assignment',
    'missing-steps',
    'wrong-sha',
    'other-job',
]) {
    test(`${kind} cannot acknowledge delivery`, async t => {
        const f = fixture(t);
        const b = f.commit('B app edit', { [app]: 'version B' });
        let job = uploaded(b);
        if (kind === 'skipped') job.conclusion = 'skipped';
        if (kind === 'failed-upload') job.steps[0].conclusion = 'failure';
        if (kind === 'failed-assignment') job.steps[1].conclusion = 'failure';
        if (kind === 'missing-steps') job.steps = [];
        if (kind === 'wrong-sha') job.head_sha = f.a;
        if (kind === 'other-job') job.name = 'Unrelated successful job';
        const range = await resolveCapgoStagingRange(
            f.options([run(b, 2), run(f.a)], { 1: [uploaded(f.a)], 2: [job] })
        );
        assert.equal(range.base, f.a);
    });
}

test('release, manual, failed, other-branch, missing, newer and own runs cannot advance staging', async t => {
    const f = fixture(t);
    const release = f.commit('chore(release): production', { [app]: 'release source' });
    const head = f.commit('staging head', { [backend]: 'current backend' });
    const newer = f.commit('newer main', { [app]: 'future source' });
    f.git('checkout', '--detach', head);
    const range = await resolveCapgoStagingRange(
        f.options(
            [
                run(newer, 2),
                run(head, 9999),
                run(head, 3, { event: 'workflow_dispatch' }),
                run(head, 4, { conclusion: 'failure' }),
                run(head, 5, { head_branch: 'feature' }),
                run('f'.repeat(40), 6),
                run(release, 7),
                run(f.a),
            ],
            { 1: [uploaded(f.a)] }
        )
    );
    assert.equal(range.base, f.a);
    assert.deepEqual(
        f.jobCalls.map(call => call.run_id),
        [1]
    );
    assert.ok(f.git('diff', '--name-only', range.base, head).includes(app));
});

for (const kind of ['empty-history', 'runs-api-error', 'jobs-api-error', 'no-delivery']) {
    test(`${kind} conservatively includes the whole app`, async t => {
        const f = fixture(t);
        const head = f.commit('current backend only', { [backend]: 'current' });
        const error = Object.assign(new Error('private transport detail'), { status: 503 });
        const runs = kind === 'empty-history' ? [] : kind === 'runs-api-error' ? error : [run(f.a)];
        const jobs = kind === 'jobs-api-error' ? { 1: error } : {};
        const range = await resolveCapgoStagingRange(f.options(runs, jobs));
        assert.equal(range.source, 'full-tree');
        assert.ok(f.git('diff', '--name-only', range.base, head).includes(app));
        assert.equal(f.warnings.length, 1);
        assert.doesNotMatch(f.warnings[0], /private transport detail/);
        if (kind.endsWith('api-error')) assert.equal(range.reason, 'history-unavailable-http-503');
    });
}

test('incomplete job metadata cannot acknowledge an upload', async t => {
    const f = fixture(t);
    const options = f.options([run(f.a)]);
    options.github.rest.actions.listJobsForWorkflowRun = async () => ({
        data: { jobs: [uploaded(f.a)], total_count: 101 },
    });
    const range = await resolveCapgoStagingRange(options);
    assert.equal(range.source, 'full-tree');
    assert.equal(range.reason, 'history-unavailable');
});

test('history lookup is bounded when 100 successful runs contain no delivered bundle', async t => {
    const f = fixture(t);
    const range = await resolveCapgoStagingRange(
        f.options(Array.from({ length: 100 }, (_, i) => run(f.a, i + 1)))
    );
    assert.equal(range.source, 'full-tree');
    assert.equal(range.reason, 'history-limit');
    assert.equal(f.calls.length, 1);
    assert.equal(f.jobCalls.length, 100);
    assert.ok(f.jobCalls.every(call => call.filter === 'latest' && call.per_page === 100));
});

test('workflow keeps release exclusion, staging channel and production tenant configuration', () => {
    const decide = workflow.jobs.decide;
    const range = decide.steps.find(s => s.id === 'range');
    const affected = decide.steps.find(s => s.id === 'affected');
    assert.deepEqual(decide.permissions, { contents: 'read', actions: 'read' });
    assert.equal(range.if, "steps.release_check.outputs.is_release != 'true'");
    assert.equal(affected.if, range.if);
    assert.equal(range.with.retries, 3);
    assert.equal(affected.env.NX_BASE, '${{ steps.range.outputs.base }}');
    assert.equal(affected.env.NX_HEAD, '${{ steps.range.outputs.head }}');
    assert.doesNotMatch(source, /HEAD~1/);
    const upload = workflow.jobs.upload;
    assert.equal(upload.if, "needs.decide.outputs.should_deploy == 'true'");
    assert.equal(upload.with.environment, 'learn-card-app-staging');
    assert.equal(upload.with.tenant, 'learncard');
    assert.equal(upload.with.stage, undefined);
    assert.equal(upload.with.channel, '${{ needs.decide.outputs.channel }}');
    assert.equal(upload.secrets.CAPGO_TOKEN, '${{ secrets.CAPGO_TOKEN }}');
});
