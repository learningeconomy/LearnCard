// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';

import { clearCredentialFacts, loadCredentialFacts } from '../credentialFactsStore';
import { useCredentialFacts } from '../useCredentialFacts';

const state = vi.hoisted(() => ({
    did: 'did:example:alice',
    wallet: null as unknown,
}));

const queryClient = vi.hoisted(() => ({ getQueryData: vi.fn(() => undefined) }));

vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => queryClient }));
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
    credential: unknown | Promise<unknown>
): {
    id: { did: () => string };
    index: { LearnCloud: { getPage: ReturnType<typeof vi.fn> } };
    read: { get: ReturnType<typeof vi.fn> };
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
});

describe('useCredentialFacts', () => {
    beforeEach(async () => {
        state.did = 'did:example:alice';
        queryClient.getQueryData.mockReset();
        queryClient.getQueryData.mockReturnValue(undefined);
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
});
