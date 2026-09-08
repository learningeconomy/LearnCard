// @vitest-environment jsdom

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { VC } from '@learncard/types';

const host = vi.hoisted(() => ({
    verifyCredential: vi.fn(),
}));

vi.mock('./useWallet', () => ({
    default: () => ({
        initWallet: async () => ({ invoke: { verifyCredential: host.verifyCredential } }),
    }),
}));

vi.mock('../helpers/verificationPrettifier', () => ({
    prettifyVerificationItems: (items: unknown[]) => items,
}));

import {
    getCredentialVerificationKey,
    useCredentialVerification,
    useFetchCredentialVerification,
} from './useCredentialVerification';
import { shouldPersistQuery } from '../react-query/shouldPersistQuery';

const signedVc = (id: string, proofValue: string): VC =>
    ({
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id,
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        credentialSubject: { id: 'did:example:subject' },
        proof: { type: 'Ed25519Signature2020', proofValue },
    }) as unknown as VC;

const ITEMS = [{ check: 'proof', status: 'Success', details: 'ok' }];

const createWrapper = (client: QueryClient) => {
    const Wrapper = ({ children }: React.PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { Wrapper, client };
};

describe('useCredentialVerification', () => {
    beforeEach(() => {
        host.verifyCredential.mockReset();
        host.verifyCredential.mockResolvedValue(ITEMS);
    });

    it('verifies a credential once even when several consumers mount concurrently', async () => {
        const { Wrapper } = createWrapper(new QueryClient());
        const vc = signedVc('urn:uuid:clr', 'zSig1');

        const a = renderHook(() => useCredentialVerification(vc), { wrapper: Wrapper });
        const b = renderHook(() => useCredentialVerification(vc), { wrapper: Wrapper });
        const c = renderHook(() => useCredentialVerification(vc), { wrapper: Wrapper });

        await waitFor(() => expect(a.result.current.isVerified).toBe(true));
        await waitFor(() => expect(b.result.current.isVerified).toBe(true));
        await waitFor(() => expect(c.result.current.isVerified).toBe(true));

        expect(host.verifyCredential).toHaveBeenCalledTimes(1);
        expect(a.result.current.verificationItems).toEqual(ITEMS);
        expect(c.result.current.verificationItems).toEqual(ITEMS);
    });

    it('shares the cache between the hook and the imperative fetcher', async () => {
        const { Wrapper } = createWrapper(new QueryClient());
        const vc = signedVc('urn:uuid:clr', 'zSig1');

        const hook = renderHook(() => useCredentialVerification(vc), { wrapper: Wrapper });
        await waitFor(() => expect(hook.result.current.isVerified).toBe(true));

        const fetcher = renderHook(() => useFetchCredentialVerification(), { wrapper: Wrapper });
        const items = await fetcher.result.current(vc);

        expect(items).toEqual(ITEMS);
        expect(host.verifyCredential).toHaveBeenCalledTimes(1);
    });

    it('re-verifies when the proof changes, even for the same credential id', async () => {
        const { Wrapper } = createWrapper(new QueryClient());

        const a = renderHook(() => useCredentialVerification(signedVc('urn:uuid:x', 'zA')), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(a.result.current.isVerified).toBe(true));

        const b = renderHook(() => useCredentialVerification(signedVc('urn:uuid:x', 'zB')), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(b.result.current.isVerified).toBe(true));

        expect(host.verifyCredential).toHaveBeenCalledTimes(2);
    });

    it('does not verify when disabled', async () => {
        const { Wrapper } = createWrapper(new QueryClient());

        const { result } = renderHook(
            () => useCredentialVerification(signedVc('urn:uuid:x', 'zA'), { enabled: false }),
            { wrapper: Wrapper }
        );

        expect(result.current.isVerifying).toBe(false);
        expect(result.current.verificationItems).toEqual([]);
        expect(host.verifyCredential).not.toHaveBeenCalled();
    });

    it('keys unsigned credentials by their full contents', () => {
        const unsigned = { id: 'urn:uuid:u', type: ['VerifiableCredential'] } as unknown as VC;

        expect(getCredentialVerificationKey(unsigned)).toEqual([
            'credential-verification',
            JSON.stringify(unsigned),
        ]);
        expect(getCredentialVerificationKey(signedVc('urn:uuid:s', 'zZ'))).toEqual([
            'credential-verification',
            'urn:uuid:s',
            'zZ',
        ]);
    });

    it('is excluded from react-query persistence', async () => {
        const { Wrapper, client } = createWrapper(new QueryClient());
        const vc = signedVc('urn:uuid:clr', 'zSig1');

        const { result } = renderHook(() => useCredentialVerification(vc), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.isVerified).toBe(true));

        const query = client.getQueryCache().find({ queryKey: getCredentialVerificationKey(vc) });

        expect(query).toBeDefined();
        expect(shouldPersistQuery(query!)).toBe(false);
    });
});
