import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    switchedProfileStore: {
        get: {
            switchedDid: () => undefined,
        },
    },
    useWallet: vi.fn(),
}));

import {
    getOrCreateSharedUriForWallet,
    getTermsWithSharedUrisForWallet,
} from '../useSharedUrisInTerms';

describe('getOrCreateSharedUriForWallet', () => {
    it('does not reuse another cached credential shared URI for a different credential', async () => {
        const queryClient = new QueryClient();
        const ownerDid = 'did:web:localhost%3A4000:users:ai-agent';
        const credentialA = 'lc:cloud:localhost%3A4100/trpc:credential:a';
        const credentialB = 'lc:cloud:localhost%3A4100/trpc:credential:b';
        const sharedA = 'lc:cloud:localhost%3A4100/trpc:credential:shared-a';
        const sharedB = 'lc:cloud:localhost%3A4100/trpc:credential:shared-b';
        const read = vi.fn(async (uri: string) => ({ id: uri, name: `Credential ${uri}` }));
        const uploadEncrypted = vi.fn(async () => sharedB);
        const update = vi.fn(async () => true);
        const wallet = {
            read: { get: read },
            store: {
                LearnCloud: {
                    uploadEncrypted,
                },
            },
            index: {
                LearnCloud: {
                    update,
                },
            },
        };

        queryClient.setQueryData(['useGetCredentialList', '', 'Achievement'], {
            pages: [
                {
                    records: [
                        {
                            id: 'record-a',
                            uri: credentialA,
                            sharedUris: {
                                [ownerDid]: [sharedA],
                            },
                        },
                        {
                            id: 'record-b',
                            uri: credentialB,
                        },
                    ],
                    hasMore: false,
                },
            ],
            pageParams: [undefined],
        });

        await expect(
            getOrCreateSharedUriForWallet(
                wallet as any,
                ownerDid,
                queryClient,
                credentialB,
                'Achievement'
            )
        ).resolves.toBe(sharedB);

        expect(read).toHaveBeenCalledWith(credentialB);
        expect(uploadEncrypted).toHaveBeenCalledWith(
            { id: credentialB, name: `Credential ${credentialB}` },
            { recipients: [ownerDid] }
        );
        expect(update).toHaveBeenCalledWith('record-b', {
            sharedUris: {
                [ownerDid]: [sharedB],
            },
        });
    });

    it('reuses a cached shared URI only from the matching credential record', async () => {
        const queryClient = new QueryClient();
        const ownerDid = 'did:web:localhost%3A4000:users:ai-agent';
        const credentialUri = 'lc:cloud:localhost%3A4100/trpc:credential:b';
        const sharedUri = 'lc:cloud:localhost%3A4100/trpc:credential:shared-b';
        const read = vi.fn();
        const uploadEncrypted = vi.fn();

        queryClient.setQueryData(['useGetCredentialList', '', 'Achievement'], {
            pages: [
                {
                    records: [
                        {
                            id: 'record-b',
                            uri: credentialUri,
                            sharedUris: {
                                [ownerDid]: [sharedUri],
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
                    index: { LearnCloud: { update: vi.fn() } },
                } as any,
                ownerDid,
                queryClient,
                credentialUri,
                'Achievement'
            )
        ).resolves.toBe(sharedUri);

        expect(read).not.toHaveBeenCalled();
        expect(uploadEncrypted).not.toHaveBeenCalled();
    });

    it('deduplicates shared URIs when replacing terms credential refs', async () => {
        const queryClient = new QueryClient();
        const ownerDid = 'did:web:localhost%3A4000:users:ai-agent';
        const credentialUri = 'lc:cloud:localhost%3A4100/trpc:credential:b';
        const sharedUri = 'lc:cloud:localhost%3A4100/trpc:credential:shared-b';

        queryClient.setQueryData(['useGetCredentialList', '', 'Achievement'], {
            pages: [
                {
                    records: [
                        {
                            id: 'record-b',
                            uri: credentialUri,
                            sharedUris: {
                                [ownerDid]: [sharedUri],
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
                index: { LearnCloud: { update: vi.fn() } },
            } as any,
            ownerDid,
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
                } as any,
            }
        );

        expect(result.terms.read.credentials.categories.Achievement.shared).toEqual([sharedUri]);
    });
});
