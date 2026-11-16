import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
    dropMalformedInfiniteCacheEntry,
    filterMalformedInfiniteQueries,
    INFINITE_QUERY_KEY_ROOTS,
    isInfiniteData,
    isKnownInfiniteQueryKey,
    sanitizePersistedQueries,
    shouldDropMalformedInfiniteEntry,
} from './infiniteQueryGuard';

const malformedEntries: Array<[string, unknown]> = [
    ['an empty object', {}],
    ['pages: undefined', { pages: undefined, pageParams: [] }],
    ['a single page', { records: [], hasMore: false }],
    ['pages without pageParams', { pages: [{ records: [], hasMore: false }] }],
];

/** Every `useInfiniteQuery` key root in the monorepo; keep in sync when adding a new one. */
const EXPECTED_INFINITE_QUERY_KEY_ROOTS = [
    'campaign-audience',
    'campaign-list',
    'getMyActivities',
    'getSkillChildrenInfinite',
    'paginatedBoostRecipients',
    'paginatedConnectionRequests',
    'paginatedConnections',
    'paginatedPendingConnections',
    'passportActivities',
    'useGetCredentialList',
    'useGetPaginatedBoostChildren',
    'useGetPaginatedFamilialBoosts',
    'useGetPaginatedManagedBoosts',
    'useGetPaginatedManagedBoostsQuery',
    'useGetUserNotifications',
    'useNetworkMembers',
    'useTermsTransactions',
    'useXApiStatements',
    'useXApiStatementsForContract',
] as const;

describe('isInfiniteData', () => {
    it.each(malformedEntries)('rejects %s', (_, data) => {
        expect(isInfiniteData(data)).toBe(false);
    });

    it('accepts an infinite query result', () => {
        expect(isInfiniteData({ pages: [], pageParams: [] })).toBe(true);
    });
});

describe('shouldDropMalformedInfiniteEntry', () => {
    it.each(malformedEntries)('drops known infinite key with %s', (_, data) => {
        expect(
            shouldDropMalformedInfiniteEntry(
                ['useGetPaginatedManagedBoosts', '', 'achievement'],
                data
            )
        ).toBe(true);
    });

    it('keeps a valid InfiniteData entry for a known key', () => {
        expect(
            shouldDropMalformedInfiniteEntry(['useGetPaginatedManagedBoosts', '', 'achievement'], {
                pages: [],
                pageParams: [],
            })
        ).toBe(false);
    });

    it('does not drop a regular query whose data is an ordinary object', () => {
        expect(shouldDropMalformedInfiniteEntry(['getProfile', 'did'], { name: 'Ada' })).toBe(
            false
        );
    });

    it('does not drop an unknown key even when data has pages/pageParams', () => {
        expect(
            shouldDropMalformedInfiniteEntry(['customInfinite'], {
                pages: [{ records: [] }],
            })
        ).toBe(false);
    });

    it('does not drop useGetResolvedCredential when the credential has a pages extension', () => {
        const credential = {
            id: 'urn:example:cred',
            type: ['VerifiableCredential'],
            // Raw credentials can carry a top-level `pages` extension (false positive before LC-2352 fix).
            pages: [{ type: 'extensionPage' }],
            pageParams: { ignored: true },
        };
        expect(
            shouldDropMalformedInfiniteEntry(
                ['useGetResolvedCredential', 'urn:example:cred', 'did:example:holder'],
                credential
            )
        ).toBe(false);
    });
});

describe('INFINITE_QUERY_KEY_ROOTS', () => {
    it('registers every known useInfiniteQuery key root', () => {
        expect([...INFINITE_QUERY_KEY_ROOTS].sort()).toEqual(
            [...EXPECTED_INFINITE_QUERY_KEY_ROOTS].sort()
        );
    });

    it('recognizes managed-boosts and credential-list roots', () => {
        expect(isKnownInfiniteQueryKey(['useGetPaginatedManagedBoosts'])).toBe(true);
        expect(isKnownInfiniteQueryKey(['useGetCredentialList'])).toBe(true);
        expect(isKnownInfiniteQueryKey(['getProfile'])).toBe(false);
        expect(isKnownInfiniteQueryKey(['useGetResolvedCredential'])).toBe(false);
    });
});

describe('dropMalformedInfiniteCacheEntry', () => {
    it('removes a malformed managed-boosts entry', () => {
        const client = new QueryClient();
        const key = ['useGetPaginatedManagedBoosts', '', 'achievement'];
        client.setQueryData(key, {});
        expect(dropMalformedInfiniteCacheEntry(client, key, 'useGetPaginatedManagedBoosts')).toBe(
            true
        );
        expect(client.getQueryData(key)).toBeUndefined();
    });

    it('leaves valid InfiniteData alone', () => {
        const client = new QueryClient();
        const key = ['useGetPaginatedManagedBoosts', '', 'achievement'];
        const data = { pages: [{ records: [] }], pageParams: [undefined] };
        client.setQueryData(key, data);
        expect(dropMalformedInfiniteCacheEntry(client, key)).toBe(false);
        expect(client.getQueryData(key)).toEqual(data);
    });
});

describe('sanitizePersistedQueries (restore boundary)', () => {
    it('strips malformed infinite entries and keeps others', () => {
        const snapshot = {
            buster: '1',
            timestamp: 1,
            clientState: {
                queries: [
                    {
                        queryKey: ['useGetPaginatedManagedBoosts', '', 'achievement'],
                        queryHash: 'a',
                        state: { data: {}, dataUpdateCount: 1 },
                    },
                    {
                        queryKey: ['useGetCredentialList', '', 'achievement', 'did'],
                        queryHash: 'b',
                        state: {
                            data: { pages: [{ records: [] }], pageParams: [undefined] },
                            dataUpdateCount: 1,
                        },
                    },
                    {
                        queryKey: ['getProfile', 'did'],
                        queryHash: 'c',
                        state: { data: { name: 'Ada' }, dataUpdateCount: 1 },
                    },
                ],
            },
        };

        const sanitized = sanitizePersistedQueries(snapshot);
        expect(sanitized.clientState.queries.map(q => q.queryKey[0])).toEqual([
            'useGetCredentialList',
            'getProfile',
        ]);
    });

    it('keeps a persisted useGetResolvedCredential entry that has a pages extension', () => {
        const credential = {
            id: 'urn:example:cred',
            type: ['VerifiableCredential'],
            pages: [{ type: 'extensionPage' }],
            pageParams: { ignored: true },
        };
        const snapshot = {
            buster: '1',
            timestamp: 1,
            clientState: {
                queries: [
                    {
                        queryKey: ['useGetResolvedCredential', 'urn:example:cred', 'did:example'],
                        queryHash: 'cred',
                        state: { data: credential, dataUpdateCount: 1 },
                    },
                    {
                        queryKey: ['useGetPaginatedManagedBoosts', '', 'achievement'],
                        queryHash: 'boosts',
                        state: { data: { pages: [{ records: [] }] }, dataUpdateCount: 1 },
                    },
                ],
            },
        };

        const sanitized = sanitizePersistedQueries(snapshot);
        expect(sanitized.clientState.queries).toHaveLength(1);
        expect(sanitized.clientState.queries[0].queryKey[0]).toBe('useGetResolvedCredential');
        expect(sanitized.clientState.queries[0].state.data).toEqual(credential);
    });

    it('filterMalformedInfiniteQueries is the queries-only form', () => {
        const kept = filterMalformedInfiniteQueries([
            { queryKey: ['getProfile'], state: { data: { ok: true } } },
            { queryKey: ['passportActivities', {}], state: { data: {} } },
        ]);
        expect(kept).toHaveLength(1);
        expect(kept[0].queryKey[0]).toBe('getProfile');
    });
});
