// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    activeDid: 'did:example:learner',
    initWallet: vi.fn(),
    sync: vi.fn(),
    contracts: vi.fn(),
    share: vi.fn(),
    readIndex: vi.fn(),
    syncContract: vi.fn(),
}));
vi.mock('./useWallet', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet, syncCredentialToContracts: mocks.sync }),
}));
vi.mock('../stores/walletStore', () => {
    const wallet = { id: { did: () => mocks.activeDid } };
    return {
        walletStore: {
            use: { wallet: () => wallet },
            get: { wallet: () => wallet },
        },
        switchedProfileStore: {
            use: { switchedDid: () => undefined },
            get: { switchedDid: () => undefined },
        },
    };
});
vi.mock('./useConsentedContracts', () => ({ getOrFetchConsentedContracts: mocks.contracts }));
vi.mock('./useSharedUrisInTerms', () => ({ getOrCreateSharedUriForWallet: mocks.share }));
vi.mock('./consentAudience', () => ({
    loadContractAudience: async () => ({
        recipients: ['did:example:recipient'],
        audienceVersion: 2,
    }),
}));
vi.mock('../logging/logger', () => ({
    getLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}));
import { usePendingContractSync } from './usePendingContractSync';
import {
    enqueuePendingContractSync,
    pendingContractSyncStore,
} from '../stores/pendingContractSyncStore';

const source = { id: 'saved', uri: 'lc:credential:saved', category: 'Achievement' as const };
const enqueue = () =>
    enqueuePendingContractSync({
        kind: 'credential',
        profileDid: 'did:example:learner',
        record: source,
        category: 'Achievement',
    });
const mount = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return renderHook(() => usePendingContractSync(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
};
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    pendingContractSyncStore.set.jobs({});
    mocks.activeDid = 'did:example:learner';
    mocks.initWallet.mockImplementation(async () => ({
        id: { did: () => mocks.activeDid },
        index: { LearnCloud: { get: mocks.readIndex } },
        invoke: { syncCredentialsToContract: mocks.syncContract },
    }));
    mocks.sync.mockReset().mockResolvedValue(true);
    mocks.contracts.mockReset().mockResolvedValue([]);
    mocks.readIndex.mockReset().mockResolvedValue([source]);
    mocks.share.mockReset().mockResolvedValue('shared-uri');
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it('persists a failed credential for reload and retries it only under its saving account', async () => {
    const job = enqueue();
    const persisted = JSON.parse(localStorage.getItem('pendingContractSyncStore')!);
    expect(persisted.state.jobs[job.id].record).toEqual(source);
    // Restore the actual persisted snapshot rather than reconstructing retry inputs.
    pendingContractSyncStore.set.jobs(persisted.state.jobs);
    mocks.activeDid = 'did:example:other';
    const hook = mount();
    await act(async () => {});
    expect(mocks.initWallet).not.toHaveBeenCalled();
    expect(pendingContractSyncStore.get.jobs()[job.id].retryCount).toBe(0);
    mocks.activeDid = 'did:example:learner';
    hook.rerender();
    await waitFor(() => expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('done'));
    expect(mocks.sync).toHaveBeenCalledWith(
        { record: source, category: 'Achievement' },
        expect.objectContaining({ id: expect.anything() }),
        expect.any(Set),
        expect.any(Function)
    );
});

it('retains a failed retry and wakes after the existing backoff', async () => {
    vi.useFakeTimers();
    const job = enqueue();
    mocks.sync.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
        mount();
    });
    expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('error');
    expect(pendingContractSyncStore.get.jobs()[job.id].retryCount).toBe(1);
    await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
    });
    expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('done');
    expect(mocks.sync).toHaveBeenCalledTimes(2);
});

it('persists each acknowledged term before failure and restores it on a reloaded retry', async () => {
    vi.useFakeTimers();
    const job = enqueue();
    mocks.sync.mockImplementationOnce(async (_input, _wallet, completed, acknowledge) => {
        expect(completed).toEqual(new Set());
        acknowledge('terms-a');
        throw new Error('terms-b unavailable');
    });
    const hook = mount();
    await act(async () => {});
    hook.unmount();
    const persisted = JSON.parse(localStorage.getItem('pendingContractSyncStore')!);
    expect(persisted.state.jobs[job.id]).toMatchObject({
        status: 'error',
        syncedTermsUris: ['terms-a'],
    });
    pendingContractSyncStore.set.jobs(persisted.state.jobs);
    mocks.sync.mockImplementationOnce(async (_input, _wallet, completed, acknowledge) => {
        expect(completed).toEqual(new Set(['terms-a']));
        acknowledge('terms-b');
        return true;
    });
    await act(async () => {
        mount();
        await vi.advanceTimersByTimeAsync(5000);
    });
    expect(pendingContractSyncStore.get.jobs()[job.id]).toMatchObject({
        status: 'done',
        syncedTermsUris: ['terms-a', 'terms-b'],
    });
    expect(mocks.sync).toHaveBeenCalledTimes(2);
});

it('waits without spending a retry or spinning when initialization returns a stale wallet', async () => {
    const job = enqueue();
    mocks.initWallet.mockResolvedValueOnce({ id: { did: () => 'did:example:other' } });
    const hook = mount();
    await act(async () => {});
    expect(pendingContractSyncStore.get.jobs()[job.id]).toMatchObject({
        status: 'queued',
        retryCount: 0,
    });
    expect(mocks.initWallet).toHaveBeenCalledTimes(1);
    expect(mocks.sync).not.toHaveBeenCalled();
    mocks.activeDid = 'did:example:other';
    hook.rerender();
    mocks.activeDid = 'did:example:learner';
    hook.rerender();
    await waitFor(() => expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('done'));
    expect(mocks.initWallet).toHaveBeenCalledTimes(2);
});

it('leaves the job queued if the active account changes while initialization is pending', async () => {
    const job = enqueue();
    let resolveWallet!: (wallet: { id: { did: () => string } }) => void;
    mocks.initWallet.mockReturnValueOnce(
        new Promise(resolve => {
            resolveWallet = resolve;
        })
    );
    const hook = mount();
    mocks.activeDid = 'did:example:other';
    hook.rerender();
    await act(async () => {
        resolveWallet({ id: { did: () => 'did:example:learner' } });
    });
    expect(pendingContractSyncStore.get.jobs()[job.id]).toMatchObject({
        status: 'queued',
        retryCount: 0,
    });
    expect(mocks.sync).not.toHaveBeenCalled();
    mocks.activeDid = 'did:example:learner';
    hook.rerender();
    await waitFor(() => expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('done'));
});

it('does not share a saved credential removed before retry', async () => {
    const job = enqueue();
    mocks.readIndex.mockResolvedValue([]);
    mount();
    await waitFor(() => expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('done'));
    expect(mocks.sync).not.toHaveBeenCalled();
});

it('cancels an Achievement retry when the same saved credential has been moved to ID', async () => {
    const job = enqueue();
    mocks.readIndex.mockResolvedValue([{ ...source, category: 'ID' }]);
    mount();
    await waitFor(() => expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('done'));
    expect(mocks.readIndex).toHaveBeenCalledWith({ id: source.id });
    expect(mocks.sync).not.toHaveBeenCalled();
    expect(mocks.share).not.toHaveBeenCalled();
    expect(mocks.syncContract).not.toHaveBeenCalled();
});

it('never retries stale contract terms against another contract owned by the same profile', async () => {
    const job = enqueuePendingContractSync({
        profileDid: 'did:example:learner',
        contractUri: 'contract-original',
        termsUri: 'terms-original',
        ownerDid: 'did:example:owner',
    });
    mocks.contracts.mockResolvedValue([
        {
            uri: 'terms-other',
            status: 'live',
            contract: { uri: 'contract-other', owner: { did: 'did:example:owner' } },
            terms: {
                read: {
                    credentials: { categories: { Achievement: { shareAll: true, sharing: true } } },
                },
            },
        },
    ]);
    mount();
    await waitFor(() => expect(pendingContractSyncStore.get.jobs()[job.id].status).toBe('error'));
    expect(mocks.share).not.toHaveBeenCalled();
    expect(mocks.syncContract).not.toHaveBeenCalled();
});
