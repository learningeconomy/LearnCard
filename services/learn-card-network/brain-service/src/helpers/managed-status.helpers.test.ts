import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from 'neo4j-driver';
import type { BitstringStatusListEntry } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    run: vi.fn(),
    transaction: vi.fn(),
    allocate: vi.fn(),
    validate: vi.fn(),
    getRefresh: vi.fn(),
    reconcile: vi.fn(),
}));
vi.mock('@instance', () => ({ neogma: { getTransaction: mocks.transaction } }));
vi.mock('./status-list.helpers', () => ({
    allocateStatusListEntry: mocks.allocate,
    validateStatusEntries: mocks.validate,
}));
vi.mock('@accesslayer/credential-refresh', () => ({ getCredentialRefresh: mocks.getRefresh }));
vi.mock('./credential-status-mutation.helpers', () => ({
    reconcileCredentialStatus: mocks.reconcile,
}));
import { bindRefreshStatusEntries, prepareRefreshStatusEntries } from './managed-status.helpers';

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

describe('managed status binding', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.transaction.mockImplementation(
            async (_existing: unknown, callback: (transaction: Transaction) => Promise<unknown>) =>
                callback(tx)
        );
        mocks.getRefresh.mockResolvedValue(null);
        mocks.allocate.mockResolvedValue(entry);
        mocks.run.mockImplementation(async (query: string) => ({
            records: query.includes('RETURN refresh.statusEntries AS entries')
                ? [record({ rootId: 'root' })]
                : [],
        }));
    });
    it('returns after the locked read on a second matching bind', async () => {
        await bindRefreshStatusEntries('refresh', [entry], 'owner', 'network.example');
        expect(mocks.reconcile).toHaveBeenCalledWith('root', tx);
        mocks.run.mockClear();
        mocks.reconcile.mockClear();
        mocks.run.mockResolvedValue({
            records: [record({ entries: JSON.stringify([entry]), rootId: 'root' })],
        });
        await bindRefreshStatusEntries('refresh', [entry], 'owner', 'network.example');
        expect(mocks.run).toHaveBeenCalledTimes(1);
        expect(mocks.run.mock.calls[0]?.[0]).toContain('SET refresh._statusBindingLock = true');
        expect(mocks.reconcile).not.toHaveBeenCalled();
    });
    it('rejects mismatching stored coordinates', async () => {
        mocks.run.mockResolvedValue({
            records: [
                record({
                    entries: JSON.stringify([{ ...entry, statusListIndex: '8' }]),
                    rootId: 'root',
                }),
            ],
        });
        await expect(
            bindRefreshStatusEntries('refresh', [entry], 'owner', 'network.example')
        ).rejects.toThrow('Credential status does not match allocated entries');
        expect(mocks.run).toHaveBeenCalledTimes(1);
        expect(mocks.reconcile).not.toHaveBeenCalled();
    });
    it('skips the legacy scan only for freshly allocated entries', async () => {
        await expect(
            prepareRefreshStatusEntries('refresh', 'owner', 'network.example')
        ).resolves.toEqual([entry]);
        expect(mocks.run).not.toHaveBeenCalledWith(
            expect.stringContaining('credential.statusEntries CONTAINS $url'),
            expect.anything()
        );
        expect(mocks.run).toHaveBeenCalledWith(
            expect.stringContaining('SET binding.refreshId = $refreshId'),
            expect.anything()
        );
        expect(mocks.reconcile).toHaveBeenCalledWith('root', tx);
    });
    it('retains the legacy scan for pre-signed and repair entries', async () => {
        await bindRefreshStatusEntries('refresh', [entry], 'owner', 'network.example', tx);
        expect(mocks.run).toHaveBeenCalledWith(
            expect.stringContaining('credential.statusEntries CONTAINS $url'),
            { ownerProfileId: 'owner', refreshId: 'refresh', url: entry.statusListCredential }
        );
    });
});
