// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

vi.mock('@ionic/react', () => ({
    IonRow: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
    ),
}));
vi.mock('@learncard/react', () => ({
    isDid: () => false,
    formatDidDisplayName: (did: string) => did,
    getLifecycleTreatment: () => ({
        isInactive: false,
        mediaStyle: undefined,
        pillBg: undefined,
    }),
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        achievement: 'Achievement',
        learningHistory: 'Learning History',
        socialBadge: 'Social Badge',
        accomplishment: 'Accomplishment',
        workHistory: 'Work History',
        accommodation: 'Accommodation',
        id: 'ID',
        membership: 'Membership',
        meritBadge: 'Merit Badge',
    },
    categoryMetadata: { Achievement: { subColor: 'emerald-100' } },
}));
vi.mock('learn-card-base/hooks/useGetIssuerName', () => ({ default: () => 'Example University' }));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getAchievementType: () => 'Achievement',
    getAchievementTypeDisplayText: () => 'Achievement',
    getIssuer: () => 'did:example:issuer',
    getIssuanceDate: () => '2026-08-06T00:00:00.000Z',
}));
vi.mock('../CredentialBadge/CredentialVerificationDisplay', () => ({
    default: () => null,
    getInfoFromCredential: () => ({ createdAt: 'August 06 2026' }),
}));
vi.mock('../CredentialBadge/BadgeThumbnailImg', () => ({ default: () => null }));
vi.mock('../CredentialBadge/CredentialMediaBadge', () => ({ default: () => null }));
vi.mock('learn-card-base/helpers/display.helpers', () => ({
    DisplayTypeEnum: { Media: 'media' },
    getAttachmentTypeIcon: () => ({ AttachmentIcon: () => null, title: '' }),
    getDisplayIcon: () => () => null,
}));
vi.mock('./boost', () => ({ BoostMediaOptionsEnum: { photo: 'photo' } }));
vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { use: { newCreds: () => ({}) } },
}));
vi.mock('../../svgs/DotIcon', () => ({ default: () => null }));
vi.mock('learn-card-base/i18n', () => ({ useT: () => (key: string) => key }));

import BoostListItem from './BoostListItem';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:credential:achievement',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-06T00:00:00.000Z',
    credentialSubject: { id: 'did:example:learner' },
} as unknown as VC;

describe('BoostListItem', () => {
    it('shows a pointer cursor only when the row is clickable', () => {
        const { rerender } = render(
            <BoostListItem
                credential={credential}
                categoryType="Achievement"
                title="Example Achievement"
                onClick={vi.fn()}
            />
        );

        expect(screen.getByTestId('boost-list-item').classList.contains('cursor-pointer')).toBe(
            true
        );

        rerender(
            <BoostListItem
                credential={credential}
                categoryType="Achievement"
                title="Example Achievement"
            />
        );

        expect(screen.getByTestId('boost-list-item').classList.contains('cursor-pointer')).toBe(
            false
        );
    });
});
