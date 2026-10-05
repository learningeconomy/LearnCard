import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

for (const replaceLock of [false, true]) {
    test(`concurrent stale-lock contenders preserve the ${replaceLock ? 'replacement' : 'stale'} lock`, { timeout: 15_000 }, async () => {
        const temp = await mkdtemp(join(tmpdir(), 'oidc-lock-test-'));
        const lock = join(temp, 'learncard-oidc-e2e.lock');
        const preload = join(temp, 'barrier.mjs');
        const children = [];
        try {
            // Hold both runners after reading the old PID, reproducing the reclamation race.
            await writeFile(preload, `
                import fs from 'node:fs/promises';
                import { syncBuiltinESMExports } from 'node:module';
                import { once } from 'node:events';
                const readFile = fs.readFile;
                fs.readFile = async (...args) => {
                    const result = await readFile(...args);
                    if (String(args[0]).endsWith('learncard-oidc-e2e.lock')) {
                        const release = once(process, 'message');
                        process.send('read');
                        await release;
                        process.disconnect();
                    }
                    return result;
                };
                syncBuiltinESMExports();
            `);
            const stalePid = '2147483647';
            assert.throws(() => process.kill(Number(stalePid), 0), { code: 'ESRCH' });
            await writeFile(lock, stalePid);
            const runs = [0, 1].map(() => {
                const child = fork(new URL('./run.mjs', import.meta.url), [], {
                    execArgv: ['--import', preload],
                    env: { ...process.env, TMPDIR: temp, TMP: temp, TEMP: temp },
                    silent: true,
                });
                children.push(child);
                let output = '';
                child.stderr.on('data', chunk => { output += chunk; });
                return {
                    child,
                    ready: once(child, 'message'),
                    exited: once(child, 'exit'),
                    output: () => output,
                };
            });
            await Promise.all(runs.map(run => run.ready));
            const expected = replaceLock ? String(process.pid) : stalePid;
            if (replaceLock) {
                await rm(lock);
                await writeFile(lock, expected);
            }
            for (const run of runs) run.child.send('release');
            for (const run of runs) {
                assert.deepEqual(await run.exited, [1, null]);
                assert.match(run.output(), /Stale OIDC E2E lock at .*remove this lock manually/);
                assert.doesNotMatch(run.output(), /cleanup complete|Starting disposable/);
            }
            assert.equal(await readFile(lock, 'utf8'), expected);
        } finally {
            for (const child of children) {
                if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
            }
            await rm(temp, { recursive: true, force: true });
        }
    });
}
