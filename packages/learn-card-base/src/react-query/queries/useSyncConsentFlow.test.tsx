// @vitest-environment happy-dom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

const host = vi.hoisted(() => ({
    pending: [] as string[],
    stored: new Set<string>(),
    unreadable: new Set<string>(),
    failAccept: new Set<string>(),
    failAcceptOnce: new Set<string>(),
    failStoreOnce: new Set<string>(),
    accept: vi.fn(),
    addVCtoWallet: vi.fn(),
}));

const wallet = {
    invoke: {
        getConsentFlowCredentials: vi.fn(async () => ({
            hasMore: false,
            records: host.pending.map(credentialUri => ({
                credentialUri,
                contractUri: 'lc:network:test:contract:jota-joti',
                termsUri: 'lc:network:test:terms:scout',
            })),
        })),
    },
    read: {
        get: vi.fn(async (uri: string) => (host.unreadable.has(uri) ? undefined : { id: uri })),
    },
    index: {
        LearnCloud: { get: vi.fn(async ({ uri }) => (host.stored.has(uri) ? [{ uri }] : [])) },
    },
};

vi.mock('learn-card-base', () => ({
    categoryMetadata: {},
    credentialWithEditsHelper: vi.fn(),
    CredentialCategoryEnum: {},
    contractCategoryNameToCategoryMetadata: vi.fn(),
    newCredsStore: { set: { addNewCreds: vi.fn() } },
    switchedProfileStore: { use: { switchedDid: () => 'did:web:test:scout' } },
    syncProgressStore: { set: {}, get: {} },
    useToast: () => ({ presentToast: vi.fn() }),
    useWallet: () => ({ initWallet: async () => wallet, addVCtoWallet: host.addVCtoWallet }),
    walletStore: { set: { setIsSyncing: vi.fn() } },
    WalletSyncState: { Syncing: 'syncing', Completed: 'completed', NotSyncing: 'not-syncing' },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({ getIssuanceDate: vi.fn() }));
vi.mock('learn-card-base/hooks/useWallet', () => ({
    getCategoryForCredential: vi.fn(async () => 'Merit Badge'),
}));
vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    getOrFetchConsentedContracts: vi.fn(async () => []),
}));
vi.mock('learn-card-base/hooks/useGetCredentialRecordForBoost', () => ({
    getOrFetchCredentialRecordForBoost: vi.fn(),
}));
vi.mock('learn-card-base/helpers/backfills', () => ({ useBackfillBoostUris: vi.fn() }));
vi.mock('learn-card-base/hooks/useSharedUrisInTerms', () => ({
    getOrCreateSharedUriForWallet: vi.fn(),
}));
vi.mock('../../hooks/consentAudience', () => ({ loadContractAudience: vi.fn() }));
vi.mock('../mutations/ai-passport', () => ({ queueAiInsightCredentialRefresh: vi.fn() }));
vi.mock('../mutations/mutations', () => ({
    useAcceptCredentialMutation: () => ({ mutateAsync: host.accept }),
}));

import { useSyncConsentFlow } from './vcQueries';

const renderSync = (
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
) => {
    return renderHook(() => useSyncConsentFlow(true), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
};

const storedUris = () => host.addVCtoWallet.mock.calls.map(([args]) => args.uri);

describe('useSyncConsentFlow', () => {
    beforeEach(() => {
        host.pending = [];
        host.stored.clear();
        host.unreadable.clear();
        host.failAccept.clear();
        host.failAcceptOnce.clear();
        host.failStoreOnce.clear();
        wallet.invoke.getConsentFlowCredentials.mockClear();
        host.accept.mockReset().mockImplementation(async ({ uri }: { uri: string }) => {
            if (host.failAccept.has(uri)) throw new Error(`accept failed for ${uri}`);
            if (host.failAcceptOnce.delete(uri)) throw new Error(`accept failed for ${uri}`);
            // Accepting creates CREDENTIAL_RECEIVED, so the server stops listing it as pending.
            host.pending = host.pending.filter(pendingUri => pendingUri !== uri);
        });
        host.addVCtoWallet.mockReset().mockImplementation(async ({ uri }: { uri: string }) => {
            if (host.failStoreOnce.delete(uri)) throw new Error(`store failed for ${uri}`);
            host.stored.add(uri);
        });
    });

    afterEach(() => {
        cleanup();
        focusManager.setFocused(undefined);
    });

    it('syncs a second contract write in the same session after the first sync saved something', async () => {
        host.pending = ['urn:test:a:first-write'];
        renderSync();

        await waitFor(() => expect(storedUris()).toEqual(['urn:test:a:first-write']));

        host.pending.push('urn:test:a:second-write');
        act(() => {
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });

        await waitFor(() =>
            expect(storedUris()).toEqual(['urn:test:a:first-write', 'urn:test:a:second-write'])
        );
    });

    it('does not let one unreadable credential block the others', async () => {
        host.pending = ['urn:test:b:good-1', 'urn:test:b:unreadable', 'urn:test:b:good-2'];
        host.unreadable.add('urn:test:b:unreadable');
        renderSync();

        await waitFor(() =>
            expect(storedUris().sort()).toEqual(['urn:test:b:good-1', 'urn:test:b:good-2'])
        );
        expect(host.accept).not.toHaveBeenCalledWith({ uri: 'urn:test:b:unreadable' });
    });

    it('does not let one failed accept block the others from being stored', async () => {
        host.pending = ['urn:test:c:good-1', 'urn:test:c:accept-fails', 'urn:test:c:good-2'];
        host.failAccept.add('urn:test:c:accept-fails');
        renderSync();

        // Storing happens before accepting, so the failed accept stays pending on the server
        // (and gets accepted on a later sync) while the others are accepted and stored.
        await waitFor(() => expect(host.pending).toEqual(['urn:test:c:accept-fails']));
        expect(host.stored).toEqual(
            new Set(['urn:test:c:good-1', 'urn:test:c:accept-fails', 'urn:test:c:good-2'])
        );
        expect(host.accept).toHaveBeenCalledWith({ uri: 'urn:test:c:accept-fails' });
    });

    it('stores a credential on a later sync when storing failed once after a successful accept', async () => {
        host.pending = ['urn:test:e:store-fails-once', 'urn:test:e:good'];
        host.failStoreOnce.add('urn:test:e:store-fails-once');
        renderSync();

        await waitFor(() => expect(host.stored).toEqual(new Set(['urn:test:e:good'])));
        expect(host.addVCtoWallet).toHaveBeenCalledWith(
            expect.objectContaining({ uri: 'urn:test:e:store-fails-once' })
        );

        act(() => {
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });

        await waitFor(() =>
            expect(host.stored).toEqual(new Set(['urn:test:e:good', 'urn:test:e:store-fails-once']))
        );
        expect(host.pending).toEqual([]);
    });

    it('accepts an already-stored credential on a later sync without storing it again', async () => {
        host.pending = ['urn:test:f:accept-fails-once'];
        host.failAcceptOnce.add('urn:test:f:accept-fails-once');
        renderSync();

        await waitFor(() => expect(host.accept).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(host.stored).toEqual(new Set(['urn:test:f:accept-fails-once'])));
        expect(host.pending).toEqual(['urn:test:f:accept-fails-once']);

        act(() => {
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });

        await waitFor(() => expect(host.pending).toEqual([]));
        expect(host.accept).toHaveBeenCalledTimes(2);
        expect(host.addVCtoWallet).toHaveBeenCalledTimes(1);
    });

    it('accepts each credential once when refetches overlap across hook instances', async () => {
        let releaseAccept = () => {};
        const acceptGate = new Promise<void>(resolve => {
            releaseAccept = resolve;
        });
        host.accept.mockImplementation(async ({ uri }: { uri: string }) => {
            await acceptGate;
            host.pending = host.pending.filter(pendingUri => pendingUri !== uri);
        });

        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const first = renderSync(client);
        renderSync(client);
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

        // With data already cached, a refetch cancels the in-flight queryFn and starts a
        // new one while the old one keeps running, so these runs genuinely overlap.
        host.pending = ['urn:test:d:one', 'urn:test:d:two'];
        for (let i = 0; i < 3; i += 1) {
            void client
                .refetchQueries({ queryKey: ['useSyncConsentFlow'], type: 'all' })
                .catch(() => undefined);
            act(() => {
                focusManager.setFocused(false);
                focusManager.setFocused(true);
            });
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        expect(wallet.invoke.getConsentFlowCredentials.mock.calls.length).toBeGreaterThan(2);
        releaseAccept();

        await waitFor(() =>
            expect(storedUris().sort()).toEqual(['urn:test:d:one', 'urn:test:d:two'])
        );
        expect(host.accept).toHaveBeenCalledTimes(2);
        expect(host.addVCtoWallet).toHaveBeenCalledTimes(2);
    });
});
