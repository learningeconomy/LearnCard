// @vitest-environment happy-dom
import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import {
    QueryClient,
    QueryClientProvider,
    IsRestoringProvider,
    dehydrate,
    hydrate,
} from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    switchedDid: undefined as string | undefined,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: { use: { switchedDid: () => host.switchedDid } },
    CredentialCategoryEnum: (await import('../../types/boostAndCredentialMetadata'))
        .CredentialCategoryEnum,
    categoryMetadata: (await import('../../types/boostAndCredentialMetadata')).categoryMetadata,
    newCredsStore: {},
    credentialWithEditsHelper: (vc: VC) => vc,
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: { get: { switchedDid: () => host.switchedDid } },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getIssuanceDate: (vc: VC) => vc.issuanceDate,
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({
    getCategoryForCredential: vi.fn(),
    default: () => ({ initWallet: host.init }),
}));
vi.mock('../mutations/syncConsentFlow', () => ({
    useSyncConsentContractsMutation: vi.fn(),
    useAcceptAndStoreCredentialsMutation: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    getOrFetchConsentedContracts: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useGetCredentialRecordForBoost', () => ({
    getOrFetchCredentialRecordForBoost: vi.fn(),
}));
vi.mock('learn-card-base/helpers/backfills', () => ({ useBackfillBoostUris: () => vi.fn() }));

import { insertItem } from '../mutations/mutation.helpers';
import { isInfiniteData, useGetCredentialList, useGetRecordForUri } from './vcQueries';

const CATEGORY = 'Merit Badge';
const KEY = ['useGetCredentialList', '', CATEGORY, 'did:example:reader'];

// Shapes a persisted cache entry can have that are truthy but not InfiniteData.
const malformedEntries: Array<[string, unknown]> = [
    ['an empty object', {}],
    ['pages: undefined', { pages: undefined, pageParams: [] }],
    ['a single page', { records: [], hasMore: false }],
    ['pages without pageParams', { pages: [{ records: [], hasMore: false }] }],
];

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const makeWallet = () => {
    const getPage = vi
        .fn()
        .mockResolvedValue({ records: [{ uri: 'uri-1' }], hasMore: true, cursor: 'next' });
    const get = vi.fn().mockResolvedValue([{ uri: 'uri-2' }]);
    host.wallet = {
        id: { did: () => 'did:example:reader' },
        index: { LearnCloud: { getPage, get } },
    } as unknown as BespokeLearnCard;
    return { getPage, get };
};

beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
    host.switchedDid = undefined;
    host.wallet = null;
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
});

describe('isInfiniteData', () => {
    it.each(malformedEntries)('rejects %s', (_, data) => {
        expect(isInfiniteData(data)).toBe(false);
    });

    it('accepts an infinite query result', () => {
        expect(isInfiniteData({ pages: [], pageParams: [] })).toBe(true);
    });
});

describe('useGetCredentialList with a malformed cache entry', () => {
    it.each(malformedEntries)('refetches instead of crashing on %s', async (_, data) => {
        const { getPage } = makeWallet();
        client.setQueryData(KEY, data);

        const { result } = renderHook(() => useGetCredentialList(CATEGORY), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getPage).toHaveBeenCalledOnce();
        expect(result.current.data?.pages).toHaveLength(1);
        expect(result.current.hasNextPage).toBe(true);
    });

    it('survives a malformed entry restored from the persisted cache after mount', async () => {
        const { getPage } = makeWallet();
        const persisted = new QueryClient();
        persisted.setQueryData(KEY, {});
        const state = dehydrate(persisted);
        let isRestoring = true;
        const restoringWrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>
                <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
            </QueryClientProvider>
        );

        const { result, rerender } = renderHook(() => useGetCredentialList(CATEGORY), {
            wrapper: restoringWrapper,
        });
        hydrate(client, state);
        isRestoring = false;
        rerender();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getPage).toHaveBeenCalledOnce();
        expect(result.current.hasNextPage).toBe(true);
    });
});

describe('useGetRecordForUri', () => {
    it('skips malformed credential-list entries when searching the cache', async () => {
        const { get } = makeWallet();
        client.setQueryData(KEY, {});

        const { result } = renderHook(() => useGetRecordForUri('uri-2'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual({ uri: 'uri-2' });
        expect(get).toHaveBeenCalledOnce();
    });
});

describe('insertItem', () => {
    it.each(malformedEntries)('replaces a malformed list on %s', async (_, malformed) => {
        client.setQueryData(KEY, malformed);

        await insertItem(client, KEY, { id: 'new', uri: 'uri-new' });

        const data = client.getQueryData(KEY);
        expect(isInfiniteData(data)).toBe(true);
        expect(data).toEqual({
            pageParams: [undefined],
            pages: [{ records: [{ id: 'new', uri: 'uri-new' }], hasMore: false }],
        });
    });
});

describe('insertItem on a list with more pages', () => {
    it('keeps hasNextPage when the follow-up refetch fails', async () => {
        const { getPage } = makeWallet();
        // Read the fields during render so the hook re-renders when they change.
        const { result } = renderHook(
            () => {
                const { data, hasNextPage, isRefetchError } = useGetCredentialList(CATEGORY);
                return { data, hasNextPage, isRefetchError };
            },
            { wrapper }
        );
        await waitFor(() => expect(result.current.hasNextPage).toBe(true));

        getPage.mockRejectedValue(new Error('offline'));
        await insertItem(client, KEY, { id: 'new', uri: 'uri-new' });
        await client.refetchQueries({ queryKey: KEY }).catch(() => undefined);
        await waitFor(() => expect(result.current.isRefetchError).toBe(true));

        expect(result.current.hasNextPage).toBe(true);
        expect(result.current.data?.pages).toEqual([
            {
                records: [{ id: 'new', uri: 'uri-new' }, { uri: 'uri-1' }],
                hasMore: true,
                cursor: 'next',
            },
        ]);
        expect(result.current.data?.pageParams).toHaveLength(1);
    });
});
