import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

vi.mock('learn-card-base', () => ({
    switchedProfileStore: {
        get: {
            switchedDid: () => 'did:web:test-user',
        },
    },
    useWallet: () => ({
        initWallet: vi.fn(),
    }),
}));

import {
    getOrCreateSharedUriForWallet,
    getTermsWithSharedUrisForWallet,
} from '../useSharedUrisInTerms';

type TestWallet = Parameters<typeof getOrCreateSharedUriForWallet>[0];

describe('getOrCreateSharedUriForWallet', () => {
    const contractOwnerDid = 'did:web:localhost%3A4000:users:app-owner';
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient();
    });

    it('does not reuse another credential record shared URI from the same category', async () => {
        queryClient.setQueryData(['useGetCredentialList', 'did:web:test-user', 'Achievement'], {
            pages: [
                {
                    records: [
                        {
                            id: 'record-1',
                            uri: 'cred:1',
                            sharedUris: {
                                [contractOwnerDid]: ['shared:1'],
                            },
                        },
                        {
                            id: 'record-2',
                            uri: 'cred:2',
                            sharedUris: {},
                        },
                    ],
                    hasMore: false,
                },
            ],
            pageParams: [undefined],
        });

        const wallet = {
            read: {
                get: vi.fn().mockResolvedValue({ id: 'cred:2' }),
            },
            store: {
                LearnCloud: {
                    uploadEncrypted: vi.fn().mockResolvedValue('shared:2'),
                },
            },
            index: {
                LearnCloud: {
                    update: vi.fn().mockResolvedValue(undefined),
                    getPage: vi.fn(),
                },
            },
        } as unknown as TestWallet;

        const result = await getOrCreateSharedUriForWallet(
            wallet,
            contractOwnerDid,
            queryClient,
            'cred:2',
            'Achievement'
        );

        expect(result).toBe('shared:2');
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledWith(
            { id: 'cred:2' },
            {
                recipients: [contractOwnerDid],
            }
        );
        expect(wallet.index.LearnCloud.update).toHaveBeenCalledWith('record-2', {
            sharedUris: {
                [contractOwnerDid]: ['shared:2'],
            },
        });
    });

    it('reuses a cached shared URI only from the matching credential record', async () => {
        const credentialUri = 'cred:2';
        const sharedUri = 'shared:2';
        const read = vi.fn();
        const uploadEncrypted = vi.fn();

        queryClient.setQueryData(['useGetCredentialList', 'did:web:test-user', 'Achievement'], {
            pages: [
                {
                    records: [
                        {
                            id: 'record-1',
                            uri: 'cred:1',
                            sharedUris: {
                                [contractOwnerDid]: ['shared:1'],
                            },
                        },
                        {
                            id: 'record-2',
                            uri: credentialUri,
                            sharedUris: {
                                [contractOwnerDid]: [sharedUri],
                            },
                        },
                    ],
                    hasMore: false,
                },
            ],
            pageParams: [undefined],
        });

        await expect(
            getOrCreateSharedUriForWallet(
                {
                    read: { get: read },
                    store: { LearnCloud: { uploadEncrypted } },
                    index: { LearnCloud: { update: vi.fn(), getPage: vi.fn() } },
                } as unknown as TestWallet,
                contractOwnerDid,
                queryClient,
                credentialUri,
                'Achievement'
            )
        ).resolves.toBe(sharedUri);

        expect(read).not.toHaveBeenCalled();
        expect(uploadEncrypted).not.toHaveBeenCalled();
    });

    it('deduplicates shared URIs when replacing terms credential refs', async () => {
        const credentialUri = 'cred:2';
        const sharedUri = 'shared:2';
        const getPage = vi.fn().mockResolvedValue({
            records: [
                {
                    id: 'record-2',
                    uri: credentialUri,
                    sharedUris: {
                        [contractOwnerDid]: [sharedUri],
                    },
                },
            ],
            hasMore: false,
        });

        queryClient.setQueryData(['useGetCredentialList', 'did:web:test-user', 'Achievement'], {
            pages: [
                {
                    records: [
                        {
                            id: 'record-2',
                            uri: credentialUri,
                            sharedUris: {
                                [contractOwnerDid]: [sharedUri],
                            },
                        },
                    ],
                    hasMore: false,
                },
            ],
            pageParams: [undefined],
        });

        const result = await getTermsWithSharedUrisForWallet(
            {
                read: { get: vi.fn() },
                store: { LearnCloud: { uploadEncrypted: vi.fn() } },
                index: { LearnCloud: { update: vi.fn(), getPage } },
            } as unknown as TestWallet,
            contractOwnerDid,
            queryClient,
            {
                terms: {
                    read: {
                        credentials: {
                            categories: {
                                Achievement: {
                                    sharing: true,
                                    shared: [credentialUri, credentialUri],
                                },
                            },
                        },
                    },
                },
            }
        );

        expect(result.terms.read.credentials.categories.Achievement.shared).toEqual([sharedUri]);
    });
});
