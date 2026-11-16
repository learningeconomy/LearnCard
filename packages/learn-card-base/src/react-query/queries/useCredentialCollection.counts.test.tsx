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
    switchedProfileStore: {
        use: { switchedDid: () => host.switchedDid },
        get: { switchedDid: () => host.switchedDid },
    },
}));
vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { set: { removeCreds: vi.fn(), addNewCreds: vi.fn() } },
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
import type { VC } from '@learncard/types';
import { useCredentialCollection } from './useCredentialCollection';
import { CREDENTIAL_LIST_PAGE_SIZE } from './vcQueries';
import { backfillResolvedCredentialRecord } from '../../helpers/backfills';
import {
    useDeleteChecklistCredentialMutation,
    useUpdateChecklistItemCategoryMutation,
} from '../mutations/checklist';

/**
 * Probe's Passport-count breaks (LC-2412) and the bounded first walk (LC-2413).
 * A tile shows `loading` when `!isComplete && !isError`, and otherwise the unavailable state
 * ("Count unavailable" in list view, "—" in grid) when `!isComplete`
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
/** A persisted snapshot whose walk (and cache write) happened at `at`. */
const stampSaved = (saved: ReturnType<typeof dehydrate>, at: number) => {
    for (const query of saved.queries) {
        query.state.dataUpdatedAt = at;
        const data = query.state.data as { pages?: { walkedAt?: number }[] } | undefined;
        for (const page of data?.pages ?? []) page.walkedAt = at;
    }
};
/** What insertItem / refreshCredentialCaches write when a key has no list yet. */
const placeholder = () => ({
    pages: [{ hasMore: false, records: [record(99)] }],
    pageParams: [undefined],
});

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

    it.each([
        ['older than the stale window', () => Date.now() - 5 * 60 * 1000 - 1000],
        // Inside the window but from an earlier page load: launch still revalidates once.
        ['from the previous launch', () => performance.timeOrigin - 1000],
    ])(
        'SavedCountShownAtLaunch: a saved cache %s shows counts once the wallet is ready, while refetching',
        async (_label, savedAt) => {
            makeWallet();
            const { result: warm, unmount } = renderHook(useCounts, { wrapper });
            await waitFor(() => expect(warm.current.count).toBe(30));
            unmount();
            const saved = dehydrate(client);
            stampSaved(saved, savedAt());

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
        }
    );

    it('CachedCountKeptOnFailedRefresh: a failed background refresh never shows the unavailable state (Count unavailable / —)', async () => {
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

    it('shows the unavailable state (Count unavailable / —) when a first walk fails mid-way', async () => {
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

describe('Optimistic placeholders and cache-only writes (LC-2412 review)', () => {
    it('PlaceholderNotComplete: an optimistic placeholder shows a spinner while its refetch runs, not a false count', async () => {
        const getPage = makeWallet();
        const held = Promise.withResolvers<Page>();
        getPage.mockImplementationOnce(() => held.promise);
        client.setQueryData(listKey, placeholder());
        const { result } = renderHook(useCountsWhileFetching, { wrapper });
        await waitFor(() => expect(result.current.fetching).toBe(true));
        expect(result.current).toEqual({ count: null, loading: true, fetching: true });

        await act(async () => held.resolve(servePage({ limit: 12 })));
        await waitFor(() => expect(result.current.count).toBe(30));
    });

    it('PlaceholderNotComplete: an optimistic placeholder with a failed refetch shows the unavailable state, not a false count', async () => {
        const getPage = makeWallet();
        getPage.mockRejectedValue(new Error('index.get blocked'));
        client.setQueryData(listKey, placeholder());
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'complete' }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(view(result.current)).toEqual({ count: null, loading: false });
    });

    it('a record inserted into a finished walk keeps the walk complete', async () => {
        makeWallet();
        const { result } = renderHook(useCounts, { wrapper });
        await waitFor(() => expect(result.current.count).toBe(30));
        await act(async () => {
            client.setQueryData<{ pages: Page[]; pageParams: unknown[] }>(listKey, data =>
                data
                    ? {
                          ...data,
                          pages: [
                              {
                                  ...data.pages[0]!,
                                  records: [record(99), ...data.pages[0]!.records],
                              },
                              ...data.pages.slice(1),
                          ],
                      }
                    : data
            );
        });
        await waitFor(() => expect(result.current).toEqual({ count: 31, loading: false }));
    });

    it('BackfillKeepsLaunchRevalidation: a restored list touched by a backfill write still revalidates once', async () => {
        makeWallet();
        const { result: warm, unmount } = renderHook(useCounts, { wrapper });
        await waitFor(() => expect(warm.current.count).toBe(30));
        unmount();
        const saved = dehydrate(client);
        stampSaved(saved, performance.timeOrigin - 1000);
        client = newClient();
        hydrate(client, saved);

        const getPage = makeWallet();
        const update = vi.fn(async () => true);
        (
            host.wallet as unknown as { index: { LearnCloud: { update: typeof update } } }
        ).index.LearnCloud.update = update;
        await backfillResolvedCredentialRecord(client, host.wallet!, 'uri-0', {
            boostId: 'boost-0',
        } as unknown as VC);
        expect(update).toHaveBeenCalledOnce();
        expect(client.getQueryState(listKey)!.dataUpdatedAt).toBeGreaterThan(
            performance.timeOrigin
        );

        const { result } = renderHook(useCountsWhileFetching, { wrapper });
        await waitFor(() => expect(getPage).toHaveBeenCalled());
        expect(result.current.count).toBe(30);
    });
});

describe('Index writers refresh the cached walk (LC-2412 review)', () => {
    it.each([
        [
            'checklist delete',
            () => {
                const mutation = useDeleteChecklistCredentialMutation();
                return () => mutation.mutateAsync({ id: '0', uri: 'uri-0' });
            },
        ],
        [
            'checklist recategorize',
            () => {
                const mutation = useUpdateChecklistItemCategoryMutation();
                return () => mutation.mutateAsync({ id: '0', uri: 'uri-0', category: 'Skill' });
            },
        ],
    ])(
        'WriterInvalidatesList: %s refetches the list inside the stale window',
        async (_label, useWriter) => {
            const getPage = makeWallet();
            Object.assign(
                (host.wallet as unknown as { index: { LearnCloud: object } }).index.LearnCloud,
                {
                    remove: vi.fn(async () => true),
                    update: vi.fn(async () => true),
                }
            );
            const { result } = renderHook(() => ({ counts: useCounts(), write: useWriter() }), {
                wrapper,
            });
            await waitFor(() => expect(result.current.counts.count).toBe(30));
            const calls = getPage.mock.calls.length;

            await act(async () => {
                await result.current.write();
            });
            await waitFor(() => expect(getPage.mock.calls.length).toBeGreaterThan(calls));
            expect(result.current.counts.count).toBe(30);
        }
    );
});
