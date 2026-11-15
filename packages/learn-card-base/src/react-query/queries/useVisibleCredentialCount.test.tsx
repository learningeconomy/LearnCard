// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import type { LCR } from '../../types/credential-records';
import type { BespokeLearnCard } from '../../types/learn-card';

const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    init: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: {
        use: { switchedDid: () => undefined },
        get: { switchedDid: () => undefined },
    },
}));
vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { set: { removeCreds: vi.fn(), addNewCreds: vi.fn() } },
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: {
        use: { switchedDid: () => undefined },
        get: { switchedDid: () => undefined },
    },
}));
vi.mock('../../stores/NetworkStore', () => ({
    networkStore: { use: { cloudUrl: () => 'cloud' } },
}));
vi.mock('../../hooks/useWallet', () => ({ useWallet: () => ({ initWallet: host.init }) }));
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

import {
    generateEncryptedFieldsArray,
    generateIndexQuery,
} from '../../../../plugins/learn-cloud/src/helpers';
import { useVisibleCredentialCount } from './useVisibleCredentialCount';
import { useCredentialCollection } from './useCredentialCollection';
import { CREDENTIAL_LIST_STALE_TIME } from './vcQueries';
import { isCredentialCollectionRecordVisible } from '../../helpers/credentialCollection';
import {
    getCredentialVisibilityBackfillKey,
    isCredentialVisibilityBackfillComplete,
    loadCredentialIndexSnapshot,
    reconcileCredentialVisibility,
    resetCredentialVisibilityBackfillForTests,
} from '../../helpers/credentialVisibilityBackfill';
import { saveVerifiableData } from '../../hooks/useVerifiableData';
import { useDeleteChecklistCredentialMutation } from '../mutations/checklist';

/**
 * Passport/Home counts from the index count endpoint (LC-2412, LC-2413). The fake LearnCloud
 * below stores what the real service stores (hashed `fields`) and filters with Mongo's
 * array semantics, and the query goes through the real plugin's generateIndexQuery, so a
 * count here is the count the service would return for the same records.
 */
const hasher = { invoke: { hash: async (message: string) => `h(${message})` } } as never;

type Stored = LCR & Record<string, unknown>;
const FIXTURE = (): Stored[] =>
    [
        { id: 'sb-1', uri: 'u:sb-1', category: 'Social Badge', title: 'Badge 1' },
        { id: 'sb-2', uri: 'u:sb-2', category: 'Social Badge', title: 'Badge 2' },
        { id: 'sb-3', uri: 'u:sb-3', category: 'Social Badge' },
        { id: 'ach-1', uri: 'u:ach-1', category: 'Achievement', title: 'Award' },
        { id: 'ach-2', uri: 'u:ach-2', category: 'Achievement' },
        { id: 'ach-no-uri', category: 'Achievement', title: 'No uri' },
        { id: 'skill-1', uri: 'u:skill-1', category: 'Skill', title: 'Welding' },
        // Legacy Self-Assigned Skills record in a Passport category.
        { id: 'sas', uri: 'u:sas', category: 'Skill', title: 'Self-Assigned Skills' },
        // Holder-hidden records (LC-2294), in both spellings.
        { id: 'hid-1', uri: 'u:hid-1', category: 'Hidden', title: 'Hidden one' },
        { id: 'hid-2', uri: 'u:hid-2', category: 'hidden', title: 'Hidden two' },
        // Verifiable data, including one stored under a Passport category.
        { id: '__verifiable_data_goals__', uri: 'u:vd-1', category: 'Goals' },
        { id: '__verifiable_data_notes__', uri: 'u:vd-2', category: 'Achievement' },
        // Internal categories, canonical and as aliases or other casings.
        { id: 'ai-1', uri: 'u:ai-1', category: 'AI Topic' },
        { id: 'ai-2', uri: 'u:ai-2', category: 'ai topic' },
        { id: 'ai-3', uri: 'u:ai-3', category: 'AI Sessions' },
        { id: 'resume-1', uri: 'u:resume-1', category: 'resume' },
        { id: 'resume-2', uri: 'u:resume-2', category: 'Resume' },
    ] as Stored[];

let records: Stored[];
/** LearnCloud custom documents (where the backfill marker lives). */
let documents: Record<string, unknown>[];
const fieldsOf = (record: Stored) => generateEncryptedFieldsArray(hasher, record);
type ServerFilter = {
    fields?: { $in?: string[]; $nin?: string[] };
    $and?: ServerFilter[];
};
const matchesFilter = (fields: string[], filter: ServerFilter): boolean =>
    Object.entries(filter).every(([key, value]) => {
        if (key === '$and')
            return (value as ServerFilter[]).every(clause => matchesFilter(fields, clause));
        if (key !== 'fields') throw new Error(`unexpected server filter key ${key}`);
        const { $in, $nin } = value as NonNullable<ServerFilter['fields']>;
        if ($in && !$in.some(hash => fields.includes(hash))) return false;
        if ($nin && $nin.some(hash => fields.includes(hash))) return false;
        return true;
    });

const makeWallet = (did = 'account-a') => {
    const getPage = vi.fn(
        async (_query: unknown, options?: { cursor?: string; limit?: number }) => {
            const start = Number(options?.cursor ?? 0);
            const end = start + (options?.limit ?? 12);
            return {
                records: records.slice(start, end).map(record => ({ ...record })),
                hasMore: end < records.length,
                cursor: String(end),
            };
        }
    );
    const getCount = vi.fn(async (query: Record<string, unknown>) => {
        const filter = (await generateIndexQuery(hasher, query)) as ServerFilter;
        let count = 0;
        for (const record of records) if (matchesFilter(await fieldsOf(record), filter)) count++;
        return count;
    });
    const update = vi.fn(async (id: string, updates: Partial<Stored>) => {
        const index = records.findIndex(record => record.id === id);
        if (index < 0) return false;
        records[index] = { ...records[index], ...updates } as Stored;
        return true;
    });
    const get = vi.fn(async (query: Partial<Stored>) =>
        records.filter(record => Object.entries(query).every(([k, v]) => record[k] === v))
    );
    const add = vi.fn(async (record: Stored) => {
        records.push(record);
        return true;
    });
    const remove = vi.fn(async (id: string) => {
        records = records.filter(record => record.id !== id);
        return true;
    });
    const learnCloudCount = vi.fn(
        async (query: Record<string, unknown>) =>
            documents.filter(doc => Object.entries(query).every(([k, v]) => doc[k] === v)).length
    );
    const learnCloudCreate = vi.fn(async (doc: Record<string, unknown>) => {
        documents.push(doc);
        return true;
    });
    host.wallet = {
        id: { did: () => did },
        index: { LearnCloud: { getPage, getCount, update, get, add, remove } },
        invoke: {
            issueCredential: vi.fn(async (vc: object) => ({ ...vc, proof: {} })),
            learnCloudCount,
            learnCloudCreate,
        },
        store: { LearnCloud: { uploadEncrypted: vi.fn(async () => `u:${records.length}`) } },
    } as unknown as BespokeLearnCard;
    return { getPage, getCount, update, learnCloudCount, learnCloudCreate };
};

/** What the full list walk shows: visible, unique by uri, matched by exact category. */
const walkCount = (category?: string) =>
    new Set(
        records
            .filter(isCredentialCollectionRecordVisible)
            .filter(record => !category || record.category === category)
            .map(record => record.uri)
    ).size;

const TILES = ['Social Badge', 'Achievement', 'Skill'] as const;
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const newClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
const useAllCounts = () => {
    const home = useVisibleCredentialCount();
    const socialBadge = useVisibleCredentialCount(TILES[0]);
    const achievement = useVisibleCredentialCount(TILES[1]);
    const skill = useVisibleCredentialCount(TILES[2]);
    return { home, tiles: [socialBadge, achievement, skill] };
};
const values = (current: ReturnType<typeof useAllCounts>) => ({
    home: current.home.count,
    tiles: current.tiles.map(tile => tile.count),
});
const expectedValues = () => ({ home: walkCount(), tiles: TILES.map(tile => walkCount(tile)) });
const backfillKey = getCredentialVisibilityBackfillKey('account-a', 'cloud');

beforeEach(() => {
    client = newClient();
    records = FIXTURE();
    documents = [];
    window.localStorage.clear();
    resetCredentialVisibilityBackfillForTests();
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe('Counts leave hidden records out (LC-2413 count endpoint)', () => {
    it('the raw count would include unmarked hidden records, so it is not used before the backfill', async () => {
        const { getCount } = makeWallet();
        const { getVisibleCredentialCountQuery } = await import('./useVisibleCredentialCount');
        expect(await getCount(getVisibleCredentialCountQuery('Achievement'))).toBe(4);
        expect(walkCount('Achievement')).toBe(2);
        expect(await getCount(getVisibleCredentialCountQuery())).not.toBe(walkCount());
    });

    it('before the backfill, Passport and Home counts come from one index read and equal the visible records', async () => {
        const { getPage } = makeWallet();
        const { result } = renderHook(useAllCounts, { wrapper });

        await waitFor(() => expect(values(result.current)).toEqual(expectedValues()));
        expect(values(result.current)).toEqual({ home: 6, tiles: [3, 2, 1] });
        expect(result.current.home.source).toBe('walk');
        // No marker, so the raw counts are not shown; one 1000-record read replaces the walk.
        expect(getPage).toHaveBeenCalledTimes(1);
        expect(getPage).toHaveBeenCalledWith({}, { cursor: undefined, limit: 1000 });
    });

    it('after the backfill, each count is one count request and equals the full walk on the same records', async () => {
        const { getPage, getCount, update } = makeWallet();
        await reconcileCredentialVisibility(host.wallet!, client, 'cloud');
        expect(isCredentialVisibilityBackfillComplete(backfillKey)).toBe(true);
        // Every record the collection hides is now marked; Hidden is spelled one way.
        expect(update).toHaveBeenCalledWith('hid-2', { category: 'Hidden' });
        expect(records.filter(record => record.hidden === true).map(record => record.id)).toEqual([
            'ach-no-uri',
            'sas',
            '__verifiable_data_goals__',
            '__verifiable_data_notes__',
            'ai-1',
            'ai-2',
            'ai-3',
            'resume-1',
            'resume-2',
        ]);
        const walkedPages = getPage.mock.calls.length;

        const { result } = renderHook(
            () => ({
                counts: useAllCounts(),
                walk: useCredentialCollection(undefined, { mode: 'complete' }),
            }),
            { wrapper }
        );
        await waitFor(() =>
            expect(values(result.current.counts)).toEqual({ home: 6, tiles: [3, 2, 1] })
        );
        expect(result.current.counts.home.source).toBe('count');
        expect(getCount).toHaveBeenCalledTimes(1 + TILES.length);

        // The same records through the real full walk give the same numbers.
        await waitFor(() => expect(result.current.walk.isComplete).toBe(true));
        expect(result.current.walk.records).toHaveLength(values(result.current.counts).home!);
        for (const [i, tile] of TILES.entries()) {
            expect(
                result.current.walk.records.filter(record => record.category === tile)
            ).toHaveLength(values(result.current.counts).tiles[i]!);
        }
        // Only the explicit walk above read pages; the counts did not.
        expect(getPage.mock.calls.length).toBeGreaterThan(walkedPages);
    });

    it('the backfill is idempotent and keeps the Hidden view exact (LC-2294)', async () => {
        const { update } = makeWallet();
        const hiddenView = () =>
            renderHook(() => useCredentialCollection('Hidden', { mode: 'complete' }), { wrapper });
        const before = hiddenView();
        await waitFor(() => expect(before.result.current.isComplete).toBe(true));
        const beforeIds = before.result.current.records.map(record => record.id);
        before.unmount();

        await reconcileCredentialVisibility(host.wallet!, client, 'cloud');
        const writes = update.mock.calls.length;
        resetCredentialVisibilityBackfillForTests();
        window.localStorage.clear();
        await reconcileCredentialVisibility(host.wallet!, client, 'cloud');
        expect(update.mock.calls.length).toBe(writes);

        client.clear();
        const after = hiddenView();
        await waitFor(() => expect(after.result.current.isComplete).toBe(true));
        expect(after.result.current.records.map(record => record.id)).toEqual(beforeIds);
        expect(beforeIds).toEqual(['hid-1', 'hid-2']);
    });

    it('the index read keeps paging at 1000 while hasMore, and callers in the same tick share it', async () => {
        const { getPage } = makeWallet();
        records = Array.from({ length: 1500 }, (_, i) => ({
            id: `r-${i}`,
            uri: `u:r-${i}`,
            category: 'Achievement',
        })) as Stored[];

        const [first, second] = await Promise.all([
            loadCredentialIndexSnapshot(host.wallet!),
            loadCredentialIndexSnapshot(host.wallet!),
        ]);

        expect(first).toHaveLength(1500);
        expect(second).toBe(first);
        expect(getPage.mock.calls).toEqual([
            [{}, { cursor: undefined, limit: 1000 }],
            [{}, { cursor: '1000', limit: 1000 }],
        ]);
    });

    it('a failed backfill write leaves the account on the walk, so counts stay exact', async () => {
        const { update, learnCloudCreate } = makeWallet();
        update.mockImplementationOnce(async () => false);
        await reconcileCredentialVisibility(host.wallet!, client, 'cloud');
        expect(isCredentialVisibilityBackfillComplete(backfillKey)).toBe(false);
        expect(learnCloudCreate).not.toHaveBeenCalled();

        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(values(result.current)).toEqual(expectedValues()));
        expect(result.current.home.source).toBe('walk');
    });

    it('switches from the walk to the count when the backfill finishes, with the same numbers', async () => {
        const { getCount } = makeWallet();
        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(values(result.current)).toEqual(expectedValues()));

        const seen: ReturnType<typeof values>[] = [];
        await act(async () => {
            await reconcileCredentialVisibility(host.wallet!, client, 'cloud');
        });
        await waitFor(() => {
            seen.push(values(result.current));
            expect(result.current.home.source).toBe('count');
            // Once untrusted (no marker yet), once more after the backfill left the marker.
            expect(getCount).toHaveBeenCalledTimes(2 * (1 + TILES.length));
        });
        await waitFor(() => expect(values(result.current)).toEqual({ home: 6, tiles: [3, 2, 1] }));
        // No spinner on the way over: every render had numbers.
        expect(seen.every(value => value.home !== null && !value.tiles.includes(null))).toBe(true);
    });

    it('records written after the backfill are marked at write time and stay out of the count', async () => {
        makeWallet();
        await reconcileCredentialVisibility(host.wallet!, client, 'cloud');
        await saveVerifiableData(host.wallet!, 'notes-2', { a: 1 }, { category: 'Achievement' });
        expect(records.at(-1)).toMatchObject({ category: 'Achievement', hidden: true });

        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(values(result.current)).toEqual({ home: 6, tiles: [3, 2, 1] }));
        expect(values(result.current)).toEqual(expectedValues());
    });
});

describe('Count queries keep LC-2412 behaviour', () => {
    const countKey = ['useGetCredentialCount', '', 'Achievement', 'account-a', 'visible'];
    const backfilled = () => window.localStorage.setItem(backfillKey, 'complete');

    it('CachedCountShownOnReturn: a remount inside the stale window reuses the count', async () => {
        const { getCount } = makeWallet();
        backfilled();
        const first = renderHook(() => useVisibleCredentialCount('Achievement'), { wrapper });
        await waitFor(() => expect(first.result.current.count).toBe(4));
        first.unmount();

        const second = renderHook(() => useVisibleCredentialCount('Achievement'), { wrapper });
        expect(second.result.current).toMatchObject({ count: 4, loading: false });
        await act(async () => new Promise(resolve => setTimeout(resolve, 20)));
        expect(getCount).toHaveBeenCalledTimes(1);
    });

    it('SavedCountShownAtLaunch: a count saved by an earlier launch shows at once and revalidates once', async () => {
        const { getCount } = makeWallet();
        backfilled();
        client.setQueryData(countKey, 9, { updatedAt: performance.timeOrigin - 1000 });
        const saved = dehydrate(client);
        client = newClient();
        hydrate(client, saved);

        const { result } = renderHook(() => useVisibleCredentialCount('Achievement'), { wrapper });
        expect(result.current).toMatchObject({ count: 9, loading: false });
        await waitFor(() => expect(result.current.count).toBe(4));
        expect(getCount).toHaveBeenCalledTimes(1);
        expect(CREDENTIAL_LIST_STALE_TIME).toBe(5 * 60 * 1000);
    });

    it('CachedCountKeptOnFailedRefresh: a failed refresh keeps the count, with no data it is unavailable', async () => {
        const { getCount } = makeWallet();
        backfilled();
        const { result } = renderHook(() => useVisibleCredentialCount('Achievement'), { wrapper });
        await waitFor(() => expect(result.current.count).toBe(4));

        getCount.mockRejectedValue(new Error('index.count blocked'));
        await act(async () => {
            await client.invalidateQueries({ queryKey: countKey }).catch(() => undefined);
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current).toMatchObject({ count: 4, loading: false, unavailable: false });

        client.clear();
        const fresh = renderHook(() => useVisibleCredentialCount('Achievement'), { wrapper });
        await waitFor(() => expect(fresh.result.current.unavailable).toBe(true));
        expect(fresh.result.current).toMatchObject({ count: null, loading: false });
    });

    it('WriterInvalidatesCount: a checklist delete refetches the counts inside the stale window', async () => {
        const { getCount } = makeWallet();
        backfilled();
        const { result } = renderHook(
            () => ({
                count: useVisibleCredentialCount(),
                remove: useDeleteChecklistCredentialMutation(),
            }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.count.count).not.toBeNull());
        const calls = getCount.mock.calls.length;

        await act(async () => {
            await result.current.remove.mutateAsync({ id: 'sb-1', uri: 'u:sb-1' });
        });
        await waitFor(() => expect(getCount.mock.calls.length).toBeGreaterThan(calls));
    });
});
