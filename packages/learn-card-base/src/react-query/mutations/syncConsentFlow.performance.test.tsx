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
        invoke: {
            getConsentedContracts: get,
            updateContractTerms: update,
            getContract: vi.fn().mockResolvedValue({
                uri: 'contract-a',
                owner: { did: 'owner-a' },
                audienceVersion: 1,
            }),
        },
    } as unknown as BespokeLearnCard;
    const options = consentedContractsQueryOptions(host.wallet);
    await client.fetchQuery(options);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(useSyncConsentContractsMutation, { wrapper });
    const contract = {
        uri: 'terms-a',
        contract: { uri: 'contract-a', owner: { did: 'owner-a' } },
        terms: {
            read: {
                credentials: {
                    categories: {
                        Achievement: { shared: ['deleted-uri'] },
                        'VerifiableData:demo:profile:branch': {
                            shareAll: false,
                            sharing: true,
                            shared: ['previously-approved-answer'],
                        },
                    },
                },
            },
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
    expect(update).toHaveBeenCalledWith(
        'terms-a',
        expect.objectContaining({
            terms: {
                read: {
                    credentials: {
                        categories: {
                            Achievement: { shared: [] },
                            'VerifiableData:demo:profile:branch': {
                                shareAll: false,
                                sharing: true,
                                shared: ['previously-approved-answer'],
                            },
                        },
                    },
                },
            },
        })
    );
    expect(await client.fetchQuery(options)).toEqual([updated]);
    expect(get).toHaveBeenCalledTimes(2);
    client.clear();
});

it('syncs the exact live profile field and rejects normalized aliases in both directions', async () => {
    const category = 'VerifiableData:demo:profile:birthDate';
    const alias = 'verifiabledata-demo-profile-birth-date';
    const { getOrCreateSharedUriForWallet } =
        await import('learn-card-base/hooks/useSharedUrisInTerms');
    vi.mocked(getOrCreateSharedUriForWallet).mockResolvedValue('shared:date');
    const sync = vi.fn();
    const fresh = vi.fn().mockResolvedValue([]);
    host.wallet = {
        id: { did: () => 'holder' },
        read: { get: async () => ({ validFrom: '2026-01-01T00:00:00.000Z' }) },
        index: { LearnCloud: { getPage: async () => ({ records: [], hasMore: false }) } },
        invoke: {
            getContract: async () => ({ owner: { did: 'owner' }, audienceVersion: 1 }),
            syncCredentialsToContract: sync,
            learnCloudGetIndexRecordForUpdate: fresh,
        },
    } as unknown as BespokeLearnCard;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(useSyncConsentContractsMutation, { wrapper });
    const grant = (key: string): ConsentedContract =>
        ({
            uri: 'terms-live',
            contract: { uri: 'contract', owner: { did: 'owner' } },
            terms: {
                read: { credentials: { categories: { [key]: { sharing: true, shareAll: true } } } },
            },
        }) as ConsentedContract;
    await act(async () => {
        await result.current.mutateAsync({
            recordsByCategory: { [category]: ['cred:date'] },
            allContracts: [grant(alias)],
        });
        await result.current.mutateAsync({
            recordsByCategory: { [alias]: ['cred:alias'] },
            allContracts: [grant(category)],
        });
    });
    expect(getOrCreateSharedUriForWallet).not.toHaveBeenCalled();
    expect(sync).not.toHaveBeenCalled();
    fresh.mockResolvedValue([{ id: `__verifiable_data_${category}__`, category, uri: 'cred:new' }]);
    await act(async () => {
        await result.current.mutateAsync({
            // The scan returned an obsolete source; the current record must win.
            recordsByCategory: { [category]: ['cred:old'] },
            allContracts: [grant(category)],
        });
    });
    expect(getOrCreateSharedUriForWallet).toHaveBeenCalledWith(
        host.wallet,
        ['owner'],
        client,
        'cred:new',
        category
    );
    expect(sync).toHaveBeenCalledExactlyOnceWith(
        'terms-live',
        { [category]: ['shared:date'] },
        1,
        true,
        { [category]: expect.stringMatching(/^2026-01-01T00:00:00\.000Z:[a-f0-9]{64}$/) }
    );
    sync.mockClear();
    await act(async () => {
        await result.current.mutateAsync({
            recordsByCategory: {},
            allContracts: [grant(category)],
        });
    });
    expect(sync).toHaveBeenCalledOnce();
    client.clear();
});
