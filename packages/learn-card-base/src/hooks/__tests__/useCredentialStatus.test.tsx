/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const uri = 'lc:cloud:credential-status-test';
const credential = { '@context': [], type: [], credentialSubject: {} } as unknown as VC;

const mocks = vi.hoisted(() => ({
    initWallet: vi.fn(),
    getMyCredentialLifecycleStatuses: vi.fn(),
    readCredential: vi.fn(),
    verifyCredential: vi.fn(),
}));

vi.mock('../useWallet', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));

import { useCredentialStatus, type UseCredentialStatusOptions } from '../useCredentialStatus';

const renderStatusHook = (options: UseCredentialStatusOptions) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useCredentialStatus(options), { wrapper });
};

describe('useCredentialStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.initWallet.mockResolvedValue({
            invoke: {
                getMyCredentialLifecycleStatuses: mocks.getMyCredentialLifecycleStatuses,
                verifyCredential: mocks.verifyCredential,
            },
            read: { get: mocks.readCredential },
        });
    });

    it('uses an authoritative revoked backend status without verification', async () => {
        mocks.getMyCredentialLifecycleStatuses.mockResolvedValue({ [uri]: 'revoked' });

        const { result } = renderStatusHook({ credential, uri });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.status).toBe('revoked');
        expect(mocks.verifyCredential).not.toHaveBeenCalled();
    });

    it('falls back to verification when the backend status request fails', async () => {
        mocks.getMyCredentialLifecycleStatuses.mockRejectedValue(new Error('network unavailable'));
        mocks.verifyCredential.mockResolvedValue({
            status: [
                {
                    entryType: 'BitstringStatusListEntry',
                    statusPurpose: 'suspension',
                    isSet: true,
                },
            ],
        });

        const { result } = renderStatusHook({ credential, uri });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.status).toBe('suspended');
        expect(result.current.isError).toBe(false);
    });

    it('fails open and retains error metadata when both lifecycle sources fail', async () => {
        mocks.getMyCredentialLifecycleStatuses.mockRejectedValue(new Error('network unavailable'));
        mocks.verifyCredential.mockRejectedValue(new Error('verification unavailable'));

        const { result } = renderStatusHook({ credential, uri });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.status).toBe('active');
        expect(result.current.isError).toBe(true);
    });

    it('does not initialize a wallet or load when disabled or missing a URI', () => {
        const { result } = renderStatusHook({ credential, enabled: false });

        expect(result.current).toEqual({ status: 'active', isLoading: false, isError: false });
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });
});
