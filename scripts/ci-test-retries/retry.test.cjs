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

for (const directory of ['services/learn-card-network/ai-agent', 'examples/credential-viewer']) {
    test(`standalone Vite config ${directory} participates in real CI retries`, t => {
        const f = fixture(t);
        f.put('package.json', JSON.stringify({ type: 'module' }));
        f.put(
            'vitest.config.ts',
            `import config from ${JSON.stringify(path.join(repository, directory, 'vite.config.ts'))};
export default {...config, root:${JSON.stringify(f.cwd)}};`
        );
        f.put(
            'case.test.ts',
            `import {test,expect} from 'vitest'; let attempt=0;
test('standalone flaky', () => expect(++attempt).toBe(2));`
        );
        const result = f.run(vitest, ['run']);
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(f.readReports()[0].counts.recovered, 1);
    });
}

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
    assert.doesNotMatch(JSON.stringify(report), /private-error-detail/);
    const summary = summarize(f.reports, 'success').markdown;
    assert.match(summary, /flaky \\\| &lt;case&gt;/);
    report.cases[0].line = 'invalid';
    writeFileSync(
        path.join(f.reports, readdirSync(f.reports)[0], 'report.json'),
        JSON.stringify(report)
    );
    assert.throws(() => summarize(f.reports, 'success'));
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
});

test('CI retry opt-in without a report directory fails instead of silently omitting evidence', t => {
    const f = fixture(t);
    f.configure();
    f.put('case.test.ts', `import {test} from 'vitest'; test('healthy', () => {});`);
    const result = f.run(vitest, ['run'], { LC_CI_TEST_REPORT_DIR: '' });
    assert.notEqual(result.status, 0);
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

for (const reporters of ["'verbose'", "['verbose']"]) {
    test(`CI preserves explicit retry zero and custom reporters ${reporters}`, t => {
        const f = fixture(t);
        f.put(
            'vitest.config.ts',
            `
import {createVitestConfig, nodePreset} from ${JSON.stringify(path.join(repository, 'vitest.shared.ts'))};
const config = createVitestConfig(nodePreset, {test:{include:['case.test.ts'], retry:0, reporters:${reporters}}});

export default config;`
        );
        f.put(
            'case.test.ts',
            `import {test} from 'vitest'; import {appendFileSync} from 'node:fs';
test('never retry', () => {appendFileSync('attempts','x'); throw new Error('failure');});`
        );
        const result = f.run(vitest, ['run']);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.equal(readFileSync(path.join(f.cwd, 'attempts'), 'utf8'), 'x');
        assert.equal(f.readReports()[0].cases[0].retries, 0);
    });
}

test('real Nx selects and invalidates tests for shared config and retry policy', t => {
    const f = fixture(t);
    const workspace = JSON.parse(readFileSync(path.join(repository, 'nx.json'), 'utf8'));
    f.put('package.json', JSON.stringify({ name: 'input-fixture', private: true }));
    f.put(
        'nx.json',
        JSON.stringify({
            namedInputs: workspace.namedInputs,
            targetDefaults: { test: { inputs: workspace.targetDefaults.test.inputs, cache: true } },
        })
    );
    f.put('vitest.shared.ts', '// shared config');
    f.put('scripts/ci-test-retries/reporter.ts', '// reporter');
    f.put('scripts/ci-test-retries/summary.cjs', '// summary');
    f.put('run.cjs', `require('node:fs').appendFileSync(process.argv[2]+'-attempts','x');`);
    for (const [name, inputs] of [
        ['inherited', undefined],
        ['explicit', ['source', 'ciTestConfig']],
        ['native', ['source']],
    ]) {
        f.put(`projects/${name}/src/index.ts`, '// source');
        f.put(
            `projects/${name}/project.json`,
            JSON.stringify({
                name,
                root: `projects/${name}`,
                namedInputs: { source: ['{projectRoot}/src/**/*'] },
                targets: {
                    test: {
                        ...(inputs ? { inputs } : {}),
                        executor: 'nx:run-commands',
                        outputs: [],
                        options: { command: `node run.cjs ${name}` },
                    },
                },
            })
        );
    }
    for (const file of [
        'vitest.shared.ts',
        'scripts/ci-test-retries/reporter.ts',
        'scripts/ci-test-retries/summary.cjs',
    ]) {
        const result = f.run(nx, ['show', 'projects', '--affected', `--files=${file}`, '--json']);
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.deepEqual(JSON.parse(result.stdout).sort(), ['explicit', 'inherited']);
    }
    const run = extra => {
        const result = f.run(
            nx,
            ['run-many', '-t', 'test', '--projects=inherited,explicit', '--outputStyle=stream'],
            extra
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
    };
    const attempts = count => {
        for (const name of ['inherited', 'explicit'])
            assert.equal(
                readFileSync(path.join(f.cwd, `${name}-attempts`), 'utf8'),
                'x'.repeat(count)
            );
    };
    run();
    attempts(1);
    run();
    attempts(1); // unchanged run is cached
    f.put('scripts/ci-test-retries/reporter.ts', '// changed reporter');
    run();
    attempts(2);
    f.put('vitest.shared.ts', '// changed config');
    run();
    attempts(3);
    run({ LC_CI_TEST_RETRY: '0' });
    attempts(4);
    run({ LC_CI_TEST_RETRY: '0', LC_CI_TEST_REPORT_DIR: path.join(f.cwd, 'different-reports') });
    attempts(4);
    f.put('projects/explicit/vite.config.ts', '// changed local config');
    run({ LC_CI_TEST_RETRY: '0' });
    assert.equal(readFileSync(path.join(f.cwd, 'explicit-attempts'), 'utf8'), 'xxxxx');
    assert.equal(readFileSync(path.join(f.cwd, 'inherited-attempts'), 'utf8'), 'xxxx');
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
    });
}

test('incomplete and corrupt reporting cannot claim complete passing coverage', t => {
    const f = fixture(t);
    mkdirSync(path.join(f.reports, 'vitest-interrupted'), { recursive: true });
    assert.equal(summarize(f.reports, 'failure').incomplete, true);
    f.put('reports/vitest-interrupted/report.json', '{}');
    assert.throws(() => summarize(f.reports, 'success'));
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

    const failed = f.run(...args, {
        LC_CI_NX_OUTCOME: 'failure',
        GITHUB_STEP_SUMMARY: summaryFile,
    });
    assert.equal(failed.status, 0, failed.stdout + failed.stderr);
});
