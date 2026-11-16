// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCR } from '../../types/credential-records';
import type { BespokeLearnCard } from '../../types/learn-card';

const host = vi.hoisted(() => ({ wallet: null as BespokeLearnCard | null }));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: vi.fn() }),
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
vi.mock('../../hooks/useWallet', () => ({ useWallet: () => ({ initWallet: vi.fn() }) }));
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

import { getLearnCloudPlugin } from '../../../../plugins/learn-cloud/src';
import { generateEncryptedFieldsArray } from '../../../../plugins/learn-cloud/src/helpers';
import { useVisibleCredentialCount } from './useVisibleCredentialCount';
import { isCredentialCollectionRecordVisible } from '../../helpers/credentialCollection';
import {
    CREDENTIAL_VISIBILITY_MARKER,
    reconcileCredentialVisibility,
    resetCredentialVisibilityBackfillForTests,
    runCredentialIndexBackfills,
} from '../../helpers/credentialVisibilityBackfill';

/**
 * Passport/Home counts on a fresh device, through the real LearnCloud plugin and the real
 * tRPC client (httpBatchLink). `fetch` is the only fake: it answers like learn-cloud-service
 * over stored rows (hashed id, hashed `fields`, the record as its payload), with Mongo's
 * array rules for `fields`. Every HTTP request is recorded, so request counts are measured.
 */
const CLOUD_URL = 'https://cloud.test/trpc';
const hashOf = async (message: string) => `h(${message})`;
const hasher = { invoke: { hash: hashOf } } as never;

type Row = { id: string; fields: string[]; encryptedRecord: Record<string, unknown> };
type Filter = { fields?: { $in?: string[]; $nin?: string[] }; $and?: Filter[] };
const matches = (fields: string[], filter: Filter = {}): boolean =>
    Object.entries(filter).every(([key, value]) => {
        if (key === '$and') return (value as Filter[]).every(clause => matches(fields, clause));
        if (key !== 'fields') throw new Error(`unexpected server filter key ${key}`);
        const { $in, $nin } = value as NonNullable<Filter['fields']>;
        if ($in && !$in.some(hash => fields.includes(hash))) return false;
        if ($nin && $nin.some(hash => fields.includes(hash))) return false;
        return true;
    });

let rows: Row[];
let documents: Row[];
/** Data requests: one entry per HTTP request, listing the procedures it carried. */
type Call = { path: string; input?: { query?: Filter; limit?: number } };
let requests: Call[][];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- inputs as the service receives them
const procedures: Record<string, (input: any) => unknown> = {
    'utilities.getChallenges': ({ amount }) =>
        Array.from({ length: amount }, (_, i) => `challenge-${i}`),
    'utilities.getDid': () => 'did:web:cloud.test',
    'index.count': ({ query }) => rows.filter(row => matches(row.fields, query)).length,
    'index.get': ({ query, limit = 25, cursor }) => {
        const matching = rows.filter(row => matches(row.fields, query));
        const start = Number(cursor ?? 0);
        const end = start + limit;
        return {
            records: matching.slice(start, end),
            hasMore: end < matching.length,
            cursor: String(end),
        };
    },
    'index.update': ({ id, updates }) => {
        const row = rows.find(item => item.id === id);
        if (!row) return false;
        Object.assign(row, updates);
        return true;
    },
    'customStorage.count': ({ query }) =>
        documents.filter(doc => matches(doc.fields, query)).length,
    'customStorage.create': ({ item }) => {
        documents.push(item);
        return true;
    },
};

/** Server round trip, so a later mount can start while an earlier request is in flight. */
let responseDelayMs = 0;
const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const { pathname } = new globalThis.URL(String(url));
    const paths = decodeURIComponent(pathname.replace('/trpc/', '')).split(',');
    const inputs = JSON.parse(String(init?.body ?? '{}'));
    const calls: Call[] = paths.map((path, i) => ({ path, input: inputs[i] }));
    if (!paths.every(path => path.startsWith('utilities.'))) requests.push(calls);
    if (responseDelayMs) await new Promise(resolve => setTimeout(resolve, responseDelayMs));
    const body = calls.map(({ path, input }) => {
        const handler = procedures[path];
        if (!handler) throw new Error(`unexpected procedure ${path}`);
        return { result: { data: handler(input) } };
    });
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    });
});

const FIXTURE: LCR[] = [
    { id: 'sb-1', uri: 'u:sb-1', category: 'Social Badge', title: 'Badge 1' },
    { id: 'sb-2', uri: 'u:sb-2', category: 'Social Badge', title: 'Badge 2' },
    { id: 'ach-1', uri: 'u:ach-1', category: 'Achievement', title: 'Award' },
    { id: 'ach-2', uri: 'u:ach-2', category: 'Achievement' },
    { id: 'skill-1', uri: 'u:skill-1', category: 'Skill', title: 'Welding' },
    // Not yet marked: only the client rules hide these.
    { id: 'sas', uri: 'u:sas', category: 'Skill', title: 'Self-Assigned Skills' },
    { id: '__verifiable_data_notes__', uri: 'u:vd-1', category: 'Achievement' },
    { id: 'ai-1', uri: 'u:ai-1', category: 'ai sessions' },
    { id: 'hid-1', uri: 'u:hid-1', category: 'Hidden', title: 'Hidden one' },
] as LCR[];

const seed = async (records: LCR[]) => {
    rows = await Promise.all(
        records.map(async record => ({
            id: await hashOf(record.id!),
            fields: await generateEncryptedFieldsArray(hasher, record),
            encryptedRecord: { ...record },
        }))
    );
};

/**
 * In the browser each field hash is an awaited crypto call that settles in a later task, so a
 * query with more fields is ready later. `slowHash` models that; an instant hash hides batch
 * splits (LC-2413 acceptance run).
 */
const slowHash = async (message: string) => {
    await new Promise(resolve => setTimeout(resolve, 0));
    return hashOf(message);
};

const makeWallet = async ({ realisticHash = false } = {}) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the minimal LearnCard the plugin binds to
    const learnCard: any = {
        id: { did: () => 'did:key:holder' },
        invoke: {
            hash: realisticHash ? slowHash : hashOf,
            createDagJwe: async (value: unknown) => value,
            decryptDagJwe: async (value: unknown) => value,
            getDidAuthVp: async () => 'did-auth-jwt',
            crypto: () => globalThis.crypto,
        },
    };
    const plugin = await getLearnCloudPlugin(learnCard, CLOUD_URL);
    const bind = (methods: Record<string, (...args: unknown[]) => unknown>) =>
        Object.fromEntries(
            Object.entries(methods).map(([name, fn]) => [
                name,
                (...args: unknown[]) => fn(learnCard, ...args),
            ])
        );
    learnCard.index = { LearnCloud: bind(plugin.index as never) };
    Object.assign(learnCard.invoke, bind(plugin.methods as never));
    // Warm the client (LearnCloud DID lookup), as earlier wallet reads do in the app.
    await learnCard.invoke.learnCloudCount({ warmUp: true });
    requests = [];
    return learnCard as BespokeLearnCard;
};

/** What the full list walk shows: visible, unique by uri, matched by exact category. */
const walkCount = (records: LCR[], category?: string) =>
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
const expected = (records: LCR[]) => ({
    home: walkCount(records),
    tiles: TILES.map(tile => walkCount(records, tile)),
});
const procedureNames = () => requests.map(request => request.map(call => call.path).sort());
const freshDevice = () => {
    window.localStorage.clear();
    resetCredentialVisibilityBackfillForTests();
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
};

beforeEach(async () => {
    vi.stubGlobal('fetch', fakeFetch);
    responseDelayMs = 0;
    freshDevice();
    documents = [];
    requests = [];
    await seed(FIXTURE);
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.unstubAllGlobals();
});

describe('Fresh-device Passport/Home counts (LC-2413), measured at the HTTP layer', () => {
    it('a finished backfill writes the LearnCloud marker, after one 1000-record index read', async () => {
        const wallet = await makeWallet();

        await reconcileCredentialVisibility(wallet, client, 'cloud');

        const markerHash = await hashOf(
            `credentialVisibilityBackfill:${JSON.stringify(
                CREDENTIAL_VISIBILITY_MARKER.credentialVisibilityBackfill
            )}`
        );
        expect(documents).toHaveLength(1);
        expect(documents[0]!.fields).toContain(markerHash);
        const create = requests.flat().filter(call => call.path === 'customStorage.create');
        expect(create).toHaveLength(1);
        // The scan was one index read at 1000 (the per-record `update` reads are by id).
        const scans = requests
            .flat()
            .filter(call => call.path === 'index.get' && !call.input?.query?.fields);
        expect(scans).toHaveLength(1);
        expect(scans[0]!.input?.limit).toBe(1000);
    });

    it('marker present: a fresh device makes exactly one request and shows the counts', async () => {
        // Another device finished the backfill.
        await reconcileCredentialVisibility(await makeWallet(), client, 'cloud');
        freshDevice();
        host.wallet = await makeWallet();

        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(result.current.home.source).toBe('count'));
        await waitFor(() => expect(values(result.current)).toEqual(expected(FIXTURE)));
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(values(result.current)).toEqual({ home: 5, tiles: [2, 2, 1] });
        expect(fakeFetch.mock.calls.length).toBeGreaterThan(0);
        expect(procedureNames()).toEqual([
            ['customStorage.count', 'index.count', 'index.count', 'index.count', 'index.count'],
        ]);
    });

    it('marker absent: one batched request, then one index.get at limit 1000; hidden left out, uris deduped; then the counts start the backfill', async () => {
        const records = [
            ...FIXTURE,
            // An existing duplicate-uri row: the walk shows it once.
            { id: 'ach-1-dup', uri: 'u:ach-1', category: 'Achievement', title: 'Award' },
        ] as LCR[];
        await seed(records);
        host.wallet = await makeWallet();

        const shown: { source: string; home: number | null; tiles: (number | null)[] }[] = [];
        const { result } = renderHook(
            () => {
                const counts = useAllCounts();
                shown.push({ source: counts.home.source, ...values(counts) });
                return counts;
            },
            { wrapper }
        );
        await waitFor(() => expect(documents).toHaveLength(1));
        await waitFor(() => expect(result.current.home.source).toBe('count'));
        await waitFor(() => expect(result.current.home.count).not.toBeNull());
        await new Promise(resolve => setTimeout(resolve, 50));

        // Before the marker: the 1000-record read, filtered and deduped on the client.
        expect(shown).toContainEqual({ source: 'walk', ...expected(records) });
        expect(expected(records)).toEqual({ home: 5, tiles: [2, 2, 1] });
        // Then the backfill starts, reusing the counts' marker read and that index read.
        expect(procedureNames().slice(0, 2)).toEqual([
            ['customStorage.count', 'index.count', 'index.count', 'index.count', 'index.count'],
            ['index.get'],
        ]);
        expect(requests.flat().filter(call => call.path === 'customStorage.count')).toHaveLength(1);
        expect(requests[1]![0]!.input).toMatchObject({ limit: 1000 });
        // The backfill reused that read, marked the hidden rows and left the marker.
        const calls = requests.flat();
        expect(calls.filter(call => call.input?.limit === 1000)).toHaveLength(1);
        expect(calls.filter(call => call.path === 'index.update').length).toBeGreaterThan(0);
        expect(calls.filter(call => call.path === 'customStorage.create')).toHaveLength(1);
        // After it: the index count, where an existing duplicate-uri row counts once per row.
        expect(values(result.current)).toEqual({ home: 6, tiles: [2, 3, 1] });
    });

    it('with real hashing time, the marker read and the counts still go in one request', async () => {
        await reconcileCredentialVisibility(await makeWallet(), client, 'cloud');
        freshDevice();
        host.wallet = await makeWallet({ realisticHash: true });

        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(values(result.current)).toEqual(expected(FIXTURE)));
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(result.current.home.source).toBe('count');
        expect(procedureNames()).toEqual([
            ['customStorage.count', 'index.count', 'index.count', 'index.count', 'index.count'],
        ]);
    });

    it('Home, then Passport while the first request is in flight: one marker read for both, and no index.get', async () => {
        await reconcileCredentialVisibility(await makeWallet(), client, 'cloud');
        freshDevice();
        host.wallet = await makeWallet({ realisticHash: true });
        responseDelayMs = 400;

        const home = renderHook(() => useVisibleCredentialCount(), { wrapper });
        await waitFor(() => expect(requests.length).toBe(1));
        const passport = renderHook(() => TILES.map(tile => useVisibleCredentialCount(tile)), {
            wrapper,
        });
        await waitFor(() => expect(home.result.current.count).toBe(walkCount(FIXTURE)));
        await waitFor(() =>
            expect(passport.result.current.map(tile => tile.count)).toEqual(
                TILES.map(tile => walkCount(FIXTURE, tile))
            )
        );
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(procedureNames()).toEqual([
            ['customStorage.count', 'index.count'],
            ['index.count', 'index.count', 'index.count'],
        ]);
    });

    it('marker absent, counts shown with no app-level backfill: the counts start it, and it writes the marker even when no record needs an update', async () => {
        // Every record the collection hides is already marked, so the scan has nothing to update.
        const marked = FIXTURE.map(record =>
            isCredentialCollectionRecordVisible(record) || record.category === 'Hidden'
                ? record
                : { ...record, hidden: true }
        ) as LCR[];
        await seed(marked);
        host.wallet = await makeWallet({ realisticHash: true });

        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(values(result.current)).toEqual(expected(marked)));
        await waitFor(() => expect(documents).toHaveLength(1), { timeout: 3000 });
        await waitFor(() => expect(result.current.home.source).toBe('count'));
        await waitFor(() => expect(values(result.current)).toEqual(expected(marked)));

        const calls = requests.flat().map(call => call.path);
        expect(calls.filter(path => path === 'customStorage.create')).toHaveLength(1);
        expect(calls.filter(path => path === 'index.update')).toHaveLength(0);
        // One shared 1000-record read serves the fallback counts and the backfill scan.
        const scans = requests
            .flat()
            .filter(call => call.path === 'index.get' && call.input?.limit === 1000);
        expect(scans).toHaveLength(1);
    });
});

/** Every record the backfill has to mark in FIXTURE. */
const NEEDS_UPDATE = FIXTURE.filter(
    record =>
        !isCredentialCollectionRecordVisible(record) && (record.category as string) !== 'Hidden'
);
const callsTo = (path: string) => requests.flat().filter(call => call.path === path);
const updatedIds = () =>
    callsTo('index.update').map(call => (call.input as unknown as { id: string }).id);
const settle = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const markerDocument = async (id: string): Promise<Row> => ({
    id,
    fields: [
        await hashOf(
            `credentialVisibilityBackfill:${JSON.stringify(
                CREDENTIAL_VISIBILITY_MARKER.credentialVisibilityBackfill
            )}`
        ),
    ],
    encryptedRecord: { ...CREDENTIAL_VISIBILITY_MARKER },
});

/** Passport's 8 squares (passportCategories.ts) and Home's 2 totals (DashboardPage.tsx). */
const PASSPORT_CATEGORIES = [
    'Social Badge',
    'Achievement',
    'Learning History',
    'Accomplishment',
    'Accommodation',
    'Work History',
    'ID',
    'Qualifications',
] as const;
const useHomeAndPassport = () => [
    useVisibleCredentialCount(),
    useVisibleCredentialCount('Skill'),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[0]),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[1]),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[2]),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[3]),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[4]),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[5]),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[6]),
    useVisibleCredentialCount(PASSPORT_CATEGORIES[7]),
];

describe('One backfill per wallet per app session, whatever starts it (LC-2413 staging run)', () => {
    it.each([
        ['BackfillOnceSameTick', 'in the same tick', 0],
        ['BackfillOnceAcrossTicks', 'a tick apart', 1],
    ] as const)(
        '%s: the app shell start and the counts fallback %s make one marker read, one scan, one update per record and one marker',
        async (_name, _when, ticks) => {
            const wallet = await makeWallet({ realisticHash: true });
            host.wallet = wallet;

            // AppRouter.tsx starts it at sign-in; the counts' 1000-record fallback starts it too.
            void runCredentialIndexBackfills(wallet, client, 'cloud');
            if (ticks) await settle(0);
            const { result } = renderHook(useAllCounts, { wrapper });
            await waitFor(() => expect(documents).toHaveLength(1), { timeout: 3000 });
            await waitFor(() => expect(result.current.home.source).toBe('count'));
            await settle(100);

            expect(callsTo('customStorage.count')).toHaveLength(1);
            expect(callsTo('index.get').filter(call => call.input?.limit === 1000)).toHaveLength(1);
            expect(updatedIds()).toHaveLength(NEEDS_UPDATE.length);
            expect(new Set(updatedIds()).size).toBe(NEEDS_UPDATE.length);
            expect(callsTo('customStorage.create')).toHaveLength(1);
        }
    );

    it('BackfillOnceAcrossDidChange: started at sign-in as did:key, then by the counts after the profile turns it into did:web, it still runs once', async () => {
        const wallet = await makeWallet({ realisticHash: true });
        host.wallet = wallet;
        responseDelayMs = 80;

        void runCredentialIndexBackfills(wallet, client, 'cloud');
        await waitFor(() => expect(requests.length).toBeGreaterThan(0));
        // The LearnCard Network plugin swaps did:key for the profile's did:web once it loads.
        (wallet.id as unknown as { did: () => string }).did = () => 'did:web:holder';
        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(documents.length).toBeGreaterThan(0), { timeout: 5000 });
        await waitFor(() => expect(result.current.home.source).toBe('count'), { timeout: 5000 });
        await settle(800);

        expect(updatedIds()).toHaveLength(NEEDS_UPDATE.length);
        expect(new Set(updatedIds()).size).toBe(NEEDS_UPDATE.length);
        expect(callsTo('customStorage.create')).toHaveLength(1);
        expect(documents).toHaveLength(1);
        expect(callsTo('customStorage.count')).toHaveLength(1);
        // Later starts in the same session reuse the finished run.
        await runCredentialIndexBackfills(wallet, client, 'cloud');
        expect(callsTo('customStorage.create')).toHaveLength(1);
    }, 15_000);

    it('DuplicateMarkerSkipsBackfill: two markers (two devices finished together) still mean done', async () => {
        documents = [await markerDocument('marker-a'), await markerDocument('marker-b')];
        const wallet = await makeWallet({ realisticHash: true });
        host.wallet = wallet;

        void runCredentialIndexBackfills(wallet, client, 'cloud');
        const { result } = renderHook(useAllCounts, { wrapper });
        await waitFor(() => expect(result.current.home.source).toBe('count'));
        await settle(100);

        expect(procedureNames()).toEqual([
            ['customStorage.count', 'index.count', 'index.count', 'index.count', 'index.count'],
        ]);
        expect(callsTo('index.update')).toHaveLength(0);
        expect(callsTo('customStorage.create')).toHaveLength(0);
        expect(documents).toHaveLength(2);
    });

    it('PartialBackfillLeavesNoMarker: a failed update writes no marker, and the next start retries and writes it once', async () => {
        const wallet = await makeWallet();
        const update = procedures['index.update']!;
        let failNext = true;
        procedures['index.update'] = input => {
            if (failNext) {
                failNext = false;
                return false;
            }
            return update(input);
        };
        try {
            await runCredentialIndexBackfills(wallet, client, 'cloud');
            expect(callsTo('customStorage.create')).toHaveLength(0);
            expect(documents).toHaveLength(0);

            await runCredentialIndexBackfills(wallet, client, 'cloud');
            expect(callsTo('customStorage.create')).toHaveLength(1);
            expect(documents).toHaveLength(1);

            await runCredentialIndexBackfills(wallet, client, 'cloud');
            expect(callsTo('customStorage.create')).toHaveLength(1);
        } finally {
            procedures['index.update'] = update;
        }
    });

    it('CountsBatchShape: Home and Passport mounted a tick after the app shell start: one request, one marker read and 10 counts', async () => {
        await reconcileCredentialVisibility(await makeWallet(), client, 'cloud');
        freshDevice();
        const wallet = await makeWallet({ realisticHash: true });
        host.wallet = wallet;

        void runCredentialIndexBackfills(wallet, client, 'cloud');
        await settle(0);
        const { result } = renderHook(useHomeAndPassport, { wrapper });
        await waitFor(() => expect(result.current.every(count => count.count !== null)).toBe(true));
        await settle(100);

        expect(procedureNames()).toEqual([
            ['customStorage.count', ...Array(10).fill('index.count')],
        ]);
    });
});
