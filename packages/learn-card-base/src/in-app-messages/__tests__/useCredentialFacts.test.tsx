// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';

import { clearCredentialFacts, loadCredentialFacts } from '../credentialFactsStore';
import { useCredentialFacts } from '../useCredentialFacts';

const state = vi.hoisted(() => ({
    did: 'did:example:alice',
    wallet: null as unknown,
}));

/** Minimal QueryClient stand-in: fetchQuery runs the real queryFn (batch or read.get). */
const queryClient = vi.hoisted(() => {
    const store = new Map<string, unknown>();
    const keyOf = (key: unknown) => JSON.stringify(key);
    return {
        store,
        getQueryData: vi.fn((key: unknown) => store.get(keyOf(key))),
        setQueryData: vi.fn((key: unknown, data: unknown) => {
            store.set(keyOf(key), data);
            return data;
        }),
        getQueryState: vi.fn((key: unknown) => {
            const data = store.get(keyOf(key));
            if (data === undefined) return undefined;
            return {
                status: 'success',
                data,
                dataUpdatedAt: Date.now(),
                isInvalidated: false,
                fetchStatus: 'idle',
            };
        }),
        getDefaultOptions: () => ({ queries: { retry: false } }),
        fetchQuery: vi.fn(
            async (opts: {
                queryKey?: unknown;
                queryFn?: (ctx: { signal: AbortSignal; queryKey: unknown }) => Promise<unknown>;
            }) => {
                const key = opts.queryKey;
                const existing = store.get(keyOf(key));
                if (existing !== undefined) return existing;
                if (typeof opts.queryFn !== 'function') {
                    throw new Error('fetchQuery mock expected queryFn');
                }
                const data = await opts.queryFn({
                    signal: new AbortController().signal,
                    queryKey: key,
                });
                store.set(keyOf(key), data);
                return data;
            }
        ),
    };
});

vi.mock('@tanstack/react-query', async importOriginal => {
    const actual = await importOriginal<typeof import('@tanstack/react-query')>();
    return { ...actual, useQueryClient: () => queryClient };
});
vi.mock('../../stores/currentUserStore', () => ({ useIsLoggedIn: () => true }));
vi.mock('../../stores/walletStore', () => ({
    switchedProfileStore: {
        get: { switchedDid: () => state.did },
        use: { switchedDid: () => state.did },
    },
    walletStore: {
        get: { wallet: () => state.wallet },
        use: { wallet: () => state.wallet },
    },
}));
vi.mock('../../hooks/useWallet', () => ({
    useWallet: () => ({ initWallet: async () => state.wallet }),
}));
vi.mock('@capacitor/app', () => ({
    App: { addListener: async () => ({ remove: vi.fn() }) },
}));

const walletFor = (
    did: string,
    uri: string,
    credential: unknown | Promise<unknown>,
    options?: { batch?: ReturnType<typeof vi.fn> }
): {
    id: { did: () => string };
    index: { LearnCloud: { getPage: ReturnType<typeof vi.fn> } };
    read: { get: ReturnType<typeof vi.fn> };
    invoke: { learnCloudBatchResolve?: ReturnType<typeof vi.fn> };
    plugins: unknown[];
} => ({
    id: { did: () => did },
    index: {
        LearnCloud: {
            getPage: vi.fn().mockResolvedValue({
                records: [{ uri, category: 'Learning History' }],
                hasMore: false,
            }),
        },
    },
    read: { get: vi.fn().mockResolvedValue(credential) },
    invoke: options?.batch ? { learnCloudBatchResolve: options.batch } : {},
    plugins: [],
});

const currentWallet = () => state.wallet as ReturnType<typeof walletFor>;

describe('useCredentialFacts', () => {
    beforeEach(async () => {
        state.did = 'did:example:alice';
        queryClient.store.clear();
        queryClient.getQueryData.mockClear();
        queryClient.setQueryData.mockClear();
        queryClient.getQueryState.mockClear();
        queryClient.fetchQuery.mockClear();
        queryClient.getQueryData.mockImplementation((key: unknown) =>
            queryClient.store.get(JSON.stringify(key))
        );
        await clearCredentialFacts();
    });

    afterEach(() => cleanup());

    it('hides the previous account immediately while the next account loads', async () => {
        state.wallet = walletFor('did:example:alice', 'lc:alice', {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:alice',
        });
        const { result, rerender } = renderHook(() => useCredentialFacts(true));

        await waitFor(() => expect(result.current.complete).toBe(true));
        expect(result.current.summaries?.[0]?.issuer).toBe('did:issuer:alice');

        state.did = 'did:example:bob';
        state.wallet = walletFor('did:example:bob', 'lc:bob', {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:bob',
        });
        rerender();

        expect(result.current.accountDid).toBe('did:example:bob');
        expect(result.current.summaries).toBeNull();
        expect(result.current.complete).toBe(false);

        await waitFor(() => expect(result.current.complete).toBe(true));
        expect(result.current.summaries?.[0]?.issuer).toBe('did:issuer:bob');
    });

    it('does not persist a decrypt that finishes after an account switch', async () => {
        let resolveAlice: (credential: unknown) => void = () => undefined;
        const aliceCredential = new Promise<unknown>(resolve => {
            resolveAlice = resolve;
        });
        const aliceWallet = walletFor('did:example:alice', 'lc:alice-interrupted', aliceCredential);

        state.wallet = aliceWallet;
        const { result, rerender } = renderHook(() => useCredentialFacts(true));

        await waitFor(() => expect(aliceWallet.read.get).toHaveBeenCalledOnce());

        state.did = 'did:example:bob';
        state.wallet = walletFor('did:example:bob', 'lc:bob-after-switch', {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:bob',
        });
        rerender();
        resolveAlice({ type: ['VerifiableCredential'], issuer: 'did:issuer:alice' });

        await waitFor(() => expect(result.current.complete).toBe(true));

        expect(await loadCredentialFacts('did:example:alice')).toEqual([]);
        expect(await loadCredentialFacts('did:example:bob')).toEqual([
            expect.objectContaining({ uri: 'lc:bob-after-switch', issuer: 'did:issuer:bob' }),
        ]);
    });

    it('reuses account-scoped RQ data instead of re-reading via wallet.read.get (LC-2382)', async () => {
        const uri = 'lc:cloud:cloud.learncard.com/trpc:credential:cached-doc';
        const vc = {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:cached',
            credentialSubject: { id: 'did:example:alice' },
        };
        state.wallet = walletFor('did:example:alice', uri, {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:should-not-read',
        });
        queryClient.store.set(
            JSON.stringify(['useGetResolvedCredential', uri, 'did:example:alice']),
            vc
        );

        const { result } = renderHook(() => useCredentialFacts(true));
        await waitFor(() => expect(result.current.complete).toBe(true));

        expect(queryClient.getQueryData).toHaveBeenCalledWith([
            'useGetResolvedCredential',
            uri,
            'did:example:alice',
        ]);
        expect(currentWallet().read.get).not.toHaveBeenCalled();
        expect(queryClient.fetchQuery).not.toHaveBeenCalled();
        expect(result.current.summaries?.[0]?.issuer).toBe('did:issuer:cached');
    });

    it('joins the RQ/batch path on cache miss instead of raw wallet.read.get (LC-2382 retake2)', async () => {
        const uri = 'lc:cloud:cloud.learncard.com/trpc:credential:race-doc';
        const vc = {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:batched',
            credentialSubject: { id: 'did:example:alice' },
        };
        const batch = vi.fn(async (uris: string[]) => uris.map(() => vc));
        state.wallet = walletFor(
            'did:example:alice',
            uri,
            {
                type: ['VerifiableCredential'],
                issuer: 'did:issuer:should-not-read',
            },
            { batch }
        );

        const { result } = renderHook(() => useCredentialFacts(true));
        await waitFor(() => expect(result.current.complete).toBe(true));

        expect(queryClient.fetchQuery).toHaveBeenCalled();
        expect(batch).toHaveBeenCalled();
        expect(currentWallet().read.get).not.toHaveBeenCalled();
        expect(result.current.summaries?.[0]?.issuer).toBe('did:issuer:batched');
    });
});
