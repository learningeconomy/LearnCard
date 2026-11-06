const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve, join } = require('node:path');
const { test } = require('node:test');
const yaml = path =>
    JSON.parse(
        execFileSync(
            'ruby',
            [
                '-rjson',
                '-ryaml',
                '-e',
                'puts JSON.generate(YAML.load_file(ARGV[0], aliases: true))',
                resolve(__dirname, '..', path),
            ],
            { encoding: 'utf8' }
        )
    );
const action = yaml('actions/setup/action.yml');
const helper = yaml('workflows/brain-integration.yml');
const benchmark = yaml('workflows/integration-cache-benchmark.yml');
const cache = action.runs.steps.find(step => step.id === 'cache');
const install = action.runs.steps.find(step => step.name === 'Install dependencies');

const choose = (t, profile, suffix = '') => {
    const dir = mkdtempSync(join(tmpdir(), 'lc-bun-cache-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const output = join(dir, 'output');
    writeFileSync(output, '');
    const result = spawnSync('bash', ['-e', '-c', cache.run], {
        encoding: 'utf8',
        env: {
            ...process.env,
            PROFILE: profile,
            CACHE_SUFFIX: suffix,
            FULL_KEY: 'Linux-bun-lock',
            SERVICE_KEY: 'Linux-X64-bun-1.4.4-brain-v1-inputs',
            RUNNER_OS: 'Linux',
            RUNNER_TEMP: dir,
            GITHUB_OUTPUT: output,
        },
    });
    return {
        ...result,
        dir,
        outputs: Object.fromEntries(
            readFileSync(output, 'utf8')
                .trim()
                .split('\n')
                .filter(Boolean)
                .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
        ),
    };
};

test('default workspace behavior retains the existing cache key and restore fallback', t => {
    assert.equal(action.inputs['dependency-profile'].default, 'workspace');
    const result = choose(t, 'workspace');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.outputs.key, 'Linux-bun-lock');
    assert.equal(result.outputs.path, `${process.env.HOME}/.bun/install/cache`);
    assert.equal(result.outputs['restore-key'], 'Linux-bun-');
});

test('scoped cache is isolated from full workspace and old dependency graphs', t => {
    const normal = choose(t, 'brain-integration');
    const cold = choose(t, 'brain-integration', 'benchmark-123');
    assert.equal(normal.status, 0, normal.stderr);
    assert.equal(cold.status, 0, cold.stderr);
    assert.equal(normal.outputs.path, join(normal.dir, 'learncard-brain-bun-cache'));
    assert.equal(normal.outputs['restore-key'], '');
    assert.notEqual(normal.outputs.key, cold.outputs.key);
    assert.equal(cold.outputs.key, `${normal.outputs.key}benchmark-123`);
    for (const input of [
        'runner.os',
        'runner.arch',
        '1.4.4',
        'bun.lock',
        'bunfig.toml',
        '.nvmrc',
        '**/package.json',
        '.github/actions/setup/action.yml',
    ])
        assert.ok(cache.env.SERVICE_KEY.includes(input), input);
    for (const step of action.runs.steps.filter(step => step.uses?.startsWith('actions/cache'))) {
        assert.equal(step.with.path, '${{ steps.cache.outputs.path }}');
        assert.equal(step.with.key, '${{ steps.cache.outputs.key }}');
        assert.equal(step.with['restore-keys'], '${{ steps.cache.outputs.restore-key }}');
    }
    assert.equal(choose(t, 'unknown').status, 1);
    assert.equal(choose(t, 'brain-integration', 'bad\nkey').status, 1);
});

test('both profiles retain the identical full frozen install', t => {
    const dir = mkdtempSync(join(tmpdir(), 'lc-bun-install-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    writeFileSync(
        join(dir, 'bun'),
        '#!/bin/bash\nprintf "%s\\n" "$@" > "$ARGS_FILE"\nprintf "%s" "$BUN_INSTALL_CACHE_DIR" > "$CACHE_FILE"\n',
        { mode: 0o755 }
    );
    for (const profile of ['workspace', 'brain-integration']) {
        const result = spawnSync('bash', ['-e', '-c', install.run], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PROFILE: profile,
                PATH: `${dir}:${process.env.PATH}`,
                ARGS_FILE: join(dir, 'args'),
                CACHE_FILE: join(dir, 'cache'),
                BUN_INSTALL_CACHE_DIR: dir,
            },
        });
        assert.equal(result.status, 0, result.stderr);
        const args = readFileSync(join(dir, 'args'), 'utf8').trim().split('\n');
        assert.deepEqual(args, ['install', '--frozen-lockfile']);
        assert.equal(readFileSync(join(dir, 'cache'), 'utf8'), dir);
    }
});

test('production groups opt in; benchmark forces a cold cache then compares identical warm suites twice', () => {
    assert.equal(
        (helper.on ?? helper.true).workflow_call.inputs.dependency_profile.default,
        'brain-integration'
    );
    const setup = helper.jobs.integration.steps.find(step => step.name === 'Setup workspace');
    assert.equal(setup.with['dependency-profile'], '${{ inputs.dependency_profile }}');
    assert.equal(setup.with['cache-suffix'], '${{ inputs.cache_suffix }}');
    assert.match(benchmark.jobs.cold.if, /benchmark-integration-cache/);
    assert.deepEqual(benchmark.jobs.cold.strategy.matrix.group, ['graph', 'delivery']);
    assert.equal(benchmark.jobs.cold.with.cache_suffix, 'benchmark-${{ github.run_id }}');
    for (const [name, previous] of [
        ['warm-first', 'cold'],
        ['warm-repeat', 'warm-first'],
    ]) {
        const job = benchmark.jobs[name];
        assert.equal(job.needs, previous);
        assert.deepEqual(job.strategy.matrix.profile, ['workspace', 'brain-integration']);
        assert.deepEqual(job.strategy.matrix.group, ['graph', 'delivery']);
        assert.equal(job.with.dependency_profile, '${{ matrix.profile }}');
        assert.equal(
            job.with.cache_suffix,
            "${{ matrix.profile == 'brain-integration' && format('benchmark-{0}', github.run_id) || '' }}"
        );
    }
    for (const job of Object.values(benchmark.jobs)) {
        assert.equal(job.uses, './.github/workflows/brain-integration.yml');
        assert.equal(job.with.ref, '${{ github.event.pull_request.head.sha || github.sha }}');
        assert.equal(job.strategy['fail-fast'], false);
    }
});
