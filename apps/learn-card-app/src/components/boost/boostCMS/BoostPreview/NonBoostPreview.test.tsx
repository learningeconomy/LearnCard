import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VerificationStatusEnum, type VC } from '@learncard/types';
import { BoostCategoryOptionsEnum, DisplayTypeEnum } from 'learn-card-base';

type MenuProps = {
    onDotsClick?: () => void;
};

type FooterLayoutProps = React.PropsWithChildren<{
    footerProps?: {
        handleClose?: () => void;
        handleDotMenu?: () => void;
        handleDetails?: () => void;
    };
}>;
const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    verify: vi.fn(),
    fullPage: vi.fn(),
    displayCard: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    boostPreviewStore: {
        useTracked: { selectedDisplayView: () => 'default' },
        set: {
            updateSelectedTab: vi.fn(),
            updateSelectedDisplayView: vi.fn(),
        },
    },
    useWallet: () => ({ initWallet: async () => ({ invoke: { verifyCredential: mocks.verify } }) }),
    useModal: () => ({ newModal: mocks.newModal, closeModal: vi.fn() }),
    ModalTypes: { Right: 'right' },
    useDeviceTypeByWidth: () => ({ isMobile: true }),
    DisplayTypeEnum: {
        Course: 'course',
        Certificate: 'certificate',
        ID: 'id',
        Media: 'media',
    },
    BoostCategoryOptionsEnum: {
        achievement: 'Achievement',
        learningHistory: 'Learning History',
    },
}));

vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@learncard/react', () => ({ getVCDisplayCardVariant: () => 'certificate' }));
vi.mock('@learncard/render-method-plugin', () => ({
    getSvgMustacheRenderMethod: () => null,
}));
vi.mock('@analytics', () => ({
    AnalyticsEvents: { CREDENTIAL_VIEWED: 'credential-viewed' },
    useAnalytics: () => ({ track: vi.fn() }),
}));
vi.mock('learn-card-base/stores/boostPreviewStore', () => ({
    BoostPreviewDisplayViewEnum: { Issuer: 'issuer', Default: 'default' },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (credential: VC) => credential,
    getAchievementType: () => 'Certification',
    getCredentialName: () => 'Video of first badge',
}));
vi.mock('learn-card-base/helpers/lifecycleVerification.helpers', () => ({
    applyLifecycleStatusToVerifications: (verifications: unknown[]) => verifications,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: ({
        onDotsClick,
        customFooterComponent,
        ...props
    }: MenuProps & { customFooterComponent?: React.ReactNode; skipVerification?: boolean }) => {
        mocks.displayCard(props);
        return (
            <div>
                <span>Generic credential preview</span>
                {customFooterComponent}
                {onDotsClick && <button type="button">Embedded options</button>}
            </div>
        );
    },
}));
vi.mock('../../../accessibility/AccessibleBoostFooterLayout', () => ({
    default: ({ children, footerProps }: FooterLayoutProps) => (
        <div>
            {children}
            {footerProps?.handleClose && (
                <button type="button" onClick={footerProps.handleClose}>
                    Footer close
                </button>
            )}
            {footerProps?.handleDotMenu && <button type="button">Footer options</button>}
            {footerProps?.handleDetails && (
                <button type="button" onClick={footerProps.handleDetails}>
                    Footer details
                </button>
            )}
        </div>
    ),
}));
vi.mock('../../../render-method/RenderMethodDisplay', () => ({ default: () => null }));
vi.mock('./BoostDetailsSideBar', () => ({ default: () => <div>Generic details sidebar</div> }));
vi.mock('./BoostDetailsSideMenu', () => ({ default: () => null }));
vi.mock('./VerifiedChildCLRFooter', () => ({ default: () => <div>Verified child CLR</div> }));
vi.mock('../../../boost-endorsements/EndorsementBadge', () => ({ default: () => null }));
vi.mock('./BoostMediaPreview', () => ({
    default: ({ onDotsClick }: MenuProps) => (
        <div>{onDotsClick && <button type="button">Media options</button>}</div>
    ),
}));
vi.mock('../../../clr-transcript/surfaces/ClrTranscriptFullPage', () => ({
    default: (props: unknown) => {
        mocks.fullPage(props);
        return null;
    },
    createClrRecordNavigator: () => ({
        selectRecord: vi.fn(),
        openRecord: vi.fn(),
    }),
}));
vi.mock('../../../clr-transcript/ClrCourseDetailPanel', () => ({
    default: () => <div>CLR course detail</div>,
}));
vi.mock('learn-card-base/helpers/credentials/clr/renderer', () => {
    const getAchievement = (rawCredential: Record<string, unknown>) => {
        const subject = rawCredential.credentialSubject as Record<string, unknown> | undefined;
        return subject?.achievement as Record<string, unknown> | undefined;
    };

    return {
        isStandaloneCourseCredential: (rawCredential: Record<string, unknown>) => {
            const achievement = getAchievement(rawCredential);
            const issuer = rawCredential.issuer as Record<string, unknown> | undefined;

            return (
                achievement?.achievementType === 'Course' &&
                Boolean(achievement.name) &&
                Boolean(issuer?.name)
            );
        },
        normalizeClrTranscriptDisplayModel: (rawCredential: Record<string, unknown>) => {
            const achievement = getAchievement(rawCredential);

            return {
                courses:
                    achievement?.achievementType === 'Course' &&
                    rawCredential.id !== 'urn:credential:course-without-normalized-course'
                        ? [{ name: { value: achievement.name } }]
                        : [],
                competencies: [],
                associations: [],
                evidence: [],
                header: {},
            };
        },
        ClrTranscriptSurface: { Full: 'full' },
    };
});
vi.mock('learn-card-base/helpers/credentials/clr/helpers', () => ({
    getDownloadableEvidence: () => [],
}));

import NonBoostPreview from './NonBoostPreview';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:credential:certificate',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-06T00:00:00.000Z',
    credentialSubject: {
        id: 'did:example:learner',
        achievement: { name: 'Video of first badge' },
    },
    display: { displayType: 'certificate' },
} as unknown as VC;

const courseCredential = {
    ...credential,
    id: 'urn:credential:course',
    issuer: { id: 'did:example:issuer', name: 'Example Institution' },
    credentialSubject: {
        id: 'did:example:learner',
        achievement: {
            achievementType: 'Course',
            name: 'Applied Data Ethics',
        },
    },
} as unknown as VC;

describe('NonBoostPreview', () => {
    it('passes computed proof results to the full CLR renderer', async () => {
        const verificationItems = [{ check: 'proof', status: VerificationStatusEnum.Failed }];
        mocks.verify.mockResolvedValue(verificationItems);
        render(
            <NonBoostPreview
                credential={credential}
                verificationItems={[]}
                categoryType={BoostCategoryOptionsEnum.learningHistory}
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                isClrCredential
            />
        );
        await waitFor(() =>
            expect(mocks.fullPage.mock.lastCall?.[0].verificationItems).toEqual(verificationItems)
        );
    });
    it('only exposes credential options through the preview footer', () => {
        const handleCloseModal = vi.fn();
        render(
            <NonBoostPreview
                credential={credential}
                verificationItems={[]}
                categoryType={BoostCategoryOptionsEnum.achievement}
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={handleCloseModal}
                handleShareBoost={vi.fn()}
                onDotsClick={vi.fn()}
                displayType={DisplayTypeEnum.Certificate}
                isPreview
            />
        );

        expect(screen.getByRole('button', { name: 'Footer options' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Embedded options' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Footer close' }));
        expect(handleCloseModal).toHaveBeenCalledOnce();
    });

    it('passes the credential record URI to earned credential options', () => {
        render(
            <NonBoostPreview
                credential={credential}
                credentialUri="lc:credential:record-a"
                verificationItems={[]}
                categoryType={BoostCategoryOptionsEnum.achievement}
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                handleShareBoost={vi.fn()}
                displayType={DisplayTypeEnum.Certificate}
                isPreview
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Footer details' }));

        const detailsElement = mocks.newModal.mock.calls[0][0] as React.ReactElement<{
            shareCredentialUri?: string;
        }>;
        expect(detailsElement.props.shareCredentialUri).toBe('lc:credential:record-a');
    });

    it('keeps credential options available for media previews', () => {
        render(
            <NonBoostPreview
                credential={credential}
                verificationItems={[]}
                categoryType={BoostCategoryOptionsEnum.achievement}
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                handleShareBoost={vi.fn()}
                onDotsClick={vi.fn()}
                displayType={DisplayTypeEnum.Media}
                isPreview
            />
        );

        expect(screen.getByRole('button', { name: 'Media options' })).toBeTruthy();
    });

    it('uses the CLR course presentation for an eligible standalone Course credential', () => {
        render(
            <NonBoostPreview
                credential={courseCredential}
                verificationItems={[]}
                categoryType={BoostCategoryOptionsEnum.learningHistory}
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                handleShareBoost={vi.fn()}
                displayType={DisplayTypeEnum.Course}
                isPreview
            />
        );

        expect(screen.getByText('CLR course detail')).toBeTruthy();
        expect(screen.queryByText('Generic credential preview')).toBeNull();
        expect(screen.queryByText('Generic details sidebar')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Footer details' })).toBeNull();
    });

    it('keeps a CLR child Course credential in the generic child presentation', () => {
        render(
            <NonBoostPreview
                credential={courseCredential}
                verificationItems={[]}
                categoryType={BoostCategoryOptionsEnum.learningHistory}
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                handleShareBoost={vi.fn()}
                isClrChildCredential
                isPreview
            />
        );

        expect(screen.getByText('Generic credential preview')).toBeTruthy();
        expect(screen.getByText('Preview')).toBeTruthy();
        expect(screen.queryByText('Verified child CLR')).toBeNull();
        expect(screen.queryByText('CLR course detail')).toBeNull();
    });

    it('falls back to the generic preview when a standalone Course cannot be normalized', () => {
        render(
            <NonBoostPreview
                credential={{
                    ...courseCredential,
                    id: 'urn:credential:course-without-normalized-course',
                }}
                verificationItems={[]}
                categoryType={BoostCategoryOptionsEnum.learningHistory}
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                handleShareBoost={vi.fn()}
                displayType={DisplayTypeEnum.Course}
                isPreview
            />
        );

        expect(screen.getByText('Generic credential preview')).toBeTruthy();
        expect(screen.queryByText('CLR course detail')).toBeNull();
    });
});

it('shows a neutral footer and prevents nested proof verification for an unsigned preview', () => {
    mocks.verify.mockClear();
    render(
        <NonBoostPreview
            credential={credential}
            verificationItems={[{ check: 'proof', status: VerificationStatusEnum.Failed }]}
            categoryType={BoostCategoryOptionsEnum.achievement}
            customThumbComponent={null}
            customBodyCardComponent={null}
            customFooterComponent={<span>Verified Credential Failed</span>}
            customIssueHistoryComponent={null}
            handleCloseModal={vi.fn()}
            isPreview
        />
    );
    expect(screen.getByText('Preview')).toBeTruthy();
    expect(screen.getByText('Verification runs after you issue it.')).toBeTruthy();
    expect(screen.queryByText('Verified Credential Failed')).toBeNull();
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.displayCard.mock.lastCall?.[0].skipVerification).toBe(true);
    expect(mocks.displayCard.mock.lastCall?.[0].verificationItems).toEqual([]);
});

it('retains proof verification and the supplied footer for an issued credential', async () => {
    const proof = [{ check: 'proof', status: VerificationStatusEnum.Success }];
    mocks.verify.mockClear();
    mocks.verify.mockResolvedValue(proof);
    render(
        <NonBoostPreview
            credential={credential}
            verificationItems={[]}
            categoryType={BoostCategoryOptionsEnum.achievement}
            customThumbComponent={null}
            customBodyCardComponent={null}
            customFooterComponent={<span>Issued credential footer</span>}
            customIssueHistoryComponent={null}
            handleCloseModal={vi.fn()}
        />
    );
    expect(screen.getByText('Issued credential footer')).toBeTruthy();
    expect(screen.queryByText('Verification runs after you issue it.')).toBeNull();
    await waitFor(() => expect(mocks.verify).toHaveBeenCalledWith(credential, {}, true));
    expect(mocks.displayCard.mock.lastCall?.[0].skipVerification).toBe(false);
});
