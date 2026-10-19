import { expect, it } from 'bun:test';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTimings } from './timings';

it('retains running, successful and failed phases without persisting action data or errors', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lc-timings-'));
    const path = join(directory, 'timings.json');
    const measure = createTimings(path);
    try {
        const result = await measure('build', async () => {
            expect(JSON.parse(await readFile(path, 'utf8'))).toEqual([
                { phase: 'build', status: 'running', durationMs: null },
            ]);
            return 'private-token';
        });
        expect(result).toBe('private-token');
        const failure = new Error('private-credential');
        await expect(
            measure('compose', async () => {
                throw failure;
            })
        ).rejects.toBe(failure);
        const text = await readFile(path, 'utf8');
        const records = JSON.parse(text);
        expect(records.map((record: { status: string }) => record.status)).toEqual([
            'passed',
            'failed',
        ]);
        expect(
            records.every(
                (record: { durationMs: number }) =>
                    Number.isInteger(record.durationMs) && record.durationMs >= 0
            )
        ).toBe(true);
        expect(text).not.toContain('private');
        expect((await stat(path)).mode & 0o777).toBe(0o600);
        await expect(createTimings(path)('build', async () => 'new run')).rejects.toThrow();
        expect(await readFile(path, 'utf8')).toBe(text);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
