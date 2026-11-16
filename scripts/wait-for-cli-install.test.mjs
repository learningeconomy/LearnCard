import assert from 'node:assert/strict';
import test from 'node:test';

import { npmPublicationPending, waitForCliInstall } from './wait-for-cli-install.mjs';

const packageSpec = '@learncard/cli@9.8.7';

test('recognizes only npm publication errors as retryable', () => {
    assert(
        npmPublicationPending({
            stderr: 'FAIL: `learncard --version` exited 1: npm error code ETARGET',
        })
    );
    assert(npmPublicationPending({ stderr: 'npm ERR! code E404' }));
    assert(!npmPublicationPending({ stderr: 'npm error code E401' }));
    assert(!npmPublicationPending({ stderr: 'CLI verification failed' }));
});

test('retries a cold install with a fresh child process after npm propagation lag', async () => {
    let time = 0;
    let attempts = 0;
    const waits = [];
    const logs = [];
    const invocations = [];

    await waitForCliInstall({
        packageSpec,
        timeoutMs: 1000,
        pollIntervalMs: 10,
        now: () => time,
        wait: async delay => {
            waits.push(delay);
            time += delay;
        },
        log: message => logs.push(message),
        writeOutput: () => {},
        writeError: () => {},
        run: (command, args, options) => {
            invocations.push({ command, args, options });
            attempts += 1;
            return attempts === 1
                ? { status: 1, stderr: 'FAIL: npm error code ETARGET' }
                : { status: 0, stdout: 'OK: cold install' };
        },
    });

    assert.equal(attempts, 2);
    assert.deepEqual(waits, [10]);
    assert.deepEqual(invocations[0].args.at(-1), `--package=${packageSpec}`);
    assert.equal(invocations.length, 2);
    assert.match(logs.join('\n'), /publication is not ready/);
});

test('does not retry a real CLI failure or a local tarball', async () => {
    let attempts = 0;
    await assert.rejects(
        waitForCliInstall({
            packageSpec,
            run: () => {
                attempts += 1;
                return { status: 1, stderr: 'FAIL: credential verification failed' };
            },
            writeOutput: () => {},
            writeError: () => {},
            log: () => {},
        }),
        /not a registry-readiness error/
    );
    assert.equal(attempts, 1);

    await assert.rejects(
        waitForCliInstall({ packageSpec: 'file:/tmp/learncard-cli.tgz' }),
        /exact public @learncard\/cli version/
    );
});

test('bounds retry time for a version that never becomes available', async () => {
    let time = 0;
    let attempts = 0;
    const waits = [];
    await assert.rejects(
        waitForCliInstall({
            packageSpec,
            timeoutMs: 25,
            pollIntervalMs: 10,
            now: () => time,
            wait: async delay => {
                waits.push(delay);
                time += delay;
            },
            run: () => {
                attempts += 1;
                return { status: 1, stderr: 'npm error code ETARGET' };
            },
            writeOutput: () => {},
            writeError: () => {},
            log: () => {},
        }),
        /Timed out waiting/
    );
    assert.equal(attempts, 3);
    assert.deepEqual(waits, [10, 10, 5]);
});
