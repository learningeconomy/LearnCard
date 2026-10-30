const assert = require('node:assert/strict');
const { spawnSync, spawn } = require('node:child_process');
const {
    mkdtempSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');
const { summarize } = require('./summary.cjs');

const repository = path.resolve(__dirname, '../..');
const vitest = path.join(repository, 'node_modules/vitest/vitest.mjs');
const nx = process.env.LC_TEST_NX_BINARY || path.join(repository, 'node_modules/nx/dist/bin/nx.js');
const fixture = t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'learncard-test-retries-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    mkdirSync(path.join(cwd, 'node_modules'));
    symlinkSync(
        path.join(repository, 'node_modules/vitest'),
        path.join(cwd, 'node_modules/vitest'),
        'dir'
    );
    symlinkSync(path.resolve(path.dirname(nx), '../..'), path.join(cwd, 'node_modules/nx'), 'dir');
    const reports = path.join(cwd, 'reports');
    const put = (file, content) => {
        mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
        writeFileSync(path.join(cwd, file), content);
    };
    const options = (extra = {}) => ({
        cwd,
        encoding: 'utf8',
        timeout: 60_000,
        maxBuffer: 4 * 1024 * 1024,
        env: {
            ...process.env,
            NODE_OPTIONS: '--no-experimental-webstorage',
            CI: 'true',
            NX_DAEMON: 'false',
            NX_TUI: 'false',
            LC_CI_TEST_RETRY: '1',
            LC_CI_TEST_REPORT_DIR: reports,
            ...extra,
        },
    });
    const run = (binary, args, extra = {}) =>
        spawnSync(process.execPath, [binary, ...args], options(extra));
    const runAsync = (binary, args) =>
        new Promise((resolve, reject) => {
            const child = spawn(process.execPath, [binary, ...args], options());
            let output = '';
            child.stdout.on('data', chunk => {
                output += chunk;
            });
            child.stderr.on('data', chunk => {
                output += chunk;
            });
            child.on('error', reject);
            child.on('close', status => resolve({ status, output }));
        });
    const configure = (options = '{}') =>
        put(
            'vitest.config.ts',
            `
import { createVitestConfig, nodePreset } from ${JSON.stringify(path.join(repository, 'vitest.shared.ts'))};
export default createVitestConfig(nodePreset, { test: { include: ['case.test.ts'], ${options.slice(1, -1)} } });
`
        );
    const readReports = () =>
        readdirSync(reports).map(name =>
            JSON.parse(readFileSync(path.join(reports, name, 'report.json'), 'utf8'))
        );
    return { cwd, reports, put, run, runAsync, configure, readReports };
};

test('real Vitest retries only a flaky case and reports its recovery', t => {
    const f = fixture(t);
    f.configure();
    f.put(
        'case.test.ts',
        `
import { test, expect, beforeEach } from 'vitest';
import { appendFileSync } from 'node:fs';
let attempts = 0;
beforeEach(() => appendFileSync('hooks', 'x'));
test('healthy case', () => appendFileSync('healthy', 'x'));
test('flaky | <case>', () => {
 appendFileSync('flaky', 'x');
 expect(++attempts, 'private-error-detail').toBe(2);
});
`
    );
    const result = f.run(vitest, ['run']);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(readFileSync(path.join(f.cwd, 'healthy'), 'utf8'), 'x');
    assert.equal(readFileSync(path.join(f.cwd, 'flaky'), 'utf8'), 'xx');
    assert.equal(readFileSync(path.join(f.cwd, 'hooks'), 'utf8'), 'xxx');
    const [report] = f.readReports();
    assert.deepEqual(report.counts, { passed: 2, failed: 0, skipped: 0, pending: 0, recovered: 1 });
    assert.equal(report.cases[0].retries, 1);
    assert.equal(report.cases[0].name, 'flaky | <case>');
    assert.match(result.stderr, /\[CI flaky\]/);
    assert.doesNotMatch(JSON.stringify(report), /private-error-detail/);
    const summary = summarize(f.reports, 'success').markdown;
    assert.match(summary, /recovered \(flaky\)/);
    assert.match(summary, /flaky \\\| &lt;case&gt;/);
});

test('concurrent Vitest processes keep separate reports and both recoveries', async t => {
    const f = fixture(t);
    f.configure();
    f.put(
        'case.test.ts',
        `import {test, expect} from 'vitest'; let attempts=0;
test('concurrent flaky', () => expect(++attempts).toBe(2));`
    );
    const results = await Promise.all([f.runAsync(vitest, ['run']), f.runAsync(vitest, ['run'])]);
    for (const result of results) assert.equal(result.status, 0, result.output);
    assert.equal(f.readReports().length, 2);
    assert.match(summarize(f.reports, 'success').markdown, /executed Vitest processes: \*\*2\*\*/);
});

test('CI retry opt-in without a report directory fails instead of silently omitting evidence', t => {
    const f = fixture(t);
    f.configure();
    f.put('case.test.ts', `import {test} from 'vitest'; test('healthy', () => {});`);
    const result = f.run(vitest, ['run'], { LC_CI_TEST_REPORT_DIR: '' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /CI test retries require a report directory/);
});

test('local/default execution does not opt into retries or reporting', t => {
    const f = fixture(t);
    f.configure();
    f.put(
        'case.test.ts',
        `import {test} from 'vitest'; import {appendFileSync} from 'node:fs';
test('fails once', () => {appendFileSync('attempts','x'); throw new Error('failed');});`
    );
    const result = f.run(vitest, ['run'], { LC_CI_TEST_RETRY: '', LC_CI_TEST_REPORT_DIR: '' });
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(path.join(f.cwd, 'attempts'), 'utf8'), 'x');
});

test('a permanently failing Vitest case still fails after two attempts', t => {
    const f = fixture(t);
    f.configure();
    f.put(
        'case.test.ts',
        `import {test} from 'vitest'; import {appendFileSync} from 'node:fs';
test('permanent', () => {appendFileSync('attempts','x'); throw new Error('private-error-detail');});`
    );
    const result = f.run(vitest, ['run']);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(readFileSync(path.join(f.cwd, 'attempts'), 'utf8'), 'xx');
    const [report] = f.readReports();
    assert.equal(report.counts.failed, 1);
    assert.equal(report.counts.recovered, 0);
    assert.equal(report.cases[0].retries, 1);
    assert.match(summarize(f.reports, 'failure').markdown, /Nx test step: \*\*failure\*\*/);
});

for (const phase of ['setupFile', 'beforeAll', 'import', 'afterAll']) {
    test(`${phase} failure remains failed and is not retried as a suite`, t => {
        const f = fixture(t);
        const failure = `import {appendFileSync} from 'node:fs';
appendFileSync('attempts','x'); throw new Error('setup failure');`;
        f.configure(phase === 'setupFile' ? "{setupFiles: ['./setup.ts']}" : '{}');
        if (phase === 'setupFile') f.put('setup.ts', failure);
        f.put(
            'case.test.ts',
            phase === 'import'
                ? failure
                : `
import {test, beforeAll, afterAll} from 'vitest'; import {appendFileSync} from 'node:fs';
${phase === 'beforeAll' ? "beforeAll(() => { appendFileSync('attempts','x'); throw new Error('setup failure'); });" : ''}
${phase === 'afterAll' ? "afterAll(() => { appendFileSync('attempts','x'); throw new Error('teardown failure'); });" : ''}
test('must not run', () => appendFileSync('body','x'));
`
        );
        const result = f.run(vitest, ['run']);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.equal(readFileSync(path.join(f.cwd, 'attempts'), 'utf8'), 'x');
        assert.equal(require('node:fs').existsSync(path.join(f.cwd, 'body')), phase === 'afterAll');
        assert.equal(f.readReports()[0].reason, 'failed');
        assert.equal(summarize(f.reports, 'success').incomplete, true);
    });
}

for (const phase of ['build', 'native-test']) {
    test(`real Nx preserves a ${phase} failure and does not rerun its target`, t => {
        const f = fixture(t);
        f.put('package.json', JSON.stringify({ name: 'retry-fixture', private: true }));
        f.put('nx.json', JSON.stringify({ targetDefaults: { test: { dependsOn: ['build'] } } }));
        f.put(
            'project.json',
            JSON.stringify({
                name: 'native',
                root: '.',
                targets: {
                    build: { executor: 'nx:run-commands', options: { command: 'node build.cjs' } },
                    test: { executor: 'nx:run-commands', options: { command: 'node native.cjs' } },
                },
            })
        );
        f.put(
            'build.cjs',
            `require('node:fs').appendFileSync('build-attempts','x'); process.exit(${phase === 'build' ? 7 : 0});`
        );
        f.put(
            'native.cjs',
            "require('node:fs').appendFileSync('native-attempts','x'); process.exit(9);"
        );
        const result = f.run(nx, ['run', 'native:test', '--skip-nx-cache', '--outputStyle=stream']);
        assert.notEqual(result.status, 0, result.stdout + result.stderr);
        assert.ok(
            require('node:fs').existsSync(path.join(f.cwd, 'build-attempts')),
            result.stdout + result.stderr
        );
        assert.equal(readFileSync(path.join(f.cwd, 'build-attempts'), 'utf8'), 'x');
        if (phase === 'native-test') {
            assert.equal(readFileSync(path.join(f.cwd, 'native-attempts'), 'utf8'), 'x');
        } else {
            assert.equal(require('node:fs').existsSync(path.join(f.cwd, 'native-attempts')), false);
        }
        assert.match(summarize(f.reports, 'failure').markdown, /Nx test step: \*\*failure\*\*/);
    });
}

test('incomplete and corrupt reporting cannot claim complete passing coverage', t => {
    const f = fixture(t);
    mkdirSync(path.join(f.reports, 'vitest-interrupted'), { recursive: true });
    assert.equal(summarize(f.reports, 'failure').incomplete, true);
    assert.match(summarize(f.reports, 'failure').markdown, /incomplete reports/);
    f.put('reports/vitest-interrupted/report.json', '{}');
    assert.throws(() => summarize(f.reports, 'success'), /Invalid Vitest retry report/);
});

test('summary CLI fails closed on incomplete reports and preserves a failed Nx outcome', t => {
    const f = fixture(t);
    mkdirSync(path.join(f.reports, 'vitest-interrupted'), { recursive: true });
    const summaryFile = path.join(f.cwd, 'step-summary.md');
    const args = [path.join(__dirname, 'summary.cjs'), []];
    const result = f.run(...args, {
        LC_CI_NX_OUTCOME: 'success',
        GITHUB_STEP_SUMMARY: summaryFile,
    });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(readFileSync(summaryFile, 'utf8'), /incomplete reports/);
    const failed = f.run(...args, {
        LC_CI_NX_OUTCOME: 'failure',
        GITHUB_STEP_SUMMARY: summaryFile,
    });
    assert.equal(failed.status, 0, failed.stdout + failed.stderr);
    assert.match(readFileSync(summaryFile, 'utf8'), /Nx test step: \*\*failure\*\*/);
});

test('both workflow gates run Nx once, stay bounded, and always summarize without swallowing failure', () => {
    for (const [file, job] of [
        ['test.yml', 'Test'],
        ['deploy.yml', 'test-affected'],
    ]) {
        const workflow = yaml.load(
            readFileSync(path.join(repository, '.github/workflows', file), 'utf8')
        );
        const steps = workflow.jobs[job].steps;
        const run = steps.find(step => step.name === 'Run tests');
        const summary = steps.find(step => step.name === 'Summarize test retries');
        assert.equal(run.uses, undefined);
        assert.equal(run['continue-on-error'], undefined);
        assert.equal(run['timeout-minutes'], 20);
        assert.match(run.run, /^bunx nx affected --target=test /);
        assert.equal(run.env.LC_CI_TEST_RETRY, '1');
        assert.equal(summary.if, 'always()');
        assert.equal(summary.env.LC_CI_NX_OUTCOME, '${{ steps.tests.outcome }}');
        assert.equal(summary.env.LC_CI_TEST_REPORT_DIR, run.env.LC_CI_TEST_REPORT_DIR);
    }
});
