// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getEndorsements: vi.fn(),
    initWallet: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialSubject: (credential: { credentialSubject?: { id?: string } }) =>
        credential.credentialSubject,
    getEndorsements: mocks.getEndorsements,
}));

import { useCredentialEndorsements } from '../useCredentialEndorsements';

type EndorsementRecord = {
    endorsement: { id: string };
    metadata: { id: string };
};

const credentialA = {
    id: 'urn:uuid:credential-a',
    credentialSubject: { id: 'did:example:subject' },
};
const credentialB = {
    id: 'urn:uuid:credential-b',
    credentialSubject: { id: 'did:example:subject' },
};
const endorsementA: EndorsementRecord = {
    endorsement: { id: 'urn:uuid:endorsement-a' },
    metadata: { id: 'record-a' },
};
const endorsementB: EndorsementRecord = {
    endorsement: { id: 'urn:uuid:endorsement-b' },
    metadata: { id: 'record-b' },
};

describe('useCredentialEndorsements', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.initWallet.mockResolvedValue({});
    });

    it('never exposes endorsements loaded for a previously displayed credential', async () => {
        const requestA = Promise.withResolvers<EndorsementRecord[]>();
        const requestB = Promise.withResolvers<EndorsementRecord[]>();
        mocks.getEndorsements.mockImplementation((_wallet: unknown, credential: { id: string }) =>
            credential.id === credentialA.id ? requestA.promise : requestB.promise
        );

        const { result, rerender } = renderHook(
            ({ credential }) => useCredentialEndorsements(credential as never),
            { initialProps: { credential: credentialA } }
        );

        await waitFor(() => expect(mocks.getEndorsements).toHaveBeenCalledTimes(1));
        rerender({ credential: credentialB });
        expect(result.current).toEqual([]);
        await waitFor(() => expect(mocks.getEndorsements).toHaveBeenCalledTimes(2));

        await act(async () => requestA.resolve([endorsementA]));
        expect(result.current).toEqual([]);

        await act(async () => requestB.resolve([endorsementB]));
        await waitFor(() => expect(result.current).toEqual([endorsementB]));
    });
});
