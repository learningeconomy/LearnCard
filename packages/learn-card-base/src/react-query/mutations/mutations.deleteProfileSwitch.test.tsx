// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    switchedDid: 'did:web:parent' as string | undefined,
    init: vi.fn(),
}));
vi.mock('learn-card-base', () => ({ useWallet: () => ({ initWallet: host.init }) }));
vi.mock('../../stores/walletStore', () => ({
    switchedProfileStore: {
        get: { switchedDid: () => host.switchedDid },
        use: { switchedDid: () => host.switchedDid },
    },
}));
vi.mock('./syncAllCredentials', () => ({ useSyncAllCredentialsToContractsMutation: () => ({}) }));
vi.mock('./ai-passport', () => ({ queueAiInsightCredentialRefresh: vi.fn() }));
vi.mock('./pruneConsentFlowDeletedCredentials', () => ({
    deleteCredentialFromAllContracts: vi.fn(),
}));
vi.mock('../../hooks/useToast', () => ({
    ToastTypeEnum: { Error: 'error' },
    useToast: () => ({ presentToast: vi.fn() }),
}));
vi.mock('../queries/queries', () => ({ invalidateBoostRecipientQueries: vi.fn() }));
vi.mock('../connectionPrompts', () => ({ connectionPromptKeys: {} }));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

import { useDeleteCredentialRecord } from './mutations';

afterEach(() => {
    cleanup();
    host.switchedDid = 'did:web:parent';
});

describe('useDeleteCredentialRecord profile pinning (LC-2355)', () => {
    it('rolls a failed delete back under the pinned profile, not the one switched to mid-flight', async () => {
        let failFlush!: (error: Error) => void;
        const wallet = {
            id: { did: () => 'did:key:reader' },
            cache: {
                flushIndex: vi.fn(
                    () =>
                        new Promise<void>((_, reject) => {
                            failFlush = reject;
                        })
                ),
            },
        };
        host.init.mockResolvedValue(wallet);

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const record = { id: 'r1', uri: 'lc:uri:1', category: 'Achievement' } as never;
        // onMutate reads the 3-part key and writes/rolls back the `true` variant.
        queryClient.setQueryData(['useGetCredentials', 'did:web:parent', 'Achievement'], [record]);
        const parentKey = ['useGetCredentials', 'did:web:parent', 'Achievement', true];
        const childKey = ['useGetCredentials', 'did:web:child', 'Achievement', true];

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
        const { result } = renderHook(() => useDeleteCredentialRecord(), { wrapper });

        let settled!: Promise<unknown>;
        act(() => {
            settled = result.current.mutateAsync(record).catch(() => undefined);
        });
        await vi.waitFor(() => expect(wallet.cache.flushIndex).toHaveBeenCalled());
        await vi.waitFor(() => expect(queryClient.getQueryData(parentKey)).toEqual([]));

        host.switchedDid = 'did:web:child';
        failFlush(new Error('delete failed'));
        await act(async () => {
            await settled;
        });

        expect(queryClient.getQueryData(parentKey)).toEqual([record]);
        expect(queryClient.getQueryData(childKey)).toBeUndefined();
        queryClient.clear();
    });
});
