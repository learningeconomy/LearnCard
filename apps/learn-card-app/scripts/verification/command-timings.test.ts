import { expect, it } from 'bun:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

it('retains a failed script command total and precondition timing through the real CLI', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lc-script-command-timing-'));
    try {
        const child = Bun.spawn(
            [
                process.execPath,
                '--no-env-file',
                '--conditions=development',
                join(import.meta.dir, 'main.ts'),
                'script',
                '-e',
                'throw new Error("script must not run without an owned stack")',
                '--dir',
                directory,
                '--json',
            ],
            {
                env: { PATH: process.env.PATH, HOME: process.env.HOME, SKIP_DIDKIT_NAPI: '1' },
                stdout: 'pipe',
                stderr: 'pipe',
            }
        );
        const [code, stdout, stderr] = await Promise.all([
            child.exited,
            new Response(child.stdout).text(),
            new Response(child.stderr).text(),
        ]);
        expect(code).toBe(1);
        expect(stdout + stderr).not.toContain('script must not run without an owned stack');
        const runs = await readdir(join(directory, 'scripts'));
        expect(runs).toHaveLength(1);
        const timings = JSON.parse(
            await readFile(join(directory, 'scripts', runs[0]!, 'timings.json'), 'utf8')
        );
        const total = timings.find((record: { phase: string }) => record.phase === 'command-total');
        const check = timings.find(
            (record: { phase: string }) => record.phase === 'script-stack-check'
        );
        expect(total.status).toBe('failed');
        expect(check.status).toBe('failed');
        expect(total.durationMs).toBeGreaterThanOrEqual(check.durationMs);
        expect(
            timings.some((record: { phase: string }) => record.phase === 'script-execution')
        ).toBe(false);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}, 30_000);
