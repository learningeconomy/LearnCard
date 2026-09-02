/**
 * @vitest-environment jsdom
 */

import React, { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const explicitTermsUri = 'lc:network:production:terms:explicit-consent';
const withdrawResult = { uri: explicitTermsUri, status: 'withdrawn' };

const mocks = vi.hoisted(() => ({
    initWallet: vi.fn(),
    withdrawConsent: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    switchedProfileStore: {
        get: { switchedDid: () => 'did:web:test-user' },
        use: { switchedDid: () => 'did:web:test-user' },
    },
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));

import { useWithdrawConsent } from '../useWithdrawConsent';

const renderHookWithQueryClient = <Result,>(callback: () => Result) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return { ...renderHook(callback, { wrapper }), queryClient };
};

describe('useWithdrawConsent', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.withdrawConsent.mockResolvedValue(withdrawResult);
        mocks.initWallet.mockResolvedValue({
            invoke: { withdrawConsent: mocks.withdrawConsent },
        });
    });

    it('withdraws an explicit terms URI when the hook is created without an initial URI', async () => {
        const { result, queryClient } = renderHookWithQueryClient(() => useWithdrawConsent());
        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
        const refetchQueries = vi.spyOn(queryClient, 'refetchQueries');
        let resultValue: unknown;

        await act(async () => {
            resultValue = await result.current.mutateAsync(explicitTermsUri);
        });

        expect(resultValue).toEqual(withdrawResult);
        expect(mocks.withdrawConsent).toHaveBeenCalledOnce();
        expect(mocks.withdrawConsent).toHaveBeenCalledWith(explicitTermsUri);
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['useConsentedContracts'],
        });
        expect(refetchQueries).toHaveBeenCalledWith({
            queryKey: ['useConsentedContracts', 'did:web:test-user'],
        });
    });

    it('rejects before touching the wallet when no terms URI is available', async () => {
        const { result } = renderHookWithQueryClient(() => useWithdrawConsent());

        await act(async () => {
            await expect(result.current.mutateAsync()).rejects.toThrow(
                'Cannot withdraw consent without a terms URI'
            );
        });

        expect(mocks.initWallet).not.toHaveBeenCalled();
        expect(mocks.withdrawConsent).not.toHaveBeenCalled();
    });
});
