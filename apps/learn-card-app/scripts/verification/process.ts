import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, readdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { z } from 'zod';

export interface ProcessIdentity {
    pid: number;
    startTime: string;
    bootId: string;
    commandHash: string;
    uid: number;
    group: number;
}

export const ProcessIdentitySchema = z.object({
    pid: z.number().int().min(2),
    startTime: z.string().regex(/^\d+$/),
    bootId: z.string().uuid(),
    commandHash: z.string().regex(/^[a-f0-9]{64}$/),
    uid: z.number().int().nonnegative(),
    group: z.number().int().min(1),
});
/** Linux birth identity plus exact command fingerprint; a PID alone never grants ownership. */
export const processIdentity = (pid: number): ProcessIdentity | undefined => {
    if (!Number.isSafeInteger(pid) || pid <= 1) return undefined;
    try {
        const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
        const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
        if (fields[0] === 'Z' || fields[0] === 'X') return undefined;
        const uid = Number(/^Uid:\s+(\d+)/m.exec(readFileSync(`/proc/${pid}/status`, 'utf8'))?.[1]);
        const command = readFileSync(`/proc/${pid}/cmdline`);
        if (!command.length || !Number.isSafeInteger(uid)) return undefined;
        return {
            pid,
            startTime: fields[19]!,
            bootId: readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(),
            commandHash: createHash('sha256').update(command).digest('hex'),
            uid,
            group: Number(fields[2]),
        };
    } catch {
        return undefined;
    }
};

export const matchesProcess = (saved: ProcessIdentity | undefined): boolean => {
    if (!saved || saved.uid !== process.getuid?.()) return false;
    const current = processIdentity(saved.pid);
    return Boolean(
        current &&
        current.startTime === saved.startTime &&
        current.bootId === saved.bootId &&
        current.commandHash === saved.commandHash &&
        current.uid === saved.uid &&
        current.group === saved.group
    );
};

export const isDirectChild = (pid: number): boolean => {
    try {
        const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
        return Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]) === process.pid;
    } catch {
        return false;
    }
};

/**
 * Bun's spawn event can precede exec-visible /proc cmdline. Wait for a direct child's
 * birth identity, rather than mistaking that transient gap for process exit.
 */
export const waitForChildIdentity = async (
    pid: number,
    options: {
        timeoutMs?: number;
        expectedArgs?: readonly string[];
        hasExited?: () => boolean;
    } = {}
): Promise<ProcessIdentity | undefined> => {
    const deadline = Date.now() + (options.timeoutMs ?? 3000);
    const parentHash = processIdentity(process.pid)?.commandHash;
    while (Date.now() < deadline) {
        if (options.hasExited?.()) return undefined;
        const saved = processIdentity(pid);
        if (saved) {
            if (!isDirectChild(pid) || saved.uid !== process.getuid?.()) {
                if (!processIdentity(pid)) return undefined;
                throw new Error(`Process ${pid} is not a verified direct child.`);
            }
            let args: string[];
            try {
                args = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').slice(0, -1);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
                return undefined;
            }
            const expected = options.expectedArgs;
            if (
                saved.commandHash !== parentHash &&
                (!expected ||
                    (args.length >= expected.length &&
                        expected.every(
                            (arg, index) => args[args.length - expected.length + index] === arg
                        )))
            ) {
                // Re-read after cmdline: an exec must not produce a mixed birth/fingerprint record.
                if (matchesProcess(saved)) return saved;
            }
        } else {
            try {
                const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
                const status = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[0];
                if (status === 'Z' || status === 'X') return undefined;
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
                try {
                    process.kill(pid, 0);
                } catch (missing) {
                    if ((missing as NodeJS.ErrnoException).code === 'ESRCH') return undefined;
                    throw missing;
                }
            }
        }
        await sleep(10);
    }
    throw new Error(
        `Child ${pid} is still present but its exec identity was unavailable after ${options.timeoutMs ?? 3000}ms; refusing to assume it exited.`
    );
};

/** Signal owned detached sessions atomically; keep verified members for leader-exit recovery. */
export const terminateProcess = async (saved: ProcessIdentity, graceMs = 3000): Promise<void> => {
    const owned: ProcessIdentity[] = [saved];
    if (saved.group === saved.pid && matchesProcess(saved)) {
        for (const pid of readdirSync('/proc')) {
            if (!/^\d+$/.test(pid) || Number(pid) === saved.pid) continue;
            const member = processIdentity(Number(pid));
            if (
                member?.group === saved.group &&
                member.uid === saved.uid &&
                member.bootId === saved.bootId &&
                BigInt(member.startTime) >= BigInt(saved.startTime)
            )
                owned.push(member);
        }
    }
    const signal = (name: NodeJS.Signals) => {
        if (saved.group === saved.pid && matchesProcess(saved)) {
            try {
                const stat = readFileSync(`/proc/${saved.pid}/stat`, 'utf8');
                const session = Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[3]);
                // Only our detached session can own this group. A per-PID snapshot misses
                // children forked by wrappers (notably docker/buildx) before the signal.
                if (session === saved.pid && matchesProcess(saved)) {
                    process.kill(-saved.group, name);
                    return;
                }
            } catch (error) {
                const code = (error as NodeJS.ErrnoException).code;
                if (code !== 'ENOENT' && code !== 'ESRCH') throw error;
            }
        }
        // Children first: a wrapper exiting early must not leave its existing children untracked.
        for (const member of [...owned].reverse()) {
            if (!matchesProcess(member)) continue;
            try {
                process.kill(member.pid, name);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
            }
        }
    };
    signal('SIGTERM');
    const deadline = Date.now() + graceMs;
    while (owned.some(matchesProcess) && Date.now() < deadline) await sleep(50);
    signal('SIGKILL');
    const killDeadline = Date.now() + 3000;
    while (owned.some(matchesProcess) && Date.now() < killDeadline) await sleep(50);
    if (owned.some(matchesProcess))
        throw new Error(
            `Owned process ${saved.pid} or its children did not exit after SIGKILL; retain its registration for recovery.`
        );
};

export const cleanEnvironment = (): NodeJS.ProcessEnv => ({
    NODE_ENV: 'development',
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    USER: process.env.USER,
    TMPDIR: process.env.TMPDIR,
    SKIP_DIDKIT_NAPI: '1',
});

export interface CommandOptions {
    signal?: AbortSignal;
    timeoutMs?: number;
    log?: string;
    register?: (pid: number) => Promise<void>;
    unregister?: (pid: number) => Promise<void>;
}

/** Every external operation is bounded, cancellation-aware and keeps diagnostics on disk. */
export const runCommand = async (
    args: string[],
    cwd: string,
    options: CommandOptions = {}
): Promise<string> => {
    options.signal?.throwIfAborted();
    const fd = options.log ? openSync(options.log, 'a', 0o600) : undefined;
    try {
        // Operational calls are pinned even if the user's current-context file changes mid-run.
        // Context metadata checks must remain unpinned so alternate contexts are rejected.
        const commandArgs =
            args[0] === 'docker' && args[1] !== 'context'
                ? ['--host', 'unix:///var/run/docker.sock', ...args.slice(1)]
                : args.slice(1);
        const child = spawn(args[0]!, commandArgs, {
            cwd,
            env: cleanEnvironment(),
            detached: true,
            stdio: ['ignore', fd ?? 'pipe', fd ?? 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        const limit = 4 * 1024 * 1024;
        child.stdout?.on('data', chunk => {
            stdout = (stdout + String(chunk)).slice(-limit);
        });
        child.stderr?.on('data', chunk => {
            stderr = (stderr + String(chunk)).slice(-limit);
        });
        let childExited = false;
        const exited = new Promise<number | null>((resolve, reject) => {
            child.once('error', error => {
                childExited = true;
                reject(error);
            });
            child.once('exit', code => {
                childExited = true;
                resolve(code);
            });
        });
        // Attach a handler immediately: spawn/registration can fail before the exit await.
        void exited.catch(() => undefined);
        if (!child.pid)
            return await exited.then(() => {
                throw new Error(`Could not spawn ${args[0]}`);
            });
        let saved: ProcessIdentity | undefined;
        let rejectCancellation: (error: Error) => void = () => {};
        const cancelled = new Promise<never>((_resolve, reject) => {
            rejectCancellation = reject;
        });
        void cancelled.catch(() => undefined);
        const cancel = () =>
            rejectCancellation(
                new Error(
                    `${args.slice(0, 4).join(' ')} ${options.signal?.aborted ? 'cancelled' : 'timed out'}${options.log ? `; see ${options.log}` : ''}`
                )
            );
        const timer = setTimeout(cancel, options.timeoutMs ?? 30_000);
        options.signal?.addEventListener('abort', cancel, { once: true });
        // Join this ownership transaction on every path. Cancellation must never let a
        // late registry write happen after unregister/teardown.
        const registration = (async () => {
            saved = await waitForChildIdentity(child.pid!, {
                expectedArgs: commandArgs,
                hasExited: () => childExited,
            });
            if (saved) await options.register?.(child.pid!);
        })();
        void registration.catch(() => undefined);
        const failures: unknown[] = [];
        try {
            if (options.signal?.aborted) cancel();
            await Promise.race([registration, cancelled]);
            const code = await Promise.race([exited, cancelled]);
            if (code !== 0)
                throw new Error(
                    `${args.slice(0, 6).join(' ')} exited ${code}: ${stderr || stdout}${options.log ? `; see ${options.log}` : ''}`
                );
        } catch (error) {
            failures.push(error);
            try {
                await registration;
            } catch (failure) {
                if (failure !== error) failures.push(failure);
            }
            if (saved) {
                try {
                    await terminateProcess(saved);
                } catch (failure) {
                    failures.push(failure);
                }
            }
        } finally {
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', cancel);
        }
        // Even cancellation has joined registration before attempting registry removal.
        try {
            await options.unregister?.(child.pid);
        } catch (failure) {
            failures.push(failure);
        }
        if (failures.length === 1) throw failures[0];
        if (failures.length > 1)
            throw new AggregateError(failures, `Command and ownership cleanup failed: ${args[0]}`, {
                cause: failures[0],
            });
        return stdout.trim();
    } finally {
        if (fd !== undefined) closeSync(fd);
    }
};

/** Kernel lock with crash-safe release when this owner's stdin pipe closes. */
export const withDirectoryLock = async <T>(path: string, action: () => Promise<T>): Promise<T> => {
    const child = spawn(
        'flock',
        ['--exclusive', '--wait', '5', path, 'sh', '-c', 'printf "locked\\n"; cat >/dev/null'],
        {
            env: cleanEnvironment(),
            detached: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        }
    );
    const exited = new Promise<void>((resolve, reject) => {
        child.once('exit', () => resolve());
        child.once('error', reject);
    });
    void exited.catch(() => undefined);
    let stderr = '';
    child.stderr.on('data', chunk => {
        stderr += String(chunk);
    });
    let timer: NodeJS.Timeout | undefined;
    try {
        await new Promise<void>((resolve, reject) => {
            timer = setTimeout(
                () => reject(new Error(`Timed out acquiring ownership lock ${path}`)),
                6000
            );
            child.once('error', reject);
            child.once('exit', () =>
                reject(
                    new Error(
                        `Another process owns cleanup for ${path}; retry after it exits. ${stderr}`
                    )
                )
            );
            child.stdout.once('data', chunk =>
                String(chunk).startsWith('locked')
                    ? resolve()
                    : reject(new Error(`Invalid lock handshake for ${path}`))
            );
        });
        clearTimeout(timer);
        return await action();
    } finally {
        clearTimeout(timer);
        child.stdin.end();
        const saved = child.pid ? processIdentity(child.pid) : undefined;
        if (saved) await terminateProcess(saved);
        await exited;
    }
};
