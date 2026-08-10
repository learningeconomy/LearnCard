// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRevokeBoostRecipientGroup } from '../revokeBoostRecipientGroup';

const mocks = vi.hoisted(() => ({
    revokeBoostRecipientGroup: vi.fn(),
}));

vi.mock('../../../hooks/useWallet', () => ({
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                revokeBoostRecipientGroup: mocks.revokeBoostRecipientGroup,
            },
        }),
    }),
}));

const boostUri = 'lc:network:test:boost:troop';
const consumerQueryKeys = [
    ['paginatedBoostRecipients', boostUri, { limit: 10 }],
    ['useCountBoostRecipients', boostUri, false],
] as const;

const seedConsumerQueries = (queryClient: QueryClient) => {
    for (const queryKey of consumerQueryKeys) queryClient.setQueryData(queryKey, { seeded: true });
};

const expectConsumerQueriesInvalidated = (queryClient: QueryClient) => {
    for (const queryKey of consumerQueryKeys) {
        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    }
};

const makeWrapper =
    (queryClient: QueryClient) =>
    ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

describe('useRevokeBoostRecipientGroup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.revokeBoostRecipientGroup.mockResolvedValue({
            revokedCredentialUris: ['credential-1'],
            alreadyRevokedCredentialUris: [],
            failedCredentialUris: [],
        });
    });

    it('revokes the recipient group and invalidates related caches after success', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        seedConsumerQueries(queryClient);
        const { result } = renderHook(() => useRevokeBoostRecipientGroup(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({
            boostUri,
            recipientProfileId: 'scout-1',
        });

        expect(mocks.revokeBoostRecipientGroup).toHaveBeenCalledWith(boostUri, 'scout-1');
        expectConsumerQueriesInvalidated(queryClient);
    });

    it('invalidates related caches after the recipient group revocation fails', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        seedConsumerQueries(queryClient);
        mocks.revokeBoostRecipientGroup.mockRejectedValueOnce(new Error('offline'));
        const { result } = renderHook(() => useRevokeBoostRecipientGroup(), {
            wrapper: makeWrapper(queryClient),
        });

        await expect(
            result.current.mutateAsync({
                boostUri,
                recipientProfileId: 'scout-1',
            })
        ).rejects.toThrow('offline');

        expectConsumerQueriesInvalidated(queryClient);
    });
});
