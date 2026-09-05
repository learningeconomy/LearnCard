import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    boostCard: vi.fn(() => null),
    useGetConnections: vi.fn(() => ({ data: [] })),
    useKnownDIDRegistry: vi.fn(() => ({ data: { source: 'unknown' } })),
}));

vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: { achievement: 'Achievement' },
    BoostPageViewMode: { Card: 'card' },
    useGetConnections: mocks.useGetConnections,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Social Badge',
    getProfileIdFromLCNDidWeb: () => 'alex',
}));
vi.mock('learn-card-base/hooks/useIssuerContext', () => ({
    deriveIssuerTrustProfile: () => 'social',
}));
vi.mock('learn-card-base/hooks/useRegistry', () => ({
    useKnownDIDRegistry: mocks.useKnownDIDRegistry,
}));
vi.mock('../../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    BoostEarnedCard: mocks.boostCard,
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'issueFlow.preview.willLook': () => 'Preview',
    'issueFlow.preview.pickToStart': () => 'Pick a credential',
}));

import { HeroCanvas } from './HeroCanvas';

const credential = {
    issuer: {
        id: 'did:web:example.com:users:alex',
        name: 'Alex Rivera',
        image: 'https://example.com/alex.png',
    },
    credentialSubject: {
        achievement: { name: 'Community Builder' },
    },
};

describe('HeroCanvas issuer context queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(cleanup);

    it('does not load recipient relationship data for shared or empty previews', () => {
        const { rerender } = render(
            <HeroCanvas credential={credential} credentialType="badge" cardTitle="Badge" />
        );

        expect(mocks.useGetConnections).not.toHaveBeenCalled();
        expect(mocks.useKnownDIDRegistry).not.toHaveBeenCalled();

        rerender(
            <HeroCanvas
                credential={null}
                credentialType="badge"
                recipientMode="self"
                cardTitle="Badge"
            />
        );

        expect(mocks.useGetConnections).not.toHaveBeenCalled();
        expect(mocks.useKnownDIDRegistry).not.toHaveBeenCalled();
    });

    it('forwards issuer identity metadata to an anyone-with-a-link full preview', () => {
        render(
            <HeroCanvas
                credential={credential}
                credentialType="badge"
                recipientMode="link"
                cardTitle="Badge"
            />
        );

        expect(mocks.useGetConnections).toHaveBeenCalledOnce();
        expect(mocks.useKnownDIDRegistry).toHaveBeenCalledWith('did:web:example.com:users:alex');
        const previewCardProps = mocks.boostCard.mock.calls[0]?.[0];
        expect(previewCardProps).toEqual(
            expect.objectContaining({
                issuerContextOverride: expect.objectContaining({
                    state: 'unclaimed',
                    issuerDid: 'did:web:example.com:users:alex',
                    profile: expect.objectContaining({
                        displayName: 'Alex Rivera',
                        image: 'https://example.com/alex.png',
                    }),
                }),
            })
        );
    });
});
