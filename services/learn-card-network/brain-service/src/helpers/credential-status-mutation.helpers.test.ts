import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from 'neo4j-driver';
import type { BitstringStatusListEntry } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    run: vi.fn(),
    transaction: vi.fn(),
    entries: vi.fn(),
    setBit: vi.fn(),
}));
vi.mock('@instance', () => ({ neogma: { getTransaction: mocks.transaction } }));
vi.mock('./status-list.helpers', () => ({
    CREDENTIAL_STATUS_ROOT_QUERY: 'MATCH (credential:Credential {id: $credentialId})',
    getStatusEntriesForCredential: mocks.entries,
    setStatusListEntryBit: mocks.setBit,
    isNetworkStatusEntry: (entry: BitstringStatusListEntry) =>
        new URL(entry.statusListCredential).hostname === 'network.example',
}));
import {
    mutateCredentialStatus,
    reconcileCredentialStatus,
} from './credential-status-mutation.helpers';

const entry: BitstringStatusListEntry = {
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: '7',
    statusListCredential: 'https://network.example/status-lists/list',
};
const tx = { run: mocks.run } as unknown as Transaction;
const record = (values: Record<string, unknown>) => ({
    get: (key: string): unknown => values[key] ?? null,
});

describe('credential lifecycle status mutations', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        mocks.transaction.mockImplementation(
            async (_existing: unknown, callback: (transaction: Transaction) => Promise<unknown>) =>
                callback(tx)
        );
        mocks.run.mockResolvedValue({
            records: [record({ rootId: 'root', owner: 'status-owner' })],
        });
        mocks.entries.mockResolvedValue([entry]);
        mocks.setBit.mockResolvedValue(true);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        { value: true, previous: null, next: 'suspended' },
        { value: false, previous: 'suspended', next: null },
    ])(
        'updates revocation-only relationship suspension value=$value',
        async ({ value, previous, next }) => {
            mocks.run.mockResolvedValue({
                records: [record({ rootId: 'root', owner: 'status-owner', status: previous })],
            });
            await expect(
                mutateCredentialStatus('version', 'recipient', 'suspension', value)
            ).resolves.toBe(true);
            expect(mocks.setBit).not.toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalledWith(expect.any(String), {
                rootId: 'root',
                purpose: 'suspension',
            });
            expect(mocks.run).toHaveBeenLastCalledWith(
                expect.stringContaining('SET sent.status = $status'),
                expect.objectContaining({ status: next })
            );
        }
    );
    it('revokes using the stored status owner before the sender', async () => {
        await expect(
            mutateCredentialStatus('version', 'recipient', 'revocation', true)
        ).resolves.toBe(true);
        expect(mocks.run.mock.calls[0]?.[0]).toContain(
            'coalesce(refresh.issuerProfileId, root.statusOwnerProfileId, issuer.profileId) AS owner'
        );
        expect(mocks.setBit).toHaveBeenCalledWith(entry, true, 'status-owner', tx);
        expect(mocks.run).toHaveBeenLastCalledWith(
            expect.stringContaining('SET sent.status = $status'),
            expect.objectContaining({ status: 'revoked' })
        );
    });
    it.each(['revocation', 'suspension'] as const)(
        'fails before relationship writes when advertised %s bit fails',
        async purpose => {
            mocks.entries.mockResolvedValue([{ ...entry, statusPurpose: purpose }]);
            mocks.run
                .mockResolvedValueOnce({
                    records: [
                        record({
                            rootId: 'root',
                            owner: 'status-owner',
                            storedOwner: null,
                            managed: false,
                        }),
                    ],
                })
                .mockResolvedValueOnce({ records: [record({ status: null })] })
                .mockResolvedValueOnce({ records: [record({ owner: 'status-owner' })] });
            mocks.setBit.mockResolvedValue(false);
            await expect(
                mutateCredentialStatus('version', 'recipient', purpose, true)
            ).rejects.toThrow('Public credential status could not be updated');
            expect(mocks.run).toHaveBeenCalledTimes(3);
            expect(mocks.run.mock.calls[2]).toEqual([
                'MATCH (list:BitstringStatusList {statusListCredential: $url}) RETURN list.ownerProfileId AS owner',
                { url: entry.statusListCredential },
            ]);
            expect(mocks.setBit).toHaveBeenCalledWith(
                { ...entry, statusPurpose: purpose },
                true,
                'status-owner',
                tx
            );
            for (const [query] of mocks.run.mock.calls) {
                expect(query).not.toMatch(/SET sent\.|SET refresh\.state/);
            }
        }
    );
    it('reconciles using the stored status owner', async () => {
        mocks.run.mockResolvedValueOnce({
            records: [record({ owner: 'status-owner', status: 'revoked' })],
        });
        await reconcileCredentialStatus('root', tx);
        expect(mocks.run.mock.calls[0]?.[0]).toContain(
            'coalesce(refresh.issuerProfileId, root.statusOwnerProfileId, issuer.profileId) AS owner'
        );
        expect(mocks.setBit).toHaveBeenCalledWith(entry, true, 'status-owner', tx);
    });
    it.each(['revocation', 'suspension'] as const)(
        'rejects managed external %s before any writes',
        async purpose => {
            mocks.run.mockResolvedValue({ records: [record({ rootId: 'root', managed: true })] });
            mocks.entries.mockResolvedValue([
                {
                    ...entry,
                    statusPurpose: purpose,
                    statusListCredential: 'https://provider.example/list',
                },
            ]);
            await expect(
                mutateCredentialStatus('version', 'recipient', purpose, true)
            ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
            expect(mocks.run).toHaveBeenCalledTimes(1);
            expect(mocks.run.mock.calls[0]?.[0]).not.toContain('SET ');
            expect(mocks.setBit).not.toHaveBeenCalled();
        }
    );
});
