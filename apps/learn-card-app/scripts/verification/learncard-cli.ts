import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPO_ROOT } from './constants';
import type { StackEndpoints } from './types';
import { saveJson } from './harness';
import { loadOrgSpec } from '../../../../packages/learn-card-cli/src/org/load';

const CLI_ROOT = join(REPO_ROOT, 'packages/learn-card-cli');
/** Display-only commands without a `--network` option. */
const DISPLAY_ONLY: Record<string, true> = {
    help: true,
    '--help': true,
    '-h': true,
    '--version': true,
    '-V': true,
};

export interface CliTranscript {
    args: string[];
    cwd: string;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
    /** Parsed single-line `--json` envelope, when the command printed one. */
    json?: unknown;
    startedAt: string;
    finishedAt: string;
}

/**
 * Pin every invocation to the owned local network. The CLI defaults to production, so a missing
 * flag is filled in and any non-local `--network` is refused rather than silently sent upstream.
 */
export const localizeCliArgs = (args: string[], stack: StackEndpoints): string[] => {
    const subcommand = args[0];
    if (subcommand === 'demo') {
        throw new Error(
            'learncard demo does not pin every service to the owned stack; use lc verify script with getVerificationLearnCard(stack) instead'
        );
    }
    if (subcommand === 'repl') {
        throw new Error(
            'The learncard REPL hard-codes production services; use lc verify script instead'
        );
    }
    if (subcommand === 'promote' || subcommand === 'webhook') {
        throw new Error(`${subcommand} needs infrastructure outside the owned verification stack`);
    }
    for (const flag of ['--endpoint', '--webhook-url', '--url']) {
        if (args.some(arg => arg === flag || arg.startsWith(`${flag}=`))) {
            throw new Error(`${flag} targets an unprovisioned signing or callback service`);
        }
    }
    for (const [flag, expected] of [
        ['--app-url', stack.app],
        ['--lca-url', stack.lcaApi],
    ] as const) {
        const occurrences = args.flatMap((arg, index) =>
            arg === flag || arg.startsWith(`${flag}=`) ? [index] : []
        );
        if (occurrences.length > 1) throw new Error(`Duplicate ${flag} options are not allowed`);
        for (const index of occurrences) {
            const value =
                args[index] === flag ? args[index + 1] : args[index]!.slice(flag.length + 1);
            if (value !== expected) throw new Error(`Verification requires ${flag} ${expected}`);
        }
    }
    const pinned =
        subcommand === 'open' &&
        !args.some(arg => arg === '--app-url' || arg.startsWith('--app-url='))
            ? [...args, '--app-url', stack.app]
            : args;
    if (args.includes('--'))
        throw new Error('Nested -- separators are unsupported during verification');
    const indexes = args.flatMap((arg, index) =>
        arg === '--network' || arg.startsWith('--network=') ? [index] : []
    );
    if (indexes.length > 1) throw new Error('Duplicate --network options are not allowed');
    if (indexes.length) {
        const index = indexes[0]!;
        const value = args[index]!.startsWith('--network=')
            ? args[index]!.slice('--network='.length)
            : args[index + 1];
        if (value !== stack.brain) {
            throw new Error(
                `Verification requires --network ${stack.brain}, not ${value ?? '(missing)'}`
            );
        }
        return pinned;
    }
    // Verify has no --network option: its child preload confines document-resolution fetches.
    // Only the actual command is exempt, never a display name or recipient.
    if (!subcommand || subcommand === 'verify' || DISPLAY_ONLY[subcommand] === true) return args;
    if (subcommand.startsWith('-')) {
        throw new Error('Place the learncard subcommand before its options');
    }
    return [...pinned, '--network', stack.brain];
};

/** Keep shell secrets, preload flags, proxy settings, and unrelated service URLs out of children. */
export const cliEnvironment = (
    stack: StackEndpoints,
    source: Record<string, string | undefined> = process.env
): NodeJS.ProcessEnv => ({
    NODE_ENV: 'development',
    PATH: source.PATH,
    HOME: source.HOME,
    TMPDIR: source.TMPDIR,
    NO_COLOR: '1',
    CI: '1',
    NETWORK_URL: stack.brain,
    CLOUD_URL: stack.cloud,
    LCA_API_URL: stack.lcaApi,
});

let snippetsEmbedded: Promise<void> | undefined;

const activeCommands = new Set<() => Promise<void>>();

/** Stop and reap only CLI children started by this verifier, including on direct SIGINT. */
export const stopLearnCardCommands = async (): Promise<void> => {
    await Promise.all([...activeCommands].map(stop => stop()));
};

const run = (
    commandArgs: string[],
    cwd: string,
    env: NodeJS.ProcessEnv,
    timeoutMs: number
): Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean }> =>
    new Promise((accept, reject) => {
        const child = spawn(process.execPath, commandArgs, {
            cwd,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let killTimer: NodeJS.Timeout | undefined;
        let reaped: () => void = () => {};
        const closed = new Promise<void>(acceptClose => {
            reaped = acceptClose;
        });
        const stop = (): Promise<void> => {
            if (!killTimer) {
                child.kill('SIGTERM');
                killTimer = setTimeout(() => child.kill('SIGKILL'), 5000);
            }
            return closed;
        };
        activeCommands.add(stop);
        const timer = setTimeout(() => {
            timedOut = true;
            void stop();
        }, timeoutMs);
        child.stdout.on('data', chunk => (stdout += String(chunk)));
        child.stderr.on('data', chunk => (stderr += String(chunk)));
        child.once('error', reject);
        // `close`, not `exit`: the transcript must include the final stdout/stderr bytes.
        child.once('close', exitCode => {
            clearTimeout(timer);
            clearTimeout(killTimer);
            activeCommands.delete(stop);
            reaped();
            accept({ exitCode: timedOut ? 124 : exitCode, stdout, stderr, timedOut });
        });
    });

/**
 * Run the checkout's `learncard` CLI from source in an isolated working directory. The CLI writes
 * its issuer seed to `<workdir>/.env`, so reusing a workdir reuses that identity across commands.
 */
export const runLearnCardCli = async (
    args: string[],
    workdir: string,
    transcriptPath: string | undefined,
    stack: StackEndpoints,
    timeoutMs = 180_000
): Promise<CliTranscript> => {
    const localArgs = localizeCliArgs(args, stack);
    if (args[0] === 'org' && args[1] === 'apply') {
        const file = args[2];
        if (!file || file.startsWith('-')) {
            throw new Error('Verification expects org apply FILE before its options');
        }
        const spec = await loadOrgSpec(resolve(workdir, file));
        if (spec.issuer.signingAuthority.type === 'self-hosted' || spec.webhooks?.length) {
            throw new Error(
                'Verification org manifests must use the local hosted signer and no webhooks'
            );
        }
    }
    await mkdir(workdir, { recursive: true, mode: 0o700 });
    // The CLI's own `start` script regenerates its embedded docs snippets first; do the same.
    snippetsEmbedded ??= run(
        ['--no-env-file', '--no-install', join(CLI_ROOT, 'scripts/embed-snippets.ts')],
        CLI_ROOT,
        cliEnvironment(stack),
        60_000
    ).then(result => {
        if (result.exitCode !== 0) throw new Error(`embed-snippets failed: ${result.stderr}`);
    });
    await snippetsEmbedded;
    const startedAt = new Date().toISOString();
    const result = await run(
        [
            '--no-env-file',
            '--no-install',
            '--conditions=development',
            ...(args[0] === 'verify'
                ? ['--preload', fileURLToPath(new URL('./cli-verify-preload.ts', import.meta.url))]
                : []),
            join(CLI_ROOT, 'src/index.tsx'),
            ...localArgs,
        ],
        workdir,
        // No inherited secrets, Bun env files, preload options, or proxy configuration.
        cliEnvironment(stack),
        timeoutMs
    );
    const output = result.stdout.trim();
    const jsonText = output.startsWith('{') ? output : (output.split('\n').at(-1) ?? '');
    let json: unknown;
    try {
        json = jsonText.startsWith('{') ? JSON.parse(jsonText) : undefined;
    } catch {
        json = undefined;
    }
    const transcript: CliTranscript = {
        args: localArgs,
        cwd: workdir,
        ...result,
        ...(json !== undefined && { json }),
        startedAt,
        finishedAt: new Date().toISOString(),
    };
    if (transcriptPath) await saveJson(transcriptPath, transcript);
    return transcript;
};
