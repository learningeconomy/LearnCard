// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { BespokeLearnCard } from '../../types/learn-card';
import { consentedContractsQueryOptions } from '../queries/consentedContracts';

const host = vi.hoisted(() => ({ wallet: undefined as unknown as BespokeLearnCard }));
vi.mock('../../hooks/useWallet', () => ({
    useWallet: () => ({ initWallet: async () => host.wallet }),
}));
vi.mock('../../hooks/useSharedUrisInTerms', () => ({ getOrCreateSharedUriForWallet: vi.fn() }));
vi.mock('../../helpers/networkHelpers', () => ({ isProductionNetwork: () => true }));
vi.mock('../../hooks/useConsentedContracts', () => ({
    getOrFetchConsentedContracts: (client: QueryClient, wallet: BespokeLearnCard) =>
        client.fetchQuery(consentedContractsQueryOptions(wallet)),
}));
import { useNetworkConsentMutation } from './networkConsent';
afterEach(cleanup);
it('invalidates a fresh inactive consent cache after automatic network consent', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const get = vi.fn().mockResolvedValue({ records: [], hasMore: false });
    const newConsent = { uri: 'terms-new', contract: { uri: 'contract-new' } };
    host.wallet = {
        id: { did: () => 'account-a' },
        index: { LearnCloud: { getCount: async () => 1 } },
        invoke: {
            getProfile: vi.fn(),
            getConsentedContracts: get,
            getContract: async () => ({ contract: {} }),
            consentToContract: async () => {
                get.mockResolvedValue({ records: [newConsent], hasMore: false });
                return 'terms-new';
            },
        },
    } as unknown as BespokeLearnCard;
    const options = consentedContractsQueryOptions(host.wallet);
    await client.fetchQuery(options);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(useNetworkConsentMutation, { wrapper });
    await act(async () => {
        await expect(result.current.mutateAsync({ queryClient: client })).resolves.toEqual({
            success: true,
            alreadyConsented: false,
        });
    });
    expect(await client.fetchQuery(options)).toEqual([newConsent]);
    expect(get).toHaveBeenCalledTimes(2);
    client.clear();
});
