import { describe, expect, it, spyOn } from 'bun:test';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';

import {
    matchesProcess,
    processIdentity,
    runCommand,
    terminateProcess,
    waitForChildIdentity,
} from './process';

describe('verification child ownership', () => {
    it('joins an in-flight registration before cancellation removes it and reaps the child', async () => {
        const controller = new AbortController();
        const events: string[] = [];
        let childPid: number | undefined;
        let started!: () => void;
        let finishRegistration!: () => void;
        const registering = new Promise<void>(resolve => {
            started = resolve;
        });
        const registrationGate = new Promise<void>(resolve => {
            finishRegistration = resolve;
        });
        const command = runCommand(
            [
                process.execPath,
                '--no-env-file',
                '-e',
                'Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("owned") })',
            ],
            tmpdir(),
            {
                signal: controller.signal,
                timeoutMs: 5000,
                register: async pid => {
                    childPid = pid;
                    started();
                    await registrationGate;
                    events.push('registered');
                },
                unregister: async () => {
                    events.push('unregistered');
                },
            }
        ).then(
            () => undefined,
            error => error
        );
        try {
            await registering;
            const interrupted = once(controller.signal, 'abort');
            controller.abort();
            await interrupted;
            expect(events).toEqual([]);
            finishRegistration();
            const error = await command;
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain('cancelled');
            expect(events).toEqual(['registered', 'unregistered']);
            expect(processIdentity(childPid!)).toBeUndefined();
        } finally {
            finishRegistration();
            controller.abort();
            await command;
            const remaining = childPid && processIdentity(childPid);
            if (remaining) await terminateProcess(remaining);
        }
    }, 10_000);

    it('does not signal a live process using a mismatched birth identity', async () => {
        const args = [
            '--no-env-file',
            '-e',
            'Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("owned") })',
        ];
        const child = spawn(process.execPath, args, { detached: true, stdio: 'ignore' });
        const identity = await waitForChildIdentity(child.pid!, { expectedArgs: args });
        expect(identity).toBeDefined();
        try {
            await terminateProcess({
                ...identity!,
                startTime: String(BigInt(identity!.startTime) + 1n),
            });
            expect(matchesProcess(identity)).toBe(true);
        } finally {
            if (identity) await terminateProcess(identity);
        }
        expect(processIdentity(child.pid!)).toBeUndefined();
    }, 10_000);

    it('reaps a child forked after group inspection but before the termination signal', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'lc-verify-fork-'));
        const childFile = join(directory, 'child.pid');
        const args = [
            '--no-env-file',
            '-e',
            `const { writeFileSync } = require('node:fs');
             process.on('SIGUSR1', () => {
                 const child = Bun.spawn(['/bin/sleep', '60'], { stdio: ['ignore', 'ignore', 'ignore'] });
                 writeFileSync(${JSON.stringify(childFile)}, String(child.pid));
             });
             setInterval(() => {}, 1000);
             console.log('ready');`,
        ];
        const parent = spawn(process.execPath, args, {
            detached: true,
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        const originalKill = process.kill.bind(process);
        let lateChild: number | undefined;
        let killSpy: { mockRestore(): void } | undefined;
        try {
            await once(parent.stdout!, 'data');
            const identity = await waitForChildIdentity(parent.pid!, { expectedArgs: args });
            expect(identity).toBeDefined();
            killSpy = spyOn(process, 'kill').mockImplementation((pid, signal) => {
                if (
                    !lateChild &&
                    signal === 'SIGTERM' &&
                    (pid === parent.pid || pid === -parent.pid!)
                ) {
                    // Force the real fork into the inspection/signal gap, without faking its exit.
                    originalKill(parent.pid!, 'SIGUSR1');
                    const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
                    const deadline = Date.now() + 5000;
                    while (!existsSync(childFile)) {
                        if (Date.now() >= deadline)
                            throw new Error('Child fork handshake timed out');
                        Atomics.wait(waitBuffer, 0, 0, 10);
                    }
                    lateChild = Number(readFileSync(childFile, 'utf8'));
                    expect(Number.isSafeInteger(lateChild) && lateChild > 1).toBe(true);
                }
                return originalKill(pid, signal);
            });
            await terminateProcess(identity!);
            expect(lateChild).toBeDefined();
            const deadline = Date.now() + 1000;
            while (processIdentity(lateChild!) && Date.now() < deadline) await Bun.sleep(10);
            expect(processIdentity(lateChild!)).toBeUndefined();
        } finally {
            killSpy?.mockRestore();
            const remainingParent = processIdentity(parent.pid!);
            if (remainingParent) await terminateProcess(remainingParent);
            if (!lateChild && existsSync(childFile))
                lateChild = Number(readFileSync(childFile, 'utf8'));
            const remainingChild = lateChild ? processIdentity(lateChild) : undefined;
            if (remainingChild) await terminateProcess(remainingChild);
            await rm(directory, { recursive: true, force: true });
        }
    }, 10_000);

    it('retains command failure when registry cleanup also fails', async () => {
        const cleanup = new Error('registry cleanup failed');
        const error = await runCommand(
            [process.execPath, '--no-env-file', '-e', 'process.exit(7)'],
            tmpdir(),
            {
                unregister: async () => {
                    throw cleanup;
                },
            }
        ).then(
            () => undefined,
            error => error
        );
        expect(error).toBeInstanceOf(AggregateError);
        expect(error.errors.some((failure: Error) => failure.message.includes('exited 7'))).toBe(
            true
        );
        expect(error.errors).toContain(cleanup);
    });
});
