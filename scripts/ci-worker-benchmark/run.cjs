#!/usr/bin/env node
'use strict';

const { spawn, execFileSync } = require('node:child_process');
const {
    appendFileSync,
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    writeFileSync,
} = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { summarize } = require('../ci-test-retries/summary.cjs');
const {
    validateGraph,
    validateProfile,
    validateApp,
    validateRetries,
    validateComparable,
} = require('./validate.cjs');
const expectedProjects = require('./expected-projects.json');

const BASE = '1fe2450d45aa1f5e038b7bbb02f61965e72671fc';
const HEAD = '154941805bd8e2aa626afe3582e7794921debd27';
const FALLBACK_SEED = 'a'.repeat(64);
const matrix = [
    { id: 'baseline-1', workers: 3 },
    { id: 'candidate-1', workers: 4 },
    { id: 'candidate-2', workers: 4 },
    { id: 'baseline-2', workers: 3 },
];

const fail = message => {
    throw new Error(message);
};
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const appendSummary = message => appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
const display = seconds => `${seconds.toFixed(2)}s`;

const run = (command, args, env) =>
    new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd: process.cwd(), env, stdio: 'inherit' });
        child.on('error', reject);
        child.on('close', (code, signal) => resolve({ code, signal }));
    });

const memoryUsed = () => {
    try {
        const info = readFileSync('/proc/meminfo', 'utf8');
        const total = Number(info.match(/^MemTotal:\s+(\d+) kB$/m)?.[1]);
        const available = Number(info.match(/^MemAvailable:\s+(\d+) kB$/m)?.[1]);
        return Number.isFinite(total) && Number.isFinite(available)
            ? (total - available) * 1024
            : null;
    } catch {
        return null;
    }
};

const readReports = directory =>
    readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name.startsWith('vitest-'))
        .map(entry => readJson(path.join(directory, entry.name, 'report.json')));

async function main() {
    if (
        process.env.LC_WORKER_BENCHMARK !== '1' ||
        process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
        process.env.GITHUB_ACTIONS !== 'true'
    ) {
        fail('This experiment is restricted to the explicit GitHub Actions manual benchmark.');
    }
    if (process.env.NX_BASE !== BASE || process.env.NX_HEAD !== HEAD)
        fail('Unexpected frozen comparison range.');
    if (!process.env.RUNNER_TEMP || !process.env.GITHUB_STEP_SUMMARY)
        fail('Runner output paths are required.');
    if (process.env.LC_CI_TEST_RETRY !== '1') fail('The CI retry policy must be enabled.');
    if (process.env.VITEST_MAX_WORKERS !== undefined)
        fail('Global Vitest worker overrides are forbidden.');
    if (
        !/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA || '') ||
        git('rev-parse', 'HEAD') !== process.env.GITHUB_SHA
    ) {
        fail('The checkout does not match the dispatched commit.');
    }
    if (git('rev-parse', 'HEAD^') !== HEAD)
        fail('The checkout is not based on the pinned queue revision.');
    const changed = git('diff', '--name-only', `${HEAD}..HEAD`).split('\n').filter(Boolean);
    if (
        !changed.length ||
        changed.some(
            file =>
                file !== '.github/workflows/test.yml' &&
                file !== 'apps/learn-card-app/vitest.config.ts' &&
                !file.startsWith('scripts/ci-worker-benchmark/')
        )
    )
        fail('The benchmark commit includes unexpected source changes.');
    if (git('status', '--porcelain', '--untracked-files=no'))
        fail('Tracked source files are modified before the benchmark.');

    const output = path.join(process.env.RUNNER_TEMP, 'ci-worker-benchmark');
    mkdirSync(output, { recursive: false });
    const working = '.nx-worker-benchmark';
    if (existsSync(working)) fail('Benchmark workspace already exists.');
    mkdirSync(working);
    const resultPath = path.join(output, 'results.json');
    const results = {
        version: 1,
        base: BASE,
        head: HEAD,
        experimentCommit: process.env.GITHUB_SHA,
        node: process.version,
        bun: execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim(),
        platform: process.platform,
        architecture: process.arch,
        cpus: os.availableParallelism(),
        totalMemoryBytes: os.totalmem(),
        runs: [],
    };
    const save = () => writeFileSync(resultPath, `${JSON.stringify(results, null, 2)}\n`);
    save();
    appendSummary(
        '## Nx / app worker benchmark\n\nOne GitHub-hosted runner; 3 Nx task slots; app workers in ABBA order 3 / 4 / 4 / 3. Nx caching is disabled for every iteration.'
    );

    try {
        const graphFile = path.join(working, 'graph.json');
        const graphEnv = { ...process.env, NX_DAEMON: 'false', NX_PARALLEL: '3' };
        const graphRun = await run(
            'bunx',
            [
                'nx',
                'affected',
                '--target=test',
                `--base=${BASE}`,
                `--head=${HEAD}`,
                `--graph=${graphFile}`,
            ],
            graphEnv
        );
        if (graphRun.code !== 0) fail('Could not freeze the affected task graph.');
        const graph = readJson(graphFile);
        const expectedTasks = validateGraph(graph, expectedProjects);
        copyFileSync(graphFile, path.join(output, 'graph.json'));
        results.projectCount = expectedProjects.length;
        results.taskCount = expectedTasks.length;
        save();
        let reference;

        for (const setting of matrix) {
            const runOutput = path.join(output, setting.id);
            const runWorking = path.join(working, setting.id);
            const reports = path.join(runOutput, 'retry-reports');
            mkdirSync(reports, { recursive: true });
            mkdirSync(runWorking, { recursive: true });
            const appReportPath = path.join(runOutput, 'app-coverage.json');
            const profilePath = path.join(runWorking, 'nx-profile.json');
            const env = {
                ...process.env,
                NX_DAEMON: 'false',
                NX_PARALLEL: '3',
                NX_PROFILE: profilePath,
                LC_BENCH_APP_WORKERS: String(setting.workers),
                LC_WORKER_BENCHMARK_REPORT: appReportPath,
                LC_CI_TEST_REPORT_DIR: reports,
                SEED: process.env.SEED || FALLBACK_SEED,
                LEARN_CLOUD_SEED: process.env.LEARN_CLOUD_SEED || FALLBACK_SEED,
            };
            delete env.VITEST_MAX_WORKERS;
            let peakMemoryUsedBytes = memoryUsed();
            const sampler = setInterval(() => {
                const sample = memoryUsed();
                if (
                    sample !== null &&
                    (peakMemoryUsedBytes === null || sample > peakMemoryUsedBytes)
                )
                    peakMemoryUsedBytes = sample;
            }, 1000);
            console.log(`::group::${setting.id}: Nx 3, app ${setting.workers}`);
            const started = performance.now();
            let execution;
            try {
                execution = await run(
                    'bunx',
                    [
                        'nx',
                        'affected',
                        '--target=test',
                        `--base=${BASE}`,
                        `--head=${HEAD}`,
                        '--skip-nx-cache',
                    ],
                    env
                );
            } finally {
                clearInterval(sampler);
                console.log('::endgroup::');
            }
            const elapsedSeconds = (performance.now() - started) / 1000;
            const outcome = execution.code === 0 && !execution.signal ? 'success' : 'failure';
            const retrySummary = summarize(reports, outcome);
            appendSummary(
                `### ${setting.id}: ${display(elapsedSeconds)}\n\n${retrySummary.markdown}`
            );
            if (outcome !== 'success' || retrySummary.incomplete)
                fail(`${setting.id} failed or has incomplete retry reports.`);
            if (git('status', '--porcelain', '--untracked-files=no'))
                fail(`${setting.id} modified tracked source files.`);

            const retryReports = readReports(reports);
            const projectSnapshot = validateRetries(retryReports);
            const app = validateApp(readJson(appReportPath), setting.workers);
            const appRetry = retryReports.filter(
                report => report.project === 'apps/learn-card-app'
            );
            if (
                appRetry.length !== 1 ||
                app.caseCount !==
                    ['passed', 'failed', 'skipped', 'pending'].reduce(
                        (n, key) => n + appRetry[0].counts[key],
                        0
                    )
            ) {
                fail(`${setting.id} app coverage and retry report disagree.`);
            }
            const tasks = validateProfile(readJson(profilePath), expectedTasks);
            copyFileSync(profilePath, path.join(runOutput, 'nx-profile.json'));
            const comparable = { tasks: [...expectedTasks], app, projects: projectSnapshot };
            if (reference) validateComparable(reference, comparable);
            else reference = comparable;
            const appTask = tasks.find(task => task.id === 'learn-card-app:test');
            if (!appTask) fail(`${setting.id} has no app timing.`);
            const result = {
                id: setting.id,
                nxParallel: 3,
                appWorkers: setting.workers,
                elapsedSeconds,
                appTaskDurationMs: appTask.durationMs,
                peakMemoryUsedBytes,
                taskCount: tasks.length,
                appFileCount: app.files.length,
                appCaseCount: app.caseCount,
                appCaseIdentitySha256: app.caseIdentitySha256,
                recovered: retryReports.reduce((n, report) => n + report.counts.recovered, 0),
                tasks,
            };
            results.runs.push(result);
            save();
            console.log(
                `${setting.id}: ${display(elapsedSeconds)}; app target ${display(appTask.durationMs / 1000)}; ${app.files.length} app files, ${app.caseCount} cases.`
            );
        }
        const mean = workers =>
            results.runs
                .filter(run => run.appWorkers === workers)
                .reduce((n, run) => n + run.elapsedSeconds, 0) / 2;
        const baseline = mean(3);
        const candidate = mean(4);
        results.baselineMeanSeconds = baseline;
        results.candidateMeanSeconds = candidate;
        results.differencePercent = (100 * (candidate - baseline)) / baseline;
        results.complete = true;
        save();
        appendSummary(
            `### Comparison\n\n| Setting | Runs | Mean |\n| --- | --- | ---: |\n| Nx 3 / app 3 | ${results.runs
                .filter(r => r.appWorkers === 3)
                .map(r => display(r.elapsedSeconds))
                .join(', ')} | ${display(baseline)} |\n| Nx 3 / app 4 | ${results.runs
                .filter(r => r.appWorkers === 4)
                .map(r => display(r.elapsedSeconds))
                .join(
                    ', '
                )} | ${display(candidate)} |\n\nCandidate difference: **${results.differencePercent.toFixed(2)}%**. Host memory samples include the whole runner and filesystem effects. A single runner and four ordered runs do not establish fleet-wide performance.`
        );
    } catch (error) {
        results.complete = false;
        results.error = String(error.message || error);
        save();
        appendSummary(
            `### Benchmark incomplete\n\nThe comparison failed validation; inspect the job log and artifact. No speedup is claimed.`
        );
        throw error;
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
