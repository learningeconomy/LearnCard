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
    credential?: VC;
    boostUri?: string;
    issueeOverride?: string;
    handleCloseModal?: () => void;
};

const mocks = vi.hoisted(() => ({
    closeModal: vi.fn(),
    issuerName: 'Example University' as string | undefined,
    newModal: vi.fn(),
    presentOptions: vi.fn(),
    isBoostCredential: vi.fn(),
    boostPreview: vi.fn(() => null),
    nonBoostPreview: vi.fn(() => null),
    unwrapBoostCredential: vi.fn(),
    resetIonicModalBackground: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useModal: () => ({
        newModal: mocks.newModal,
        closeModal: mocks.closeModal,
        closeAllModals: vi.fn(),
    }),
    CredentialSubjectDisplay: () => null,
    useGetVCInfo: () => ({
        issuerName: mocks.issuerName,
        issuerDid: 'did:example:issuer',
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
    resetIonicModalBackground: mocks.resetIonicModalBackground,
    BoostCategoryOptionsEnum: { family: 'Family' },
    newCredsStore: {
        use: { newCreds: () => ({}) },
        set: { removeCreds: vi.fn() },
    },
}));

// Keep the collection picker import graph outside these credential UI unit tests.
vi.mock('../../share-links/ShareLinkCreate', () => ({ default: () => null }));
vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => ({ shareMultipleEnabled: false }),
}));

vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({ getThemedCategory: () => undefined }),
}));
vi.mock('../hooks/useBoostMenu', () => ({
    default: () => mocks.presentOptions,
    BoostMenuType: { earned: 'earned' },
}));
vi.mock('../../../hooks/useCredentialStatus', () => ({ useCredentialStatus: () => undefined }));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: mocks.unwrapBoostCredential,
    isBoostCredential: mocks.isBoostCredential,
    getClrLinkedCredentials: () => [],
    getIssuanceDate: (credential?: VC) => credential?.issuanceDate,
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
    default: mocks.boostPreview,
}));
vi.mock('../boostCMS/BoostPreview/NonBoostPreview', () => ({
    default: mocks.nonBoostPreview,
}));
vi.mock('../boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('../../share-links/ShareLinkCreate', () => ({ default: () => null }));
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
// The credential-history module imports the generated paraglide bundle (absent in tests);
// the refresh indicator behavior is covered by CredentialHistoryModal.test.tsx.
vi.mock('../../credentials/credential-history/CredentialUpdatedIndicator', () => ({
    default: () => null,
}));
vi.mock('../../credentials/credential-history/useMarkCredentialUpdateRead', () => ({
    useMarkCredentialUpdateRead: () => vi.fn(async () => false),
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
        mocks.closeModal.mockClear();
        mocks.issuerName = 'Example University';
        mocks.presentOptions.mockClear();
        mocks.isBoostCredential.mockReturnValue(true);
        mocks.boostPreview.mockClear();
        mocks.nonBoostPreview.mockClear();
        mocks.resetIonicModalBackground.mockClear();
        mocks.unwrapBoostCredential.mockImplementation(value => value);
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
        ['Boost', true, mocks.boostPreview],
        ['non-Boost', false, mocks.nonBoostPreview],
    ])(
        'keeps preview options active for a %s credential when only the card trigger is hidden',
        (_credentialKind, isBoost, expectedPreview) => {
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
                React.ReactElement<PreviewProps> | undefined;
            expect(preview).toBeDefined();
            expect(preview!.type).toBe(expectedPreview);
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
            React.ReactElement<PreviewProps> | undefined;
        expect(preview).toBeDefined();
        expect(preview!.props.onDotsClick).toBeUndefined();
        expect(mocks.presentOptions).not.toHaveBeenCalled();
    });

    it('uses the resolved issuer and keeps the endorsement preview close action', () => {
        mocks.isBoostCredential.mockReturnValue(false);

        render(
            <BoostEarnedCard
                credential={credential}
                record={{ uri: 'urn:credential:endorsement' }}
                categoryType="Social Badge"
                useWrapper={false}
                displayIssuerAsSubject
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

        const preview = mocks.newModal.mock.calls[0]?.[0] as
            React.ReactElement<PreviewProps> | undefined;
        expect(preview?.props.issueeOverride).toBe('Example University');
        expect(preview?.props.issueeOverride).not.toBe('Ada Learner');
        expect(preview?.props.handleCloseModal).toBeTypeOf('function');

        preview?.props.handleCloseModal?.();
        expect(mocks.closeModal).toHaveBeenCalledOnce();
    });

    it('falls back to the signed issuer DID when the issuer has no resolved name', () => {
        mocks.isBoostCredential.mockReturnValue(false);
        mocks.issuerName = undefined;

        render(
            <BoostEarnedCard
                credential={credential}
                record={{ uri: 'urn:credential:endorsement' }}
                categoryType="Social Badge"
                useWrapper={false}
                displayIssuerAsSubject
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

        const preview = mocks.newModal.mock.calls[0]?.[0] as
            React.ReactElement<PreviewProps> | undefined;
        expect(preview?.props.issueeOverride).toBe('did:example:issuer');
    });

    it('uses the earned preview flow from a custom trigger', () => {
        render(
            <BoostEarnedCard
                credential={credential}
                record={{ uri: 'urn:credential:achievement' }}
                categoryType="Achievement"
                renderPreviewTrigger={openPreview => (
                    <button type="button" onClick={openPreview}>
                        Open contact credential
                    </button>
                )}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open contact credential' }));

        expect(mocks.resetIonicModalBackground).toHaveBeenCalledOnce();
        expect(mocks.newModal).toHaveBeenCalledOnce();
        const preview = mocks.newModal.mock.calls[0]?.[0] as React.ReactElement | undefined;
        expect(preview?.type).toBe(mocks.boostPreview);
    });

    it('keeps the resolved wrapper and record URI in the earned ID preview', () => {
        const innerCredential = {
            ...credential,
            id: undefined,
        } as unknown as VC;
        const wrapperCredential = {
            ...credential,
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: innerCredential,
        } as unknown as VC;
        mocks.unwrapBoostCredential.mockReturnValue(innerCredential);

        render(
            <BoostEarnedCard
                credential={wrapperCredential}
                record={{ uri: 'urn:credential:id-record' }}
                categoryType="ID"
                useWrapper={false}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

        const preview = mocks.newModal.mock.calls[0]?.[0] as
            React.ReactElement<PreviewProps> | undefined;
        expect(preview?.type).toBe(mocks.boostPreview);
        expect(preview?.props.credential).toBe(wrapperCredential);
        expect(preview?.props.boostUri).toBe('urn:credential:id-record');
    });
});
