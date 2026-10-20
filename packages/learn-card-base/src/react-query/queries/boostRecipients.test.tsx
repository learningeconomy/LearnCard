// @vitest-environment jsdom

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

const host = vi.hoisted(() => ({
    getBoostRecipients: vi.fn(),
    countBoostRecipients: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                getBoostRecipients: host.getBoostRecipients,
                countBoostRecipients: host.countBoostRecipients,
            },
        }),
    }),
    useIsLoggedIn: () => true,
    useCurrentUser: () => null,
}));

vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import {
    BOOST_RECIPIENTS_STALE_TIME,
    invalidateBoostRecipientQueries,
    useCountBoostRecipients,
    useGetBoostRecipients,
} from './queries';

const BOOST_URI = 'urn:lc:boost:merit-badge';

const createClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapperFor = (queryClient: QueryClient) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
};

describe('boost recipient query caching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        focusManager.setFocused(undefined);
        host.getBoostRecipients.mockResolvedValue([{ to: { profileId: 'scout' } }]);
        host.countBoostRecipients.mockResolvedValue(1);
    });

    it('caches recipient lists for five minutes and skips window-focus refetches', async () => {
        const queryClient = createClient();
        const { result } = renderHook(() => useGetBoostRecipients(BOOST_URI, true, true), {
            wrapper: wrapperFor(queryClient),
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const query = queryClient
            .getQueryCache()
            .find({ queryKey: ['boostRecipients', BOOST_URI, true] });
        expect(BOOST_RECIPIENTS_STALE_TIME).toBe(5 * 60 * 1000);
        expect(query?.options).toMatchObject({
            staleTime: BOOST_RECIPIENTS_STALE_TIME,
            refetchOnWindowFocus: false,
        });

        // A second card mounting the same query and a window refocus both reuse the cache.
        const { result: second } = renderHook(() => useGetBoostRecipients(BOOST_URI, true, true), {
            wrapper: wrapperFor(queryClient),
        });
        expect(second.current.data).toEqual([{ to: { profileId: 'scout' } }]);
        act(() => {
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });
        expect(host.getBoostRecipients).toHaveBeenCalledTimes(1);
    });

    it('caches recipient counts for five minutes and skips window-focus refetches', async () => {
        const queryClient = createClient();
        const { result } = renderHook(() => useCountBoostRecipients(BOOST_URI), {
            wrapper: wrapperFor(queryClient),
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const query = queryClient
            .getQueryCache()
            .find({ queryKey: ['useCountBoostRecipients', BOOST_URI, false] });
        expect(query?.options).toMatchObject({
            staleTime: BOOST_RECIPIENTS_STALE_TIME,
            refetchOnWindowFocus: false,
        });

        act(() => {
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });
        expect(host.countBoostRecipients).toHaveBeenCalledTimes(1);
    });

    it('does not call brain-service when disabled', () => {
        const queryClient = createClient();
        renderHook(() => useGetBoostRecipients(BOOST_URI, false, false), {
            wrapper: wrapperFor(queryClient),
        });
        expect(host.getBoostRecipients).not.toHaveBeenCalled();
    });

    it('invalidateBoostRecipientQueries refetches lists and counts for that boost', async () => {
        const queryClient = createClient();
        const wrapper = wrapperFor(queryClient);
        // Read data inside the hook so React Query's tracked-props optimisation re-renders on it.
        const list = renderHook(
            () => {
                const { data, isSuccess } = useGetBoostRecipients(BOOST_URI, true, false);
                return { data, isSuccess };
            },
            { wrapper }
        );
        const count = renderHook(
            () => {
                const { data, isSuccess } = useCountBoostRecipients(BOOST_URI);
                return { data, isSuccess };
            },
            { wrapper }
        );
        await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
        await waitFor(() => expect(count.result.current.isSuccess).toBe(true));

        host.getBoostRecipients.mockResolvedValue([
            { to: { profileId: 'scout' } },
            { to: { profileId: 'new-scout' } },
        ]);
        host.countBoostRecipients.mockResolvedValue(2);

        await act(async () => {
            await invalidateBoostRecipientQueries(queryClient, BOOST_URI);
        });

        await waitFor(() => expect(list.result.current.data).toHaveLength(2));
        await waitFor(() => expect(count.result.current.data).toBe(2));
        expect(host.getBoostRecipients).toHaveBeenCalledTimes(2);
        expect(host.countBoostRecipients).toHaveBeenCalledTimes(2);
    });

    it('leaves other boosts cached when invalidating one boost', async () => {
        const queryClient = createClient();
        const wrapper = wrapperFor(queryClient);
        const other = renderHook(() => useGetBoostRecipients('urn:lc:boost:other', true, false), {
            wrapper,
        });
        await waitFor(() => expect(other.result.current.isSuccess).toBe(true));

        await act(async () => {
            await invalidateBoostRecipientQueries(queryClient, BOOST_URI);
        });

        expect(host.getBoostRecipients).toHaveBeenCalledTimes(1);
    });
});
