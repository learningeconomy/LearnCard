/**
 * Shared notice and hand-off for the retired EducationOS demo scripts (`prove:demo-lms`,
 * `seed:demo-lms`, `prove:demo-learner`). The scenario runner (`scenario/cli.ts`) replaces
 * them; the scripts stay only for the manual LearnCard app flow (`--learner <profileId>`).
 *
 * Standalone: no Brain imports, so prove-demo-learner stays free of the database environment.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const brainServiceDir = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Prints the RETIRED notice to stderr, so stdout parsing of the old output is unaffected. */
export const warnRetired = (script: string, replacement: string): void => {
    console.error(
        `RETIRED: ${script} is superseded by the EducationOS scenario runner.\n` +
            `  Use instead: ${replacement}\n` +
            '  Stack check: bun run scenario doctor (repo root)\n' +
            '  This script still runs for the manual LearnCard app flow; it is no longer maintained.\n'
    );
};

/**
 * Runs `scenario mvp --driver live` with the given extra arguments and resolves with its exit
 * code. Signals sent to this process alone (`kill <pid>`, `timeout`, a CI step timeout) are
 * forwarded to the child, which cleans up (it stops the demo LMS it spawned) and exits; this
 * process then resolves with the child's exit code. A terminal Ctrl-C reaches both, and the
 * child ignores the repeat while it closes.
 */
export const runScenarioMvpLive = (args: readonly string[]): Promise<number> => {
    const signals: readonly NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    let forward: ((signal: NodeJS.Signals) => void) | undefined;
    return new Promise<number>((resolve, reject) => {
        const child = spawn(
            process.execPath,
            ['--conditions=development', 'scenario/cli.ts', 'mvp', '--driver', 'live', ...args],
            {
                cwd: brainServiceDir,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    SEED: process.env.SEED ?? 'a',
                    SKIP_DIDKIT_NAPI: process.env.SKIP_DIDKIT_NAPI ?? 'true',
                },
            }
        );
        forward = (signal: NodeJS.Signals): void => {
            if (child.exitCode === null && child.signalCode === null) child.kill(signal);
        };
        for (const signal of signals) process.on(signal, forward);
        child.once('error', reject);
        child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    }).finally(() => {
        if (forward) for (const signal of signals) process.off(signal, forward);
    });
};
