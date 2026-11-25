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
    getProfileFieldAudienceCacheKey,
} from '../useSharedUrisInTerms';

type TestWallet = Parameters<typeof getOrCreateSharedUriForWallet>[0];

describe('getOrCreateSharedUriForWallet', () => {
    const contractOwnerDid = 'did:web:localhost%3A4000:users:app-owner';
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient();
    });

    it('does not reuse another credential record shared URI from the same category', async () => {
        queryClient.setQueryData(
            ['useGetCredentialList', 'did:web:test-user', 'Achievement', 'did:web:test-user'],
            {
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
            }
        );

        const wallet = {
            id: { did: () => 'did:web:test-user' },
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

        queryClient.setQueryData(
            ['useGetCredentialList', 'did:web:test-user', 'Achievement', 'did:web:test-user'],
            {
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
            }
        );

        await expect(
            getOrCreateSharedUriForWallet(
                {
                    id: { did: () => 'did:web:test-user' },
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

    it('updates shared ciphertext metadata only in the wallet reader account cache', async () => {
        const firstKey = [
            'useGetCredentialList',
            'did:web:test-user',
            'Achievement',
            'did:web:test-user',
        ];
        const otherKey = [
            'useGetCredentialList',
            'did:web:test-user',
            'Achievement',
            'did:web:other-user',
        ];
        const first = { id: 'same-id', uri: 'cred:original', sharedUris: {} };
        const other = { id: 'same-id', uri: 'cred:other', sharedUris: {} };
        queryClient.setQueryData(firstKey, {
            pages: [{ records: [first], hasMore: false }],
            pageParams: [undefined],
        });
        queryClient.setQueryData(otherKey, {
            pages: [{ records: [other], hasMore: false }],
            pageParams: [undefined],
        });
        const wallet = {
            id: { did: () => 'did:web:test-user' },
            read: { get: vi.fn().mockResolvedValue({ id: 'cred:original' }) },
            store: { LearnCloud: { uploadEncrypted: vi.fn().mockResolvedValue('shared:new') } },
            index: { LearnCloud: { update: vi.fn(), getPage: vi.fn() } },
        } as unknown as TestWallet;
        await expect(
            getOrCreateSharedUriForWallet(
                wallet,
                contractOwnerDid,
                queryClient,
                first.uri,
                'Achievement'
            )
        ).resolves.toBe('shared:new');
        expect(
            queryClient.getQueryData<{ pages: { records: (typeof first)[] }[] }>(firstKey)?.pages[0]
                .records[0].sharedUris
        ).toEqual({
            [getConsentAudienceCacheKey(contractOwnerDid)]: ['shared:new'],
        });
        expect(
            queryClient.getQueryData<{ pages: { records: (typeof other)[] }[] }>(otherKey)?.pages[0]
                .records
        ).toEqual([other]);
        expect(wallet.index.LearnCloud.getPage).not.toHaveBeenCalled();
    });

    it('does not coalesce concurrent shares from different wallet readers', async () => {
        const wallets = ['did:web:test-user', 'did:web:other-user'].map((readerDid, index) => {
            queryClient.setQueryData(
                ['useGetCredentialList', 'did:web:test-user', 'Achievement', readerDid],
                {
                    pages: [
                        {
                            records: [{ id: 'same-id', uri: 'cred:original', sharedUris: {} }],
                            hasMore: false,
                        },
                    ],
                    pageParams: [undefined],
                }
            );
            return {
                id: { did: () => readerDid },
                read: { get: vi.fn().mockResolvedValue({ id: 'cred:original' }) },
                store: {
                    LearnCloud: {
                        uploadEncrypted: vi.fn().mockResolvedValue(`shared:reader-${index}`),
                    },
                },
                index: { LearnCloud: { update: vi.fn() } },
            } as unknown as TestWallet;
        });
        const sharedUris = await Promise.all(
            wallets.map(wallet =>
                getOrCreateSharedUriForWallet(
                    wallet,
                    contractOwnerDid,
                    queryClient,
                    'cred:original',
                    'Achievement'
                )
            )
        );
        expect(sharedUris).toEqual(['shared:reader-0', 'shared:reader-1']);
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

            queryClient.setQueryData(
                ['useGetCredentialList', 'did:web:test-user', 'Achievement', 'did:web:test-user'],
                {
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
                }
            );

            const result = await getTermsWithSharedUrisForWallet(
                {
                    id: { did: () => 'did:web:test-user' },
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
        queryClient.setQueryData(
            ['useGetCredentialList', 'did:web:test-user', 'Achievement', 'did:web:test-user'],
            {
                pages: [
                    {
                        records: [{ id: 'record', uri: 'cred:original', sharedUris }],
                        hasMore: false,
                    },
                ],
                pageParams: [undefined],
            }
        );
        return {
            id: { did: () => 'did:web:test-user' },
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
        const uploadEncrypted = vi.fn(
            async (credential: { id: string }) => `shared:${credential.id}`
        );
        const wallet = {
            id: { did: () => 'did:web:test-user' },
            read: { get: vi.fn(async (uri: string) => ({ id: uri })) },
            store: {
                LearnCloud: {
                    uploadEncrypted,
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
        expect(uploadEncrypted.mock.calls.map(([credential]) => credential.id)).toEqual([
            'cred:a1',
            'cred:a2',
            'cred:c1',
        ]);
        expect(result.terms.read.credentials.categories.Achievement.shared).toEqual([
            'shared:cred:a1',
            'shared:cred:a2',
        ]);
        expect(result.terms.read.credentials.categories.Course.shared).toEqual(['shared:cred:c1']);
        expect(result.terms.read.credentials.categories.Disabled.shared).toEqual([]);
        expect(terms.terms.read.credentials.categories.Achievement.shared).toEqual(['cred:a1']);
    });
});

describe('reviewed profile field sharing', () => {
    const category = 'VerifiableData:demo:profile:branch';
    const indexId = `__verifiable_data_${category}__`;
    const owner = 'did:example:owner';
    const branch = { branch: 'North' };
    const prepare = (
        id: string,
        dataKey: string,
        dataPayload: object,
        cached: false | true | 'bound' = false
    ) => {
        const record = {
            id,
            uri: 'credential:source',
            sharedUris: cached
                ? {
                      [cached === 'bound'
                          ? getProfileFieldAudienceCacheKey(owner, 'credential:source')
                          : getConsentAudienceCacheKey(owner)]: ['shared:cached'],
                  }
                : {},
        };
        const credential = {
            validFrom: '2026-01-01T00:00:00.000Z',
            credentialSubject: { dataKey, dataPayload },
        };
        const upload = vi.fn().mockResolvedValue('shared:branch');
        const update = vi.fn().mockResolvedValue(true);
        const wallet = {
            id: { did: () => 'did:example:holder' },
            invoke: {
                learnCloudCompareAndSwapIndexRecord: update,
                learnCloudGetIndexRecordForUpdate: async () => [record],
            },
            index: { LearnCloud: { get: async () => [record], update } },
            read: { get: async () => credential },
            store: { LearnCloud: { uploadEncrypted: upload } },
        } as unknown as TestWallet;
        const terms = {
            terms: {
                read: {
                    personal: {},
                    credentials: {
                        categories: {
                            [category]: { sharing: true, shared: [record.uri] },
                        },
                    },
                },
                write: { personal: {}, credentials: { categories: {} } },
            },
        };
        const result = getTermsWithSharedUrisForWallet(wallet, owner, new QueryClient(), terms);
        return { result, credential, upload, update };
    };

    it.each([
        [true, 'shared:branch', 1],
        ['bound', 'shared:cached', 0],
    ] as const)(
        'only reuses a copy bound to its source answer (%s)',
        async (cache, uri, uploads) => {
            const { result, upload } = prepare(indexId, category, branch, cache);
            expect((await result).terms.read.credentials.categories[category].shared).toEqual([
                uri,
            ]);
            expect(upload).toHaveBeenCalledTimes(uploads);
        }
    );

    it('encrypts just the reviewed field for its recipient', async () => {
        const { result, upload, credential } = prepare(indexId, category, branch);
        const grant = (await result).terms.read.credentials.categories[category];
        expect(grant.shared).toEqual(['shared:branch']);
        expect(grant.fieldGeneration).toMatch(/^2026-01-01T00:00:00\.000Z:[a-f0-9]{64}$/);
        expect(grant.fieldGeneration).not.toContain('credential:source');
        expect(upload).toHaveBeenCalledExactlyOnceWith(credential, { recipients: [owner] });
    });

    it.each([
        {
            name: 'wrong index ID',
            id: '__verifiable_data_branch__',
            key: category,
            payload: branch,
        },
        {
            name: 'another field key',
            id: indexId,
            key: 'VerifiableData:demo:profile:gender',
            payload: branch,
        },
        {
            name: 'additional answer',
            id: indexId,
            key: category,
            payload: { ...branch, gender: 'Other' },
        },
    ])('rejects a $name even with a cached recipient copy', async ({ id, key, payload }) => {
        for (const cached of [false, true]) {
            const { result, upload, update } = prepare(id, key, payload, cached);
            await expect(result).rejects.toThrow('A reviewed profile field could not be prepared');
            expect(upload).not.toHaveBeenCalled();
            expect(update).not.toHaveBeenCalled();
        }
    });
});

describe('concurrent field updates', () => {
    const field = 'VerifiableData:demo:profile:branch';
    const id = `__verifiable_data_${field}__`;
    const audience = 'did:example:partner';
    type RecordState = {
        id: string;
        uri: string;
        category: string;
        issuanceDate: string;
        sharedUris: Record<string, string[]>;
    };
    const record = (uri: string, issuanceDate: string): RecordState => ({
        id,
        uri,
        category: field,
        issuanceDate,
        sharedUris: {},
    });
    const first = record('answer:a', '2026-01-01T00:00:00Z');
    const second = record('answer:b', '2026-02-01T00:00:00Z');
    const third = record('answer:c', '2026-03-01T00:00:00Z');

    it('materializes the current answer when the cached category page is stale', async () => {
        const getPage = vi.fn().mockResolvedValue({ records: [first], hasMore: false });
        const getForUpdate = vi.fn().mockImplementation(async () => [structuredClone(second)]);
        const wallet = {
            id: { did: () => 'did:example:holder' },
            invoke: {
                learnCloudGetIndexRecordForUpdate: getForUpdate,
                learnCloudCompareAndSwapIndexRecord: vi.fn().mockResolvedValue(true),
            },
            index: { LearnCloud: { getPage } },
            read: {
                get: async (uri: string) => ({
                    id: uri,
                    credentialSubject: { dataKey: field, dataPayload: { branch: uri } },
                }),
            },
            store: { LearnCloud: { uploadEncrypted: vi.fn().mockResolvedValue('shared:b') } },
        } as unknown as TestWallet;
        const result = await getOrCreateSharedUriForWallet(
            wallet,
            audience,
            new QueryClient(),
            second.uri,
            field
        );
        expect(result).toBe('shared:b');
        expect(getPage).not.toHaveBeenCalled();
        expect(getForUpdate).toHaveBeenCalledWith(id);
    });

    const setup = () => {
        let current = structuredClone(first);
        const swap = vi.fn(async (expected: RecordState, next: RecordState) => {
            if (JSON.stringify(expected) !== JSON.stringify(current)) return false;
            current = structuredClone(next);
            return true;
        });
        const upload = vi.fn(async (vc: { id: string }) => 'shared:' + vc.id);
        const wallet = {
            id: { did: () => 'did:example:holder' },
            invoke: {
                learnCloudCompareAndSwapIndexRecord: swap,
                learnCloudGetIndexRecordForUpdate: async () => [structuredClone(current)],
            },
            index: { LearnCloud: { get: async () => [structuredClone(current)] } },
            read: {
                get: async (uri: string) => ({
                    id: uri,
                    credentialSubject: { dataKey: field, dataPayload: { branch: uri } },
                }),
            },
            store: { LearnCloud: { uploadEncrypted: upload } },
        } as unknown as TestWallet;
        return { wallet, upload, swap, current: () => current };
    };
    it('discards an older ciphertext when replacement finishes during encryption', async () => {
        const { wallet, upload, current } = setup();
        const { indexLatestProfileField } = await import('../profileFieldIndex');
        let resume!: () => void;
        upload.mockImplementationOnce(
            async () =>
                new Promise(resolve => {
                    resume = () => resolve('shared:a');
                })
        );
        const share = (uri: string) =>
            getOrCreateSharedUriForWallet(wallet, audience, new QueryClient(), uri, field);
        const earlier = share(first.uri);
        await vi.waitFor(() => expect(upload).toHaveBeenCalledOnce());
        await indexLatestProfileField(wallet, second);
        resume();
        expect(await earlier).toBe(false);
        expect(current()).toEqual(second);
        expect(await share(second.uri)).toBe('shared:answer:b');
    });
    it('rechecks issuance order when two clients read the same original answer', async () => {
        const { wallet, current, swap } = setup();
        const { indexLatestProfileField } = await import('../profileFieldIndex');
        const compareAndSwap = swap.getMockImplementation()!;
        let resume!: () => void;
        swap.mockImplementationOnce(async (expected, next) => {
            await new Promise<void>(resolve => {
                resume = resolve;
            });
            return compareAndSwap(expected, next);
        });
        const older = indexLatestProfileField(wallet, second);
        await vi.waitFor(() => expect(swap).toHaveBeenCalledOnce());
        await indexLatestProfileField(wallet, third);
        resume();
        expect((await older)?.uri).toBe(third.uri);
        expect(current()).toEqual(third);
    });
});
