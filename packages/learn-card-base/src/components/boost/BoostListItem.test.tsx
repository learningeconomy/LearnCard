// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
    it('exposes clickable rows to pointer and keyboard users', () => {
        const onClick = vi.fn();
        const { rerender } = render(
            <BoostListItem
                credential={credential}
                categoryType="Achievement"
                title="Example Achievement"
                onClick={onClick}
            />
        );

        const clickableRow = screen.getByRole('button');
        expect(clickableRow.classList.contains('cursor-pointer')).toBe(true);
        expect(clickableRow.getAttribute('tabindex')).toBe('0');

        fireEvent.keyDown(clickableRow, { key: 'Enter' });
        fireEvent.keyDown(clickableRow, { key: ' ' });
        expect(onClick).toHaveBeenCalledTimes(2);

        rerender(
            <BoostListItem
                credential={credential}
                categoryType="Achievement"
                title="Example Achievement"
            />
        );

        const passiveRow = screen.getByTestId('boost-list-item');
        expect(passiveRow.classList.contains('cursor-pointer')).toBe(false);
        expect(passiveRow.getAttribute('role')).toBeNull();
        expect(passiveRow.getAttribute('tabindex')).toBeNull();
    });
});
