import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { builds, cacheServer, digest, verifyCache } from './transport.mjs';
import { startCache, validatePolicy, validateResults } from './run.mjs';

const require = createRequire(import.meta.url);
const { eligible, lookupRequest, selectProducer } = require('./select-producer.cjs');
const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);

test('lookup aborts a stalled fetch at its remaining deadline', { timeout: 2_000 }, async t => {
    const server = createServer(() => {});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => {
        server.closeAllConnections();
        return new Promise(resolve => server.close(resolve));
    });
    const request = lookupRequest(Date.now() + 50);
    await assert.rejects(
        fetch(`http://127.0.0.1:${server.address().port}`, request),
        error => error.name === 'TimeoutError'
    );
    assert.equal(request.signal.aborted, true);
    assert.throws(() => lookupRequest(Date.now() - 1), /budget exhausted/);
});

test('a cache startup failure permits fresh consumer execution but fails a producer', async () => {
    const fail = async () => {
        throw new Error('loopback unavailable');
    };
    assert.equal(await startCache('consume', '/unused', fail), undefined);
    await assert.rejects(startCache('produce', '/unused', fail), /loopback unavailable/);
});

test('producer eligibility rejects untrusted branches/events, wrong workflow/repo and stale runs', () => {
    const run = {
        conclusion: 'success',
        event: 'workflow_dispatch',
        head_branch: 'main',
        path: '.github/workflows/nx-artifact-producer.yml',
        head_sha: headSha,
        head_repository: { full_name: 'learningeconomy/LearnCard' },
        created_at: new Date().toISOString(),
    };
    const check = r => eligible(r, 'learningeconomy/LearnCard', baseSha);
    assert.equal(check(run), true);
    for (const bad of [
        { conclusion: 'failure' },
        { event: 'pull_request' },
        { head_branch: 'feature' },
        { path: '.github/workflows/other.yml' },
        { head_repository: { full_name: 'fork/LearnCard' } },
        { head_sha: 'invalid' },
        { created_at: '2000-01-01T00:00:00Z' },
        { created_at: 'invalid' },
    ]) {
        assert.equal(check({ ...run, ...bad }), false);
    }
});

test('lookup failure and a non-ancestor producer select no artifact and preserve fresh fallback', async () => {
    const outputs = {};
    const core = {
        setOutput: (k, v) => {
            outputs[k] = v;
        },
        notice() {},
    };
    const context = {
        repo: { owner: 'learningeconomy', repo: 'LearnCard' },
        payload: { merge_group: { base_sha: baseSha } },
    };
    await selectProducer({
        context,
        core,
        github: {
            rest: {
                actions: {
                    listWorkflowRuns: async () => {
                        throw Error('unavailable');
                    },
                },
            },
        },
    });
    assert.deepEqual(outputs, { active: 'true' });
    const run = {
        conclusion: 'success',
        event: 'workflow_dispatch',
        head_branch: 'main',
        path: '.github/workflows/nx-artifact-producer.yml',
        head_sha: headSha,
        head_repository: { full_name: 'learningeconomy/LearnCard' },
        created_at: new Date().toISOString(),
    };
    await selectProducer({
        context,
        core,
        github: {
            rest: {
                actions: {
                    listWorkflowRuns: async () => ({ data: { workflow_runs: [run] } }),
                    listWorkflowRunArtifacts: () =>
                        assert.fail('Do not download a non-ancestor artifact'),
                },
                repos: {
                    compareCommitsWithBasehead: async () => ({ data: { status: 'diverged' } }),
                },
            },
        },
    });
    assert.deepEqual(outputs, { active: 'true' });
});

test('native payload transport authenticates reads and discards consumer writes', async t => {
    const dir = await mkdtemp(path.join(tmpdir(), 'nx-pilot-transport-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    await writeFile(path.join(dir, '12345678'), 'payload');
    const server = await cacheServer(dir);
    t.after(() => server.close());
    const url = `${server.url}/v1/cache/12345678`;
    const headers = { authorization: `Bearer ${server.token}` };
    assert.equal((await fetch(url)).status, 401);
    assert.equal(await (await fetch(url, { headers })).text(), 'payload');
    assert.equal((await fetch(url, { method: 'PUT', headers, body: 'replacement' })).status, 200);
    assert.equal(await readFile(path.join(dir, '12345678'), 'utf8'), 'payload');
    assert.equal((await fetch(`${server.url}/v1/cache/abcdef12`, { headers })).status, 404);
    assert.ok(server.events.some(e => e.operation === 'discard'));
});

test('successful selection binds the immutable artifact to the ancestor run and attempt', async t => {
    const dir = await mkdtemp(path.join(tmpdir(), 'nx-pilot-selection-'));
    const previous = process.env.RUNNER_TEMP;
    process.env.RUNNER_TEMP = dir;
    t.after(async () => {
        if (previous === undefined) delete process.env.RUNNER_TEMP;
        else process.env.RUNNER_TEMP = previous;
        await rm(dir, { recursive: true, force: true });
    });
    const outputs = {};
    const run = {
        id: 42,
        run_attempt: 2,
        conclusion: 'success',
        event: 'workflow_dispatch',
        head_branch: 'main',
        path: '.github/workflows/nx-artifact-producer.yml',
        head_sha: headSha,
        head_repository: { full_name: 'learningeconomy/LearnCard' },
        created_at: new Date().toISOString(),
    };
    await selectProducer({
        context: {
            repo: { owner: 'learningeconomy', repo: 'LearnCard' },
            payload: { merge_group: { base_sha: baseSha } },
        },
        core: {
            setOutput: (key, value) => {
                outputs[key] = value;
            },
            info() {},
            notice() {},
        },
        github: {
            rest: {
                actions: {
                    listWorkflowRuns: async () => ({ data: { workflow_runs: [run] } }),
                    listWorkflowRunArtifacts: async args => {
                        assert.equal(args.run_id, 42);
                        return {
                            data: {
                                artifacts: [
                                    {
                                        id: 7,
                                        name: 'nx-main-build-payloads',
                                        expired: false,
                                        digest: 'sha256:test',
                                    },
                                ],
                            },
                        };
                    },
                },
                repos: {
                    compareCommitsWithBasehead: async args => {
                        assert.equal(args.basehead, `${headSha}...${baseSha}`);
                        return { data: { status: 'ahead' } };
                    },
                },
            },
        },
    });
    assert.deepEqual(outputs, { active: 'true', 'run-id': '42', 'artifact-id': '7' });
    assert.deepEqual(JSON.parse(await readFile(path.join(dir, 'nx-pilot-producer.json'))), {
        runId: 42,
        runAttempt: 2,
        headSha,
        artifactId: 7,
        artifactDigest: 'sha256:test',
    });
});

test('manifest validates exact trusted run, runtime identity, three targets and payload integrity', async t => {
    const dir = await mkdtemp(path.join(tmpdir(), 'nx-pilot-manifest-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const identity = { node: 'test-runtime', lock: 'lock-digest' };
    const producer = { headSha, runId: 42, runAttempt: 1 };
    const entries = [];
    for (const [i, name] of builds.entries()) {
        const hash = `${12345678 + i}`;
        const bytes = Buffer.from(name);
        await writeFile(path.join(dir, hash), bytes);
        entries.push({ id: `${name}:build`, hash, bytes: bytes.length, sha256: digest(bytes) });
    }
    const manifest = {
        version: 1,
        identity,
        sourceSha: headSha,
        runId: '42',
        runAttempt: '1',
        entries,
    };
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    await verifyCache(dir, identity, producer);
    await assert.rejects(verifyCache(dir, { ...identity, lock: 'changed' }, producer));
    await assert.rejects(verifyCache(dir, identity, { ...producer, runId: 43 }));
    await assert.rejects(verifyCache(dir, identity, { ...producer, headSha: baseSha }));
    await writeFile(path.join(dir, entries[0].hash), 'corrupted');
    await assert.rejects(verifyCache(dir, identity, producer));
    await rm(path.join(dir, entries[0].hash));
    await symlink(path.join(dir, entries[1].hash), path.join(dir, entries[0].hash));
    await assert.rejects(verifyCache(dir, identity, producer));
});

test('policy rejects cached tests or unaudited builds; observations reject cached/missing/failed tests', () => {
    const graph = {
        tasks: {
            tasks: {
                'core:build': { id: 'core:build', target: { project: 'core', target: 'build' } },
                'core:test': { id: 'core:test', target: { project: 'core', target: 'test' } },
            },
        },
        graph: {
            nodes: {
                core: {
                    data: {
                        targets: {
                            build: { cache: true, inputs: ['sdkBuild', '^sdkBuild'] },
                            test: { cache: false },
                        },
                    },
                },
            },
        },
    };
    validatePolicy(graph);
    graph.graph.nodes.core.data.targets.test.cache = true;
    assert.throws(() => validatePolicy(graph));
    graph.graph.nodes.core.data.targets.test.cache = false;
    const tasks = [
        { id: 'core:build', status: 'remote-cache', code: 0 },
        { id: 'core:test', status: 'success', code: 0 },
    ];
    validateResults(tasks, graph);
    assert.throws(() => validateResults(tasks.slice(0, 1), graph));
    assert.throws(() => validateResults([tasks[0], { ...tasks[1], status: 'local-cache' }], graph));
    assert.throws(() => validateResults([tasks[0], { ...tasks[1], code: 1 }], graph));
});

test('workflow activates only for opted-in merge groups and publishes only from main', async () => {
    const workflow = await readFile('.github/workflows/test.yml', 'utf8');
    const producer = await readFile('.github/workflows/nx-artifact-producer.yml', 'utf8');
    assert.match(
        workflow,
        /github.event_name == 'merge_group' && vars.LC_NX_ARTIFACT_PILOT == 'true'/
    );
    assert.match(workflow, /LC_NX_PILOT_BASE: \$\{\{ github.event.merge_group.base_sha \}\}/);
    assert.match(workflow, /bunx nx affected --target=test --base=origin\/main --head=HEAD/);
    assert.match(workflow, /actions: read/);
    assert.match(producer, /if: github.ref == 'refs\/heads\/main'/);
    assert.match(producer, /workflow_dispatch:/);
    assert.doesNotMatch(producer, /pull_request_target|schedule:|push:/);
    assert.match(producer, /nx-pilot-payloads/);
    assert.doesNotMatch(producer, /\.nx-cache|node_modules\/\.cache/);
});
