import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';
import { BoostCategoryOptionsEnum, DisplayTypeEnum } from 'learn-card-base';

type MenuProps = {
    onDotsClick?: () => void;
};

type FooterLayoutProps = React.PropsWithChildren<{
    footerProps?: { handleDotMenu?: () => void; handleDetails?: () => void };
}>;

vi.mock('learn-card-base', () => ({
    boostPreviewStore: {
        useTracked: { selectedDisplayView: () => 'default' },
        set: {
            updateSelectedTab: vi.fn(),
            updateSelectedDisplayView: vi.fn(),
        },
    },
    useWallet: () => ({ initWallet: vi.fn() }),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
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
vi.mock('../../../../hooks/useRenderMethodEnabled', () => ({
    useRenderMethodEnabled: () => false,
}));
vi.mock('learn-card-base/stores/boostPreviewStore', () => ({
    BoostPreviewDisplayViewEnum: { Issuer: 'issuer', Default: 'default' },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (credential: VC) => credential,
    getAchievementType: () => 'Certification',
}));
vi.mock('learn-card-base/helpers/lifecycleVerification.helpers', () => ({
    applyLifecycleStatusToVerifications: (verifications: unknown[]) => verifications,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: ({ onDotsClick }: MenuProps) => (
        <div>
            <span>Generic credential preview</span>
            {onDotsClick && <button type="button">Embedded options</button>}
        </div>
    ),
}));
vi.mock('learn-card-base/components/boost/boostFooter/BoostFooterLayout', () => ({
    default: ({ children, footerProps }: FooterLayoutProps) => (
        <div>
            {children}
            {footerProps?.handleDotMenu && <button type="button">Footer options</button>}
            {footerProps?.handleDetails && <button type="button">Footer details</button>}
        </div>
    ),
}));
vi.mock('../../../render-method/RenderMethodDisplay', () => ({ default: () => null }));
vi.mock('./BoostDetailsSideBar', () => ({ default: () => <div>Generic details sidebar</div> }));
vi.mock('./BoostDetailsSideMenu', () => ({ default: () => null }));
vi.mock('./VerifiedChildCLRFooter', () => ({ default: () => null }));
vi.mock('../../../boost-endorsements/EndorsementBadge', () => ({ default: () => null }));
vi.mock('./BoostMediaPreview', () => ({
    default: ({ onDotsClick }: MenuProps) => (
        <div>{onDotsClick && <button type="button">Media options</button>}</div>
    ),
}));
vi.mock('../../../clr-transcript/surfaces/ClrTranscriptFullPage', () => ({
    default: () => null,
}));
vi.mock('../../../clr-transcript/ClrCourseDetailPanel', () => ({
    default: () => <div>CLR course detail</div>,
}));
vi.mock('../../../../helpers/clrRenderer.helpers', () => {
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
                    achievement?.achievementType === 'Course'
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
vi.mock('../../../clr-transcript/clr.helpers', () => ({
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
    it('only exposes credential options through the preview footer', () => {
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
                displayType={DisplayTypeEnum.Certificate}
                isPreview
            />
        );

        expect(screen.getByRole('button', { name: 'Footer options' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Embedded options' })).toBeNull();
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
});
