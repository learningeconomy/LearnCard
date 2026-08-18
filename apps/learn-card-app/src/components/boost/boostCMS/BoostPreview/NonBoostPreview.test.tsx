import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

type MenuProps = {
    onDotsClick?: () => void;
};

type FooterLayoutProps = React.PropsWithChildren<{
    footerProps?: { handleDotMenu?: () => void };
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
        Certificate: 'certificate',
        ID: 'id',
        Media: 'media',
    },
    BoostCategoryOptionsEnum: { achievement: 'Achievement' },
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
    default: ({ onDotsClick }: MenuProps) => (
        <div>{onDotsClick && <button type="button">Embedded options</button>}</div>
    ),
}));
vi.mock('../../../accessibility/AccessibleBoostFooterLayout', () => ({
    default: ({ children, footerProps }: FooterLayoutProps) => (
        <div>
            {children}
            {footerProps?.handleDotMenu && <button type="button">Footer options</button>}
        </div>
    ),
}));
vi.mock('../../../render-method/RenderMethodDisplay', () => ({ default: () => null }));
vi.mock('./BoostDetailsSideBar', () => ({ default: () => null }));
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
vi.mock('../../../../helpers/clrRenderer.helpers', () => ({
    normalizeClrTranscriptDisplayModel: () => null,
    ClrTranscriptSurface: { Full: 'full' },
}));
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

describe('NonBoostPreview', () => {
    it('only exposes credential options through the preview footer', () => {
        render(
            <NonBoostPreview
                credential={credential}
                verificationItems={[]}
                categoryType="Achievement"
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                handleShareBoost={vi.fn()}
                onDotsClick={vi.fn()}
                displayType="certificate"
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
                categoryType="Achievement"
                customThumbComponent={null}
                customBodyCardComponent={null}
                customFooterComponent={null}
                customIssueHistoryComponent={null}
                handleCloseModal={vi.fn()}
                handleShareBoost={vi.fn()}
                onDotsClick={vi.fn()}
                displayType="media"
                isPreview
            />
        );

        expect(screen.getByRole('button', { name: 'Media options' })).toBeTruthy();
    });
});
