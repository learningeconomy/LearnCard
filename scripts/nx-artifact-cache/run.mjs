import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir, rm, appendFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { builds, cacheServer, digest, json, verifyCache } from './transport.mjs';

const hook = 'nx-cache-pilot-observer.cjs';
const allowed = builds.map(project => `${project}:build`);

export function validatePolicy(graph) {
    for (const task of Object.values(graph.tasks.tasks)) {
        const target = graph.graph.nodes[task.target.project].data.targets[task.target.target];
        if (allowed.includes(task.id)) {
            assert.equal(target.cache, true);
            assert.deepEqual(target.inputs, ['sdkBuild', '^sdkBuild']);
        } else {
            assert.notEqual(target.cache, true, `Unaudited cacheable task: ${task.id}`);
        }
    }
}

export function validateResults(tasks, graph) {
    assert.deepEqual(tasks.map(task => task.id).sort(), Object.keys(graph.tasks.tasks).sort());
    for (const task of tasks) {
        assert.equal(task.code, 0, task.id);
        assert.ok(['success', 'remote-cache'].includes(task.status), task.id);
        if (!allowed.includes(task.id)) assert.equal(task.status, 'success', task.id);
    }
}

const command = (cwd, args, env) =>
    new Promise((resolve, reject) => {
        const child = spawn(args[0], args.slice(1), { cwd, env, stdio: 'inherit' });
        child.on('error', reject);
        child.on('close', code => resolve(code ?? 1));
    });

export async function startCache(mode, cache, start = cacheServer) {
    try {
        return await start(cache, { writable: mode === 'produce' });
    } catch (error) {
        if (mode === 'produce') throw error;
        return undefined;
    }
}

export async function runPilot(mode) {
    assert.ok(['produce', 'consume'].includes(mode));
    assert.equal(process.env.CI, 'true');
    assert.equal(process.env.GITHUB_ACTIONS, 'true');
    const workspace = process.cwd();
    const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    // A caller which freezes its test range (e.g. Deploy proof publication) must
    // observe exactly the same range we execute, not a separately selected base.
    const baseSha = process.env.NX_BASE || process.env.LC_NX_PILOT_BASE;
    assert.equal(sourceSha, process.env.GITHUB_SHA);
    if (mode === 'produce') {
        assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
        assert.equal(process.env.GITHUB_EVENT_NAME, 'workflow_dispatch');
    } else {
        assert.equal(process.env.GITHUB_EVENT_NAME, 'merge_group');
        assert.match(baseSha, /^[a-f0-9]{40}$/);
        if (process.env.NX_HEAD) assert.equal(process.env.NX_HEAD, sourceSha);
    }
    const output = path.join(process.env.RUNNER_TEMP, 'nx-pilot');
    const cache = path.join(process.env.RUNNER_TEMP, 'nx-pilot-payloads');
    await mkdir(output, { recursive: false });
    const started = performance.now();
    const timings = {};
    const phase = async (name, fn) => {
        const start = performance.now();
        try {
            return await fn();
        } finally {
            timings[name] = performance.now() - start;
        }
    };
    const env = {
        ...process.env,
        NX_DAEMON: 'false',
        NX_ISOLATE_PLUGINS: 'false',
        NX_NO_CLOUD: 'true',
        NX_CACHE_FAILURES: 'false',
        NX_TUI: 'false',
        NX_CACHE_DIRECTORY: path.join(output, 'local-cache'),
        NX_WORKSPACE_DATA_DIRECTORY: path.join(output, 'workspace-data'),
        LC_NX_PILOT_TASKS: path.join(output, 'tasks.json'),
    };
    for (const key of [
        'NX_SKIP_NX_CACHE',
        'NX_SKIP_REMOTE_CACHE',
        'NX_SELF_HOSTED_REMOTE_CACHE_SERVER',
        'NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN',
    ])
        delete env[key];
    const nx =
        mode === 'produce'
            ? ['bun', 'x', 'nx', 'run-many', '--target=build', `--projects=${builds.join(',')}`]
            : [
                  'bun',
                  'x',
                  'nx',
                  'affected',
                  '--target=test',
                  `--base=${baseSha}`,
                  `--head=${sourceSha}`,
              ];
    const original = await readFile('nx.json', 'utf8');
    let server;
    let graph;
    let producer;
    let manifest;
    let cacheState = mode === 'produce' ? 'producing' : 'unavailable';
    let exitCode = 1;
    let tasks = [];
    let hookCreated = false;
    const identity = {
        node: process.version,
        bun: execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim(),
        nx: (await json('node_modules/nx/package.json')).version,
        platform: process.platform,
        arch: process.arch,
        lock: digest(await readFile('bun.lock')),
        nodeEnv: process.env.NODE_ENV ?? '',
        nodeOptions: process.env.NODE_OPTIONS ?? '',
        observer: digest(await readFile(new URL('./observe.cjs', import.meta.url))),
        driver: digest(await readFile(fileURLToPath(import.meta.url))),
        transport: digest(await readFile(new URL('./transport.mjs', import.meta.url))),
    };
    try {
        // This uniform, relative hook changes the hashed nx.json identically for
        // publisher and consumer. No target/input/cache definitions are replaced.
        await writeFile(hook, await readFile(new URL('./observe.cjs', import.meta.url)), {
            flag: 'wx',
        });
        hookCreated = true;
        const config = JSON.parse(original);
        config.plugins = [...(config.plugins ?? []), `./${hook}`];
        await writeFile('nx.json', JSON.stringify(config));
        assert.equal(
            await phase('planMs', () =>
                command(workspace, [...nx, `--graph=${path.join(output, 'graph.json')}`], env)
            ),
            0
        );
        graph = await json(path.join(output, 'graph.json'));
        let policyValid = true;
        try {
            validatePolicy(graph);
        } catch {
            policyValid = false;
            if (mode === 'produce')
                throw new Error('Producer cache policy is outside the audited scope');
            cacheState = 'policy-mismatch';
        }
        if (mode === 'consume' && policyValid) {
            try {
                producer = await json(path.join(process.env.RUNNER_TEMP, 'nx-pilot-producer.json'));
                manifest = await phase('verifyMs', () => verifyCache(cache, identity, producer));
                cacheState = 'verified';
            } catch {
                cacheState = 'unavailable-or-incompatible';
            }
        }
        if (mode === 'produce' || cacheState === 'verified') {
            server = await startCache(mode, cache);
            if (server) {
                env.NX_SELF_HOSTED_REMOTE_CACHE_SERVER = server.url;
                env.NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN = server.token;
            } else cacheState = 'server-unavailable';
        }
        if (!server) {
            // Missing/expired/incompatible artifacts never substitute for tests.
            env.NX_SKIP_NX_CACHE = 'true';
            console.log(`Nx artifact pilot: ${cacheState}; executing without cache`);
        }
        const commandExit = await phase('commandMs', () => command(workspace, nx, env));
        if (Object.keys(graph.tasks.tasks).length) tasks = await json(env.LC_NX_PILOT_TASKS);
        if (commandExit === 0) validateResults(tasks, graph);
        exitCode = commandExit;
        if (mode === 'produce' && exitCode === 0) {
            const entries = [];
            for (const id of allowed) {
                const task = tasks.find(row => row.id === id);
                assert.equal(task?.status, 'success', `Producer must build ${id} freshly`);
                const bytes = await readFile(path.join(cache, task.hash));
                entries.push({ id, hash: task.hash, bytes: bytes.length, sha256: digest(bytes) });
            }
            manifest = {
                version: 1,
                sourceSha,
                identity,
                runId: process.env.GITHUB_RUN_ID,
                runAttempt: process.env.GITHUB_RUN_ATTEMPT,
                entries,
            };
            await writeFile(path.join(cache, 'manifest.json'), JSON.stringify(manifest));
            await verifyCache(cache, identity, {
                headSha: sourceSha,
                runId: process.env.GITHUB_RUN_ID,
                runAttempt: process.env.GITHUB_RUN_ATTEMPT,
            });
        }
        return exitCode;
    } finally {
        if (server) await server.close();
        await writeFile('nx.json', original);
        if (hookCreated) await rm(hook, { force: true });
        const coverage = [];
        // Only numeric/project coverage goes into the diagnostic artifact.
        if (process.env.LC_CI_TEST_REPORT_DIR) {
            for (const dir of await readdir(process.env.LC_CI_TEST_REPORT_DIR).catch(() => [])) {
                const report = await json(
                    path.join(process.env.LC_CI_TEST_REPORT_DIR, dir, 'report.json')
                ).catch(() => null);
                if (report)
                    coverage.push({
                        project: report.project,
                        counts: report.counts,
                        reason: report.reason,
                    });
            }
        }
        const hits = tasks.filter(t => t.status === 'remote-cache');
        const liveConsumed =
            mode === 'consume' &&
            cacheState === 'verified' &&
            exitCode === 0 &&
            tasks.some(t => t.target === 'test' && t.status === 'success') &&
            hits.length > 0 &&
            hits.every(
                t =>
                    manifest.entries.some(e => e.id === t.id && e.hash === t.hash) &&
                    server.events.some(e => e.operation === 'hit' && e.hash === t.hash)
            );
        const report = {
            version: 1,
            mode,
            event: process.env.GITHUB_EVENT_NAME,
            runId: process.env.GITHUB_RUN_ID,
            runAttempt: process.env.GITHUB_RUN_ATTEMPT,
            sourceSha,
            baseSha,
            queueBaseSha: process.env.LC_NX_PILOT_BASE,
            producer,
            cacheState,
            liveConsumed,
            exitCode,
            identity,
            productionConfigSha256: digest(original),
            runner: {
                imageOS: process.env.ImageOS,
                imageVersion: process.env.ImageVersion,
                kernel: release(),
                cpu: cpus()[0]?.model,
                cpuCount: cpus().length,
            },
            tasks,
            coverage,
            timings,
            totalMs: performance.now() - started,
            transport: server?.events ?? [],
        };
        await writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2));
        await rm(path.join(output, 'local-cache'), { recursive: true, force: true });
        await rm(path.join(output, 'workspace-data'), { recursive: true, force: true });
        if (process.env.GITHUB_STEP_SUMMARY)
            await appendFile(
                process.env.GITHUB_STEP_SUMMARY,
                `\n### Nx artifact pilot\n\nSource: \`${sourceSha}\` · event: \`${report.event}\`\n\n` +
                    `Cache: ${cacheState}; build hits: ${hits.length}; freshly executed test targets: ${tasks.filter(t => t.target === 'test' && t.status === 'success').length}.\n\n` +
                    `Live queue consumption verified: **${liveConsumed}**. Producer run: ${producer?.runId ?? 'none'}.\n`
            );
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = await runPilot(process.argv[2]);
}
