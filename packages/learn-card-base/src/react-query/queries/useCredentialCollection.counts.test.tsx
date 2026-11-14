// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import {
    QueryClient,
    QueryClientProvider,
    dehydrate,
    focusManager,
    hydrate,
} from '@tanstack/react-query';
import type { LCR } from '../../types/credential-records';
import type { BespokeLearnCard } from '../../types/learn-card';

const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    switchedDid: undefined as string | undefined,
    init: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: { use: { switchedDid: () => host.switchedDid } },
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: {
        use: { switchedDid: () => host.switchedDid },
        get: { switchedDid: () => host.switchedDid },
    },
}));
vi.mock('../../helpers/credentialHelpers', () => ({
    getCredentialName: (vc: {
        name?: string;
        credentialSubject?: { achievement?: { name?: string } };
    }) => vc.name ?? vc.credentialSubject?.achievement?.name ?? '',
    getCredentialSubjectAchievement: (vc: {
        credentialSubject?: { achievement?: { name?: string } };
    }) => vc.credentialSubject?.achievement,
    getIssuanceDate: () => '',
    SELF_ASSIGNED_SKILLS_BOOST_NAME: 'Self-Assigned Skills',
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({ getCategoryForCredential: vi.fn() }));
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
import { useCredentialCollection } from './useCredentialCollection';
import { CREDENTIAL_LIST_PAGE_SIZE, CREDENTIAL_LIST_STALE_TIME } from './vcQueries';

/**
 * Probe's Passport-count breaks (LC-2412) and the bounded first walk (LC-2413).
 * A square shows `loading` when `!isComplete && !isError` and "—" when `!isComplete`
 * (WalletPageItemWrapper, DashboardPage, CredentialPage), so those two flags are the contract.
 */
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const newClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
const record = (i: number): LCR =>
    ({ id: String(i), uri: `uri-${i}`, title: `Badge ${i}`, category: 'Social Badge' }) as LCR;
const ROWS = Array.from({ length: 30 }, (_, i) => record(i));
type Page = { records: LCR[]; hasMore: boolean; cursor: string };
const servePage = (options?: { cursor?: string; limit?: number }): Page => {
    const start = Number(options?.cursor ?? 0);
    const end = start + (options?.limit ?? 12);
    return { records: ROWS.slice(start, end), hasMore: end < ROWS.length, cursor: String(end) };
};
const makeWallet = (did = 'account-a') => {
    const getPage = vi.fn(async (_query: unknown, options?: { cursor?: string; limit?: number }) =>
        servePage(options)
    );
    host.wallet = {
        id: { did: () => did },
        index: { LearnCloud: { getPage } },
    } as unknown as BespokeLearnCard;
    return getPage;
};
const view = (collection: ReturnType<typeof useCredentialCollection>) => ({
    count: collection.isComplete ? collection.records.length : null,
    loading: !collection.isComplete && !collection.isError,
});
const useCounts = () => view(useCredentialCollection(undefined, { mode: 'complete' }));
/** Same view plus the rendered fetch state, so assertions read what the screen rendered. */
const useCountsWhileFetching = () => {
    const collection = useCredentialCollection(undefined, { mode: 'complete' });
    return { ...view(collection), fetching: collection.isFetching };
};
const listKey = ['useGetCredentialList', '', '', 'account-a'];

beforeEach(() => {
    client = newClient();
    host.switchedDid = undefined;
    host.wallet = null;
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
    focusManager.setFocused(undefined);
    vi.clearAllMocks();
});

describe('Passport counts (LC-2412, LC-2413)', () => {
    it('CachedCountShownOnReturn: a return within the window reuses the walk', async () => {
        const getPage = makeWallet();
        const first = renderHook(useCounts, { wrapper });
        await waitFor(() => expect(first.result.current.count).toBe(30));
        first.unmount();
        const calls = getPage.mock.calls.length;

        const back = renderHook(useCounts, { wrapper });
        expect(back.result.current).toEqual({ count: 30, loading: false });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
        });
        expect(getPage).toHaveBeenCalledTimes(calls);
        expect(back.result.current).toEqual({ count: 30, loading: false });
    });

    it('CachedCountShownOnReturn: a resume refetch keeps the cached count, no spinner', async () => {
        const getPage = makeWallet();
        const { result } = renderHook(useCountsWhileFetching, { wrapper });
        await waitFor(() => expect(result.current.count).toBe(30));

        const held = Promise.withResolvers<Page>();
        getPage.mockImplementationOnce(() => held.promise);
        // Stale after the window, then the app regains focus (resume) and refetches.
        await act(async () => {
            await client.invalidateQueries({ queryKey: listKey, refetchType: 'none' });
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });
        await waitFor(() => expect(result.current.fetching).toBe(true));
        expect(result.current).toEqual({ count: 30, loading: false, fetching: true });

        await act(async () => held.resolve(servePage()));
        await waitFor(() => expect(result.current.fetching).toBe(false));
        expect(result.current).toEqual({ count: 30, loading: false, fetching: false });
    });

    it('SavedCountShownAtLaunch: hydrated counts show once the wallet is ready, even while refetching', async () => {
        makeWallet();
        const { result: warm, unmount } = renderHook(useCounts, { wrapper });
        await waitFor(() => expect(warm.current.count).toBe(30));
        unmount();
        const saved = dehydrate(client);
        for (const query of saved.queries) {
            // Saved last session: older than the stale window, so launch refetches.
            query.state.dataUpdatedAt = Date.now() - CREDENTIAL_LIST_STALE_TIME - 1000;
        }

        client = newClient();
        hydrate(client, saved);
        host.wallet = null;
        const { result, rerender } = renderHook(useCountsWhileFetching, { wrapper });
        expect(result.current.loading).toBe(true);

        const getPage = makeWallet();
        const held = Promise.withResolvers<Page>();
        getPage.mockImplementationOnce(() => held.promise);
        rerender();
        await waitFor(() => expect(result.current.fetching).toBe(true));
        expect(getPage).toHaveBeenCalledTimes(1);
        expect(result.current).toEqual({ count: 30, loading: false, fetching: true });

        await act(async () => held.resolve(servePage()));
        await waitFor(() => expect(result.current.fetching).toBe(false));
        expect(result.current).toEqual({ count: 30, loading: false, fetching: false });
    });

    it('CachedCountKeptOnFailedRefresh: a failed background refresh never shows "—"', async () => {
        const getPage = makeWallet();
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'complete' }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.isComplete).toBe(true));

        getPage.mockRejectedValue(new Error('offline'));
        await act(async () => {
            await client.invalidateQueries({ queryKey: listKey }).catch(() => undefined);
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(view(result.current)).toEqual({ count: 30, loading: false });
    });

    it('still shows a spinner, then "—", when a first walk fails mid-way', async () => {
        const getPage = makeWallet();
        getPage.mockImplementation(async (_query, options) => {
            if (options?.cursor) throw new Error('offline');
            return servePage(options);
        });
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'complete' }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(view(result.current)).toEqual({ count: null, loading: false });
        expect(result.current.records).toHaveLength(12);
    });

    it('FirstLoadBounded: the walk keeps a small first page, then takes large pages', async () => {
        const getPage = makeWallet();
        const { result } = renderHook(useCounts, { wrapper });
        await waitFor(() => expect(result.current.count).toBe(30));
        expect(getPage.mock.calls.map(([, options]) => options?.limit)).toEqual([
            12,
            CREDENTIAL_LIST_PAGE_SIZE,
        ]);
    });
});
