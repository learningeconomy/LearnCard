const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');

const read = name =>
    JSON.parse(
        execFileSync(
            'ruby',
            [
                '-rjson',
                '-ryaml',
                '-e',
                'puts JSON.generate(YAML.load_file(ARGV[0], aliases: true))',
                resolve(__dirname, `../workflows/${name}.yml`),
            ],
            { encoding: 'utf8' }
        )
    );
const workflow = read('brain-integration');
const main = read('test');
const benchmark = read('integration-benchmark');
const job = workflow.jobs.integration;
const suites = job.steps.filter(step => step.name.startsWith('Run '));
const expression = (value, context) =>
    vm.runInNewContext(
        value
            .replace(/^\$\{\{\s*|\s*\}\}$/g, '')
            .replaceAll('needs.integration-selection', 'needs.selection'),
        {
            cancelled: () => false,
            contains: (values, value) => values.includes(value),
            fromJSON: JSON.parse,
            ...context,
        }
    );
const selected = (group, overrides = {}) =>
    suites
        .filter(step =>
            expression(step.if, {
                inputs: {
                    group,
                    build_once: true,
                    run_brain: true,
                    run_campaigns: true,
                    ...overrides,
                },
                steps: {
                    setup: { outcome: 'success' },
                    docker: { outcome: 'success' },
                    builds: { outcome: 'success' },
                },
            })
        )
        .map(step => step.name);
const graph = ['Run share-link security', 'Run profile search', 'Run boost recipients'];
const delivery = ['Run inbox security', 'Run campaign permissions', 'Run campaign notifications'];

test('the two production groups cover every original suite once with one setup each', () => {
    assert.deepEqual(selected('graph'), graph);
    assert.deepEqual(selected('delivery'), delivery);
    assert.equal(Object.keys(workflow.jobs).length, 1);
    assert.equal(job.steps.filter(step => step.uses === './.github/actions/setup').length, 1);
    assert.equal(job['runs-on'], 'ubuntu-latest');
    assert.equal(job['timeout-minutes'], 20);
    assert.equal(job.env.TESTCONTAINERS_REUSE_ENABLE, 'false');
    assert.equal(
        job.steps.find(step => step.uses === 'actions/checkout@v7').with.ref,
        '${{ inputs.ref }}'
    );
    assert.deepEqual(
        suites.map(step => [step.run, step['working-directory']]),
        [
            [
                'bunx vitest run --config vitest.share-links-neo4j.config.ts',
                'services/learn-card-network/brain-service',
            ],
            [
                "bunx nx run network-brain-service:test:profile-search ${{ inputs.build_once && inputs.group == 'graph' && '--excludeTaskDependencies' || '' }}",
                undefined,
            ],
            [
                "bunx nx run network-brain-service:test:boost-recipients ${{ inputs.build_once && inputs.group == 'graph' && '--excludeTaskDependencies' || '' }}",
                undefined,
            ],
            ['bunx nx run network-brain-service:test:inbox:e2e', undefined],
            ['bunx nx run network-brain-service:test:campaigns', undefined],
            [
                "bunx vitest run --config vitest.integration.config.ts test/notifications.spec.ts -t 'deduplicates concurrent campaign'",
                'services/learn-card-network/lca-api',
            ],
        ]
    );
});

test('campaign-only changes do not run inbox and brain-only changes do not run campaign steps', () => {
    assert.deepEqual(selected('delivery', { run_brain: false }), delivery.slice(1));
    assert.deepEqual(selected('delivery', { run_campaigns: false }), [delivery[0]]);
    assert.deepEqual(selected('delivery', { run_brain: false, run_campaigns: false }), []);
});

test('later suites run after a test failure but setup failures and cancellation stop them', () => {
    for (const step of suites) {
        assert.equal(step['continue-on-error'], undefined, 'a suite failure must fail its group');
        assert.match(
            step.if,
            /!cancelled\(\)/,
            'explicit status function overrides implicit success()'
        );
        const context = {
            inputs: {
                group: graph.includes(step.name) ? 'graph' : 'delivery',
                build_once: true,
                run_brain: true,
                run_campaigns: true,
            },
            steps: {
                setup: { outcome: 'success' },
                docker: { outcome: 'success' },
                builds: { outcome: 'success' },
            },
            success: () => false,
            failure: () => true,
        };
        assert.equal(expression(step.if, context), true);
        assert.equal(expression(step.if, { ...context, cancelled: () => true }), false);
        for (const failed of ['setup', 'docker']) {
            const next = structuredClone(context.steps);
            next[failed].outcome = 'failure';
            assert.equal(expression(step.if, { ...context, steps: next }), false);
        }
    }
});

test('actual group validation rejects unknown and empty selections before setup', () => {
    const script = job.steps[0].run;
    for (const [group, brain, campaigns, expected] of [
        ['graph', true, false, 0],
        ['delivery', false, true, 0],
        ['delivery', true, false, 0],
        ['share-links', true, false, 0],
        ['campaigns', false, true, 0],
        ['graph', false, true, 1],
        ['delivery', false, false, 1],
        ['unknown', true, true, 1],
    ]) {
        const result = spawnSync('bash', ['-e', '-c', script], {
            env: {
                ...process.env,
                GROUP: group,
                RUN_BRAIN: String(brain),
                RUN_CAMPAIGNS: String(campaigns),
            },
        });
        assert.equal(result.status, expected, `${group}/${brain}/${campaigns}`);
    }
});

test('caller gates preserve selection and run on uncertain outputs without waiting for unit tests', () => {
    const a = main.jobs['brain-graph'];
    const b = main.jobs['brain-delivery'];
    for (const caller of [a, b]) {
        assert.equal(caller.needs, 'integration-selection');
        assert.equal(caller.uses, './.github/workflows/brain-integration.yml');
        assert.match(caller.with.ref, /pull_request.head.sha.*merge_group.head_sha.*inputs.branch/);
    }
    for (const [brain, campaigns, result, expected] of [
        ['false', 'false', 'success', [false, false]],
        ['false', 'true', 'success', [false, true]],
        ['true', 'false', 'success', [true, true]],
        [undefined, undefined, 'success', [true, true]],
        ['false', 'false', 'failure', [true, true]],
    ]) {
        const context = { needs: { selection: { result, outputs: { brain, campaigns } } } };
        assert.deepEqual([expression(a.if, context), expression(b.if, context)], expected);
        assert.equal(expression(b.with.run_brain, context), expected[0]);
    }
    assert.equal(main.jobs.Test.needs, undefined);
});

test('benchmark is opt-in and compares identical commands at one head in ABBA order', () => {
    const phases = Object.entries(benchmark.jobs);
    assert.deepEqual(
        phases.map(([name]) => name),
        ['separate-before', 'grouped-first', 'grouped-repeat', 'separate-after']
    );
    assert.match(phases[0][1].if, /benchmark-integrations/);
    assert.deepEqual((benchmark.on ?? benchmark.true).pull_request.types, ['labeled']);
    for (let i = 0; i < phases.length; i++) {
        const [, phase] = phases[i];
        assert.equal(phase.needs, i ? phases[i - 1][0] : undefined);
        assert.equal(phase.uses, './.github/workflows/brain-integration.yml');
        assert.equal(phase.with.ref, '${{ github.event.pull_request.head.sha || github.sha }}');
        assert.equal(phase.strategy['fail-fast'], false);
        const names = phase.strategy.matrix.group.flatMap(group => selected(group));
        assert.deepEqual(
            names.sort(),
            [...graph, ...delivery].sort(),
            'same six commands in every phase'
        );
        assert.equal(phase.strategy.matrix.group.length, i === 0 || i === 3 ? 5 : 2);
    }
});

test('only graph groups build once, and dependent suites cannot bypass a failed build', () => {
    const builds = job.steps.find(step => step.id === 'builds');
    const inputs = { group: 'graph', build_once: true, run_brain: true, run_campaigns: true };
    const steps = {
        setup: { outcome: 'success' },
        docker: { outcome: 'success' },
        builds: { outcome: 'failure' },
    };
    assert.equal(
        workflow.on?.workflow_call?.inputs.build_once.default ??
            workflow.true.workflow_call.inputs.build_once.default,
        true
    );
    assert.equal(expression(builds.if, { inputs, steps, success: () => false }), true);
    for (const override of [
        { group: 'delivery' },
        { group: 'profile-search' },
        { build_once: false },
        { run_brain: false },
    ]) {
        assert.equal(expression(builds.if, { inputs: { ...inputs, ...override }, steps }), false);
    }
    for (const outcome of ['failure', 'cancelled', 'skipped']) {
        steps.builds.outcome = outcome;
        for (const step of suites.filter(s =>
            ['Run profile search', 'Run boost recipients'].includes(s.name)
        )) {
            assert.equal(expression(step.if, { inputs, steps }), false);
            assert.equal(
                expression(step.if, { inputs: { ...inputs, build_once: false }, steps }),
                true
            );
        }
    }
    const targets = JSON.parse(
        readFileSync(
            resolve(__dirname, '../../services/learn-card-network/brain-service/project.json')
        )
    ).targets;
    const build = targets['build:integration-dependencies'];
    assert.equal(build.executor, 'nx:noop');
    assert.equal(build.cache, false);
    for (const name of ['test:profile-search', 'test:boost-recipients']) {
        assert.deepEqual(
            targets[name].dependsOn,
            build.dependsOn,
            'shared phase must cover every skipped prerequisite'
        );
        assert.equal(targets[name].cache, false, 'tests always execute');
    }
});

test('build benchmark isolates build-once with the same two groups in ABBA order', () => {
    const benchmark = read('integration-build-benchmark');
    const phases = Object.entries(benchmark.jobs);
    assert.deepEqual(
        phases.map(([id]) => id),
        ['repeated-before', 'once-first', 'once-repeat', 'repeated-after']
    );
    assert.match(phases[0][1].if, /benchmark-integration-builds/);
    assert.deepEqual((benchmark.on ?? benchmark.true).pull_request.types, ['labeled']);
    for (let i = 0; i < phases.length; i++) {
        const phase = phases[i][1];
        assert.equal(phase.needs, i ? phases[i - 1][0] : undefined);
        assert.equal(phase.uses, './.github/workflows/brain-integration.yml');
        assert.equal(phase.with.ref, '${{ github.event.pull_request.head.sha || github.sha }}');
        assert.equal(phase.with.build_once, i === 1 || i === 2);
        assert.deepEqual(phase.strategy.matrix.group, ['graph', 'delivery']);
    }
});

test('native Nx builds transitive prerequisites once and still executes both uncached suites', t => {
    const { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } = require('node:fs');
    const { tmpdir } = require('node:os');
    const cwd = mkdtempSync(resolve(tmpdir(), 'learncard-integration-build-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const put = (name, value) => writeFileSync(resolve(cwd, name), JSON.stringify(value));
    symlinkSync(
        resolve(require.resolve('nx/package.json'), '../..'),
        resolve(cwd, 'node_modules'),
        'dir'
    );
    put('package.json', { private: true });
    put('nx.json', { targetDefaults: { build: { cache: false, dependsOn: ['^build'] } } });
    writeFileSync(
        resolve(cwd, 'observe.cjs'),
        `
        const fs = require('node:fs');
        const id = process.argv[2];
        const prior = fs.existsSync('executed.json') ? JSON.parse(fs.readFileSync('executed.json')) : [];
        if (id === 'middle' && !prior.includes('leaf')) process.exit(2);
        if (id.startsWith('test:') && !prior.includes('middle')) process.exit(3);
        prior.push(id);
        fs.writeFileSync('executed.json', JSON.stringify(prior));
    `
    );
    const command = id => ({
        executor: 'nx:run-commands',
        cache: false,
        options: { command: `node observe.cjs ${id}` },
    });
    for (const [name, dependencies] of [
        ['leaf', []],
        ['middle', ['leaf']],
    ]) {
        mkdirSync(resolve(cwd, name));
        put(`${name}/project.json`, {
            name,
            implicitDependencies: dependencies,
            targets: { build: command(name) },
        });
    }
    const actual = JSON.parse(
        readFileSync(
            resolve(__dirname, '../../services/learn-card-network/brain-service/project.json')
        )
    ).targets;
    const targets = { 'build:integration-dependencies': actual['build:integration-dependencies'] };
    const names = ['test:profile-search', 'test:boost-recipients'];
    for (const name of names)
        targets[name] = { ...command(name), dependsOn: actual[name].dependsOn };
    mkdirSync(resolve(cwd, 'brain'));
    put('brain/project.json', {
        name: 'network-brain-service',
        implicitDependencies: ['middle'],
        targets,
    });
    const run = (target, ...args) =>
        execFileSync(
            process.execPath,
            [require.resolve('nx/bin/nx'), 'run', `network-brain-service:${target}`, ...args],
            {
                cwd,
                encoding: 'utf8',
                timeout: 60_000,
                env: {
                    ...process.env,
                    NX_DAEMON: 'false',
                    NX_ISOLATE_PLUGINS: 'false',
                    NX_NO_CLOUD: 'true',
                    NX_TUI: 'false',
                },
            }
        );
    run('build:integration-dependencies');
    for (const target of names) run(target, '--excludeTaskDependencies');
    assert.deepEqual(JSON.parse(readFileSync(resolve(cwd, 'executed.json'))), [
        'leaf',
        'middle',
        ...names,
    ]);
    // Ordinary standalone execution must retain the same dependency builds.
    run(names[1]);
    assert.deepEqual(JSON.parse(readFileSync(resolve(cwd, 'executed.json'))), [
        'leaf',
        'middle',
        ...names,
        'leaf',
        'middle',
        names[1],
    ]);
});
