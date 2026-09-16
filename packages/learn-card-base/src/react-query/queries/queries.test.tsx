// @vitest-environment jsdom

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
    getBoost: vi.fn(),
    initWallet: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    switchedProfileStore: {
        use: { switchedDid: () => undefined },
    },
    useCurrentUser: () => undefined,
    useIsLoggedIn: () => false,
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));

import { useGetBoost } from './queries';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return function QueryClientWrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
};

describe('useGetBoost', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.initWallet.mockResolvedValue({
            invoke: { getBoost: mocks.getBoost },
        });
        mocks.getBoost.mockResolvedValue({ id: 'boost-id' });
    });

    it('does not invoke getBoost for a storage URI', () => {
        const { result } = renderHook(() => useGetBoost('ceramic://encrypted-presentation'), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
        expect(mocks.initWallet).not.toHaveBeenCalled();
        expect(mocks.getBoost).not.toHaveBeenCalled();
    });

    it('loads a network Boost URI', async () => {
        const boostUri = 'lc:network:localhost%3A4000/trpc:boost:boost-id';

        const { result } = renderHook(() => useGetBoost(boostUri), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mocks.getBoost).toHaveBeenCalledWith(boostUri);
    });
});
