// @vitest-environment happy-dom

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const host = vi.hoisted(() => ({ records: [] as { vc: VC; uri: string }[], card: vi.fn() }));

vi.mock('learn-card-base', () => ({
    BoostPageViewMode: { Card: 'Card' },
    useGetIDs: () => ({ data: host.records, isLoading: false, isFetching: false }),
}));
vi.mock('@ionic/react', () => ({ IonCol: () => null, IonSpinner: () => null }));
vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../../components/boost/boostErrors/BoostErrorsDisplay', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/loaders/CredentialListSkeleton', () => ({
    CredentialListSkeleton: () => null,
}));
vi.mock('./BoostEarnedIDCard', () => ({
    default: (props: unknown) => {
        host.card(props);
        return null;
    },
}));

import BoostEarnedIDListAlternative from './BoostEarnedIDListAlternative';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('earned membership ID card inputs', () => {
    it('passes the original signed credential and storage URI as separate props', () => {
        const credential: VC = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential', 'BoostCredential', 'BoostID'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:member' },
            name: 'World Scouting',
            proof: {
                type: 'DataIntegrityProof',
                proofValue: 'signed-proof',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:example:issuer#key',
                created: '2026-10-13T00:00:00Z',
            },
        };
        const uri = 'lc:network:example.org/trpc:credential:global-id';
        host.records = [{ vc: credential, uri }];

        render(
            <BoostEarnedIDListAlternative
                category={'Global Admin ID' as never}
                viewMode={'Card' as never}
                defaultImg=""
            />
        );

        expect(host.card).toHaveBeenCalledWith(expect.objectContaining({ credential, uri }));
        expect(host.card.mock.calls[0][0].credential).toBe(credential);
        expect(host.card.mock.calls[0][0].credential).not.toHaveProperty('uri');
    });
});
