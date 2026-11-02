import { describe, expect, it, vi } from 'vitest';
import { LCR } from '../../types/credential-records';
import { runBulkDelete, runBulkDeleteWithCleanup } from './bulkDeleteCredentials';

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: vi.fn() }),
}));

const records = Array.from(
    { length: 9 },
    (_, index) => ({ id: `record-${index}`, uri: `uri-${index}`, category: 'Achievement' }) as LCR
);

describe('runBulkDelete', () => {
    it('limits concurrent deletes to four and reports progress', async () => {
        let active = 0;
        let maximum = 0;
        const progress: number[] = [];
        const result = await runBulkDelete(
            records,
            async () => {
                active += 1;
                maximum = Math.max(maximum, active);
                await new Promise(resolve => setTimeout(resolve, 5));
                active -= 1;
            },
            completed => progress.push(completed)
        );
        expect(maximum).toBe(4);
        expect(result).toEqual({ succeeded: records, failed: [] });
        expect(progress).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('retains failed records in the result while continuing the batch', async () => {
        const result = await runBulkDelete(records.slice(0, 3), async record => {
            if (record.uri === 'uri-1') throw new Error('offline');
        });
        expect(result.succeeded.map(record => record.uri)).toEqual(['uri-0', 'uri-2']);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0]?.record.uri).toBe('uri-1');
    });

    it('runs shared cleanup exactly once for all successful deletes', async () => {
        const cleanup = vi.fn().mockResolvedValue(undefined);
        const result = await runBulkDeleteWithCleanup(
            records.slice(0, 3),
            async record => {
                if (record.uri === 'uri-1') throw new Error('offline');
            },
            cleanup
        );
        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(cleanup).toHaveBeenCalledWith(result.succeeded);
    });
});
