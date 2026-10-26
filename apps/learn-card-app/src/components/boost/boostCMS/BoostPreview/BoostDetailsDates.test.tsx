import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

vi.mock('learn-card-base', () => ({
    useGetVCInfo: () => ({ description: 'Course completion' }),
    boostPreviewStore: {
        useTracked: { selectedTab: () => 'details' },
        set: { updateSelectedTab: vi.fn() },
    },
    BoostPreviewTabsEnum: { Details: 'details', Endorsements: 'endorsements' },
    useModal: () => ({ closeModal: vi.fn() }),
    useDeviceTypeByWidth: () => ({ isMobile: false }),
    DisplayTypeEnum: { Media: 'media' },
    CredentialCategoryEnum: {},
    getCategoryDarkColor: () => 'grayscale-900',
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    default: () => null,
    getInfoFromCredential: () => ({ createdAt: 'October 26, 2026' }),
}));
vi.mock('../../../accessibility/AccessibleBoostFooterLayout', () => ({
    default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('apps/learn-card-app/src/pages/ids/view-id/IdDetails/TruncateTextBox', () => ({
    default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('../../../../theme/hooks/useTheme', () => ({
    default: () => ({ colors: { defaults: { primaryColor: 'emerald-600' } } }),
}));
vi.mock('./OpenSyllabusMetaData', () => ({ default: () => null }));
vi.mock('./CredentialIssuerInformation', () => ({ default: () => null }));
vi.mock('./SdJwtVcClaimsBox', () => ({ default: () => null }));
vi.mock('../../../boost-endorsements/EndorsementCard', () => ({ default: () => null }));
vi.mock('../../../boost-endorsements/EndorsementsList/EndorsementsList', () => ({
    default: () => null,
}));
vi.mock('../../../boost-endorsements/BoostEndorsementDetails', () => ({ default: () => null }));
vi.mock('../../../boost-preview-tabs/BoostPreviewTabs', () => ({ default: () => null }));

vi.mock('./BoostSideMenuMediaDetails', () => ({ default: () => null }));
vi.mock('./BoostDisplayStyleSelector', () => ({ default: () => null }));
vi.mock('apps/learn-card-app/src/pages/ids/view-id/IdDetails/SkillsBox', () => ({
    default: () => null,
}));
vi.mock('apps/learn-card-app/src/pages/ids/view-id/IdDetails/AlignmentsBox', () => ({
    default: () => null,
}));
vi.mock('apps/learn-card-app/src/pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts', () => ({
    default: () => null,
}));

import BoostDetailsSideBar from './BoostDetailsSideBar';
import BoostDetailsSideMenu from './BoostDetailsSideMenu';

describe.each([
    ['desktop sidebar', BoostDetailsSideBar],
    ['mobile details', BoostDetailsSideMenu],
])('%s award date', (_, Component) => {
    it('displays the standard award date instead of the different issuance date', () => {
        render(
            <Component
                credential={
                    { awardedDate: '2027-10-01T00:00:00Z', validFrom: '2026-10-26T12:00:00Z' } as VC
                }
                verificationItems={[]}
                isPreview
            />
        );
        expect(screen.getByText('Awarded on October 01, 2027')).toBeTruthy();
        expect(screen.queryByText('Awarded on October 26, 2026')).toBeNull();
    });
    it('falls back to the legacy issuance date', () => {
        render(
            <Component credential={{ issuanceDate: '2026-10-26' } as VC} verificationItems={[]} />
        );
        expect(screen.getByText('Awarded on October 26, 2026')).toBeTruthy();
    });
    it('does not invent an award day for an undated draft', () => {
        render(<Component credential={{} as VC} verificationItems={[]} isPreview />);
        expect(screen.queryByText(/Awarded on/)).toBeNull();
    });
});
