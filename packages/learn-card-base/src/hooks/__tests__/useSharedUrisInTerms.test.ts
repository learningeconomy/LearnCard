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

import { getOrCreateSharedUriForWallet } from '../useSharedUrisInTerms';

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
        } as any;

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
});
