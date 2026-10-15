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
    getConsentAudienceCacheKey,
    getConsentAudienceRecipients,
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
                [getConsentAudienceCacheKey(contractOwnerDid)]: ['shared:2'],
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
                                [getConsentAudienceCacheKey(contractOwnerDid)]: ['shared:1'],
                            },
                        },
                        {
                            id: 'record-2',
                            uri: credentialUri,
                            sharedUris: {
                                [getConsentAudienceCacheKey(contractOwnerDid)]: [sharedUri],
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

    it.each([contractOwnerDid, getConsentAudienceCacheKey(contractOwnerDid)])(
        'deduplicates and reuses saved terms credential refs with cache key %s',
        async cacheKey => {
            const credentialUri = 'cred:2';
            const sharedUri = 'shared:2';
            const getPage = vi.fn().mockResolvedValue({
                records: [
                    {
                        id: 'record-2',
                        uri: credentialUri,
                        sharedUris: {
                            [cacheKey]: [sharedUri],
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
                                    [cacheKey]: [sharedUri],
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

            expect(result.terms.read.credentials.categories.Achievement.shared).toEqual([
                sharedUri,
            ]);
        }
    );

    const setup = (sharedUris: Record<string, string[]> = {}) => {
        queryClient.setQueryData(['useGetCredentialList', 'did:web:test-user', 'Achievement'], {
            pages: [
                { records: [{ id: 'record', uri: 'cred:original', sharedUris }], hasMore: false },
            ],
            pageParams: [undefined],
        });
        return {
            read: { get: vi.fn().mockResolvedValue({ id: 'cred:original' }) },
            store: { LearnCloud: { uploadEncrypted: vi.fn().mockResolvedValue('shared:new') } },
            index: {
                LearnCloud: { update: vi.fn().mockResolvedValue(undefined), getPage: vi.fn() },
            },
        } as any;
    };

    it.each([contractOwnerDid, [contractOwnerDid]])(
        'reuses legacy owner-keyed copies for the unchanged audience %j',
        async audience => {
            const wallet = setup({ [contractOwnerDid]: ['shared:old', 'shared:legacy'] });
            expect(
                await getOrCreateSharedUriForWallet(
                    wallet,
                    audience,
                    queryClient,
                    'shared:legacy',
                    'Achievement'
                )
            ).toBe('shared:legacy');
            expect(wallet.read.get).not.toHaveBeenCalled();
            expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
            expect(wallet.index.LearnCloud.update).not.toHaveBeenCalled();
        }
    );

    it('reuses legacy SmartResume copies with the same effective server recipients', async () => {
        const smartResumeDid = 'did:web:localhost%3A4000:users:smart-resume';
        const wallet = setup({ [smartResumeDid]: ['shared:smart-resume'] });
        expect(
            await getOrCreateSharedUriForWallet(
                wallet,
                [smartResumeDid],
                queryClient,
                'cred:original',
                'Achievement'
            )
        ).toBe('shared:smart-resume');
        expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
    });

    it('does not reuse a legacy copy whose effective audience includes removed SmartResume servers', async () => {
        const smartResumeDid = 'did:web:localhost%3A4000:users:smart-resume';
        const wallet = setup({ [smartResumeDid]: ['shared:smart-resume'] });
        expect(
            await getOrCreateSharedUriForWallet(
                wallet,
                ['did:web:network.learncard.com'],
                queryClient,
                'shared:smart-resume',
                'Achievement'
            )
        ).toBe('shared:new');
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledWith(
            { id: 'cred:original' },
            { recipients: ['did:web:network.learncard.com'] }
        );
    });

    it('canonicalizes order and duplicates and reuses only the exact audience ciphertext', async () => {
        const audience = [contractOwnerDid, 'did:key:recipient'];
        const wallet = setup({ [getConsentAudienceCacheKey(audience)]: ['shared:exact'] });
        expect(
            await getOrCreateSharedUriForWallet(
                wallet,
                [...audience].reverse().concat(audience),
                queryClient,
                'cred:original',
                'Achievement'
            )
        ).toBe('shared:exact');
        expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
    });

    it('does not reuse an owner-only cached copy for an expanded audience', async () => {
        const wallet = setup({
            [contractOwnerDid]: ['shared:legacy'],
            [getConsentAudienceCacheKey(contractOwnerDid)]: ['shared:owner'],
        });
        const audience = [contractOwnerDid, 'did:key:recipient'];
        expect(
            await getOrCreateSharedUriForWallet(
                wallet,
                audience,
                queryClient,
                'cred:original',
                'Achievement'
            )
        ).toBe('shared:new');
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledWith(
            { id: 'cred:original' },
            { recipients: [...audience].sort() }
        );
    });

    it('re-encrypts from the original when a selected URI belonged to a removed audience', async () => {
        const wallet = setup({
            [getConsentAudienceCacheKey([contractOwnerDid, 'did:key:removed'])]: ['shared:old'],
        });
        expect(
            await getOrCreateSharedUriForWallet(
                wallet,
                [contractOwnerDid],
                queryClient,
                'shared:old',
                'Achievement'
            )
        ).toBe('shared:new');
        expect(wallet.read.get).toHaveBeenCalledWith('cred:original');
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledWith(
            { id: 'cred:original' },
            { recipients: [contractOwnerDid] }
        );
    });

    it('keeps concurrent creations for different audiences separate', async () => {
        const wallet = setup();
        await Promise.all([
            getOrCreateSharedUriForWallet(
                wallet,
                [contractOwnerDid],
                queryClient,
                'cred:original',
                'Achievement'
            ),
            getOrCreateSharedUriForWallet(
                wallet,
                [contractOwnerDid, 'did:key:recipient'],
                queryClient,
                'cred:original',
                'Achievement'
            ),
        ]);
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(2);
        const persisted = wallet.index.LearnCloud.update.mock.calls.at(-1)[1].sharedUris;
        expect(Object.keys(persisted).sort()).toEqual(
            [
                getConsentAudienceCacheKey([contractOwnerDid]),
                getConsentAudienceCacheKey([contractOwnerDid, 'did:key:recipient']),
            ].sort()
        );
    });

    it('deduplicates concurrent creations for the same normalized audience', async () => {
        const wallet = setup();
        const audience = [contractOwnerDid, 'did:key:recipient'];
        await Promise.all([
            getOrCreateSharedUriForWallet(
                wallet,
                audience,
                queryClient,
                'cred:original',
                'Achievement'
            ),
            getOrCreateSharedUriForWallet(
                wallet,
                [...audience].reverse(),
                queryClient,
                'cred:original',
                'Achievement'
            ),
        ]);
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(1);
    });

    it('preserves SmartResume server recipients in the effective audience', () => {
        expect(
            getConsentAudienceRecipients([
                'did:web:localhost%3A4000:users:smart-resume',
                'did:key:partner',
            ])
        ).toEqual([
            'did:key:partner',
            'did:web:localhost%3A4000',
            'did:web:localhost%3A4000:users:smart-resume',
            'did:web:network.learncard.com',
        ]);
    });
    it('materializes every credential only in explicitly selected enabled full-share categories', async () => {
        const categoryPages: Record<
            string,
            { records: { id: string; uri: string }[]; hasMore: boolean; cursor?: string }[]
        > = {
            Achievement: [
                { records: [{ id: 'a1', uri: 'cred:a1' }], hasMore: true, cursor: 'a-next' },
                { records: [{ id: 'a2', uri: 'cred:a2' }], hasMore: false },
            ],
            Course: [{ records: [{ id: 'c1', uri: 'cred:c1' }], hasMore: false }],
            Disabled: [{ records: [{ id: 'd1', uri: 'cred:d1' }], hasMore: false }],
        };
        const getPage = vi.fn(async (query: { category: string }, options: { cursor?: string }) => {
            const pages = categoryPages[query.category] ?? [];
            return pages[options.cursor === 'a-next' ? 1 : 0];
        });
        const wallet = {
            id: { did: () => 'did:web:test-user' },
            read: { get: vi.fn(async (uri: string) => ({ id: uri })) },
            store: {
                LearnCloud: {
                    uploadEncrypted: vi.fn(
                        async (credential: { id: string }) => `shared:${credential.id}`
                    ),
                },
            },
            index: { LearnCloud: { getPage, update: vi.fn().mockResolvedValue(undefined) } },
        } as unknown as TestWallet;
        const terms = {
            terms: {
                write: { personal: {}, credentials: { categories: {} } },
                read: {
                    personal: {},
                    credentials: {
                        categories: {
                            Achievement: { sharing: true, shareAll: true, shared: ['cred:a1'] },
                            Course: { sharing: true, shareAll: true, shared: ['cred:c1'] },
                            Disabled: { sharing: false, shareAll: true, shared: ['cred:d1'] },
                        },
                    },
                },
            },
        } as Parameters<typeof getTermsWithSharedUrisForWallet>[3];

        const result = await getTermsWithSharedUrisForWallet(
            wallet,
            contractOwnerDid,
            queryClient,
            terms,
            ['Achievement']
        );

        expect(getPage.mock.calls.map(([query]) => query.category)).toEqual([
            'Achievement',
            'Achievement',
            'Course',
        ]);
        expect(
            wallet.store.LearnCloud.uploadEncrypted.mock.calls.map(([credential]) => credential.id)
        ).toEqual(['cred:a1', 'cred:a2', 'cred:c1']);
        expect(result.terms.read.credentials.categories.Achievement.shared).toEqual([
            'shared:cred:a1',
            'shared:cred:a2',
        ]);
        expect(result.terms.read.credentials.categories.Course.shared).toEqual(['shared:cred:c1']);
        expect(result.terms.read.credentials.categories.Disabled.shared).toEqual([]);
        expect(terms.terms.read.credentials.categories.Achievement.shared).toEqual(['cred:a1']);
    });
});
