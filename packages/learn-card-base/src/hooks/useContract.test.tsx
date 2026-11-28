// @vitest-environment jsdom

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useContract } from './useContract';

const mocks = vi.hoisted(() => ({
    wallet: null as null | { invoke: { getContract: ReturnType<typeof vi.fn> } },
    initWallet: vi.fn(),
    anonymousGetContract: vi.fn(),
}));

vi.mock('learn-card-base', () => ({ useWallet: () => ({ initWallet: mocks.initWallet }) }));
vi.mock('../stores/walletStore', () => ({ walletStore: { get: { wallet: () => mocks.wallet } } }));
vi.mock('../helpers/anonymousNetworkClient', () => ({
    getAnonymousNetworkClient: () => ({
        contracts: { getConsentFlowContract: { query: mocks.anonymousGetContract } },
    }),
}));

const uri = 'lc:network:network.learncard.com/trpc:contract:abc';

const renderUseContract = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return renderHook(() => useContract(uri), {
        wrapper: ({ children }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
};

describe('useContract', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.wallet = null;
        mocks.anonymousGetContract.mockResolvedValue({ name: 'Public contract' });
    });

    it('reads the contract through the no-auth client without building a wallet', async () => {
        const { result } = renderUseContract();

        await waitFor(() => expect(result.current.data).toEqual({ name: 'Public contract' }));
        expect(mocks.anonymousGetContract).toHaveBeenCalledWith({ uri });
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });

    it('uses the started wallet when there is one', async () => {
        mocks.wallet = {
            invoke: { getContract: vi.fn().mockResolvedValue({ name: 'Via wallet' }) },
        };
        const { result } = renderUseContract();

        await waitFor(() => expect(result.current.data).toEqual({ name: 'Via wallet' }));
        expect(mocks.anonymousGetContract).not.toHaveBeenCalled();
    });
});
