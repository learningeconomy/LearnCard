import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPlan, stageShard, mergeShards } from './verification-shards.mjs';

const context = { runId: '42', attempt: 1, checkoutSha: 'a'.repeat(40), headSha: 'b'.repeat(40) };
const deps = { source: 'success', bundle: 'success', runtime: 'success' };
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const fixture = async action => {
    const root = await mkdtemp(join(tmpdir(), 'lcv-shards-'));
    try {
        const journeys = join(root, 'apps/learn-card-app/scripts/verification/journeys');
        await mkdir(journeys, { recursive: true });
        await mkdir(join(root, 'scripts'));
        await writeFile(
            join(journeys, '../catalog.ts'),
            `
            import { alpha } from './journeys/alpha';
            import { beta } from './journeys/beta';
            import type { FeatureDefinition } from './types';
            export const verificationFeatures = [alpha, beta];`
        );
        for (const id of ['alpha', 'beta'])
            await writeFile(
                join(journeys, `${id}.ts`),
                `export const ${id} = {id:'${id}',entries:['${id}-one']};`
            );
        await writeFile(
            join(root, 'scripts/verification-shards.json'),
            JSON.stringify({
                version: 1,
                shards: [
                    { id: '1', features: ['alpha'], scripts: ['navigation'] },
                    { id: '2', features: ['beta'], scripts: ['campaigns'] },
                ],
            })
        );
        await mkdir(join(root, 'input'));
        const stage = async (id, mutate = () => {}, attempt = 1, imageBytes = png) => {
            const feature = id === '1' ? 'alpha' : 'beta';
            const stack = join(root, `stack-${id}-${attempt}`),
                run = join(stack, 'runs/run');
            await mkdir(join(run, feature), { recursive: true });
            const report = {
                status: 'passed',
                results: [
                    {
                        feature,
                        status: 'passed',
                        requiredEntries: [`${feature}-one`],
                        entries: [`${feature}-one`],
                        durationMs: 100,
                        observations: { secret: 'PRIVATE_SEED_AND_PIN' },
                    },
                ],
                notRun: [],
                notSelected: [feature === 'alpha' ? 'beta' : 'alpha'],
            };
            mutate(report);
            await writeFile(join(run, 'report.json'), JSON.stringify(report));
            await writeFile(join(run, feature, '001-step-after.png'), imageBytes);
            const out = join(root, 'input', `lc-verification-shard-42-${attempt}-${id}`);
            const commandOutcomes = {
                startup: 'success',
                catalog: report.status === 'passed' ? 'success' : 'failure',
                teardown: 'success',
                navigation: id === '1' ? 'success' : 'skipped',
                campaigns: id === '2' ? 'success' : 'skipped',
            };
            const passed = await stageShard({
                stack,
                out,
                shardId: id,
                context: { ...context, attempt },
                commandOutcomes,
                root,
            });
            return { passed, out };
        };
        let merges = 0;
        const merge = async (dependencyOutcomes = deps, current = context) =>
            mergeShards({
                input: join(root, 'input'),
                out: join(root, `merged-${++merges}`),
                context: current,
                dependencyOutcomes,
                root,
            });
        await action({ root, stage, merge });
    } finally {
        await rm(root, { recursive: true, force: true });
    }
};
const edit = async (path, change) => {
    const data = JSON.parse(await readFile(path, 'utf8'));
    change(data);
    await writeFile(path, JSON.stringify(data));
};

test('real plan partitions every executable feature and each extra script exactly once', async () => {
    const { catalog, plan } = await readPlan();
    assert.equal(plan.shards.flatMap(shard => shard.features).length, catalog.size);
});

test('new canonical feature cannot silently fall outside the partition', async () =>
    fixture(async ({ root }) => {
        const file = join(root, 'apps/learn-card-app/scripts/verification/catalog.ts');
        await writeFile(
            file,
            (await readFile(file, 'utf8')).replace('[alpha, beta]', '[alpha, beta, gamma]') +
                `\nimport { gamma } from './journeys/gamma';`
        );
        await writeFile(
            join(root, 'apps/learn-card-app/scripts/verification/journeys/gamma.ts'),
            `export const gamma={id:'gamma',entries:['gamma-one']};`
        );
        await assert.rejects(readPlan(root));
    }));

for (const mutation of ['duplicate-feature', 'missing-script', 'duplicate-script'])
    test(`rejects invalid plan: ${mutation}`, async () =>
        fixture(async ({ root }) => {
            await edit(join(root, 'scripts/verification-shards.json'), plan => {
                if (mutation === 'duplicate-feature') plan.shards[1].features.push('alpha');
                else if (mutation === 'missing-script') plan.shards[1].scripts = [];
                else plan.shards[1].scripts.push('navigation');
            });
            await assert.rejects(readPlan(root));
        }));

test('merges complete evidence, strips raw observations and preserves image bytes', async () =>
    fixture(async ({ root, stage, merge }) => {
        assert.equal((await stage('1')).passed, true);
        assert.equal((await stage('2')).passed, true);
        const result = await merge();
        assert.equal(result.valid, true);
        assert.equal(result.hasMedia, true);
        assert.equal(result.summary.reports[0].features.length, 2);
        const report = await readFile(join(root, 'merged-1/media/report.json'), 'utf8');
        assert.doesNotMatch(report, /PRIVATE|seed=|pin=/);
        assert.deepEqual(JSON.parse(report).results[0].entries, ['entry-1']);
        assert.deepEqual(
            await readFile(join(root, 'merged-1/media/alpha/001-step-after.png')),
            png
        );
    }));

for (const [label, mutate] of [
    ['duplicate-row', report => report.results.push(report.results[0])],
    ['unknown-row', report => (report.results[0].feature = 'unknown')],
    ['extra-entry', report => report.results[0].entries.push('extra')],
    ['duplicate-entry', report => report.results[0].entries.push('alpha-one')],
    ['wrong-required-entry', report => (report.results[0].requiredEntries = ['wrong'])],
    ['missing-entry', report => (report.results[0].entries = [])],
    [
        'unexecuted-feature',
        report => {
            report.results = [];
            report.notRun = ['alpha'];
        },
    ],
])
    test(`raw validation rejects ${label} before sanitizer can hide it`, async () =>
        fixture(async ({ stage, merge }) => {
            assert.equal((await stage('1', mutate)).passed, false);
            await stage('2');
            assert.equal((await merge()).valid, false);
        }));

test('new canonical entry makes an old passing raw report invalid', async () =>
    fixture(async ({ root, stage }) => {
        await writeFile(
            join(root, 'apps/learn-card-app/scripts/verification/journeys/alpha.ts'),
            `export const alpha={id:'alpha',entries:['alpha-one','alpha-two']};`
        );
        assert.equal((await stage('1')).passed, false);
    }));

test('valid failed partial proof survives while aggregate fails', async () =>
    fixture(async ({ root, stage, merge }) => {
        await stage('1', report => {
            report.status = 'failed';
            report.results[0].status = 'failed';
            delete report.results[0].entries;
            report.results[0].error = 'PRIVATE_SEED_AND_PIN';
        });
        await stage('2');
        const result = await merge();
        assert.equal(result.valid, false);
        assert.equal(result.hasMedia, true);
        const report = JSON.parse(await readFile(join(root, 'merged-1/media/report.json'), 'utf8'));
        assert.equal(report.status, 'failed');
        assert.equal(report.results[0].status, 'failed');
        assert.equal(report.results[0].hasError, true);
        assert.doesNotMatch(JSON.stringify(report), /PRIVATE/);
    }));

test('missing shard fails but retains safe sibling evidence', async () =>
    fixture(async ({ stage, merge }) => {
        await stage('1');
        const result = await merge();
        assert.equal(result.valid, false);
        assert.equal(result.hasMedia, true);
        assert.ok(result.summary.shards.some(shard => shard.status === 'missing'));
    }));

for (const field of ['checkoutSha', 'headSha', 'runId', 'attempt', 'catalogHash', 'planHash'])
    test(`rejects stale or mismatched ${field}`, async () =>
        fixture(async ({ stage, merge }) => {
            const a = await stage('1');
            await stage('2');
            await edit(
                join(a.out, 'envelope.json'),
                envelope => (envelope[field] = field === 'attempt' ? 2 : 'c'.repeat(40))
            );
            assert.equal((await merge()).valid, false);
        }));

test('rerun-failed-jobs can reuse prior successful sibling with same run and source', async () =>
    fixture(async ({ stage, merge }) => {
        await stage('1');
        await stage('2');
        await stage('1', () => {}, 2);
        const result = await merge(deps, { ...context, attempt: 2 });
        assert.equal(result.valid, true);
        assert.deepEqual(
            result.summary.shards.map(shard => shard.attempt),
            [2, 1]
        );
    }));

test('latest invalid attempt cannot fall back to old green evidence', async () =>
    fixture(async ({ stage, merge }) => {
        await stage('1');
        await stage('2');
        const latest = await stage('1', () => {}, 2);
        await edit(join(latest.out, 'envelope.json'), e => (e.checkoutSha = 'c'.repeat(40)));
        assert.equal((await merge(deps, { ...context, attempt: 2 })).valid, false);
    }));

test('duplicate attempt aliases cannot masquerade as a second shard', async () =>
    fixture(async ({ root, stage, merge }) => {
        const a = await stage('1');
        await stage('2');
        await cp(a.out, join(root, 'input/lc-verification-shard-42-01-1'), { recursive: true });
        assert.equal((await merge()).valid, false);
    }));

for (const dependency of ['source', 'bundle', 'runtime'])
    for (const status of ['failure', 'cancelled', 'skipped', 'unknown'])
        test(`${dependency}=${status} cannot pass with otherwise green coverage`, async () =>
            fixture(async ({ stage, merge }) => {
                await stage('1');
                await stage('2');
                assert.equal((await merge({ ...deps, [dependency]: status })).valid, false);
            }));

for (const script of ['navigation', 'campaigns'])
    test(`assigned ${script} cannot be skipped`, async () =>
        fixture(async ({ stage, merge }) => {
            const a = await stage('1'),
                b = await stage('2');
            await edit(
                join((script === 'navigation' ? a : b).out, 'envelope.json'),
                e => (e.commands[script] = 'skipped')
            );
            assert.equal((await merge()).valid, false);
        }));

for (const attack of [
    'extra-root',
    'raw-trace',
    'symlink',
    'wrong-extension',
    'wrong-magic',
    'unexpected-json',
])
    test(`rejects unsafe staged payload: ${attack}`, async () =>
        fixture(async ({ root, stage, merge }) => {
            const a = await stage('1');
            await stage('2');
            if (attack === 'extra-root') await writeFile(join(a.out, 'private.env'), 'PRIVATE');
            if (attack === 'raw-trace')
                await writeFile(join(a.out, 'media/alpha/raw-trace.zip'), 'PRIVATE');
            if (attack === 'symlink')
                await symlink(join(a.out, 'envelope.json'), join(a.out, 'media/alpha/link.png'));
            if (attack === 'wrong-extension')
                await writeFile(join(a.out, 'media/alpha/video.webm'), 'PRIVATE');
            if (attack === 'wrong-magic')
                await writeFile(join(a.out, 'media/alpha/fake.png'), 'PRIVATE');
            if (attack === 'unexpected-json')
                await edit(join(a.out, 'media/report.json'), e => (e.secret = 'PRIVATE'));
            const result = await merge();
            assert.equal(result.valid, false);
            const report = await readFile(join(root, 'merged-1/media/report.json'), 'utf8');
            assert.doesNotMatch(report, /PRIVATE/);
        }));

test('latest missing proof replaces earlier green proof with a current failed report-only payload', async () =>
    fixture(async ({ root, stage, merge }) => {
        await stage('1');
        await stage('2');
        assert.equal((await merge()).valid, true);
        await rm(join(root, 'input'), { recursive: true });
        await mkdir(join(root, 'input'));
        const latest = await merge(deps, { ...context, attempt: 2 });
        assert.equal(latest.valid, false);
        assert.equal(latest.hasMedia, false);
        const report = JSON.parse(await readFile(join(root, 'merged-2/media/report.json'), 'utf8'));
        assert.equal(report.status, 'failed');
        assert.deepEqual(report.results, []);
        assert.deepEqual(report.notRun, ['alpha', 'beta']);
    }));

test('rejected local staging files are removed before the shard bundle can upload', async () =>
    fixture(async ({ stage }) => {
        const rejected = await stage('1', () => {}, 1, Buffer.from('PRIVATE_NOT_A_PNG'));
        assert.equal(rejected.passed, false);
        await assert.rejects(readFile(join(rejected.out, 'media/report.json')), { code: 'ENOENT' });
        const envelope = JSON.parse(await readFile(join(rejected.out, 'envelope.json'), 'utf8'));
        assert.deepEqual(envelope.diagnostics, ['invalid-media']);
    }));

test('staged report status must match its validated raw envelope', async () =>
    fixture(async ({ stage, merge }) => {
        const a = await stage('1');
        await stage('2');
        await edit(join(a.out, 'media/report.json'), report => (report.status = 'failed'));
        assert.equal((await merge()).valid, false);
    }));
