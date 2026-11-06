const assert = require('node:assert/strict');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');
const {
    mkdirSync,
    mkdtempSync,
    writeFileSync,
    readFileSync,
    rmSync,
    renameSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname, resolve } = require('node:path');
const { select, decideFromGraph, groups } = require('../../scripts/test-ci-selection.cjs');

const repo = resolve(__dirname, '../..');
const graph = () => {
    const projects = {
        'network-brain-service': 'services/brain',
        'lca-api-service': 'services/lca',
        'sss-key-manager': 'packages/sss',
        'escrow-enclave-app': 'services/escrow',
        shared: 'packages/shared',
        transitive: 'packages/transitive',
        builder: 'tools/builder',
        input: 'packages/input',
        unrelated: 'apps/unrelated',
    };
    const tasks = Object.fromEntries(
        [...new Set(Object.values(groups).flatMap(g => g.tasks))].map(id => [
            id,
            { target: { project: id.split(':')[0], target: id.slice(id.indexOf(':') + 1) } },
        ])
    );
    tasks['builder:build'] = { target: { project: 'builder', target: 'build' } };
    return {
        graph: {
            nodes: Object.fromEntries(
                Object.entries(projects).map(([name, root]) => [name, { data: { root } }])
            ),
            dependencies: {
                ...Object.fromEntries(Object.keys(projects).map(name => [name, []])),
                'network-brain-service': [{ target: 'shared', type: 'implicit' }],
                shared: [{ target: 'transitive', type: 'dynamic' }],
            },
        },
        tasks: {
            tasks,
            dependencies: {
                ...Object.fromEntries(Object.keys(tasks).map(id => [id, []])),
                'network-brain-service:test:profile-search': ['builder:build'],
            },
        },
    };
};
const runs = result =>
    Object.fromEntries(Object.entries(result).map(([key, value]) => [key, value.run]));
const full = { brain: true, campaigns: true, escrow: true };
const none = { brain: false, campaigns: false, escrow: false };

test('selects direct, transitive, implicit and prerequisite dependencies without unrelated apps', () => {
    for (const path of [
        'services/brain/src/a.ts',
        'packages/shared/src/a.ts',
        'packages/transitive/src/a.ts',
        'tools/builder/executor.ts',
    ])
        assert.deepEqual(runs(decideFromGraph([path], graph())), {
            brain: true,
            campaigns: true,
            escrow: false,
        });
    assert.deepEqual(runs(decideFromGraph(['apps/unrelated/src/a.ts'], graph())), none);
});

test('campaign coverage includes LCA notifications and escrow retains its explicit service/package inputs', () => {
    assert.deepEqual(runs(decideFromGraph(['services/lca/src/a.ts'], graph())), {
        brain: false,
        campaigns: true,
        escrow: true,
    });
    for (const path of ['services/escrow/src/a.rs', 'packages/sss/src/a.ts'])
        assert.deepEqual(runs(decideFromGraph([path], graph())), {
            brain: false,
            campaigns: false,
            escrow: true,
        });
});

test('workspace inputs and their dependency closure count even without a source import', () => {
    const g = graph();
    g.graph.nodes['network-brain-service'].data.namedInputs = {
        shared: ['{workspaceRoot}/packages/input/src/**/*'],
    };
    g.graph.dependencies.input = [{ target: 'unrelated', type: 'static' }];
    assert.equal(decideFromGraph(['packages/input/src/a.ts'], g).brain.run, true);
    assert.equal(decideFromGraph(['apps/unrelated/src/a.ts'], g).brain.run, true);
});

test('root named inputs and target defaults retain explicitly referenced workspace projects', () => {
    for (const workspaceConfig of [
        { namedInputs: { shared: ['{workspaceRoot}/packages/input/src/**/*'] } },
        { targetDefaults: { build: { inputs: ['{workspaceRoot}/packages/input/src/**/*'] } } },
    ]) {
        const g = { ...graph(), workspaceConfig };
        assert.deepEqual(runs(decideFromGraph(['packages/input/src/a.ts'], g)), full);
    }
});

test('every workspace reference in a command is included; ambiguous parent traversal cannot skip', () => {
    const g = graph();
    g.graph.nodes['network-brain-service'].data.targets = {
        build: {
            options: {
                command: `node "{workspaceRoot}/tools/builder/run.js" --source '{workspaceRoot}/packages/input/src'`,
            },
        },
    };
    assert.equal(decideFromGraph(['packages/input/src/a.ts'], g).brain.run, true);
    g.graph.nodes['network-brain-service'].data.targets.build.options.command =
        '{workspaceRoot}/packages/unrelated/../input/src';
    assert.throws(
        () => decideFromGraph(['packages/input/src/a.ts'], g),
        /Ambiguous workspace input/
    );
});

test('unknown ownership runs; root projects and incomplete graphs cannot authorize skips', () => {
    assert.deepEqual(runs(decideFromGraph(['packages/missing/a.ts'], graph())), full);
    for (const mutate of [
        g => {
            g.graph.nodes.unrelated.data.root = '.';
        },
        g => {
            delete g.graph.nodes['network-brain-service'];
        },
        g => {
            delete g.graph.dependencies['network-brain-service'];
        },
        g => {
            g.graph.dependencies.shared.push({ target: 'missing' });
        },
        g => {
            delete g.tasks.tasks['builder:build'];
        },
        g => {
            delete g.tasks.dependencies['builder:build'];
        },
    ]) {
        const g = graph();
        mutate(g);
        assert.throws(() => decideFromGraph(['apps/unrelated/src/a.ts'], g));
    }
});

const fixture = t => {
    const cwd = mkdtempSync(join(tmpdir(), 'integration-selection-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) =>
        execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    const write = (path, content = 'initial\n') => {
        mkdirSync(dirname(join(cwd, path)), { recursive: true });
        writeFileSync(join(cwd, path), content);
    };
    const commit = () => {
        git('add', '-A');
        git(
            '-c',
            'core.hooksPath=/dev/null',
            '-c',
            'user.name=Fixture',
            '-c',
            'user.email=fixture@example.com',
            'commit',
            '--allow-empty',
            '-qm',
            'fixture'
        );
        return git('rev-parse', 'HEAD');
    };
    git('init', '-q', '-b', 'main');
    write('nx.json', '{}\n');
    write('README.md');
    write('packages/shared/src/a.ts');
    write('apps/unrelated/src/a.ts');
    const baseSha = commit();
    const decide = (headSha, overrides = {}) =>
        select({ eventName: 'pull_request', baseSha, headSha, cwd, getGraph: graph, ...overrides });
    return { cwd, git, write, commit, baseSha, decide };
};

test('reviewed independent E2E files and prose skip without installing Nx or workspace dependencies', t => {
    const f = fixture(t);
    f.write('.github/workflows/e2e.yml');
    f.write('.github/tests/test-hosted-e2e-workflow-contract.test.sh');
    f.write('scripts/e2e-hosted/README.md');
    f.write('docs/guide.md');
    assert.deepEqual(
        runs(
            f.decide(f.commit(), {
                getGraph: () => {
                    throw new Error('must not need graph');
                },
            })
        ),
        none
    );
});

test('manual and unknown events never skip integration coverage', () => {
    for (const eventName of ['workflow_dispatch', 'push', undefined])
        assert.deepEqual(runs(select({ eventName })), full);
});

for (const path of [
    'package.json',
    'bun.lock',
    'nx.json',
    'vitest.shared.ts',
    'packages/unrelated/package.json',
    'apps/unrelated/project.json',
    'packages/shared/tsconfig.json',
    '.github/workflows/test.yml',
    '.github/actions/setup/action.yml',
    '.github/mock-e2e-preflight/package-lock.json',
    'scripts/test-ci-selection.cjs',
    'scripts/mock-e2e-ci.cjs',
    'unknown/input',
]) {
    test(`shared configuration or unknown input runs all: ${path}`, t => {
        const f = fixture(t);
        f.write(path);
        assert.deepEqual(runs(f.decide(f.commit())), full);
    });
}

test('graph errors, missing metadata, missing Git objects and empty comparisons run all', t => {
    const f = fixture(t);
    f.write('apps/unrelated/src/a.ts', 'changed\n');
    const headSha = f.commit();
    assert.deepEqual(runs(f.decide(headSha)), none);
    assert.deepEqual(
        runs(
            f.decide(headSha, {
                getGraph: () => {
                    throw new Error('timeout');
                },
            })
        ),
        full
    );
    for (const baseSha of [undefined, '--invalid', 'f'.repeat(40), headSha])
        assert.deepEqual(runs(f.decide(headSha, { baseSha })), full);
    assert.deepEqual(
        runs(f.decide(f.baseSha)),
        full,
        'a graph from the wrong checkout cannot authorize skips'
    );
});

test('source deletion and rename cannot hide former dependents in the head graph', t => {
    const f = fixture(t);
    mkdirSync(join(f.cwd, 'docs'));
    renameSync(join(f.cwd, 'packages/shared/src/a.ts'), join(f.cwd, 'docs/moved.md'));
    assert.deepEqual(runs(f.decide(f.commit())), full);
});

test('PR uses merge base; queue uses its frozen base including preceding queue changes', t => {
    const f = fixture(t);
    f.git('checkout', '-qb', 'pr');
    f.write('apps/unrelated/src/a.ts', 'PR change\n');
    const prHead = f.commit();
    f.git('checkout', 'main');
    f.write('packages/shared/src/a.ts', 'Earlier queue/base change\n');
    const advancedBase = f.commit();
    f.git('checkout', 'pr');
    assert.deepEqual(runs(f.decide(prHead, { baseSha: advancedBase })), none);
    f.git(
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'merge',
        '--no-edit',
        '-m',
        'Combined queue revision',
        'main'
    );
    const queueHead = f.git('rev-parse', 'HEAD');
    assert.deepEqual(runs(f.decide(queueHead, { eventName: 'merge_group' })), {
        brain: true,
        campaigns: true,
        escrow: false,
    });
});

test('CLI emits explicit skip outputs and an honest summary without installed dependencies', t => {
    const f = fixture(t);
    f.write('docs/guide.md');
    const headSha = f.commit();
    const output = join(f.cwd, 'outputs');
    const summary = join(f.cwd, 'summary');
    const result = spawnSync(process.execPath, [join(repo, 'scripts/test-ci-selection.cjs')], {
        cwd: f.cwd,
        encoding: 'utf8',
        env: {
            ...process.env,
            GITHUB_EVENT_NAME: 'pull_request',
            BASE_SHA: f.baseSha,
            HEAD_SHA: headSha,
            GITHUB_OUTPUT: output,
            GITHUB_STEP_SUMMARY: summary,
        },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(output, 'utf8'), 'brain=false\ncampaigns=false\nescrow=false\n');
    assert.match(readFileSync(summary, 'utf8'), /not applicable — skipped/);
});

test('job gates reuse an existing runner, fail toward execution and retain all suite commands', () => {
    const workflow = JSON.parse(
        execFileSync(
            'ruby',
            [
                '-ryaml',
                '-rjson',
                '-e',
                'puts JSON.generate(YAML.load_file(ARGV[0], aliases: true))',
                join(repo, '.github/workflows/test.yml'),
            ],
            { encoding: 'utf8' }
        )
    );
    const jobs = workflow.jobs;
    assert.equal(Object.keys(jobs).length, 10, 'no extra selector or aggregate runner');
    const selector = jobs['deployment-tools'];
    assert.equal(selector.steps[0].with['fetch-depth'], 0);
    assert.ok(!selector.steps.some(step => step.uses === './.github/actions/setup'));
    const selection = selector.steps.find(step => step.id === 'selection');
    assert.equal(selection.run, 'node scripts/test-ci-selection.cjs');
    assert.match(selection.env.BASE_SHA, /merge_group.base_sha/);
    assert.match(selection.env.HEAD_SHA, /merge_group.head_sha/);
    for (const [job, group] of Object.entries({
        'share-link-security': 'brain',
        'profile-search': 'brain',
        'inbox-security': 'brain',
        'boost-recipients': 'brain',
        campaigns: 'campaigns',
        'escrow-integration': 'escrow',
    })) {
        assert.equal(jobs[job].needs, 'deployment-tools');
        assert.equal(
            jobs[job].if,
            `\${{ !cancelled() && (needs.deployment-tools.result != 'success' || needs.deployment-tools.outputs.${group} != 'false') }}`
        );
        for (const step of jobs[job].steps)
            assert.equal(step['continue-on-error'], undefined, 'suite failures stay failures');
    }
    assert.equal(jobs.Test.needs, undefined, 'required unit tests are not delayed or filtered');
    assert.equal(jobs.Test.if, undefined);
    assert.equal(jobs['ai-agent'].if, "github.event_name == 'pull_request'");
    assert.ok(
        jobs['escrow-integration'].steps
            .find(step => step.name === 'Run escrow integration specs')
            .run.includes('test/keys-pin-lease.spec.ts')
    );
    assert.ok(
        jobs.campaigns.steps.some(step => step.run?.includes('deduplicates concurrent campaign'))
    );
});
