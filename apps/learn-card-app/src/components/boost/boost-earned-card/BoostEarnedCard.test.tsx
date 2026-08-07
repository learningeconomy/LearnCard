import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

type CardWrapperProps = {
    innerOnClick?: () => void;
    optionsTriggerOnClick?: () => void;
};

type PreviewProps = {
    onDotsClick?: () => void;
};

const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    presentOptions: vi.fn(),
    isBoostCredential: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useModal: () => ({
        newModal: mocks.newModal,
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
    }),
    CredentialSubjectDisplay: () => null,
    useGetVCInfo: () => ({
        issuerName: 'Example University',
        issueeName: 'Ada Learner',
        title: 'Example Achievement',
        achievementType: 'Achievement',
        formattedAchievementType: 'Achievement',
        badgeThumbnail: undefined,
        isClrCredential: false,
        linkedCredentialCount: 0,
        displayType: 'badge',
        loading: false,
    }),
    useGetResolvedCredential: () => ({
        data: undefined,
        isFetching: false,
        isLoading: false,
    }),
    useGetCredentialWithEdits: () => ({ credentialWithEdits: undefined }),
    ModalTypes: { FullScreen: 'fullscreen' },
    DisplayTypeEnum: { Certificate: 'certificate', ID: 'id', Award: 'award' },
    categoryMetadata: {
        Achievement: {
            walletSubtype: 'achievement',
            color: 'emerald-100',
            darkColor: 'emerald-700',
        },
    },
    BoostPageViewMode: { Card: 'card' },
    BoostGenericCardWrapper: ({ innerOnClick, optionsTriggerOnClick }: CardWrapperProps) => (
        <div>
            <button type="button" onClick={innerOnClick}>
                Open credential
            </button>
            {optionsTriggerOnClick && (
                <button type="button" onClick={optionsTriggerOnClick}>
                    Card options
                </button>
            )}
        </div>
    ),
    resetIonicModalBackground: vi.fn(),
    BoostCategoryOptionsEnum: { family: 'Family' },
    newCredsStore: {
        use: { newCreds: () => ({}) },
        set: { removeCreds: vi.fn() },
    },
}));

vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({ getThemedCategory: () => undefined }),
}));
vi.mock('../hooks/useBoostMenu', () => ({
    default: () => mocks.presentOptions,
    BoostMenuType: { earned: 'earned' },
}));
vi.mock('src/hooks/useCredentialStatus', () => ({ useCredentialStatus: () => undefined }));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (credential: VC) => credential,
    isBoostCredential: mocks.isBoostCredential,
    getClrLinkedCredentials: () => [],
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    getInfoFromCredential: () => ({ createdAt: '2026-08-06' }),
}));
vi.mock('../../clr-transcript', () => ({
    getClrTranscriptKind: () => 'unknown',
    getClrTranscriptIssuerInfo: () => ({}),
}));
vi.mock('../boostHelpers', () => ({ getDefaultDisplayType: () => 'badge' }));
vi.mock('../boostCMS/BoostPreview/BoostPreview', () => ({
    default: () => null,
}));
vi.mock('../boostCMS/BoostPreview/NonBoostPreview', () => ({
    default: () => null,
}));
vi.mock('../boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('../../familyCMS/FamilyCard/FamilyCard', () => ({ default: () => null }));
vi.mock('./helpers/CustomIssuerName', () => ({ default: () => null }));
vi.mock('./helpers/CustomBoostTitleDisplay', () => ({ default: () => null }));
vi.mock('../boostLinkedCredentials/BoostLinkedCredentialsBox', () => ({ default: () => null }));
vi.mock('../boostLinkedCredentials/ClrAchievementsSummaryBox', () => ({ default: () => null }));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/id/IDDisplayCard', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadgeNew', () => ({
    default: () => null,
}));

import BoostEarnedCard from './BoostEarnedCard';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:credential:achievement',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-06T00:00:00.000Z',
    credentialSubject: {
        id: 'did:example:learner',
        achievement: { name: 'Example Achievement' },
    },
} as unknown as VC;

describe('BoostEarnedCard', () => {
    beforeEach(() => {
        mocks.newModal.mockClear();
        mocks.presentOptions.mockClear();
        mocks.isBoostCredential.mockReturnValue(true);
    });

    it('does not expose card options while the credential is loading', () => {
        render(
            <BoostEarnedCard
                credential={credential}
                record={{ uri: 'urn:credential:achievement' }}
                categoryType="Achievement"
                useWrapper={false}
                loading
            />
        );

        expect(screen.queryByRole('button', { name: 'Card options' })).toBeNull();
    });

    it.each([
        ['Boost', true],
        ['non-Boost', false],
    ])(
        'keeps preview options active for a %s credential when only the card trigger is hidden',
        (_credentialKind, isBoost) => {
            mocks.isBoostCredential.mockReturnValue(isBoost);
            render(
                <BoostEarnedCard
                    credential={credential}
                    record={{ uri: 'urn:credential:achievement' }}
                    categoryType="Achievement"
                    useWrapper={false}
                    hideCardOptionsMenu
                />
            );

            expect(screen.queryByRole('button', { name: 'Card options' })).toBeNull();

            fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

            expect(mocks.newModal).toHaveBeenCalledOnce();
            const preview = mocks.newModal.mock.calls[0]?.[0] as
                | React.ReactElement<PreviewProps>
                | undefined;
            expect(preview).toBeDefined();
            expect(typeof preview!.props.onDotsClick).toBe('function');
            preview!.props.onDotsClick!();

            expect(mocks.presentOptions).toHaveBeenCalledOnce();
        }
    );

    it('keeps preview options hidden when all options are disabled', () => {
        render(
            <BoostEarnedCard
                credential={credential}
                record={{ uri: 'urn:credential:achievement' }}
                categoryType="Achievement"
                useWrapper={false}
                hideOptionsMenu
            />
        );

        expect(screen.queryByRole('button', { name: 'Card options' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

        expect(mocks.newModal).toHaveBeenCalledOnce();
        const preview = mocks.newModal.mock.calls[0]?.[0] as
            | React.ReactElement<PreviewProps>
            | undefined;
        expect(preview).toBeDefined();
        expect(preview!.props.onDotsClick).toBeUndefined();
        expect(mocks.presentOptions).not.toHaveBeenCalled();
    });
});
