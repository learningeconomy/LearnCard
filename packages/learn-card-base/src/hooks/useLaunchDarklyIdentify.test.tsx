// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    user: { name: 'Demo', email: 'demo@example.com' } as { name: string; email: string } | null,
    keyDid: 'did:key:z6Mkdemo' as string | undefined,
    keyDidLoading: false,
    status: 'online' as 'online' | 'offline',
    identify: vi.fn(),
}));

vi.mock('./useGetCurrentUser', () => ({
    // A fresh object every render, like the real store selector can return.
    default: () => (state.user ? { ...state.user } : null),
}));
vi.mock('launchdarkly-react-client-sdk', () => ({
    useLDClient: () => ({ identify: state.identify }),
}));
vi.mock('learn-card-base', () => ({
    // A fresh getDID every render, like the real useWallet (LC-2433).
    useWallet: () => ({ getDID: async () => 'did:key:fallback' }),
    useIsCurrentUserLCNUser: () => ({ data: false, isLoading: false }),
    useGetDid: (method: string) =>
        method === 'key'
            ? { data: state.keyDid, isLoading: state.keyDidLoading }
            : { data: undefined, isLoading: false },
}));
vi.mock('../stores/connectivityStore', () => ({
    connectivityStore: { use: { status: () => state.status } },
}));

import { useLaunchDarklyIdentify } from './useLaunchDarklyIdentify';

const identifiedKeys = () => state.identify.mock.calls.map(([context]) => context.key);

beforeEach(() => {
    state.user = { name: 'Demo', email: 'demo@example.com' };
    state.keyDid = 'did:key:z6Mkdemo';
    state.keyDidLoading = false;
    state.status = 'online';
    state.identify.mockReset();
});

it('identifies once across re-renders with the same context', async () => {
    const { rerender } = renderHook(() => useLaunchDarklyIdentify());
    for (let i = 0; i < 5; i += 1) rerender();

    await waitFor(() => expect(state.identify).toHaveBeenCalledTimes(1));
    expect(identifiedKeys()).toEqual(['did:key:z6Mkdemo']);
});

it('waits for the DID, then identifies once when the context key changes', async () => {
    state.keyDidLoading = true;
    state.keyDid = undefined;
    const { rerender } = renderHook(() => useLaunchDarklyIdentify());
    rerender();
    expect(state.identify).not.toHaveBeenCalled();

    state.keyDidLoading = false;
    state.keyDid = 'did:key:z6Mkdemo';
    rerender();
    rerender();
    await waitFor(() => expect(identifiedKeys()).toEqual(['did:key:z6Mkdemo']));

    state.user = null;
    rerender();
    rerender();
    await waitFor(() => expect(identifiedKeys()).toEqual(['did:key:z6Mkdemo', 'anonymous']));
});

it('re-identifies the same context on reconnect', async () => {
    const { rerender } = renderHook(() => useLaunchDarklyIdentify());
    await waitFor(() => expect(state.identify).toHaveBeenCalledTimes(1));

    state.status = 'offline';
    rerender();
    state.status = 'online';
    await act(async () => rerender());

    await waitFor(() => expect(state.identify).toHaveBeenCalledTimes(2));
    expect(identifiedKeys()).toEqual(['did:key:z6Mkdemo', 'did:key:z6Mkdemo']);
});
