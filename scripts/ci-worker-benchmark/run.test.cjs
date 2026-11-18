'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'run.cjs');
const BASE = '1fe2450d45aa1f5e038b7bbb02f61965e72671fc';
const HEAD = '154941805bd8e2aa626afe3582e7794921debd27';
const COMMIT = 'f'.repeat(40);

const fixture = scenario => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-worker-benchmark-test-'));
    const bin = path.join(directory, 'bin');
    const tmp = path.join(directory, 'runner-temp');
    fs.mkdirSync(bin);
    fs.mkdirSync(tmp);
    const git = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'rev-parse') console.log(args[1] === 'HEAD^' ? process.env.NX_HEAD : process.env.GITHUB_SHA);
else if (args[0] === 'diff') console.log(process.env.FIXTURE_CHANGED_FILE || 'apps/learn-card-app/vitest.config.ts');
else if (args[0] !== 'status') process.exit(1);
`;
    const bunx = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const projects = require(process.env.FIXTURE_PROJECTS);
const tasks = Object.fromEntries(projects.map(project => [project + ':test', { target: { project, target: 'test' } }]));
tasks['core:build'] = { target: { project: 'core', target: 'build' } };
const graph = process.argv.find(arg => arg.startsWith('--graph='));
if (graph) {
  fs.writeFileSync(graph.slice('--graph='.length), JSON.stringify({ tasks: { tasks } }));
  process.exit(0);
}
const workers = process.env.LC_BENCH_APP_WORKERS;
fs.appendFileSync(process.env.FIXTURE_INVOCATIONS, workers + '\\n');
if (process.env.FIXTURE_SCENARIO === 'failure' && workers === '4') process.exit(1);
const profile = Object.entries(tasks).map(([name, task]) => ({ name, ph: 'X', dur: 1000, args: { target: task.target, status: 'success' } }));
fs.writeFileSync(process.env.NX_PROFILE, JSON.stringify(profile));
const hash = process.env.FIXTURE_SCENARIO === 'drift' && workers === '4' ? 'b' : 'a';
fs.writeFileSync(process.env.LC_WORKER_BENCHMARK_REPORT, JSON.stringify({ version: 1, reason: 'passed', unhandledErrors: 0, maxWorkers: Number(workers), files: ['src/a.test.ts'], caseCount: 1, caseIdentitySha256: hash.repeat(64) }));
const directory = path.join(process.env.LC_CI_TEST_REPORT_DIR, 'vitest-fixture');
fs.mkdirSync(directory);
fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify({ schemaVersion: 1, project: 'apps/learn-card-app', reason: 'passed', counts: { passed: 1, failed: 0, skipped: 0, pending: 0, recovered: 0 }, failedModules: 0, unhandledErrors: 0, cases: [] }));
`;
    fs.writeFileSync(path.join(bin, 'git'), git, { mode: 0o755 });
    fs.writeFileSync(path.join(bin, 'bunx'), bunx, { mode: 0o755 });
    const env = {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        LC_WORKER_BENCHMARK: '1',
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_ACTIONS: 'true',
        NX_BASE: BASE,
        NX_HEAD: HEAD,
        GITHUB_SHA: COMMIT,
        LC_CI_TEST_RETRY: '1',
        RUNNER_TEMP: tmp,
        GITHUB_STEP_SUMMARY: path.join(directory, 'summary.md'),
        FIXTURE_PROJECTS: path.join(__dirname, 'expected-projects.json'),
        FIXTURE_INVOCATIONS: path.join(directory, 'invocations'),
        FIXTURE_SCENARIO: scenario,
    };
    delete env.VITEST_MAX_WORKERS;
    return { directory, env };
};

test('runs all settings serially and requires comparable coverage', t => {
    const f = fixture('success');
    t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
    const result = spawnSync(process.execPath, [SCRIPT], {
        cwd: f.directory,
        env: f.env,
        encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(f.env.FIXTURE_INVOCATIONS, 'utf8'), '3\n4\n4\n3\n');
    const report = JSON.parse(
        fs.readFileSync(path.join(f.env.RUNNER_TEMP, 'ci-worker-benchmark/results.json'))
    );
    assert.equal(report.complete, true);
    assert.equal(report.runs.length, 4);
    assert.equal(report.projectCount, 59);
});

test('fails closed when app test identities change or a run fails', t => {
    for (const scenario of ['drift', 'failure']) {
        const f = fixture(scenario);
        t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
        const result = spawnSync(process.execPath, [SCRIPT], {
            cwd: f.directory,
            env: f.env,
            encoding: 'utf8',
        });
        assert.notEqual(result.status, 0, scenario);
        const report = JSON.parse(
            fs.readFileSync(path.join(f.env.RUNNER_TEMP, 'ci-worker-benchmark/results.json'))
        );
        assert.equal(report.complete, false);
        assert.equal(report.runs.length, 1);
    }
});

test('rejects global Vitest worker overrides before starting any Nx work', t => {
    const f = fixture('success');
    t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
    f.env.VITEST_MAX_WORKERS = '4';
    const result = spawnSync(process.execPath, [SCRIPT], {
        cwd: f.directory,
        env: f.env,
        encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Global Vitest worker overrides are forbidden/);
    assert.equal(fs.existsSync(f.env.FIXTURE_INVOCATIONS), false);
});

test('requires the exact frozen range and a benchmark-only commit', t => {
    for (const [key, value, message] of [
        ['NX_HEAD', '0'.repeat(40), /Unexpected frozen comparison range/],
        ['GITHUB_EVENT_NAME', 'merge_group', /restricted to the explicit/],
        [
            'FIXTURE_CHANGED_FILE',
            'packages/learn-card-base/src/index.ts',
            /unexpected source changes/,
        ],
    ]) {
        const f = fixture('success');
        t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
        f.env[key] = value;
        const result = spawnSync(process.execPath, [SCRIPT], {
            cwd: f.directory,
            env: f.env,
            encoding: 'utf8',
        });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, message);
        assert.equal(fs.existsSync(f.env.FIXTURE_INVOCATIONS), false);
    }
});
