// @vitest-environment jsdom

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const host = vi.hoisted(() => ({
    currentUser: { uid: 'account-a' } as { uid: string } | null,
    switchedDid: undefined as string | undefined,
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
});
