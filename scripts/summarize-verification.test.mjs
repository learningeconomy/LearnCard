import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

const exec = promisify(execFile);
const script = new URL('./summarize-verification.mjs', import.meta.url);

const fixture = async action => {
    const directory = await mkdtemp(join(tmpdir(), 'lc-summary-'));
    const run = join(directory, 'runs', 'private-run-id');
    const output = join(directory, 'summary');
    await mkdir(run, { recursive: true });
    const json = (path, value) => writeFile(path, JSON.stringify(value));
    const summarize = async () => {
        await exec(process.execPath, [script.pathname, directory, output], {
            env: {
                ...process.env,
                GITHUB_STEP_SUMMARY: join(directory, 'github-summary.md'),
                VERIFICATION_OUTCOME: 'failure',
                TEARDOWN_OUTCOME: 'success',
            },
        });
        return {
            data: JSON.parse(await readFile(join(output, 'summary.json'), 'utf8')),
            markdown: await readFile(join(output, 'summary.md'), 'utf8'),
            github: await readFile(join(directory, 'github-summary.md'), 'utf8'),
        };
    };
    try {
        await action({ directory, run, json, summarize });
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
};

test('retains durations and counts while excluding credentials and arbitrary labels', async () => {
    await fixture(async ({ directory, run, json, summarize }) => {
        await json(join(directory, 'startup-timings.json'), [
            { phase: 'build', status: 'passed', durationMs: 61_234, error: 'private-seed' },
            { phase: 'private-seed', status: 'passed', durationMs: 10 },
        ]);
        await json(join(run, 'timings.json'), [
            { phase: 'catalog', status: 'failed', durationMs: 120_000 },
        ]);
        await json(join(run, 'report.json'), {
            status: 'failed',
            baseUrl: 'https://private-seed.example',
            results: [
                {
                    feature: 'account',
                    status: 'failed',
                    entries: ['auth-public-email-entry', 'auth-public-email-entry', 'private-seed'],
                    durationMs: 22_000,
                    startedAt: 'private-seed',
                    error: 'private-seed',
                },
            ],
        });
        const { data, markdown, github } = await summarize();
        assert.deepEqual(data.startupTimings, [
            { phase: 'build', status: 'passed', durationMs: 61_234 },
        ]);
        assert.deepEqual(data.reports[0].timings, [
            { phase: 'catalog', status: 'failed', durationMs: 120_000 },
        ]);
        assert.equal(
            data.reports[0].features.find(value => value.feature === 'account').durationMs,
            22_000
        );
        assert.equal(
            data.reports[0].features.find(value => value.feature === 'account').completedEntries,
            1
        );
        assert.equal(
            data.reports[0].features.find(value => value.feature === 'language').durationMs,
            null
        );
        assert.match(markdown, /1m 1.2s/);
        assert.equal(github, markdown);
        assert.doesNotMatch(
            JSON.stringify(data) + markdown,
            /private-seed|private-run-id|startedAt|baseUrl/
        );
    });
});

test('handles invalid, missing and partial timing records without publishing raw values', async () => {
    await fixture(async ({ directory, run, json, summarize }) => {
        await json(join(directory, 'startup-timings.json'), [
            { phase: 'build', status: 'private-seed', durationMs: 'private-seed' },
            { phase: 'compose', status: 'failed', durationMs: -1 },
            { phase: 'readiness', status: 'running', durationMs: null },
            { phase: 'prepare', status: 'passed', durationMs: 1e100 },
            null,
        ]);
        await writeFile(join(run, 'timings.json'), '[{"phase":');
        // No report: preserve startup failure timings without inventing a successful run.
        const { data, markdown } = await summarize();
        assert.equal(data.reports[0].status, 'unreadable');
        assert.deepEqual(data.reports[0].timings, []);
        assert.ok(data.startupTimings.every(value => value.durationMs === null));
        assert.doesNotMatch(JSON.stringify(data) + markdown, /private-seed|1e\+100/);
    });
});

test('supports older reports using only validated numeric timestamp differences', async () => {
    await fixture(async ({ run, json, summarize }) => {
        await json(join(run, 'report.json'), {
            status: 'passed',
            results: [
                {
                    feature: 'account',
                    status: 'passed',
                    startedAt: '2026-10-19T00:00:00.000Z',
                    finishedAt: '2026-10-19T00:00:12.345Z',
                },
                { feature: 'language', status: 'failed', durationMs: 'private-seed' },
                {
                    feature: 'contacts',
                    status: 'failed',
                    startedAt: '2026-10-19T00:00:12.345Z',
                    finishedAt: '2026-10-19T00:00:00.000Z',
                },
            ],
        });
        const { data } = await summarize();
        const features = data.reports[0].features;
        assert.equal(features.find(value => value.feature === 'account').durationMs, 12_345);
        assert.equal(features.find(value => value.feature === 'language').durationMs, null);
        assert.equal(features.find(value => value.feature === 'contacts').durationMs, null);
        assert.deepEqual(data.startupTimings, []);
    });
});
