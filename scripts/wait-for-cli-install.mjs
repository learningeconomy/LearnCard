#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const EXACT_CLI_SPEC = /^@learncard\/cli@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const CHECK_SCRIPT = fileURLToPath(new URL('./check-cli-install.mjs', import.meta.url));

const write = (writer, output) => {
    if (output) writer(output.endsWith('\n') ? output : output + '\n');
};

/** True only for npm's errors that mean the requested public version has not propagated yet. */
export const npmPublicationPending = result => {
    const output = (result.stdout ?? '') + '\n' + (result.stderr ?? '');
    let code;
    try {
        code = JSON.parse(result.stdout).error?.code;
    } catch {
        // check-cli-install writes npm's human-readable output, not npm --json output.
    }
    code ??= output.match(/npm (?:ERR!|error) code (ETARGET|E404)\b/)?.[1];
    return code === 'ETARGET' || code === 'E404';
};

/**
 * Runs the complete CLI cold-install assertion. Each retry starts a new child process,
 * so check-cli-install gets a new temporary npx cache rather than retaining stale npm metadata.
 */
export const waitForCliInstall = async ({
    packageSpec,
    timeoutMs = 1_200_000,
    pollIntervalMs = 15_000,
    scriptPath = CHECK_SCRIPT,
    run = spawnSync,
    now = () => performance.now(),
    wait = sleep,
    writeOutput = output => process.stdout.write(output),
    writeError = output => process.stderr.write(output),
    log = message => console.log(message),
} = {}) => {
    if (!EXACT_CLI_SPEC.test(packageSpec ?? '')) {
        throw new Error('The CLI readiness check requires an exact public @learncard/cli version.');
    }
    if (![timeoutMs, pollIntervalMs].every(value => Number.isSafeInteger(value) && value > 0)) {
        throw new Error('Registry timeout and poll interval must be positive integers.');
    }

    const deadline = now() + timeoutMs;
    for (let attempt = 1; ; attempt += 1) {
        const remaining = Math.floor(deadline - now());
        if (remaining <= 0) {
            throw new Error(`Timed out waiting for ${packageSpec} to cold-install.`);
        }
        log(`Cold-installing ${packageSpec} (attempt ${attempt}).`);
        const result = run(process.execPath, [scriptPath, `--package=${packageSpec}`], {
            encoding: 'utf8',
            timeout: remaining,
            killSignal: 'SIGKILL',
            maxBuffer: 8 * 1024 * 1024,
        });
        write(writeOutput, result.stdout ?? '');
        write(writeError, result.stderr ?? '');

        if (result.status === 0) return;
        if (result.error?.code === 'ETIMEDOUT' || now() >= deadline) {
            throw new Error(`Timed out waiting for ${packageSpec} to cold-install.`);
        }
        if (result.error || result.signal) {
            throw new Error(
                'CLI cold-install could not complete: ' + (result.error?.message ?? result.signal)
            );
        }
        if (!npmPublicationPending(result)) {
            throw new Error('CLI cold-install failed; not a registry-readiness error.');
        }

        const delay = Math.min(pollIntervalMs, Math.max(0, deadline - now()));
        if (delay <= 0) {
            throw new Error(`Timed out waiting for ${packageSpec} to cold-install.`);
        }
        log(`CLI package publication is not ready; retrying in ${Math.ceil(delay / 1000)}s.`);
        await wait(delay);
    }
};

const readOption = name => {
    const prefix = `--${name}=`;
    return process.argv.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
};

const parseOptions = () => {
    const packageSpec = readOption('package');
    const timeoutSeconds = Number(readOption('timeout-seconds') ?? '1200');
    const pollIntervalSeconds = Number(readOption('poll-interval-seconds') ?? '15');
    if (
        !packageSpec ||
        ![timeoutSeconds, pollIntervalSeconds].every(
            value => Number.isSafeInteger(value) && value > 0
        )
    ) {
        throw new Error(
            'Usage: node scripts/wait-for-cli-install.mjs --package=@learncard/cli@<exact-version> ' +
                '[--timeout-seconds=<positive integer>] [--poll-interval-seconds=<positive integer>]'
        );
    }
    return {
        packageSpec,
        timeoutMs: timeoutSeconds * 1000,
        pollIntervalMs: pollIntervalSeconds * 1000,
    };
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        await waitForCliInstall(parseOptions());
    } catch (error) {
        console.error('[cli-install-readiness] ' + error.message);
        process.exitCode = 1;
    }
}
