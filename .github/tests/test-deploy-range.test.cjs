const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const {
    resolveDeployRange,
    getDeploymentChangeFlags,
} = require('../../scripts/resolve-deploy-range.cjs');

const root = path.resolve(__dirname, '../..');
const workflowSource = readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
const workflow = yaml.load(workflowSource);
const brain = 'services/learn-card-network/brain-service/package.json';
const lca = 'services/learn-card-network/lca-api/package.json';
const frontend = 'apps/learn-card-app/package.json';
const native = 'packages/plugins/didkit-plugin-node/src/index.ts';
const manifest = version => JSON.stringify({ name: 'fixture', version });

const fixture = t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'learncard-deploy-range-'));
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
    git('config', 'user.name', 'Deploy range fixture');
    git('config', 'user.email', 'deploy-range@example.invalid');
    const commit = (message, files) => {
        for (const [filename, content] of Object.entries(files)) {
            const target = path.join(cwd, filename);
            mkdirSync(path.dirname(target), { recursive: true });
            writeFileSync(target, content);
        }
        git('add', '.');
        git('commit', '-m', message);
        return git('rev-parse', 'HEAD');
    };
    const initial = commit('initial source', {
        [brain]: manifest('1.0.0'),
        [lca]: manifest('1.0.0'),
        [frontend]: manifest('1.0.0'),
        [native]: 'export const version = 1;',
    });
    const warnings = [];
    const calls = [];
    const options = (pages, release = false) => ({
        cwd,
        repo: { owner: 'learningeconomy', repo: 'LearnCard' },
        head: git('rev-parse', 'HEAD'),
        runId: 9999,
        release,
        warn: message => warnings.push(message),
        github: {
            rest: {
                actions: {
                    listWorkflowRuns: async query => {
                        calls.push(query);
                        if (pages instanceof Error) throw pages;
                        return { data: { workflow_runs: pages[query.page - 1] ?? [] } };
                    },
                },
            },
        },
    });
    return { cwd, git, commit, initial, options, calls, warnings };
};

const run = (head_sha, overrides = {}) => ({
    id: 1,
    event: 'push',
    head_branch: 'main',
    conclusion: 'success',
    head_sha,
    ...overrides,
});

test('A succeeded, B was displaced, C selects both B-only and C-only changes', async t => {
    const f = fixture(t);
    const b = f.commit('B changes Brain', { [brain]: manifest('1.1.0') });
    f.commit('C changes frontend', { [frontend]: manifest('1.1.0') });
    const range = await resolveDeployRange(
        f.options([[run(b, { conclusion: 'cancelled' }), run(f.initial)]])
    );
    assert.equal(range.base, f.initial);
    assert.equal(range.source, 'successful-deploy');
    const changed = f.git('diff', '--name-only', range.base, range.head).split('\n').sort();
    assert.deepEqual(changed, [brain, frontend].sort());
    assert.deepEqual(f.git('diff', '--name-only', b, range.head).split('\n'), [frontend]);
    assert.equal(f.calls[0].workflow_id, 'deploy.yml');
    assert.equal(f.calls[0].event, 'push');
    assert.equal(f.calls[0].status, 'success');
    assert.equal(f.calls[0].branch, 'main');
});

test('manual, failed and other-branch runs cannot acknowledge staging work', async t => {
    const f = fixture(t);
    const b = f.commit('B changes Brain', { [brain]: manifest('1.1.0') });
    f.commit('C changes frontend', { [frontend]: manifest('1.1.0') });
    const range = await resolveDeployRange(
        f.options([
            [
                run(b, { event: 'workflow_dispatch' }),
                run(b, { conclusion: 'failure' }),
                run(b, { head_branch: 'another-branch' }),
                run(f.initial),
            ],
        ])
    );
    assert.equal(range.base, f.initial);
});

test('a successful production release cannot advance the staging baseline', async t => {
    const f = fixture(t);
    const release = f.commit('chore(release): version packages', { [brain]: manifest('1.1.0') });
    f.commit('ordinary staging push', { [frontend]: manifest('1.1.0') });
    const range = await resolveDeployRange(f.options([[run(release), run(f.initial)]]));
    assert.equal(range.base, f.initial);
    assert.equal(range.mode, 'staging');
});

test('release range retains displaced package/native changes and ignores staging success', async t => {
    const f = fixture(t);
    const released = f.commit('chore(release): previous release', { [brain]: manifest('1.0.1') });
    const displaced = f.commit('chore(release): displaced release', {
        [brain]: manifest('1.1.0'),
        [native]: 'export const version = 2;',
    });
    const staging = f.commit('staging-only dependency edit', {
        [frontend]: JSON.stringify({ version: '1.0.0', dependencies: { example: '2.0.0' } }),
    });
    f.commit('chore(release): current release', { [lca]: manifest('1.1.0') });
    const range = await resolveDeployRange(
        f.options(
            [[run(staging), run(displaced, { conclusion: 'cancelled' }), run(released)]],
            true
        )
    );
    assert.equal(range.base, released);
    assert.equal(range.mode, 'production-release');

    // Execute the actual workflow's package/native selection, not a test copy.
    const output = path.join(f.cwd, 'outputs');
    mkdirSync(path.join(f.cwd, 'scripts'));
    writeFileSync(
        path.join(f.cwd, 'scripts/resolve-deploy-range.cjs'),
        readFileSync(path.join(root, 'scripts/resolve-deploy-range.cjs'))
    );
    const step = workflow.jobs['determine-affected'].steps.find(
        step => step.id === 'check_versions'
    );
    const selected = spawnSync('bash', ['-e', '-c', step.run], {
        cwd: f.cwd,
        env: { ...process.env, NX_BASE: range.base, NX_HEAD: range.head, GITHUB_OUTPUT: output },
        encoding: 'utf8',
    });
    assert.equal(selected.status, 0, selected.stderr);
    const flags = readFileSync(output, 'utf8');
    assert.match(flags, /brain_service_changed=true/);
    assert.match(flags, /lca_api_changed=true/);
    assert.match(flags, /native_plugin_changed=true/);
    assert.match(flags, /lca_app_changed=false/);
});

test('an actual app version bump selects publishing, while dependency-only edits do not', t => {
    const f = fixture(t);
    const dependencyEdit = f.commit('app dependency update', {
        [frontend]: JSON.stringify({ version: '1.0.0', dependencies: { example: '2.0.0' } }),
    });
    assert.equal(
        getDeploymentChangeFlags({ base: f.initial, head: dependencyEdit, cwd: f.cwd })
            .lca_app_changed,
        false
    );
    const bump = f.commit('chore(release): app version bump', { [frontend]: manifest('1.1.0') });
    assert.equal(
        getDeploymentChangeFlags({ base: f.initial, head: bump, cwd: f.cwd }).lca_app_changed,
        true
    );
});

test('paginates past successful runs in the wrong deployment mode', async t => {
    const f = fixture(t);
    const release = f.commit('chore(release): version packages', { [brain]: manifest('1.1.0') });
    f.commit('staging push', { [frontend]: manifest('1.1.0') });
    const page = Array.from({ length: 100 }, (_, i) => run(release, { id: i + 10 }));
    const range = await resolveDeployRange(f.options([page, [run(f.initial)]]));
    assert.equal(range.base, f.initial);
    assert.deepEqual(
        f.calls.map(query => query.page),
        [1, 2]
    );
});

test('an old-run rerun rejects later commits and its own previous successful attempt', async t => {
    const f = fixture(t);
    const old = f.commit('old push', { [brain]: manifest('1.1.0') });
    const newer = f.commit('new push', { [frontend]: manifest('1.1.0') });
    f.git('checkout', '--detach', old);
    const range = await resolveDeployRange(
        f.options([[run(newer), run(old, { id: 9999 }), run(f.initial)]])
    );
    assert.equal(range.base, f.initial);
    assert.equal(range.head, old);
});

for (const reason of ['no-success', 'API-error', 'missing-object']) {
    test(`${reason} uses the full tree, including files in the root commit`, async t => {
        const f = fixture(t);
        f.commit('current push', { [frontend]: manifest('1.1.0') });
        const pages =
            reason === 'API-error'
                ? new Error('private transport detail must not enter the summary')
                : reason === 'missing-object'
                  ? [[run('f'.repeat(40))]]
                  : [[]];
        const range = await resolveDeployRange(f.options(pages));
        assert.equal(range.source, 'full-tree');
        assert.equal(f.git('cat-file', '-t', range.base), 'tree');
        assert.deepEqual(
            f.git('diff', '--name-only', range.base, range.head).split('\n').sort(),
            [brain, lca, frontend, native].sort()
        );
        assert.equal(f.warnings.length, 1);
        assert.doesNotMatch(f.warnings[0], /private transport detail/);
    });
}

for (const status of [403, 429, 503]) {
    for (const release of [false, true]) {
        test(`HTTP ${status} diagnoses ${release ? 'production failure' : 'staging fallback'} without raw transport details`, async t => {
            const f = fixture(t);
            f.commit(release ? 'chore(release): current release' : 'current push', {
                [frontend]: manifest('1.1.0'),
            });
            const error = Object.assign(new Error('private transport detail'), { status });
            const options = f.options(error, release);
            const reason = `history-unavailable-http-${status}`;
            if (release) {
                await assert.rejects(resolveDeployRange(options), error => {
                    assert.match(error.message, /No trusted production-release Deploy baseline/);
                    assert.ok(error.message.includes(reason));
                    assert.doesNotMatch(error.message, /private transport detail/);
                    return true;
                });
            } else {
                const range = await resolveDeployRange(options);
                assert.equal(range.source, 'full-tree');
                assert.equal(range.reason, reason);
                assert.equal(f.git('cat-file', '-t', range.base), 'tree');
                assert.ok(f.warnings[0].includes(reason));
                assert.doesNotMatch(f.warnings[0], /private transport detail/);
            }
        });
    }
}

test('rejects a head or mode mismatch before consulting deployment history', async t => {
    const f = fixture(t);
    const options = f.options([[]]);
    await assert.rejects(
        resolveDeployRange({ ...options, head: 'f'.repeat(40) }),
        /checked-out commit/
    );
    await assert.rejects(resolveDeployRange({ ...options, release: true }), /mode/);
    assert.equal(f.calls.length, 0);
});

test('bounded history exhaustion uses a full-tree range rather than the last commit', async t => {
    const f = fixture(t);
    const page = Array.from({ length: 100 }, () => run(f.initial, { event: 'workflow_dispatch' }));
    const range = await resolveDeployRange(f.options(Array.from({ length: 10 }, () => page)));
    assert.equal(range.source, 'full-tree');
    assert.equal(range.reason, 'history-limit');
    assert.equal(f.calls.length, 10);
});

for (const reason of ['no-success', 'API-error', 'history-limit']) {
    test(`production ${reason} stops before any blanket publishing selection`, async t => {
        const f = fixture(t);
        f.commit('chore(release): current release', { [brain]: manifest('1.1.0') });
        const pages =
            reason === 'API-error'
                ? new Error('unavailable history')
                : reason === 'history-limit'
                  ? Array.from({ length: 10 }, () =>
                        Array.from({ length: 100 }, () =>
                            run(f.initial, { event: 'workflow_dispatch' })
                        )
                    )
                  : [[]];
        await assert.rejects(
            resolveDeployRange(f.options(pages, true)),
            /No trusted production-release Deploy baseline/
        );
    });
}

test('the test runner can use the full-tree fallback in its own independent clone', async t => {
    const f = fixture(t);
    const range = await resolveDeployRange(f.options([[]]));
    const clone = mkdtempSync(path.join(tmpdir(), 'learncard-deploy-consumer-'));
    t.after(() => rmSync(clone, { recursive: true, force: true }));
    f.git('clone', '--no-local', f.cwd, clone);
    const prepare = workflow.jobs['test-affected'].steps.find(
        step => step.name === 'Prepare full-tree comparison fallback'
    );
    execFileSync('bash', ['-e', '-c', prepare.run], { cwd: clone, stdio: 'pipe' });
    const files = execFileSync('git', ['diff', '--name-only', range.base, range.head], {
        cwd: clone,
        encoding: 'utf8',
    });
    assert.deepEqual(files.trim().split('\n').sort(), [brain, lca, frontend, native].sort());
});

test('all automatic consumers share one range; manual dispatch still bypasses selection', () => {
    const determine = workflow.jobs['determine-affected'];
    const range = determine.steps.find(step => step.id === 'range');
    assert.equal(range.if, "github.event_name != 'workflow_dispatch'");
    assert.deepEqual(determine.permissions, { contents: 'read', actions: 'read' });
    assert.equal(
        determine.outputs.is_release,
        "${{ job.status == 'success' && steps.check_release.outputs.is_release || 'false' }}"
    );
    assert.equal(determine.outputs.base, '${{ steps.range.outputs.base }}');
    assert.equal(determine.outputs.head, '${{ steps.range.outputs.head }}');
    for (const id of ['affected', 'check_versions']) {
        const step = determine.steps.find(step => step.id === id);
        assert.equal(step.if, range.if);
        assert.equal(step.env.NX_BASE, '${{ steps.range.outputs.base }}');
        assert.equal(step.env.NX_HEAD, '${{ steps.range.outputs.head }}');
        assert.match(step.run, /"\$NX_BASE"/);
        assert.match(step.run, /"\$NX_HEAD"/);
    }
    const tests = workflow.jobs['test-affected'];
    assert.ok(tests.needs.includes('determine-affected'));
    assert.match(tests.if, /is_manual != 'true'/);
    const runTests = tests.steps.find(step => step.name === 'Run tests');
    assert.equal(runTests.env.NX_BASE, '${{ needs.determine-affected.outputs.base }}');
    assert.equal(runTests.env.NX_HEAD, '${{ needs.determine-affected.outputs.head }}');
    assert.match(runTests.with.command, /--base="\$NX_BASE" --head="\$NX_HEAD"/);
    assert.ok(
        tests.steps.some(step => step.run === 'git hash-object -t tree -w --stdin </dev/null')
    );
    assert.doesNotMatch(workflowSource, /HEAD~1/);
});
