// @vitest-environment jsdom

import React, { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LCNIssuerRelationshipContext, VC } from '@learncard/types';

const HOLDER_DID = 'did:key:holder';
const DEMO_DID = 'did:key:demo';
const OTHER_DID = 'did:key:other';

const mocks = vi.hoisted(() => ({
    disconnectWith: vi.fn(),
    initWallet: vi.fn(),
    resolveIssuerContext: vi.fn(),
}));

const wallet = {
    id: { did: () => HOLDER_DID },
    invoke: {
        disconnectWith: mocks.disconnectWith,
        resolveIssuerContext: mocks.resolveIssuerContext,
    },
};

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));

vi.mock('learn-card-base/hooks/useWallet', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));

vi.mock('learn-card-base/hooks/useRegistry', () => ({
    useKnownDIDRegistry: () => ({
        data: { source: 'unknown' },
        isFetched: true,
        isPending: false,
    }),
}));

vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: {
        get: { switchedDid: () => undefined },
        use: { switchedDid: () => undefined },
    },
    walletStore: {
        use: { wallet: () => wallet },
    },
}));

import { ISSUER_CONTEXT_QUERY_KEY } from '../helpers/issuerContext.helpers';
import { useDisconnectWithMutation } from '../react-query/mutations/mutations';
import { ISSUER_CONTEXT_REFRESH_INTERVAL_MS, useIssuerContext } from './useIssuerContext';

const credential = (issuerDid: string): VC =>
    ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: issuerDid,
        issuanceDate: '2026-01-01T00:00:00.000Z',
        credentialSubject: { id: HOLDER_DID },
    } as VC);

const profile = (profileId: string) => ({ profileId, displayName: profileId });

const relationship = (
    profileId: string,
    connectionStatus: LCNIssuerRelationshipContext['connectionStatus'],
    mutualConnectionCount: number
): LCNIssuerRelationshipContext => ({
    profile: profile(profileId),
    connectionStatus,
    mutualConnectionCount,
    hasVerifiedContactMethod: false,
});

const renderIssuerRelationships = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return {
        ...renderHook(
            () => ({
                demo: useIssuerContext(credential(DEMO_DID), { trustProfile: 'social' }),
                other: useIssuerContext(credential(OTHER_DID), { trustProfile: 'social' }),
                disconnect: useDisconnectWithMutation(),
            }),
            { wrapper }
        ),
        queryClient,
    };
};

describe('useIssuerContext relationship refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.initWallet.mockResolvedValue(wallet);
    });

    it('refreshes every active issuer after a connection is removed without hiding cached labels', async () => {
        let disconnected = false;
        let releaseRefresh: (() => void) | undefined;
        const refreshStarted = new Promise<void>(resolve => {
            releaseRefresh = resolve;
        });
        let refreshCalls = 0;

        mocks.disconnectWith.mockImplementation(async () => {
            disconnected = true;
            return true;
        });
        mocks.resolveIssuerContext.mockImplementation(async (issuerDid: string) => {
            if (!disconnected) {
                return issuerDid === DEMO_DID
                    ? relationship('Demo', 'CONNECTED', 0)
                    : relationship('Other', 'NOT_CONNECTED', 2);
            }

            refreshCalls += 1;
            await refreshStarted;

            return issuerDid === DEMO_DID
                ? relationship('Demo', 'NOT_CONNECTED', 0)
                : relationship('Other', 'NOT_CONNECTED', 1);
        });

        const { result } = renderIssuerRelationships();

        await waitFor(() => {
            expect(result.current.demo.issuerContext?.state).toBe('connection');
            expect(result.current.other.issuerContext?.mutualConnectionCount).toBe(2);
        });

        let disconnectPromise: Promise<boolean>;
        act(() => {
            disconnectPromise = result.current.disconnect.mutateAsync({ profileId: 'Demo' });
        });

        await waitFor(() => expect(refreshCalls).toBe(2));
        await act(async () => {
            await disconnectPromise;
        });

        expect(result.current.disconnect.isPending).toBe(false);
        expect(result.current.demo.isLoading).toBe(false);
        expect(result.current.demo.issuerContext?.state).toBe('connection');
        expect(result.current.other.isLoading).toBe(false);
        expect(result.current.other.issuerContext?.mutualConnectionCount).toBe(2);

        releaseRefresh?.();

        await waitFor(() => {
            expect(result.current.demo.issuerContext?.state).toBe('unclaimed');
            expect(result.current.other.issuerContext?.mutualConnectionCount).toBe(1);
        });
    });

    it('periodically refreshes relationship data while keeping cached context available', async () => {
        mocks.resolveIssuerContext.mockResolvedValue(relationship('Demo', 'CONNECTED', 0));

        const { result, queryClient } = renderIssuerRelationships();

        await waitFor(() => expect(result.current.demo.issuerContext?.state).toBe('connection'));

        const query = queryClient.getQueryCache().find({
            queryKey: [...ISSUER_CONTEXT_QUERY_KEY, HOLDER_DID, DEMO_DID],
        });

        expect(query?.options.staleTime).toBe(ISSUER_CONTEXT_REFRESH_INTERVAL_MS);
        expect(query?.options.refetchInterval).toBe(ISSUER_CONTEXT_REFRESH_INTERVAL_MS);
        expect(query?.options.refetchOnWindowFocus).toBe('always');
        expect(query?.options.refetchOnReconnect).toBe('always');
        expect(result.current.demo.isLoading).toBe(false);
    });
});
