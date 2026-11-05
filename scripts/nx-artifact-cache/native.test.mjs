import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, readdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { builds } from './transport.mjs';

const repo = process.cwd();

test(
    'native build producer feeds affected-test dependencies; misses and failures still execute',
    { timeout: 120_000 },
    async t => {
        const root = await mkdtemp(path.join(tmpdir(), 'nx-artifact-native-'));
        t.after(() => rm(root, { recursive: true, force: true }));
        const cwd = path.join(root, 'workspace');
        const put = async (file, contents) => {
            const target = path.join(cwd, file);
            await mkdir(path.dirname(target), { recursive: true });
            await writeFile(target, contents);
        };
        await put('package.json', JSON.stringify({ private: true, workspaces: ['packages/*'] }));
        await symlink(path.join(repo, 'node_modules'), path.join(cwd, 'node_modules'), 'dir');
        await put('.gitignore', 'node_modules\n.nx\n**/dist\n');
        for (const file of ['bun.lock', '.nvmrc', 'bunfig.toml', 'tsconfig.base.json']) {
            await put(file, await readFile(path.join(repo, file)));
        }
        const config = JSON.parse(await readFile(path.join(repo, 'nx.json')));
        await put('nx.json', JSON.stringify(config));
        await put(
            'probe.cjs',
            `
        const fs = require('node:fs');
        const path = require('node:path');
        const action = process.argv[2];
        const name = path.basename(process.cwd());
        const count = path.join(process.env.PROBE_COUNTS, name + '-' + action);
        fs.writeFileSync(count, String(fs.existsSync(count) ? Number(fs.readFileSync(count)) + 1 : 1));
        const source = fs.readFileSync('src/index.ts', 'utf8');
        if (action === 'build') {
            fs.mkdirSync('dist', { recursive: true }); fs.writeFileSync('dist/output', source);
        } else {
            require('node:assert/strict').equal(fs.readFileSync('dist/output', 'utf8'), source);
            if (process.env.PROBE_BREAK_OBSERVATION === '1') {
                fs.mkdirSync(path.join(process.env.RUNNER_TEMP, 'nx-pilot/tasks.json'), { recursive: true });
            }
            if (process.env.PROBE_FAIL === '1') process.exit(1);
        }
    `
        );
        for (const name of builds) {
            await put(
                `packages/${name}/package.json`,
                JSON.stringify({ name: `@pilot/${name}`, version: '1.0.0' })
            );
            await put(`packages/${name}/src/index.ts`, `export const name = '${name}';\n`);
            await put(
                `packages/${name}/project.json`,
                JSON.stringify({
                    name,
                    implicitDependencies:
                        name === 'core' ? ['helpers'] : name === 'helpers' ? ['types'] : [],
                    targets: {
                        build: {
                            executor: 'nx:run-commands',
                            cache: true,
                            inputs: ['sdkBuild', '^sdkBuild'],
                            options: {
                                command: 'node ../../probe.cjs build',
                                cwd: `packages/${name}`,
                            },
                        },
                        test: {
                            executor: 'nx:run-commands',
                            cache: false,
                            dependsOn: ['build', '^build'],
                            options: {
                                command: 'node ../../probe.cjs test',
                                cwd: `packages/${name}`,
                            },
                        },
                    },
                })
            );
        }
        const git = (...args) =>
            execFileSync('git', args, {
                cwd,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            }).trim();
        git('init', '-b', 'main');
        const commit = () => {
            git('add', '.');
            git(
                '-c',
                'user.name=Fixture',
                '-c',
                'user.email=fixture@example.invalid',
                '-c',
                'core.hooksPath=/dev/null',
                '-c',
                'commit.gpgsign=false',
                'commit',
                '-m',
                'fixture'
            );
        };
        commit();
        const base = git('rev-parse', 'HEAD');
        const counts = path.join(root, 'counts');
        await mkdir(counts);
        let attempt = 0;
        const driver = path.join(repo, 'scripts/nx-artifact-cache/run.mjs');
        const run = async (
            mode,
            { artifact, fail = false, breakPlan = false, breakObservation = false } = {}
        ) => {
            const runnerTemp = path.join(root, `runner-${++attempt}`);
            await mkdir(runnerTemp);
            if (artifact) {
                await cp(artifact, path.join(runnerTemp, 'nx-pilot-payloads'), { recursive: true });
                await writeFile(
                    path.join(runnerTemp, 'nx-pilot-producer.json'),
                    JSON.stringify({
                        headSha: base,
                        runId: '101',
                        runAttempt: '1',
                        artifactId: 1,
                    })
                );
            }
            const env = {
                ...process.env,
                CI: 'true',
                GITHUB_ACTIONS: 'true',
                GITHUB_EVENT_NAME: mode === 'produce' ? 'workflow_dispatch' : 'merge_group',
                GITHUB_REF: 'refs/heads/main',
                GITHUB_SHA: git('rev-parse', 'HEAD'),
                GITHUB_RUN_ID: mode === 'produce' ? '101' : String(101 + attempt),
                GITHUB_RUN_ATTEMPT: '1',
                RUNNER_TEMP: runnerTemp,
                LC_NX_PILOT_BASE: base,
                PROBE_COUNTS: counts,
                PROBE_FAIL: fail ? '1' : '0',
                PROBE_BREAK_OBSERVATION: breakObservation ? '1' : '0',
            };
            if (breakPlan) {
                const bin = path.join(runnerTemp, 'bin');
                await mkdir(bin);
                const bun = execFileSync('which', ['bun'], { encoding: 'utf8' }).trim();
                await writeFile(
                    path.join(bin, 'bun'),
                    '#!/usr/bin/env node\n' +
                        `if (process.argv.some(arg => arg.startsWith('--graph='))) process.exit(1);\n` +
                        `const r = require('node:child_process').spawnSync(${JSON.stringify(bun)}, process.argv.slice(2), {stdio:'inherit'}); process.exit(r.status ?? 1);\n`,
                    { mode: 0o755 }
                );
                env.PATH = `${bin}${path.delimiter}${env.PATH}`;
            }
            for (const key of [
                'NX_BASE',
                'NX_HEAD',
                'GITHUB_STEP_SUMMARY',
                'LC_CI_TEST_REPORT_DIR',
            ])
                delete env[key];
            let output = '';
            const code = await new Promise((resolve, reject) => {
                const child = spawn(process.execPath, [driver, mode], { cwd, env });
                child.stdout.on('data', data => {
                    output += data;
                });
                child.stderr.on('data', data => {
                    output += data;
                });
                child.on('error', reject);
                child.on('close', resolve);
            });
            const report = JSON.parse(
                await readFile(path.join(runnerTemp, 'nx-pilot/result.json'))
            );
            assert.deepEqual(JSON.parse(await readFile(path.join(cwd, 'nx.json'))), config);
            return {
                code,
                output,
                tasks: report.tasks,
                report,
                artifact: path.join(runnerTemp, 'nx-pilot-payloads'),
            };
        };
        const produced = await run('produce');
        assert.equal(produced.code, 0, produced.output);
        assert.equal(produced.tasks.length, 3);
        const originalFiles = await readdir(produced.artifact);
        for (const name of builds)
            await rm(path.join(cwd, 'packages', name, 'dist'), { recursive: true });
        await put('packages/core/tests/marker.txt', 'test-only change');
        commit();
        const warm = await run('consume', { artifact: produced.artifact });
        assert.equal(warm.code, 0, warm.output);
        assert.equal(warm.report.liveConsumed, true);
        assert.equal(warm.report.producer.runId, '101');
        for (const task of produced.tasks) {
            const restored = warm.tasks.find(row => row.id === task.id);
            assert.equal(restored.status, 'remote-cache', task.id);
            assert.equal(restored.hash, task.hash, task.id);
        }
        assert.equal(warm.tasks.find(row => row.id === 'core:test').status, 'success');
        assert.equal(await readFile(path.join(counts, 'core-build'), 'utf8'), '1');
        assert.equal(await readFile(path.join(counts, 'core-test'), 'utf8'), '1');
        const cold = await run('consume');
        assert.equal(cold.code, 0, cold.output);
        assert.equal(cold.report.liveConsumed, false);
        assert.equal(cold.report.cacheState, 'unavailable-or-incompatible');
        assert.ok(cold.tasks.every(task => task.status === 'success'));
        assert.equal(await readFile(path.join(counts, 'core-test'), 'utf8'), '2');
        const unobserved = await run('consume', {
            artifact: produced.artifact,
            breakObservation: true,
        });
        assert.equal(unobserved.code, 0, unobserved.output);
        assert.equal(unobserved.report.cacheState, 'observation-unavailable');
        assert.equal(unobserved.report.liveConsumed, false);
        const unplanned = await run('consume', { artifact: produced.artifact, breakPlan: true });
        assert.equal(unplanned.code, 0, unplanned.output);
        assert.equal(unplanned.report.cacheState, 'plan-unavailable');
        assert.equal(unplanned.report.liveConsumed, false);
        const countBefore = Number(await readFile(path.join(counts, 'core-test'), 'utf8'));
        const failedFallback = await run('consume', { breakPlan: true, fail: true });
        assert.notEqual(failedFallback.code, 0);
        assert.equal(failedFallback.report.liveConsumed, false);
        assert.equal(
            Number(await readFile(path.join(counts, 'core-test'), 'utf8')),
            countBefore + 1
        );
        await put('packages/types/src/index.ts', 'export const changed = true;\n');
        commit();
        const changed = await run('consume', { artifact: produced.artifact });
        assert.equal(changed.code, 0, changed.output);
        assert.ok(changed.tasks.every(task => task.status === 'success'));
        assert.deepEqual(await readdir(changed.artifact), originalFiles);
        assert.ok(changed.report.transport.some(row => row.operation === 'discard'));
        assert.equal(changed.report.liveConsumed, false);
        const failed = await run('consume', { artifact: produced.artifact, fail: true });
        assert.notEqual(failed.code, 0);
        assert.equal(failed.report.liveConsumed, false);
        assert.ok(failed.tasks.some(task => task.target === 'test' && task.code !== 0));
    }
);
