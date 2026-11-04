// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { MutationCache, QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    update: vi.fn(),
    read: vi.fn(),
    activeDid: 'did:key:adult',
    walletError: null as Error | null,
}));
vi.mock('../../../hooks/useWallet', () => ({
    useWallet: () => {
        const did = host.activeDid;
        return {
            initWallet: () =>
                host.walletError
                    ? Promise.reject(host.walletError)
                    : Promise.resolve({
                          id: { did: () => did },
                          invoke: {
                              updatePreferences: (preferences: unknown) =>
                                  host.update(did, preferences),
                              getPreferencesForDid: host.read,
                          },
                      }),
        };
    },
}));
import { useUpdatePreferences } from '../preferences';

const key = ['useGetPreferencesForDid', 'did:key:adult'];
const otherKey = ['useGetPreferencesForDid', 'did:key:child'];
const setup = (analyticsEnabled: boolean) => {
    const client = new QueryClient({
        defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    client.setQueryData(key, { analyticsEnabled });
    client.setQueryData(otherKey, { analyticsEnabled: false });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return {
        client,
        ...renderHook(
            () => {
                useQuery({ queryKey: key, queryFn: () => host.read(), staleTime: Infinity });
                return useUpdatePreferences();
            },
            { wrapper }
        ),
    };
};

beforeEach(() => {
    vi.clearAllMocks();
    host.activeDid = 'did:key:adult';
    host.walletError = null;
});
afterEach(cleanup);

describe('preference authorization cache transitions', () => {
    it('keeps opt-in off until the backend authorizes it, without changing another profile', async () => {
        const pending = Promise.withResolvers<boolean>();
        host.update.mockReturnValue(pending.promise);
        host.read.mockResolvedValue({ analyticsEnabled: true });
        const { result, client } = setup(false);
        act(() => result.current.mutate({ analyticsEnabled: true }));
        await waitFor(() => expect(result.current.isPending).toBe(true));
        expect(client.getQueryData(key)).toEqual({ analyticsEnabled: false });
        expect(client.getQueryData(otherKey)).toEqual({ analyticsEnabled: false });
        await act(async () => pending.resolve(true));
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(client.getQueryData(key)).toEqual({ analyticsEnabled: true });
        expect(client.getQueryData(otherKey)).toEqual({ analyticsEnabled: false });
    });

    it('does not convert a restricted backend result into optimistic permission', async () => {
        host.update.mockResolvedValue(true);
        host.read.mockResolvedValue({ analyticsEnabled: false, isMinor: true });
        const { result, client } = setup(false);
        await act(async () => {
            await result.current.mutateAsync({ analyticsEnabled: true });
        });
        expect(client.getQueryData(key)).toEqual({ analyticsEnabled: false, isMinor: true });
    });

    it('revokes opt-in while an opt-out write is still pending', async () => {
        const pending = Promise.withResolvers<boolean>();
        host.update.mockReturnValue(pending.promise);
        const { result, client } = setup(true);
        act(() => result.current.mutate({ analyticsEnabled: false }));
        await waitFor(() => expect(client.getQueryData(key)).toEqual({ analyticsEnabled: false }));
        expect(result.current.isPending).toBe(true);
        expect(client.getQueryData(otherKey)).toEqual({ analyticsEnabled: false });
        host.read.mockResolvedValue({ analyticsEnabled: false });
        await act(async () => pending.resolve(true));
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('never restores opt-in when a successful opt-out is followed by a failed refresh', async () => {
        host.update.mockResolvedValue(true);
        host.read.mockRejectedValue(new Error('Profile authority unavailable'));
        const { result, client } = setup(true);
        await act(async () => {
            await result.current.mutateAsync({ analyticsEnabled: false });
        });
        expect(client.getQueryData(key)).toEqual({ analyticsEnabled: false });
        expect(client.getQueryState(key)?.status).toBe('error');
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('binds an in-flight write to the initiating account across profile switches', async () => {
        const saved = new Map<string, unknown>();
        host.update.mockImplementation(async (did: string, preferences: unknown) => {
            saved.set(did, preferences);
            return true;
        });
        host.read.mockResolvedValue({ analyticsEnabled: false });
        const { result } = setup(true);
        act(() => {
            result.current.mutate({ analyticsEnabled: false });
            host.activeDid = 'did:key:child';
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(saved.get('did:key:adult')).toEqual({ analyticsEnabled: false });
        expect(saved.has('did:key:child')).toBe(false);
    });

    it('uses the current wallet when a retained callback starts a later write', async () => {
        const saved = new Map<string, unknown>();
        host.update.mockImplementation(async (did: string, preferences: unknown) => {
            saved.set(did, preferences);
            return true;
        });
        host.read.mockResolvedValue({ analyticsEnabled: false });
        const { result, rerender } = setup(true);
        const retained = result.current.mutate;
        host.activeDid = 'did:key:child';
        rerender();
        act(() => retained({ analyticsEnabled: false }));
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(saved.get('did:key:child')).toEqual({ analyticsEnabled: false });
        expect(saved.has('did:key:adult')).toBe(false);
    });

    it('owns a rejected wallet promise even when a global mutation hook cancels first', async () => {
        const gate = Promise.withResolvers<void>();
        const unhandled = vi.fn();
        const client = new QueryClient({
            mutationCache: new MutationCache({
                onMutate: async () => {
                    await gate.promise;
                    throw new Error('Write cancelled');
                },
            }),
            defaultOptions: { mutations: { retry: false } },
        });
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
        host.walletError = new Error('Account is locked');
        process.on('unhandledRejection', unhandled);
        try {
            const { result } = renderHook(() => useUpdatePreferences(), { wrapper });
            act(() => result.current.mutate({ analyticsEnabled: false }));
            await new Promise<void>(resolve => setImmediate(resolve));
            await act(async () => gate.resolve());
            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error?.message).toBe('Write cancelled');
            expect(unhandled).not.toHaveBeenCalled();
            expect(host.update).not.toHaveBeenCalled();
        } finally {
            gate.resolve();
            process.off('unhandledRejection', unhandled);
            client.clear();
        }
    });
});
