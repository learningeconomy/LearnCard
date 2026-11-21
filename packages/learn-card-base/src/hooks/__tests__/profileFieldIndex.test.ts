import { describe, expect, it, vi } from 'vitest';
import { indexLatestProfileField } from '../profileFieldIndex';

describe('profile field conditional indexing', () => {
    it('retries with a fresh record after a competing write', async () => {
        const id = '__verifiable_data_VerifiableData:demo:profile:branch__';
        const makeRecord = (uri: string, issuanceDate: string) => ({ id, uri, issuanceDate });
        const cached = makeRecord('old', '2026-01-01T00:00:00.000Z');
        const winning = makeRecord('winning', '2026-02-01T00:00:00.000Z');
        const latest = makeRecord('latest', '2026-03-01T00:00:00.000Z');
        const target = makeRecord('target', '2026-04-01T00:00:00.000Z');
        const get = vi.fn().mockResolvedValue([cached]);
        const getForUpdate = vi
            .fn()
            .mockResolvedValueOnce([winning])
            .mockResolvedValueOnce([latest]);
        const swap = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const wallet = {
            index: { LearnCloud: { get } },
            invoke: {
                learnCloudGetIndexRecordForUpdate: getForUpdate,
                learnCloudCompareAndSwapIndexRecord: swap,
            },
        };

        await expect(indexLatestProfileField(wallet as never, target)).resolves.toEqual(target);
        expect(get).not.toHaveBeenCalled();
        expect(swap.mock.calls).toEqual([
            [winning, target],
            [latest, target],
        ]);
    });
});
