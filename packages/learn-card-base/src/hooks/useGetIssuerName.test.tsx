// @vitest-environment jsdom

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({ getProfile: vi.fn(), initWallet: vi.fn() }));
vi.mock('./useWallet', () => ({ default: () => ({ initWallet: mocks.initWallet }) }));
import { useGetIssuerName } from './useGetIssuerName';

const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
        {children}
    </QueryClientProvider>
);

beforeEach(() => {
    mocks.getProfile.mockReset().mockResolvedValue({ displayName: 'Network School' });
    mocks.initWallet.mockReset().mockResolvedValue({ invoke: { getProfile: mocks.getProfile } });
});

describe('issuer-name fallback queries', () => {
    it.each([
        'did:web:network.example:users:school',
        { id: 'did:web:network.example:users:school' },
    ])('resolves network profiles for string and object issuers: %j', async issuer => {
        const { result } = renderHook(() => useGetIssuerName({ issuer } as VC), { wrapper });
        await waitFor(() => expect(result.current).toBe('Network School'));
        expect(mocks.getProfile).toHaveBeenCalledWith('school');
    });

    it('does not fetch a profile when a resolved name was supplied by the caller', () => {
        renderHook(
            () => useGetIssuerName({ issuer: 'did:web:network.example:users:school' } as VC, false),
            { wrapper }
        );
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });

    it('preserves explicit issuer names without a profile request', () => {
        const { result } = renderHook(
            () =>
                useGetIssuerName({
                    issuer: { id: 'did:example:school', name: 'Named School' },
                } as VC),
            { wrapper }
        );
        expect(result.current).toBe('Named School');
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });
});
