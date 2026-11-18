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
    if (args[0] === 'rev-parse') console.log(process.env.GITHUB_SHA);
else if (args[0] === 'merge-base') { if (process.env.FIXTURE_SCENARIO === 'unrelated') process.exit(1); }
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
if (process.env.CARGO_NET_OFFLINE !== 'true') process.exit(1);
for (const project of ['escrow-enclave-app', 'escrow-enclave-host', 'escrow-ledger-monitor']) {
  const target = path.join(process.cwd(), 'services', project, 'target');
  if (fs.existsSync(target)) throw new Error('Cargo cache was not cleaned');
  fs.mkdirSync(target);
}
if (process.env.FIXTURE_SCENARIO === 'failure' && workers === '4') process.exit(1);
const profile = Object.entries(tasks).map(([name, task]) => ({ name, ph: 'X', dur: 1000, args: { target: task.target, status: 'success' } }));
fs.writeFileSync(process.env.NX_PROFILE, JSON.stringify(profile));
const hash = process.env.FIXTURE_SCENARIO === 'drift' && workers === '4' ? 'b' : 'a';
fs.writeFileSync(process.env.LC_WORKER_BENCHMARK_REPORT, JSON.stringify({ version: 1, reason: 'passed', unhandledErrors: 0, maxWorkers: Number(workers), files: ['src/a.test.ts'], caseCount: 1, caseIdentitySha256: hash.repeat(64) }));
const directory = path.join(process.env.LC_CI_TEST_REPORT_DIR, 'vitest-fixture');
fs.mkdirSync(directory);
fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify({ schemaVersion: 1, project: 'apps/learn-card-app', reason: 'passed', counts: { passed: 1, failed: 0, skipped: 0, pending: 0, recovered: 0 }, failedModules: 0, unhandledErrors: 0, cases: [] }));
`;
    const cargo = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const root = process.cwd();
const target = path.join(root, 'target');
const project = path.basename(root);
if (args[0] === 'metadata') {
  const selected = process.env.FIXTURE_SCENARIO === 'redirect' && project === 'escrow-enclave-host' ? root : target;
  console.log(JSON.stringify({workspace_root: root, target_directory: selected}));
} else if (args[0] === 'test' && args.includes('--no-run') && args.includes('--locked')) {
  fs.appendFileSync(process.env.FIXTURE_CARGO, 'preload:' + project + '\\n');
  if (process.env.FIXTURE_SCENARIO === 'symlink' && project === 'escrow-ledger-monitor') {
    fs.symlinkSync(path.join(root, 'missing-target'), target);
  } else fs.mkdirSync(target, { recursive: true });
} else if (args[0] === 'clean') {
  fs.appendFileSync(process.env.FIXTURE_CARGO, 'clean:' + project + '\\n');
  fs.rmSync(target, { recursive: true, force: true });
} else process.exit(1);
`;
    for (const project of ['escrow-enclave-app', 'escrow-enclave-host', 'escrow-ledger-monitor']) {
        fs.mkdirSync(path.join(directory, 'services', project), { recursive: true });
    }
    fs.writeFileSync(path.join(bin, 'git'), git, { mode: 0o755 });
    fs.writeFileSync(path.join(bin, 'bunx'), bunx, { mode: 0o755 });
    fs.writeFileSync(path.join(bin, 'cargo'), cargo, { mode: 0o755 });
    const env = {
        ...process.env,
        HOME: directory,
        CARGO_HOME: path.join(directory, '.cargo'),
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        LC_WORKER_BENCHMARK: '1',
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_ACTIONS: 'true',
        GITHUB_WORKSPACE: directory,
        NX_BASE: BASE,
        NX_HEAD: HEAD,
        GITHUB_SHA: COMMIT,
        LC_CI_TEST_RETRY: '1',
        RUNNER_TEMP: tmp,
        GITHUB_STEP_SUMMARY: path.join(directory, 'summary.md'),
        FIXTURE_PROJECTS: path.join(__dirname, 'expected-projects.json'),
        FIXTURE_INVOCATIONS: path.join(directory, 'invocations'),
        FIXTURE_CARGO: path.join(directory, 'cargo-invocations'),
        FIXTURE_SCENARIO: scenario,
    };
    delete env.VITEST_MAX_WORKERS;
    for (const name of [
        'CARGO_TARGET_DIR',
        'CARGO_BUILD_TARGET_DIR',
        'CARGO_BUILD_BUILD_DIR',
        'RUSTC_WRAPPER',
        'RUSTC_WORKSPACE_WRAPPER',
        'CARGO_BUILD_RUSTC_WRAPPER',
        'CARGO_BUILD_RUSTC_WORKSPACE_WRAPPER',
        'BUILD_DIDKIT_NAPI',
        'RUSTFLAGS',
        'CARGO_ENCODED_RUSTFLAGS',
        'CARGO_BUILD_RUSTFLAGS',
    ])
        delete env[name];
    for (const name of Object.keys(env)) {
        if (/^CARGO_TARGET_.+_RUSTFLAGS$/.test(name)) delete env[name];
    }
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
    assert.equal(report.cargo.mode, 'cold-target-warm-registry');
    assert.equal(
        report.runs.every(run => run.cargoMode === 'cold-target-warm-registry'),
        true
    );
    const cargoCalls = fs.readFileSync(f.env.FIXTURE_CARGO, 'utf8').trim().split('\n');
    assert.equal(cargoCalls.filter(call => call.startsWith('preload:')).length, 3);
    assert.equal(cargoCalls.filter(call => call.startsWith('clean:')).length, 12);
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

test('refuses redirected Cargo paths and compiler caches before cleaning', t => {
    for (const scenario of [
        'redirect',
        'wrapper',
        'target_env',
        'build_dir',
        'didkit',
        'config_incremental',
        'target_rustflags',
    ]) {
        const f = fixture(scenario);
        t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
        if (scenario === 'wrapper') f.env.RUSTC_WRAPPER = '/tmp/sccache';
        if (scenario === 'target_env') f.env.CARGO_TARGET_DIR = '/tmp/unrelated';
        if (scenario === 'build_dir') f.env.CARGO_BUILD_BUILD_DIR = '/tmp/unrelated';
        if (scenario === 'didkit') f.env.BUILD_DIDKIT_NAPI = '1';
        if (scenario === 'target_rustflags')
            f.env.CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_RUSTFLAGS = '-C incremental=/tmp/shared';
        if (scenario === 'config_incremental') {
            fs.mkdirSync(f.env.CARGO_HOME);
            fs.writeFileSync(
                path.join(f.env.CARGO_HOME, 'config.toml'),
                '[build]\nrustflags = ["-C", "incremental=/tmp/shared"]\n'
            );
        }
        const result = spawnSync(process.execPath, [SCRIPT], {
            cwd: f.directory,
            env: f.env,
            encoding: 'utf8',
        });
        assert.notEqual(result.status, 0, scenario);
        assert.match(
            result.stderr,
            /Cargo (target|cache control|configuration)|External Rust incremental/i
        );
        assert.equal(fs.existsSync(f.env.FIXTURE_CARGO), false);
        assert.equal(fs.existsSync(f.env.FIXTURE_INVOCATIONS), false);
    }
});

test('does not clean outside the explicit GitHub workspace or follow a target symlink', t => {
    for (const scenario of ['wrong_workspace', 'symlink']) {
        const f = fixture(scenario);
        t.after(() => fs.rmSync(f.directory, { recursive: true, force: true }));
        if (scenario === 'wrong_workspace') f.env.GITHUB_WORKSPACE = os.tmpdir();
        const result = spawnSync(process.execPath, [SCRIPT], {
            cwd: f.directory,
            env: f.env,
            encoding: 'utf8',
        });
        assert.notEqual(result.status, 0, scenario);
        assert.match(result.stderr, /Cargo (cleanup|target directory)/i);
        assert.doesNotMatch(fs.readFileSync(f.env.FIXTURE_CARGO, 'utf8'), /clean:/);
        assert.equal(fs.existsSync(f.env.FIXTURE_INVOCATIONS), false);
    }
});

test('requires the exact frozen range and a benchmark-only commit', t => {
    for (const [key, value, message] of [
        ['NX_HEAD', '0'.repeat(40), /Unexpected frozen comparison range/],
        ['GITHUB_EVENT_NAME', 'merge_group', /restricted to the explicit/],
        ['FIXTURE_SCENARIO', 'unrelated', /not based on the pinned/],
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
