// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    displayCard: vi.fn(() => null),
    verifyCredential: vi.fn(),
}));

vi.mock('@learncard/react', () => ({
    VCDisplayCard2: (props: unknown) => mocks.displayCard(props),
}));
vi.mock('../id/IDDisplayCard', () => ({ default: () => null }));
vi.mock('./FamilyBoostPreview/FamilyBoostPreview', () => ({ default: () => null }));
vi.mock('learn-card-base/hooks/useVerifyCredential', () => ({
    default: () => ({ verifyCredential: mocks.verifyCredential }),
}));
vi.mock('learn-card-base/hooks/useRegistry', () => ({
    useKnownDIDRegistry: () => ({ data: undefined }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: () => undefined }));
vi.mock('learn-card-base/hooks/useGetVCInfo', () => ({
    useGetVCInfo: () => ({
        issuerName: 'Resolved Issuer',
        issuerDid: 'did:key:resolved-issuer',
        issueeName: 'urn:sha256:endorsement-target',
        title: 'Endorsement of First Aid',
        achievementType: 'Achievement',
        formattedAchievementType: 'Achievement',
        displayType: 'badge',
    }),
}));
vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: {
        id: 'ID',
        membership: 'Membership',
        globalAdminId: 'Global Admin ID',
        nationalNetworkAdminId: 'National Network Admin ID',
        troopLeaderId: 'Troop Leader ID',
        scoutId: 'Scout ID',
        family: 'Family',
        socialBadge: 'Social Badge',
        achievement: 'Achievement',
        learningHistory: 'Learning History',
        workHistory: 'Work History',
        accomplishment: 'Accomplishment',
    },
    BrandingEnum: { learncard: 'learncard', scoutPass: 'scoutPass' },
    CredentialBadge: () => null,
    CredentialSubjectDisplay: () => null,
}));
vi.mock('learn-card-base/helpers/lifecycleVerification.helpers', () => ({
    applyLifecycleStatusToVerifications: (items: unknown[]) => items,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (credential: VC) => credential,
    getDefaultCategoryForCredential: () => 'Social Badge',
}));
vi.mock('learn-card-base/helpers/credentials/ids', () => ({
    ID_CARD_DISPLAY_TYPES: { PermanentResidentCard: 'PermanentResidentCard' },
}));
vi.mock('learn-card-base/helpers/didHelpers', () => ({ formatDid: (did: string) => did }));
vi.mock('../../helpers/openAttachmentUrl', () => ({ openAttachmentUrl: vi.fn() }));
vi.mock('../CredentialBadge/CredentialIssuerPopover', () => ({
    default: () => null,
    useCredentialIssuerPopover: () => ({
        credentialIssuerPopoverProps: {},
        openCredentialIssuerPopover: vi.fn(),
    }),
}));

import VCDisplayCardWrapper2 from './VCDisplayCardWrapper2';

const endorsement = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'EndorsementCredential'],
    issuer: 'did:key:endorser',
    issuanceDate: '2026-09-18T00:00:00.000Z',
    credentialSubject: { id: 'urn:sha256:endorsement-target' },
} as unknown as VC;

describe('VCDisplayCardWrapper2', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards endorsement identity overrides to the final credential card', () => {
        const issuerImage = <span>Issuer image</span>;

        render(
            <VCDisplayCardWrapper2
                credential={endorsement}
                categoryType="Social Badge"
                issueeOverride="did:key:endorser"
                issuerOverride="Endorser Profile"
                subjectImageComponent={issuerImage}
            />
        );

        const displayProps = mocks.displayCard.mock.calls.at(-1)?.[0] as {
            credential: VC;
            issueeOverride?: string;
            issuerOverride?: string;
            subjectImageComponent?: React.ReactNode;
        };

        expect(displayProps.credential.credentialSubject).toEqual({
            id: 'urn:sha256:endorsement-target',
        });
        expect(displayProps.issueeOverride).toBe('did:key:endorser');
        expect(displayProps.issuerOverride).toBe('Endorser Profile');
        expect(displayProps.subjectImageComponent).toBe(issuerImage);
    });
});
