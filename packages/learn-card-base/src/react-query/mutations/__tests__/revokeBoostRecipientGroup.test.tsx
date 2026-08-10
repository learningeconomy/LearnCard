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

const INVALIDATION_PREFIXES = [
    ['boostRecipients'],
    ['getPaginatedBoostRecipients'],
    ['getBoostRecipientCount'],
    ['boosts'],
    ['useNetworkMembers'],
    ['getMyActivities'],
    ['getActivityStats'],
    ['credentialStatus'],
];

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
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useRevokeBoostRecipientGroup(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({
            boostUri: 'lc:network:test:boost:troop',
            recipientProfileId: 'scout-1',
        });

        expect(mocks.revokeBoostRecipientGroup).toHaveBeenCalledWith(
            'lc:network:test:boost:troop',
            'scout-1'
        );
        for (const queryKey of INVALIDATION_PREFIXES) {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
        }
    });

    it('invalidates related caches after the recipient group revocation fails', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        mocks.revokeBoostRecipientGroup.mockRejectedValueOnce(new Error('offline'));
        const { result } = renderHook(() => useRevokeBoostRecipientGroup(), {
            wrapper: makeWrapper(queryClient),
        });

        await expect(
            result.current.mutateAsync({
                boostUri: 'lc:network:test:boost:troop',
                recipientProfileId: 'scout-1',
            })
        ).rejects.toThrow('offline');

        for (const queryKey of INVALIDATION_PREFIXES) {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
        }
    });
});
