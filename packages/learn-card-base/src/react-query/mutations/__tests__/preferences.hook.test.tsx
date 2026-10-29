// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    update: vi.fn(),
    read: vi.fn(),
    activeDid: 'did:key:adult',
}));
vi.mock('../../../hooks/useWallet', () => ({
    useWallet: () => ({
        initWallet: () => {
            const did = host.activeDid;
            return Promise.resolve({
                id: { did: () => did },
                invoke: {
                    updatePreferences: (preferences: unknown) => host.update(did, preferences),
                    getPreferencesForDid: host.read,
                },
            });
        },
    }),
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
});
