import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readVerificationCatalog, repositoryRoot, sameEntries } from './verification-catalog.mjs';

const statuses = ['passed', 'failed', 'interrupted', 'running'];
const outcomes = ['success', 'failure', 'cancelled', 'skipped', 'unknown'];
const commands = ['startup', 'navigation', 'catalog', 'campaigns', 'teardown'];
const codes = ['missing-report', 'invalid-report', 'stage-failed', 'invalid-media'];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const object = value => assert(value && typeof value === 'object' && !Array.isArray(value));
const keys = (value, required, optional = []) => {
    object(value);
    assert(required.every(key => Object.hasOwn(value, key)));
    assert(Object.keys(value).every(key => [...required, ...optional].includes(key)));
};
const integer = (value, max = 86_400_000) =>
    Number.isSafeInteger(value) && value >= 0 && value <= max;
const duration = value => (integer(value) ? value : null);
const exists = async path =>
    lstat(path).then(
        () => true,
        error => {
            if (error.code === 'ENOENT') return false;
            throw error;
        }
    );
const json = async path => {
    const stat = await lstat(path);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 1_000_000);
    return JSON.parse(await readFile(path, 'utf8'));
};
const directory = async path => {
    const stat = await lstat(path);
    assert(stat.isDirectory() && !stat.isSymbolicLink());
};

export const readPlan = async (root = repositoryRoot) => {
    const catalog = await readVerificationCatalog(root);
    const plan = await json(join(root, 'scripts/verification-shards.json'));
    keys(plan, ['version', 'shards']);
    assert.equal(plan.version, 1);
    assert.equal(plan.shards.length, 2);
    sameEntries(
        plan.shards.map(shard => shard.id),
        ['1', '2'],
        'Shard IDs'
    );
    for (const shard of plan.shards) {
        keys(shard, ['id', 'features', 'scripts']);
        assert(Array.isArray(shard.features) && shard.features.length);
        assert(shard.features.every(feature => catalog.has(feature)));
        assert(Array.isArray(shard.scripts));
        assert(shard.scripts.every(script => ['navigation', 'campaigns'].includes(script)));
        sameEntries(
            shard.features,
            [...catalog.keys()].filter(id => shard.features.includes(id)),
            'Shard order/IDs'
        );
    }
    sameEntries(
        plan.shards.flatMap(shard => shard.features),
        [...catalog.keys()],
        'Catalog partition'
    );
    sameEntries(
        plan.shards.flatMap(shard => shard.scripts),
        ['navigation', 'campaigns'],
        'Script partition'
    );
    return { catalog, plan, catalogHash: hash([...catalog]), planHash: hash(plan) };
};

const identity = value => {
    keys(value, ['runId', 'attempt', 'checkoutSha', 'headSha']);
    assert(typeof value.runId === 'string' && /^[1-9]\d*$/.test(value.runId));
    assert(integer(value.attempt, 10000) && value.attempt > 0);
    for (const key of ['checkoutSha', 'headSha']) assert(/^[a-f0-9]{40}$/.test(value[key]));
};
const featureRows = (report, shard, catalog) => {
    object(report);
    assert(statuses.includes(report.status) && Array.isArray(report.results));
    const rows = report.results;
    const ids = rows.map(row => row.feature);
    sameEntries(
        ids,
        shard.features.filter(id => ids.includes(id)),
        'Raw feature rows'
    );
    sameEntries(
        report.notRun,
        shard.features.filter(id => !ids.includes(id)),
        'Raw missing features'
    );
    sameEntries(
        report.notSelected,
        [...catalog.keys()].filter(id => !shard.features.includes(id)),
        'Raw unselected features'
    );
    return rows.map(row => {
        assert(statuses.includes(row.status));
        const required = catalog.get(row.feature);
        sameEntries(row.requiredEntries, required, 'Raw required entries');
        const completed = row.entries ?? [];
        sameEntries(
            completed,
            required.filter(id => completed.includes(id)),
            'Raw completed entries'
        );
        const hasError = Boolean(
            row.hasError || row.error || row.evidenceError || row.cleanupError
        );
        if (row.status === 'passed') {
            sameEntries(completed, required, 'Passing entries');
            assert(!hasError && duration(row.durationMs) !== null);
        }
        return {
            feature: row.feature,
            status: row.status,
            requiredEntries: required.length,
            completedEntries: completed.length,
            durationMs: duration(row.durationMs),
            hasError,
        };
    });
};
const aliases = count => Array.from({ length: count }, (_, index) => `entry-${index + 1}`);

/** Validate an already-staged report and allowlisted screenshots, never raw evidence. */
const stagedImages = async (root, rows, shard, catalog, expectedStatus) => {
    await directory(root);
    const report = await json(join(root, 'report.json'));
    keys(report, ['status', 'script', 'results', 'notRun', 'notSelected']);
    assert(statuses.includes(report.status) && report.script === false);
    assert.equal(report.status, expectedStatus);
    assert.equal(report.results.length, rows.length);
    sameEntries(
        report.results.map(row => row.feature),
        rows.map(row => row.feature),
        'Staged features'
    );
    for (const row of report.results) {
        keys(row, ['feature', 'status', 'requiredEntries', 'hasError'], ['entries', 'durationMs']);
        const expected = rows.find(candidate => candidate.feature === row.feature);
        assert.equal(row.status, expected.status);
        assert.equal(row.hasError, expected.hasError);
        assert.deepEqual(row.requiredEntries, aliases(expected.requiredEntries));
        assert.deepEqual(row.entries ?? [], aliases(expected.completedEntries));
        assert.equal(row.durationMs ?? null, expected.durationMs);
    }
    sameEntries(
        report.notRun,
        shard.features.filter(id => !rows.some(row => row.feature === id)),
        'Staged missing'
    );
    sameEntries(
        report.notSelected,
        [...catalog.keys()].filter(id => !shard.features.includes(id)),
        'Staged unselected'
    );
    const images = [];
    for (const entry of await readdir(root)) {
        if (entry === 'report.json') continue;
        assert(shard.features.includes(entry) && rows.some(row => row.feature === entry));
        const folder = join(root, entry);
        await directory(folder);
        for (const name of await readdir(folder)) {
            assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}\.png$/.test(name));
            const path = join(folder, name);
            const stat = await lstat(path);
            assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 50_000_000);
            const bytes = await readFile(path);
            assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
            images.push({ path, feature: entry, name });
        }
    }
    return images;
};
const successful = envelope =>
    envelope.validReport &&
    envelope.evidence === 'success' &&
    envelope.reportStatus === 'passed' &&
    envelope.features.length === envelope.assignment.features.length &&
    envelope.features.every(
        row =>
            row.status === 'passed' && !row.hasError && row.completedEntries === row.requiredEntries
    ) &&
    commands.every(
        command =>
            envelope.commands[command] ===
            (['navigation', 'campaigns'].includes(command) &&
            !envelope.assignment.scripts.includes(command)
                ? 'skipped'
                : 'success')
    );

/** Validate original IDs before the existing proof stager replaces them with entry-N. */
export const stageShard = async ({
    stack,
    out,
    shardId,
    context,
    commandOutcomes,
    root = repositoryRoot,
}) => {
    const configuration = await readPlan(root);
    const { catalog, plan } = configuration;
    identity(context);
    const assignment = plan.shards.find(shard => shard.id === shardId);
    assert(assignment);
    assert(!(await exists(out)));
    await mkdir(out, { recursive: true, mode: 0o700 });
    const envelope = {
        schemaVersion: 1,
        ...context,
        shard: shardId,
        catalogHash: configuration.catalogHash,
        planHash: configuration.planHash,
        assignment,
        commands: Object.fromEntries(
            commands.map(name => [
                name,
                outcomes.includes(commandOutcomes[name]) ? commandOutcomes[name] : 'unknown',
            ])
        ),
        validReport: false,
        reportStatus: 'failed',
        features: [],
        evidence: 'failure',
        diagnostics: [],
    };
    let runs = [];
    if (await exists(join(stack, 'runs'))) {
        await directory(join(stack, 'runs'));
        runs = await readdir(join(stack, 'runs'));
    }
    if (runs.length !== 1) envelope.diagnostics.push('missing-report');
    else {
        const run = join(stack, 'runs', runs[0]);
        try {
            await directory(run);
            const report = await json(join(run, 'report.json'));
            envelope.features = featureRows(report, assignment, catalog);
            envelope.reportStatus = report.status;
            envelope.validReport = true;
        } catch {
            envelope.diagnostics.push('invalid-report');
        }
        if (envelope.validReport) {
            const media = join(out, 'media');
            const staged = spawnSync(
                'bun',
                ['scripts/proof.ts', 'stage', '--from-run', run, '--out', media, '--images-only'],
                { cwd: repositoryRoot, stdio: ['ignore', 'pipe', 'pipe'] }
            );
            if (staged.status !== 0) envelope.diagnostics.push('stage-failed');
            else {
                try {
                    await stagedImages(
                        media,
                        envelope.features,
                        assignment,
                        catalog,
                        envelope.reportStatus
                    );
                    envelope.evidence = 'success';
                } catch {
                    envelope.diagnostics.push('invalid-media');
                }
            }
        }
    }
    if (envelope.evidence !== 'success')
        await rm(join(out, 'media'), { recursive: true, force: true });
    await writeFile(join(out, 'envelope.json'), JSON.stringify(envelope, null, 2) + '\n', {
        mode: 0o600,
    });
    return successful(envelope);
};

const validateEnvelope = (value, configuration, expected, shard, attempt) => {
    keys(value, [
        'schemaVersion',
        'runId',
        'attempt',
        'checkoutSha',
        'headSha',
        'shard',
        'catalogHash',
        'planHash',
        'assignment',
        'commands',
        'validReport',
        'reportStatus',
        'features',
        'evidence',
        'diagnostics',
    ]);
    identity({
        runId: value.runId,
        attempt: value.attempt,
        checkoutSha: value.checkoutSha,
        headSha: value.headSha,
    });
    assert(
        value.schemaVersion === 1 &&
            value.runId === expected.runId &&
            value.attempt === attempt &&
            attempt <= expected.attempt
    );
    assert(
        value.checkoutSha === expected.checkoutSha &&
            value.headSha === expected.headSha &&
            value.shard === shard.id
    );
    assert.equal(value.catalogHash, configuration.catalogHash);
    assert.equal(value.planHash, configuration.planHash);
    assert.deepEqual(value.assignment, shard);
    keys(value.commands, commands);
    assert(Object.values(value.commands).every(outcome => outcomes.includes(outcome)));
    assert(typeof value.validReport === 'boolean' && statuses.includes(value.reportStatus));
    assert(['success', 'failure'].includes(value.evidence));
    assert(
        Array.isArray(value.diagnostics) && value.diagnostics.every(code => codes.includes(code))
    );
    const ids = value.features.map(row => row.feature);
    sameEntries(
        ids,
        shard.features.filter(id => ids.includes(id)),
        'Envelope feature IDs'
    );
    for (const row of value.features) {
        keys(row, [
            'feature',
            'status',
            'requiredEntries',
            'completedEntries',
            'durationMs',
            'hasError',
        ]);
        assert(statuses.includes(row.status) && typeof row.hasError === 'boolean');
        assert.equal(row.requiredEntries, configuration.catalog.get(row.feature).length);
        assert(integer(row.completedEntries, row.requiredEntries));
        assert(row.durationMs === null || duration(row.durationMs) !== null);
        if (row.status === 'passed')
            assert(
                row.completedEntries === row.requiredEntries &&
                    row.durationMs !== null &&
                    !row.hasError
            );
    }
    if (!value.validReport) assert.equal(value.features.length, 0);
    if (value.evidence === 'success') assert(value.validReport && value.diagnostics.length === 0);
};

/** Select the newest attempt per shard within this run/SHA; rerun-failed-jobs can reuse a successful sibling. */
export const mergeShards = async ({
    input,
    out,
    context,
    dependencyOutcomes,
    root = repositoryRoot,
}) => {
    const configuration = await readPlan(root);
    const { catalog, plan } = configuration;
    identity(context);
    await directory(input);
    assert(!(await exists(out)));
    await mkdir(out, { recursive: true, mode: 0o700 });
    const candidates = new Map(plan.shards.map(shard => [shard.id, []]));
    let invalid = false;
    for (const name of await readdir(input)) {
        const match = /^lc-verification-shard-(\d+)-(\d+)-(1|2)$/.exec(name);
        if (
            !match ||
            match[1] !== context.runId ||
            Number(match[2]) > context.attempt ||
            Number(match[2]) < 1
        ) {
            invalid = true;
            continue;
        }
        candidates.get(match[3]).push({ name, attempt: Number(match[2]) });
    }
    const rows = new Map();
    const images = [];
    const shards = [];
    for (const assignment of plan.shards) {
        const options = candidates.get(assignment.id).sort((a, b) => b.attempt - a.attempt);
        const selected = options[0];
        if (!selected) {
            invalid = true;
            shards.push({ shard: assignment.id, status: 'missing' });
            continue;
        }
        try {
            assert(!options[1] || options[1].attempt !== selected.attempt);
            const folder = join(input, selected.name);
            await directory(folder);
            assert(
                (await readdir(folder)).every(name => ['envelope.json', 'media'].includes(name))
            );
            const envelope = await json(join(folder, 'envelope.json'));
            validateEnvelope(envelope, configuration, context, assignment, selected.attempt);
            if (envelope.evidence === 'success')
                images.push(
                    ...(await stagedImages(
                        join(folder, 'media'),
                        envelope.features,
                        assignment,
                        catalog,
                        envelope.reportStatus
                    ))
                );
            else assert(!(await exists(join(folder, 'media'))) || envelope.validReport);
            for (const row of envelope.features) {
                assert(!rows.has(row.feature));
                rows.set(row.feature, row);
            }
            const passed = successful(envelope);
            invalid ||= !passed;
            shards.push({
                shard: assignment.id,
                attempt: selected.attempt,
                status: passed ? 'passed' : 'failed',
                commands: envelope.commands,
                diagnostics: envelope.diagnostics,
            });
        } catch {
            invalid = true;
            shards.push({ shard: assignment.id, status: 'invalid' });
        }
    }
    const dependenciesPassed = ['source', 'bundle', 'runtime'].every(
        key => dependencyOutcomes[key] === 'success'
    );
    const valid = !invalid && dependenciesPassed && rows.size === catalog.size;
    const features = [...catalog].map(
        ([id, entries]) =>
            rows.get(id) ?? {
                feature: id,
                status: 'not-run',
                requiredEntries: entries.length,
                completedEntries: 0,
                durationMs: null,
                hasError: true,
            }
    );
    const allCommand = name =>
        shards.length === plan.shards.length &&
        shards.every(shard => shard.commands?.[name] === 'success');
    const scriptSuccess = plan.shards.every(assignment =>
        assignment.scripts.every(
            name =>
                shards.find(shard => shard.shard === assignment.id)?.commands?.[name] === 'success'
        )
    );
    const summary = {
        schemaVersion: 1,
        ...context,
        run: valid ? 'success' : 'failure',
        coverageValid: valid,
        commandOutcomes: {
            startup: allCommand('startup') ? 'success' : 'failure',
            script: scriptSuccess ? 'success' : 'failure',
            catalog: allCommand('catalog') ? 'success' : 'failure',
        },
        teardown: allCommand('teardown') ? 'success' : 'failure',
        dependencies: Object.fromEntries(
            ['source', 'bundle', 'runtime'].map(name => [
                name,
                outcomes.includes(dependencyOutcomes[name]) ? dependencyOutcomes[name] : 'unknown',
            ])
        ),
        startupTimings: [],
        startupCommands: [],
        scriptCommands: [],
        shards,
        reports: [{ status: valid ? 'passed' : 'failed', features }],
    };
    await writeFile(join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    const markdown = [
        '# Sharded LearnCard verification',
        '',
        `Combined verification: **${summary.run}**.`,
        '',
        'Each shard owns a separate stack; feature durations are serial work within that shard, not total workflow wall time.',
        '',
        '| Feature | Status | Entries | Duration (s) |',
        '| --- | --- | ---: | ---: |',
        ...features.map(
            row =>
                `| ${row.feature} | ${row.status} | ${row.completedEntries}/${row.requiredEntries} | ${row.durationMs === null ? '—' : (row.durationMs / 1000).toFixed(1)} |`
        ),
        '',
    ].join('\n');
    await writeFile(join(out, 'summary.md'), markdown);
    const media = join(out, 'media');
    await mkdir(media, { mode: 0o700 });
    for (const image of images) {
        const folder = join(media, image.feature);
        await mkdir(folder, { recursive: true, mode: 0o700 });
        const target = join(folder, image.name);
        assert(!(await exists(target)));
        await copyFile(image.path, target);
    }
    const result = {
        status: valid ? 'passed' : 'failed',
        script: false,
        results: [...rows.values()].map(row => ({
            feature: row.feature,
            status: row.status,
            requiredEntries: aliases(row.requiredEntries),
            entries: aliases(row.completedEntries),
            ...(row.durationMs === null ? {} : { durationMs: row.durationMs }),
            hasError: row.hasError,
        })),
        notRun: [...catalog.keys()].filter(id => !rows.has(id)),
        notSelected: [],
    };
    await writeFile(join(media, 'report.json'), JSON.stringify(result, null, 2) + '\n');
    return { valid, hasMedia: images.length > 0, summary };
};

const environmentIdentity = () => ({
    runId: process.env.GITHUB_RUN_ID,
    attempt: Number(process.env.GITHUB_RUN_ATTEMPT),
    checkoutSha: process.env.GITHUB_SHA,
    headSha: process.env.PR_HEAD_SHA,
});
const main = async () => {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'check' || command === 'features') {
        const { plan } = await readPlan();
        if (command === 'features') {
            const shard = plan.shards.find(shard => shard.id === args[0]);
            assert(shard);
            console.log(shard.features.join('\n'));
        } else
            console.log(
                'Catalog shards cover every executable feature and both scripts exactly once.'
            );
    } else if (command === 'stage') {
        const context = environmentIdentity();
        identity(context);
        const checkout = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
        assert(checkout.status === 0 && checkout.stdout.trim() === context.checkoutSha);
        const passed = await stageShard({
            stack: resolve(args[0]),
            out: resolve(args[1]),
            shardId: args[2],
            context,
            commandOutcomes: Object.fromEntries(
                commands.map(name => [name, process.env[`${name.toUpperCase()}_OUTCOME`]])
            ),
        });
        if (!passed) process.exitCode = 1;
    } else if (command === 'merge') {
        const result = await mergeShards({
            input: resolve(args[0]),
            out: resolve(args[1]),
            context: environmentIdentity(),
            dependencyOutcomes: {
                source: process.env.SOURCE_RESULT,
                bundle: process.env.BUNDLE_RESULT,
                runtime: process.env.RUNTIME_RESULT,
            },
        });
        if (process.env.GITHUB_OUTPUT)
            await writeFile(process.env.GITHUB_OUTPUT, `has_media=${result.hasMedia}\n`, {
                flag: 'a',
            });
        if (!result.valid) process.exitCode = 1;
    } else throw new Error('Unknown command');
};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch(() => {
        console.error(
            'Verification shard validation failed; inspect the fixed status/count diagnostics.'
        );
        process.exitCode = 1;
    });
}
