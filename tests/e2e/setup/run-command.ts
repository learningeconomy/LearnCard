import { execFile, type ExecFileOptions } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type ExecFileError = Error & {
    stdout?: string | Buffer;
    stderr?: string | Buffer;
};

const outputToString = (output: string | Buffer | undefined): string =>
    Buffer.isBuffer(output) ? output.toString().trim() : output?.trim() ?? '';

const commandToString = (command: string, args: string[]): string => [command, ...args].join(' ');

export { delay };

export const runCommand = async (
    command: string,
    args: string[],
    options: ExecFileOptions = {}
): Promise<void> => {
    try {
        await execFileAsync(command, args, { maxBuffer: 100 * 1024 * 1024, ...options });
    } catch (error) {
        const execError = error as ExecFileError;
        const stdout = outputToString(execError.stdout);
        const stderr = outputToString(execError.stderr);
        const output = [stdout, stderr].filter(Boolean).join('\n');

        throw new Error(`${commandToString(command, args)} failed${output ? `\n${output}` : ''}`, {
            cause: error,
        });
    }
};
