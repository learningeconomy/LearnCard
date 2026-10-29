// @vitest-environment jsdom

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const host = vi.hoisted(() => ({
    currentUser: { uid: 'account-a' } as { uid: string } | null,
    switchedDid: undefined as string | undefined,
    walletReady: true,
    getDID: vi.fn(),
    getPreferencesForDid: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useWallet: () => ({
        // The real hook returns a new wrapper on rerenders; keep this unstable
        // so effect/state feedback loops are covered.
        getDID: () => host.getDID(),
        initWallet: async () => ({
            invoke: { getPreferencesForDid: host.getPreferencesForDid },
        }),
    }),
    useIsLoggedIn: () => Boolean(host.currentUser),
}));

vi.mock('../../stores/currentUserStore', () => ({
    default: {
        useTracked: {
            currentUser: () => host.currentUser,
        },
    },
}));

vi.mock('../../stores/walletStore', () => ({
    walletStore: {
        use: {
            wallet: () =>
                host.walletReady ? { id: { did: () => host.switchedDid ?? 'did:key:a' } } : null,
        },
    },
    switchedProfileStore: {
        use: {
            switchedDid: () => host.switchedDid,
        },
    },
}));

vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ debug: vi.fn() }),
}));

import { useGetPreferencesForDid } from './preferences';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useGetPreferencesForDid identity transitions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        host.currentUser = { uid: 'account-a' };
        host.switchedDid = undefined;
        host.walletReady = true;
        host.getDID.mockResolvedValue('did:key:a');
        host.getPreferencesForDid.mockImplementation(async () => ({
            bugReportsEnabled: host.currentUser?.uid === 'account-b',
        }));
    });

    it('does not expose a previous account preference while the next DID resolves', async () => {
        const { result, rerender } = renderHook(() => useGetPreferencesForDid(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.data?.bugReportsEnabled).toBe(false));

        host.currentUser = null;
        rerender();
        expect(result.current.data).toBeUndefined();

        let resolveNextDid!: (did: string) => void;
        host.getDID.mockImplementationOnce(
            () => new Promise<string>(resolve => (resolveNextDid = resolve))
        );
        host.currentUser = { uid: 'account-b' };
        rerender();

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);

        await act(async () => resolveNextDid('did:key:b'));
        await waitFor(() => expect(result.current.data?.bugReportsEnabled).toBe(true));
        expect(host.getDID.mock.calls.length).toBeLessThanOrEqual(4);
    });

    it('does not expose parent preferences while a managed profile DID resolves', async () => {
        host.getDID.mockImplementation(async () => host.switchedDid ?? 'did:key:parent');
        host.getPreferencesForDid.mockImplementation(async () => ({
            bugReportsEnabled: host.switchedDid === 'did:web:child',
        }));
        const { result, rerender } = renderHook(() => useGetPreferencesForDid(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.data?.bugReportsEnabled).toBe(false));

        host.switchedDid = 'did:web:child';
        rerender();

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
        await waitFor(() => expect(result.current.data?.bugReportsEnabled).toBe(true));
    });

    it('does not authorize telemetry from cached opt-in before a fresh backend response', async () => {
        const pending = Promise.withResolvers<{ analyticsEnabled: boolean }>();
        host.getPreferencesForDid.mockReturnValue(pending.promise);
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        client.setQueryData(['useGetPreferencesForDid', 'did:key:a'], { analyticsEnabled: true });
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
        const { result } = renderHook(() => useGetPreferencesForDid(), { wrapper });
        await waitFor(() => expect(result.current.did).toBe('did:key:a'));
        expect(result.current.data?.analyticsEnabled).toBe(true);
        expect(result.current.consentResolved).toBe(false);
        act(() =>
            client.setQueryData(['useGetPreferencesForDid', 'did:key:a'], {
                analyticsEnabled: true,
                theme: 'formal',
            })
        );
        await waitFor(() => expect(result.current.data?.theme).toBe('formal'));
        expect(result.current.isFetchedAfterMount).toBe(true);
        expect(result.current.consentResolved).toBe(false);
        await act(async () => pending.resolve({ analyticsEnabled: false }));
        await waitFor(() => expect(result.current.consentResolved).toBe(true));
        expect(result.current.data?.analyticsEnabled).toBe(false);
    });

    it('resolves preferences after a delayed wallet reconstruction instead of remaining locked', async () => {
        host.walletReady = false;
        host.getPreferencesForDid.mockResolvedValue({ analyticsEnabled: true });
        const { result, rerender } = renderHook(() => useGetPreferencesForDid(), {
            wrapper: createWrapper(),
        });
        expect(result.current.consentResolved).toBe(false);
        expect(host.getDID).not.toHaveBeenCalled();
        host.walletReady = true;
        rerender();
        await waitFor(() => expect(result.current.consentResolved).toBe(true));
        expect(result.current.data?.analyticsEnabled).toBe(true);
    });

    it('authorizes private-key-first accounts without an auth-provider UID only after a real response', async () => {
        host.currentUser = { uid: '' };
        host.getPreferencesForDid.mockResolvedValue({ analyticsEnabled: true });
        const { result } = renderHook(() => useGetPreferencesForDid(), {
            wrapper: createWrapper(),
        });
        await waitFor(() => expect(result.current.consentResolved).toBe(true));
        expect(result.current.did).toBe('did:key:a');
        expect(result.current.data?.analyticsEnabled).toBe(true);
    });
});
