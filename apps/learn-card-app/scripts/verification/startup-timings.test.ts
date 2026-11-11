import { expect, it } from 'bun:test';
import { access, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStack } from './stack';

it('can retry the same directory after preflight fails without creating an ownership/timing file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lc-preflight-retry-'));
    try {
        const failures: string[] = [];
        for (let attempt = 0; attempt < 2; attempt++) {
            // A cancelled preflight never reaches Docker startup, on any platform.
            try {
                await startStack(directory, {
                    signal: AbortSignal.abort(new Error('preflight cancelled for test')),
                });
                throw new Error('Expected preflight to fail');
            } catch (error) {
                failures.push(String(error));
            }
            await expect(access(join(directory, 'startup-timings.json'))).rejects.toThrow();
            expect(await readdir(directory)).toEqual([]);
        }
        expect(failures[0]).toBe(failures[1]);
        expect(failures[1]).not.toContain('EEXIST');
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
