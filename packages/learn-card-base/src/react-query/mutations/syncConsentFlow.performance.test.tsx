// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { BespokeLearnCard } from '../../types/learn-card';
import { consentedContractsQueryOptions } from '../queries/consentedContracts';

const host = vi.hoisted(() => ({ wallet: undefined as unknown as BespokeLearnCard }));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: async () => host.wallet }),
    syncProgressStore: {
        set: { currentContract: vi.fn(), lastError: vi.fn(), contractsCompleted: vi.fn() },
        get: { contractsCompleted: () => 0 },
    },
    useToast: vi.fn(),
    walletStore: {},
    WalletSyncState: {},
    contractCategoryNameToCategoryMetadata: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useSharedUrisInTerms', () => ({
    getOrCreateSharedUriForWallet: vi.fn(),
}));
vi.mock('./mutations', () => ({ useAcceptCredentialMutation: vi.fn() }));
vi.mock('./ai-passport', () => ({ queueAiInsightCredentialRefresh: vi.fn() }));
import { useSyncConsentContractsMutation, type ConsentedContract } from './syncConsentFlow';
afterEach(cleanup);
it('invalidates cached terms even when a later contract fails after an earlier update', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const get = vi.fn().mockResolvedValue({ records: [{ uri: 'old-terms' }], hasMore: false });
    const updated = { uri: 'new-terms' };
    const update = vi.fn(async () => {
        get.mockResolvedValue({ records: [updated], hasMore: false });
        return true;
    });
    host.wallet = {
        id: { did: () => 'account-a' },
        index: {
            LearnCloud: {
                getPage: vi
                    .fn()
                    .mockResolvedValueOnce({ records: [], hasMore: false })
                    .mockRejectedValueOnce(new Error('offline')),
            },
        },
        invoke: { getConsentedContracts: get, updateContractTerms: update },
    } as unknown as BespokeLearnCard;
    const options = consentedContractsQueryOptions(host.wallet);
    await client.fetchQuery(options);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(useSyncConsentContractsMutation, { wrapper });
    const contract = {
        uri: 'terms-a',
        contract: { owner: { did: 'owner-a' } },
        terms: {
            read: { credentials: { categories: { Achievement: { shared: ['deleted-uri'] } } } },
        },
    } as unknown as ConsentedContract;
    await act(async () => {
        await expect(
            result.current.mutateAsync({
                recordsByCategory: {},
                allContracts: [contract, { ...contract, uri: 'terms-b' }],
            })
        ).rejects.toThrow('offline');
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(await client.fetchQuery(options)).toEqual([updated]);
    expect(get).toHaveBeenCalledTimes(2);
    client.clear();
});
