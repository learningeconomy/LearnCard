const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve, join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
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
const restore = action.runs.steps.find(step => step.uses === 'actions/cache/restore@v6');
const save = action.runs.steps.find(step => step.uses === 'actions/cache@v6');
const configure = action.runs.steps.find(step => step.name === 'Configure dependency cache');
const runIf = (value, cache, write) =>
    vm.runInNewContext(
        value
            .replace(/^\$\{\{\s*|\s*\}\}$/g, '')
            .replaceAll('inputs.dependency-cache', 'inputs.cache')
            .replaceAll('inputs.save-cache', 'inputs.write'),
        { inputs: { cache, write } }
    );

test('default callers retain the legacy archive and cache-reader/writer behavior', () => {
    assert.equal(action.inputs['dependency-cache'].default, 'true');
    assert.equal(action.inputs['save-cache'].default, 'true');
    assert.deepEqual(restore.with, save.with);
    assert.equal(save.with.path, '~/.bun/install/cache');
    assert.equal(save.with.key, "${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}");
    assert.equal(save.with['restore-keys'].trim(), '${{ runner.os }}-bun-');
    for (const [cache, write, expected] of [
        ['true', 'true', [false, true]],
        ['true', 'false', [true, false]],
        ['false', 'true', [false, false]],
        ['false', 'false', [false, false]],
    ])
        assert.deepEqual([runIf(restore.if, cache, write), runIf(save.if, cache, write)], expected);
});

test('uncached mode uses the runner temporary store and invalid modes fail', t => {
    const dir = mkdtempSync(join(tmpdir(), 'lc-cache-mode-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    for (const [mode, expected] of [
        ['true', 0],
        ['false', 0],
        ['invalid', 1],
    ]) {
        const output = join(dir, 'env');
        writeFileSync(output, '');
        const result = spawnSync('bash', ['-e', '-c', configure.run], {
            encoding: 'utf8',
            env: { ...process.env, DEPENDENCY_CACHE: mode, RUNNER_TEMP: dir, GITHUB_ENV: output },
        });
        assert.equal(result.status, expected, result.stderr);
        assert.equal(
            readFileSync(output, 'utf8'),
            mode === 'false' ? `BUN_INSTALL_CACHE_DIR=${dir}/learncard-bun-cache\n` : ''
        );
    }
});

test('all modes retain a complete frozen install and Bun binary caching', () => {
    assert.equal(
        action.runs.steps.find(step => step.name === 'Install dependencies').run,
        'bun install --frozen-lockfile'
    );
    assert.equal(
        action.runs.steps.find(step => step.uses === 'oven-sh/setup-bun@v2').with['bun-version'],
        '1.4.4'
    );
    assert.equal(
        action.runs.steps.find(step => step.uses === 'oven-sh/setup-bun@v2').if,
        undefined
    );
});

test('production groups opt out while the benchmark compares both modes twice at one revision', () => {
    const inputs = (helper.on ?? helper.true).workflow_call.inputs;
    assert.equal(inputs.dependency_cache.type, 'boolean');
    assert.equal(inputs.dependency_cache.default, false);
    assert.equal(
        helper.jobs.integration.steps.find(step => step.name === 'Setup workspace').with[
            'dependency-cache'
        ],
        '${{ inputs.dependency_cache }}'
    );
    assert.deepEqual(Object.keys(benchmark.jobs), ['first', 'repeat']);
    assert.match(benchmark.jobs.first.if, /benchmark-integration-cache/);
    assert.equal(benchmark.jobs.repeat.needs, 'first');
    for (const job of Object.values(benchmark.jobs)) {
        assert.deepEqual(job.strategy.matrix.group, ['graph', 'delivery']);
        assert.deepEqual(job.strategy.matrix.cache, [true, false]);
        assert.equal(job.strategy['fail-fast'], false);
        assert.equal(job.uses, './.github/workflows/brain-integration.yml');
        assert.equal(job.with.ref, '${{ github.event.pull_request.head.sha || github.sha }}');
        assert.equal(job.with.dependency_cache, '${{ matrix.cache }}');
    }
});
