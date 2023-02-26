import { command } from 'execa';
import type { ExecutorContext } from '@nrwl/devkit';

export default async function buildExecutor(
    options: { command: string; cwd?: string },
    context: ExecutorContext
) {
    await command(options.command, {
        cwd: options.cwd?.replace('{root}', context.root),
        stdio: [process.stdin, process.stdout, 'pipe'],
    });

    return { success: true };
}
