import { expect, it, spyOn } from 'bun:test';
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
        const warning = spyOn(console, 'error').mockImplementation(() => {});
        try {
            expect(await createTimings(path)('build', async () => 'new run')).toBe('new run');
            expect(await readFile(path, 'utf8')).toBe(text);
            expect(warning).toHaveBeenCalledTimes(1);
        } finally {
            warning.mockRestore();
        }
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

it('does not hide an action error when the final timing write fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lc-timing-write-failure-'));
    const warning = spyOn(console, 'error').mockImplementation(() => {});
    const measure = createTimings(join(directory, 'timings.json'));
    const failure = new Error('private-build-failure');
    try {
        await expect(
            measure('build', async () => {
                await rm(directory, { recursive: true, force: true });
                throw failure;
            })
        ).rejects.toBe(failure);
        expect(await measure('teardown', async () => 'cleaned')).toBe('cleaned');
        expect(warning).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(warning.mock.calls)).not.toContain('private-build-failure');
    } finally {
        warning.mockRestore();
        await rm(directory, { recursive: true, force: true });
    }
});

it('keeps inclusive command totals running across nested phases and records interruption', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lc-command-timings-'));
    const path = join(directory, 'timings.json');
    const measure = createTimings(path);
    try {
        const finish = await measure.start('command-total');
        await measure('bootstrap', () =>
            measure('bootstrap-learner-sign-in', async () => 'signed in')
        );
        let records = JSON.parse(await readFile(path, 'utf8'));
        expect(records[0]).toEqual({ phase: 'command-total', status: 'running', durationMs: null });
        expect(records.slice(1).map((record: { status: string }) => record.status)).toEqual([
            'passed',
            'passed',
        ]);
        await finish('interrupted');
        records = JSON.parse(await readFile(path, 'utf8'));
        expect(records[0].status).toBe('interrupted');
        expect(records[0].durationMs).toBeGreaterThanOrEqual(records[1].durationMs);
        expect(records[1].durationMs).toBeGreaterThanOrEqual(records[2].durationMs);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
