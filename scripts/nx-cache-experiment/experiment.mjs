import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, readdir, lstat, rm } from 'node:fs/promises';
import path from 'node:path';
import { cpus, release } from 'node:os';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

export const projects = ['core', 'types', 'helpers', 'vc-plugin', 'init', 'credential-library'];
export const builds = ['core', 'types', 'helpers'];
const hashPattern = /^[a-f0-9]{8,64}$/;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async file => JSON.parse(await readFile(file, 'utf8'));

// This endpoint lives only on the owned runner. Its files are Nx's native task
// archives; transport is a GitHub artifact, not a copied local cache database.
export async function cacheServer(
    directory,
    { writable = false, token = randomBytes(24).toString('hex') } = {}
) {
    await mkdir(directory, { recursive: true });
    const events = [];
    const server = createServer(async (request, response) => {
        try {
            if (request.headers.authorization !== `Bearer ${token}`) {
                response.writeHead(401).end();
                return;
            }
            const hash = /^\/v1\/cache\/([a-f0-9]{8,64})$/.exec(request.url)?.[1];
            if (!hash || !['GET', 'PUT'].includes(request.method)) {
                response.writeHead(404).end();
                return;
            }
            const file = path.join(directory, hash);
            if (request.method === 'GET') {
                try {
                    assert.ok((await lstat(file)).isFile());
                    const bytes = await readFile(file);
                    events.push({ hash, operation: 'hit', bytes: bytes.length });
                    response.writeHead(200, { 'Content-Length': bytes.length }).end(bytes);
                } catch {
                    events.push({ hash, operation: 'miss' });
                    response.writeHead(404).end();
                }
                return;
            }
            const length = Number(request.headers['content-length']);
            if (!Number.isSafeInteger(length) || length <= 0 || length > 128 * 1024 * 1024) {
                response.writeHead(413).end();
                return;
            }
            const chunks = [];
            let received = 0;
            for await (const chunk of request) {
                received += chunk.length;
                if (received > length) throw new Error('Oversized upload');
                if (writable) chunks.push(chunk);
            }
            assert.equal(received, length);
            if (writable) {
                assert.ok(events.filter(row => row.operation === 'store').length < 10);
                await writeFile(file, Buffer.concat(chunks), { flag: 'wx' });
            }
            // Accept-and-discard consumer writes: a miss can rebuild normally,
            // without modifying or re-exporting the shared producer artifact.
            events.push({ hash, operation: writable ? 'store' : 'discard', bytes: length });
            response.writeHead(200).end();
        } catch {
            response.writeHead(500).end();
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return {
        url: `http://127.0.0.1:${server.address().port}`,
        token,
        events,
        close: () => new Promise(resolve => server.close(resolve)),
    };
}

const command = (cwd, args, env, log) =>
    new Promise((resolve, reject) => {
        const child = spawn(args[0], args.slice(1), {
            cwd,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        child.on('error', reject);
        for (const stream of [child.stdout, child.stderr])
            stream.on('data', bytes => {
                process.stdout.write(bytes);
                log.push(bytes);
            });
        child.on('close', code =>
            code === 0 ? resolve() : reject(new Error(`Command exited ${code}`))
        );
    });

export function validateTasks(
    tasks,
    mode,
    expected = [
        ...projects.map(project => `${project}:test`),
        ...builds.map(project => `${project}:build`),
    ]
) {
    expected = [...expected].sort();
    assert.deepEqual(tasks.map(task => task.id).sort(), expected);
    for (const task of tasks) {
        assert.equal(task.code, 0, task.id);
        assert.ok(hashPattern.test(task.hash));
        assert.ok(['success', 'remote-cache'].includes(task.status), task.id);
        if (
            !builds.some(name => task.id === `${name}:build`) ||
            ['producer', 'off', 'cold'].includes(mode)
        ) {
            assert.equal(task.status, 'success', `${task.id} must execute freshly`);
        }
    }
}

export function validateCoverage(coverage, expectedRoots) {
    assert.deepEqual(
        coverage.map(row => row.project).sort(),
        [...expectedRoots].sort(),
        'Every expected test project must report exactly once'
    );
}

export async function verifyCache(directory, identity) {
    const manifest = await json(path.join(directory, 'manifest.json'));
    assert.deepEqual(manifest.identity, identity, 'Toolchain/lockfile differs: reject this cache');
    assert.equal(manifest.version, 1);
    assert.match(manifest.sourceSha, /^[a-f0-9]{40}$/);
    assert.equal(manifest.sourceBranch, 'main');
    assert.equal(manifest.entries.length, builds.length);
    assert.equal(new Set(manifest.entries.map(entry => entry.hash)).size, builds.length);
    assert.deepEqual(
        manifest.entries.map(entry => entry.id).sort(),
        builds.map(name => `${name}:build`).sort()
    );
    assert.deepEqual(
        (await readdir(directory)).sort(),
        ['manifest.json', ...manifest.entries.map(entry => entry.hash)].sort()
    );
    for (const entry of manifest.entries) {
        assert.ok(hashPattern.test(entry.hash));
        const file = path.join(directory, entry.hash);
        assert.ok((await lstat(file)).isFile() && !(await lstat(file)).isSymbolicLink());
        const bytes = await readFile(file);
        assert.equal(bytes.length, entry.bytes);
        assert.equal(digest(bytes), entry.sha256);
    }
    return manifest;
}

export async function experiment({ workspace, output, cache, mode }) {
    assert.ok(
        [
            'producer',
            'off',
            'cold',
            'warm',
            'invalidate-source',
            'invalidate-config',
            'invalidate-lock',
        ].includes(mode)
    );
    workspace = path.resolve(workspace);
    output = path.resolve(output);
    cache = path.resolve(cache);
    // Never patch the agent's/shared developer checkout. Hosted workspaces are disposable.
    assert.equal(process.env.CI, 'true', 'Use a disposable CI workspace');
    await mkdir(output, { recursive: false });
    const started = performance.now();
    const timings = {};
    const originals = new Map();
    let server;
    const env = {
        ...process.env,
        NX_DAEMON: 'false',
        NX_ISOLATE_PLUGINS: 'false',
        NX_NO_CLOUD: 'true',
        NX_CACHE_FAILURES: 'false',
        NX_TUI: 'false',
        LC_CI_TEST_RETRY: '1',
        LC_CI_TEST_REPORT_DIR: path.join(output, 'retry-reports'),
        LC_NX_EXPERIMENT_TASKS: path.join(output, 'tasks.json'),
    };
    for (const name of [
        'NX_SKIP_NX_CACHE',
        'NX_SKIP_REMOTE_CACHE',
        'NX_SELF_HOSTED_REMOTE_CACHE_SERVER',
        'NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN',
        'NX_CACHE_DIRECTORY',
    ])
        delete env[name];
    env.NX_CACHE_DIRECTORY = path.join(output, 'local-cache');
    if (mode === 'off') env.NX_SKIP_NX_CACHE = 'true';
    const logs = [];
    const nx = ['bun', 'x', 'nx', 'run-many', '-t', 'test', '-p', projects.join(',')];
    const phase = async (name, run) => {
        const start = performance.now();
        try {
            return await run();
        } finally {
            timings[name] = performance.now() - start;
        }
    };
    const edit = async (file, transform) => {
        file = path.join(workspace, file);
        const original = await readFile(file, 'utf8');
        originals.set(file, original);
        await writeFile(file, transform(original));
    };
    try {
        await phase('planMs', () =>
            command(workspace, [...nx, `--graph=${path.join(output, 'graph.json')}`], env, logs)
        );
        const graph = await json(path.join(output, 'graph.json'));
        const expectedTasks = Object.keys(graph.tasks.tasks);
        assert.ok(
            expectedTasks.length > projects.length,
            'A representative graph must build dependencies'
        );
        const cacheable = Object.values(graph.tasks.tasks).filter(task => {
            const target = graph.graph.nodes[task.target.project].data.targets[task.target.target];
            if (task.target.target === 'test')
                assert.equal(target.cache, false, 'Never cache test success');
            return target.cache === true;
        });
        assert.deepEqual(
            cacheable.map(task => task.id).sort(),
            builds.map(name => `${name}:build`).sort(),
            'Only production-audited SDK tasks may cache'
        );
        for (const task of cacheable) {
            assert.deepEqual(graph.graph.nodes[task.target.project].data.targets.build.inputs, [
                'sdkBuild',
                '^sdkBuild',
            ]);
        }
        const productionConfigSha256 = digest(await readFile(path.join(workspace, 'nx.json')));
        const identity = {
            node: process.version,
            bun: (await import('node:child_process'))
                .execFileSync('bun', ['--version'], { encoding: 'utf8' })
                .trim(),
            nx: (await json(path.join(workspace, 'node_modules/nx/package.json'))).version,
            platform: process.platform,
            arch: process.arch,
            lock: digest(await readFile(path.join(workspace, 'bun.lock'))),
        };
        // Observe using the supported hook. Its stable relative path is identical
        // in every arm: nx.json itself is a production sdkBuild input. Do not put
        // runner-specific absolute paths into this hashed configuration.
        const hook = 'nx-cache-observer.cjs';
        await writeFile(
            path.join(workspace, hook),
            await readFile(new URL('./results.cjs', import.meta.url)),
            { flag: 'wx' }
        );
        await edit('nx.json', original => {
            const config = JSON.parse(original);
            config.plugins = [...(config.plugins ?? []), `./${hook}`];
            return JSON.stringify(config);
        });
        const observedConfigSha256 = digest(await readFile(path.join(workspace, 'nx.json')));
        if (mode === 'warm' || mode.startsWith('invalidate-'))
            await phase('verifyMs', () => verifyCache(cache, identity));
        const probes = {
            'invalidate-source': 'packages/learn-card-types/src/index.ts',
            'invalidate-config': 'packages/learn-card-core/tsconfig.build.json',
            'invalidate-lock': 'bun.lock',
        };
        if (probes[mode]) await edit(probes[mode], original => `${original}\n`);
        if (mode !== 'off') {
            server = await cacheServer(cache, { writable: ['producer', 'cold'].includes(mode) });
            env.NX_SELF_HOSTED_REMOTE_CACHE_SERVER = server.url;
            env.NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN = server.token;
        }
        await phase('commandMs', () => command(workspace, nx, env, logs));
        const tasks = await json(env.LC_NX_EXPERIMENT_TASKS);
        validateTasks(tasks, mode, expectedTasks);
        const reports = await readdir(env.LC_CI_TEST_REPORT_DIR);
        assert.equal(
            reports.length,
            projects.length,
            'Every Vitest process must report fresh coverage'
        );
        const coverage = [];
        for (const directory of reports) {
            const report = await json(
                path.join(env.LC_CI_TEST_REPORT_DIR, directory, 'report.json')
            );
            assert.equal(report.reason, 'passed');
            assert.equal(report.failedModules + report.unhandledErrors + report.counts.failed, 0);
            coverage.push({ project: report.project, counts: report.counts });
        }
        validateCoverage(
            coverage,
            projects.map(name => graph.graph.nodes[name].data.root)
        );
        if (mode === 'producer') {
            assert.equal(process.env.LC_NX_PRODUCER_BRANCH, 'main');
            const entries = [];
            for (const task of tasks.filter(task =>
                builds.some(name => task.id === `${name}:build`)
            )) {
                const bytes = await readFile(path.join(cache, task.hash));
                entries.push({
                    id: task.id,
                    hash: task.hash,
                    bytes: bytes.length,
                    sha256: digest(bytes),
                });
            }
            await writeFile(
                path.join(cache, 'manifest.json'),
                JSON.stringify({
                    version: 1,
                    identity,
                    sourceBranch: 'main',
                    sourceSha: process.env.LC_NX_SOURCE_SHA,
                    entries,
                })
            );
            await verifyCache(cache, identity);
        }
        const result = {
            mode,
            sourceSha: process.env.LC_NX_SOURCE_SHA,
            sourceRef: process.env.LC_NX_SOURCE_REF,
            originRunId: process.env.LC_NX_ORIGIN_RUN_ID || undefined,
            identity,
            productionConfigSha256,
            observedConfigSha256,
            runner: {
                imageOS: process.env.ImageOS,
                imageVersion: process.env.ImageVersion,
                kernel: release(),
                cpu: cpus()[0]?.model,
                cpuCount: cpus().length,
            },
            tasks,
            coverage: coverage.sort((a, b) => a.project.localeCompare(b.project)),
            graph: graph.tasks.dependencies,
            timings,
            totalMs: performance.now() - started,
            transport: server?.events ?? [],
        };
        await writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
        console.log(
            JSON.stringify({
                mode,
                timings,
                freshTests: projects.length,
                buildHits: tasks.filter(task => task.status === 'remote-cache').length,
            })
        );
    } finally {
        if (server) await server.close();
        for (const [file, original] of originals) await writeFile(file, original);
        await rm(path.join(workspace, 'nx-cache-observer.cjs'), { force: true });
        // Local databases/results are deliberately never exported with payloads.
        await rm(path.join(output, 'local-cache'), { recursive: true, force: true });
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const args = Object.fromEntries(
        process.argv
            .slice(2)
            .map((value, index, all) => (index % 2 === 0 ? [value.slice(2), all[index + 1]] : null))
            .filter(Boolean)
    );
    await experiment(args);
}
