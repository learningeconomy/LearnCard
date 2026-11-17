import 'fake-indexeddb/auto';
import {
    clearPendingContractSyncJob,
    hydratePendingContractSyncJobs,
    pendingContractSyncStore,
} from '../../../../packages/learn-card-base/src/stores/pendingContractSyncStore';
import { enqueuePendingContractSyncSafely } from '../../../../packages/learn-card-base/src/stores/pendingContractSyncStore';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    wallet: null as unknown,
    initWallet: vi.fn(),
    sync: vi.fn(),
    upload: vi.fn(),
    add: vi.fn(),
    wrap: vi.fn(),
    addPlugin: vi.fn(),
    category: vi.fn(),
    invalidateQueries: vi.fn(),
    invalidateCounts: vi.fn(),
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('learn-card-base', () => ({
    switchedProfileStore: { get: { switchedDid: () => 'did:example:upload-account' } },
    invalidateVisibleCredentialCounts: mocks.invalidateCounts,
    useWallet: () => ({ initWallet: mocks.initWallet, syncCredentialToContracts: mocks.sync }),
    enqueuePendingContractSyncSafely,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: mocks.category,
}));
vi.mock('@learncard/types', () => ({
    VCValidator: { safeParse: () => ({ success: true, data: {} }) },
}));
vi.mock('./extractCredentialsFromText', () => ({
    extractCredentialsFromText: (text: string) => {
        const parsed = JSON.parse(text);
        return { credentials: Array.isArray(parsed) ? parsed : [parsed], errors: [] };
    },
}));
import { useUploadVcFromText } from './useUploadVcFromText';

const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    id: 'credential-1',
    issuer: 'did:example:issuer',
    credentialSubject: {},
    proof: {
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-jcs-2022',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
        proofValue: 'unit-test',
    },
};
const readPersistedJobs = async (): Promise<unknown[]> => {
    const databasePromise = Promise.withResolvers<IDBDatabase>();
    const openRequest = indexedDB.open('learn-card-pending-contract-sync');
    openRequest.onsuccess = () => databasePromise.resolve(openRequest.result);
    openRequest.onerror = () => databasePromise.reject(openRequest.error);
    const database = await databasePromise.promise;
    try {
        const read = Promise.withResolvers<unknown[]>();
        const transaction = database.transaction('jobs', 'readonly');
        const request = transaction.objectStore('jobs').getAll();
        transaction.oncomplete = () => read.resolve(request.result);
        transaction.onerror = () => read.reject(transaction.error);
        transaction.onabort = () => read.reject(transaction.error);
        return await read.promise;
    } finally {
        database.close();
    }
};
beforeEach(async () => {
    vi.clearAllMocks();
    mocks.category.mockReturnValue('Achievement');
    mocks.invalidateQueries.mockResolvedValue(undefined);
    mocks.invalidateCounts.mockResolvedValue(undefined);
    await hydratePendingContractSyncJobs();
    await Promise.all(
        Object.keys(pendingContractSyncStore.get.jobs()).map(clearPendingContractSyncJob)
    );
    mocks.wallet = {
        id: { did: () => 'did:example:upload-account' },
        store: { LearnCloud: { uploadEncrypted: mocks.upload } },
        index: { LearnCloud: { add: mocks.add } },
        addPlugin: mocks.addPlugin,
        invoke: { wrapOpenBadgeV2: mocks.wrap },
    };
    mocks.initWallet.mockResolvedValue(mocks.wallet);
    mocks.upload.mockResolvedValue('credential-uri');
    mocks.add.mockResolvedValue(true);
    mocks.sync.mockResolvedValue(true);
    mocks.addPlugin.mockResolvedValue(mocks.wallet);
    mocks.wrap.mockResolvedValue(credential);
});

describe('useUploadVcFromText contract synchronization', () => {
    it('queues a single upload with its persisted metadata under the original account', async () => {
        mocks.add.mockImplementationOnce(async () => {
            mocks.initWallet.mockResolvedValue({ id: { did: () => 'other-account' } });
            return true;
        });
        const { result } = renderHook(() => useUploadVcFromText());
        const response = await result.current.uploadVcFromText(JSON.stringify(credential), {
            id: 'single-id',
            fileInfo: { name: 'credential.json', size: 42, type: 'application/json' },
            uploadType: 'file',
        });
        const record = mocks.add.mock.calls[0][0];
        expect(response.results[0]).toMatchObject({ success: true, storedVC: record });
        expect(record).toMatchObject({
            id: 'single-id',
            uri: 'credential-uri',
            category: 'Achievement',
            fileName: 'credential.json',
            uploadType: 'file',
        });
        expect(Object.values(pendingContractSyncStore.get.jobs())).toEqual([
            expect.objectContaining({
                record: { id: record.id, uri: record.uri, category: record.category },
                category: 'Achievement',
                profileDid: 'did:example:upload-account',
            }),
        ]);
        expect(mocks.sync).not.toHaveBeenCalled();
        expect(await readPersistedJobs()).toEqual(
            Object.values(pendingContractSyncStore.get.jobs())
        );
    });

    it('queues only successfully saved credentials in a partially failed bulk upload', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        mocks.add.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('index failed'));
        const response = await result.current.uploadVcFromText(
            JSON.stringify([credential, { ...credential, id: 'second' }])
        );
        expect(response).toMatchObject({ success: true, addedCount: 1, failedCount: 1 });
        expect(Object.values(pendingContractSyncStore.get.jobs())).toHaveLength(1);
        expect(mocks.sync).not.toHaveBeenCalled();
    });

    it('preserves a successful paste save when sharing is queued for retry', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        mocks.sync.mockImplementation(() => new Promise(() => {}));
        const response = await result.current.uploadVcFromTextAndAddToWallet(credential);
        expect(response?.success).toBe(true);
        expect(Object.values(pendingContractSyncStore.get.jobs())).toEqual([
            expect.objectContaining({
                record: expect.objectContaining({ uri: 'credential-uri', category: 'Achievement' }),
                category: 'Achievement',
            }),
        ]);
        expect(mocks.sync).not.toHaveBeenCalled();
    });

    it.each(['single', 'bulk', 'openbadge', 'paste'] as const)(
        'keeps a committed %s import successful when queue persistence rejects',
        async path => {
            vi.spyOn(pendingContractSyncStore.set, 'enqueueContractSyncJob').mockRejectedValueOnce(
                new Error('queue unavailable')
            );
            const { result } = renderHook(() => useUploadVcFromText());
            const response =
                path === 'paste'
                    ? await result.current.uploadVcFromTextAndAddToWallet(credential)
                    : await result.current.uploadVcFromText(
                          JSON.stringify(
                              path === 'openbadge'
                                  ? {
                                        '@context': 'https://openbadges.org/openbadges/v2',
                                        name: 'badge',
                                    }
                                  : path === 'bulk'
                                    ? [credential, { ...credential, id: 'second' }]
                                    : credential
                          )
                      );
            if (path === 'paste') {
                expect(response?.success).toBe(true);
            } else {
                expect(response.success).toBe(true);
                expect(response.addedCount).toBe(path === 'bulk' ? 2 : 1);
                expect(response.results.every(item => item.success)).toBe(true);
            }
            expect(mocks.add).toHaveBeenCalledTimes(path === 'bulk' ? 2 : 1);
            expect(mocks.invalidateQueries).toHaveBeenCalled();
        }
    );

    it('queues the wrapped OpenBadgeV2 credential after indexing', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        const response = await result.current.uploadVcFromText(
            JSON.stringify({
                '@context': 'https://openbadges.org/openbadges/v2',
                name: 'badge',
            })
        );
        expect(response.results[0].success).toBe(true);
        expect(Object.values(pendingContractSyncStore.get.jobs())).toEqual([
            expect.objectContaining({
                record: expect.objectContaining({ uri: 'credential-uri', category: 'Achievement' }),
                category: 'Achievement',
            }),
        ]);
        expect(mocks.sync).not.toHaveBeenCalled();
    });

    it.each(['single', 'bulk', 'openbadge', 'paste'] as const)(
        'persists the %s handoff only after indexing succeeds',
        async path => {
            const index = Promise.withResolvers<boolean>();
            mocks.add.mockReturnValue(index.promise);
            const { result } = renderHook(() => useUploadVcFromText());
            const saving =
                path === 'paste'
                    ? result.current.uploadVcFromTextAndAddToWallet(credential)
                    : result.current.uploadVcFromText(
                          JSON.stringify(
                              path === 'openbadge'
                                  ? {
                                        '@context': 'https://openbadges.org/openbadges/v2',
                                        name: 'badge',
                                    }
                                  : path === 'bulk'
                                    ? [credential, { ...credential, id: 'second' }]
                                    : credential
                          )
                      );
            await waitFor(() => expect(mocks.add).toHaveBeenCalled());
            expect(pendingContractSyncStore.get.jobs()).toEqual({});
            expect(mocks.sync).not.toHaveBeenCalled();
            expect(mocks.invalidateQueries).not.toHaveBeenCalled();
            expect(mocks.invalidateCounts).not.toHaveBeenCalled();
            index.resolve(true);
            await saving;
            expect(mocks.invalidateQueries).toHaveBeenCalledExactlyOnceWith({
                queryKey: ['useGetCredentialList', 'did:example:upload-account'],
            });
            expect(mocks.invalidateCounts).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ invalidateQueries: mocks.invalidateQueries }),
                'did:example:upload-account'
            );
            const jobs = Object.values(pendingContractSyncStore.get.jobs());
            expect(jobs.length).toBeGreaterThan(0);
            expect(await readPersistedJobs()).toEqual(jobs);
            expect(mocks.sync).not.toHaveBeenCalled();
        }
    );

    it.each(['openbadge', 'paste'] as const)(
        'does not queue a failed %s index write',
        async path => {
            mocks.add.mockResolvedValue(false);
            const { result } = renderHook(() => useUploadVcFromText());
            if (path === 'paste') {
                expect(
                    (await result.current.uploadVcFromTextAndAddToWallet(credential))?.success
                ).toBe(false);
            } else {
                const response = await result.current.uploadVcFromText(
                    JSON.stringify({
                        '@context': 'https://openbadges.org/openbadges/v2',
                        name: 'badge',
                    })
                );
                expect(response.results[0].success).toBe(false);
            }
            expect(pendingContractSyncStore.get.jobs()).toEqual({});
            expect(mocks.sync).not.toHaveBeenCalled();
            expect(mocks.invalidateQueries).not.toHaveBeenCalled();
            expect(mocks.invalidateCounts).not.toHaveBeenCalled();
        }
    );

    it('does not queue failed or URI-less saves', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        mocks.add.mockResolvedValueOnce(false);
        const failed = await result.current.uploadVcFromText(JSON.stringify(credential));
        expect(failed.results[0].success).toBe(false);
        expect(mocks.sync).not.toHaveBeenCalled();
        mocks.upload.mockResolvedValueOnce(undefined);
        const missing = await result.current.uploadVcFromText(JSON.stringify(credential));
        expect(missing.results[0].success).toBe(false);
        expect(mocks.sync).not.toHaveBeenCalled();
        expect(pendingContractSyncStore.get.jobs()).toEqual({});
    });

    it.each(['single', 'openbadge', 'paste'] as const)(
        'preserves internal-category visibility on the %s save path',
        async path => {
            mocks.category.mockReturnValue('AI Topic');
            const { result } = renderHook(() => useUploadVcFromText());
            if (path === 'paste') {
                expect(
                    (await result.current.uploadVcFromTextAndAddToWallet(credential))?.success
                ).toBe(true);
            } else {
                const response = await result.current.uploadVcFromText(
                    JSON.stringify(
                        path === 'openbadge'
                            ? { '@context': 'https://openbadges.org/openbadges/v2', name: 'badge' }
                            : credential
                    )
                );
                expect(response.success).toBe(true);
            }
            expect(mocks.add).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ category: 'AI Topic', hidden: true })
            );
            expect(mocks.invalidateCounts).toHaveBeenCalledOnce();
            expect(Object.values(pendingContractSyncStore.get.jobs())).toHaveLength(1);
            expect(mocks.sync).not.toHaveBeenCalled();
        }
    );
});
