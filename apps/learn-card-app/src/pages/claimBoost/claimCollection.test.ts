import { describe, expect, it, vi } from 'vitest';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { AddVCToWalletInput } from 'learn-card-base/hooks/useWallet';
import { saveClaimToCollection } from './claimCollection';

const collection = () => {
    const records = new Map<string, AddVCToWalletInput>();
    const wallet = {
        id: { did: () => 'did:example:claiming-account' },
        index: {
            LearnCloud: {
                get: vi.fn(async (query: { id?: string; uri?: string }) =>
                    [...records.values()].filter(record =>
                        query.id ? record.id === query.id : record.uri === query.uri
                    )
                ),
            },
        },
    } as unknown as BespokeLearnCard;
    const add = vi.fn(async (record: AddVCToWalletInput) => {
        if (records.has(record.id!)) throw new Error('unique index conflict');
        records.set(record.id!, record);
        return true;
    });
    return { records, wallet, add };
};

describe('claimed credential collection recovery', () => {
    it('recognizes a committed insert whose response was lost and never inserts another entry', async () => {
        const { records, wallet, add } = collection();
        add.mockImplementationOnce(async record => {
            records.set(record.id!, record);
            throw new TypeError('response lost');
        });
        await saveClaimToCollection(wallet, 'credential-1', 'boost-1', add);
        await saveClaimToCollection(wallet, 'credential-1', 'boost-1', add);
        expect([...records.values()]).toEqual([
            expect.objectContaining({ uri: 'credential-1', boostUri: 'boost-1' }),
        ]);
        expect(add).toHaveBeenCalledTimes(1);
    });

    it('retries a rejected save using the same identity', async () => {
        const { records, wallet, add } = collection();
        add.mockRejectedValueOnce(new TypeError('offline'));
        await expect(saveClaimToCollection(wallet, 'credential-1', 'boost-1', add)).rejects.toThrow(
            'offline'
        );
        await saveClaimToCollection(wallet, 'credential-1', 'boost-1', add);
        expect(records.size).toBe(1);
        expect(add.mock.calls[0][0].id).toBe(add.mock.calls[1][0].id);
    });

    it('handles two recoveries racing an insert without duplicate entries', async () => {
        const { records, wallet, add } = collection();
        await Promise.all([
            saveClaimToCollection(wallet, 'credential-1', 'boost-1', add),
            saveClaimToCollection(wallet, 'credential-1', 'boost-1', add),
        ]);
        expect([...records.values()].map(record => record.uri)).toEqual(['credential-1']);
    });

    it('recognizes an older entry by exact credential URI without conflating another earned copy', async () => {
        const { records, wallet, add } = collection();
        records.set('legacy-id', { id: 'legacy-id', uri: 'credential-1', boostUri: 'boost-1' });
        await saveClaimToCollection(wallet, 'credential-1', 'boost-1', add);
        await saveClaimToCollection(wallet, 'credential-2', 'boost-1', add);
        expect([...records.values()].map(record => record.uri)).toEqual([
            'credential-1',
            'credential-2',
        ]);
    });
});
