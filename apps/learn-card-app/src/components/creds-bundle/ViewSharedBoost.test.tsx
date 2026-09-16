import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageUri = 'ceramic://encrypted-presentation';
const credential = { id: 'urn:uuid:credential', boostId: 'urn:boost:test' };

const mocks = vi.hoisted(() => ({
    readCredential: vi.fn(),
    useGetCredentialWithEdits: vi.fn(() => ({ credentialWithEdits: undefined })),
    verifyCredential: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: vi.fn() }),
    useLocation: () => ({
        search: `?uri=${encodeURIComponent(storageUri)}&seed=seed&pin=1234`,
    }),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn() } }));
vi.mock('@learncard/react', () => ({ getVCDisplayCardVariant: () => 'default' }));
vi.mock('@ionic/react', () => ({
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonToolbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useIonAlert: () => [vi.fn()],
    useIonModal: () => [vi.fn(), vi.fn()],
}));
vi.mock('learn-card-base', () => ({
    BrandingEnum: { learncard: 'learncard' },
    getLogger: () => ({ info: vi.fn(), warn: vi.fn() }),
    useGetCredentialWithEdits: mocks.useGetCredentialWithEdits,
    useIsLoggedIn: () => false,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
    getEndorsementsFromPresentations: () => [],
    isClrCredential: () => false,
    unwrapBoostCredential: (value: unknown) => value,
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: async () => ({
        read: { get: mocks.readCredential },
        invoke: { verifyCredential: mocks.verifyCredential },
    }),
}));
vi.mock('../accessibility/AccessibleBoostFooterLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('./SharedBoostVerificationBlock', () => ({
    default: () => null,
    SharedBoostVerificationBlockViewMode: { mini: 'mini', modal: 'modal' },
}));
vi.mock('learn-card-base/components/loaders/LoadingSpinner', () => ({
    LoadingSpinner: () => null,
}));
vi.mock('../main-header/MainHeader', () => ({ default: () => null }));
vi.mock('../boost-endorsements/EndorsementRequestModal/EndorsementRequestModal', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/headerBranding/HeaderBranding', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => null,
}));
vi.mock('./SharedBoostPageFooter', () => ({ default: () => null }));
vi.mock('../clr-transcript/surfaces/ClrTranscriptFullPage', () => ({ default: () => null }));
vi.mock('../../helpers/clrRenderer.helpers', () => ({
    ClrTranscriptSurface: { Full: 'full' },
    normalizeClrTranscriptDisplayModel: () => null,
}));
vi.mock('../../hooks/deriveLifecycleStatus', () => ({
    deriveLifecycleStatus: () => 'active',
}));
vi.mock('../../stores/endorsementsRequestStore', () => ({
    default: {
        useTracked: {
            credentialInfo: () => undefined,
            endorsementRequest: () => undefined,
        },
    },
}));
vi.mock('../boost-endorsements/EndorsementRequestForm/EndorsementDraftRequestSuccess', () => ({
    default: () => null,
}));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'http://localhost:3000',
}));
vi.mock('../boost-endorsements/EndorsementRequestForm/endorsement-request.helpers', () => ({
    createEndorsementShareLinkInfo: () => 'share-link',
}));
vi.mock('../../paraglide/messages.js', () => ({
    'endorsement.viewRequest.errorOpening': () => 'Unable to open credential',
    'issue.revoked': () => 'Revoked',
    'issue.suspended': () => 'Suspended',
}));

import ViewSharedBoost from './ViewSharedBoost';

describe('ViewSharedBoost', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.readCredential.mockResolvedValue({ verifiableCredential: credential });
        mocks.verifyCredential.mockResolvedValue([]);
    });

    it('does not pass the encrypted presentation URI as a Boost edit fallback', async () => {
        render(<ViewSharedBoost showEndorsementRequest />);

        await waitFor(() =>
            expect(mocks.useGetCredentialWithEdits).toHaveBeenCalledWith(credential)
        );
        expect(
            mocks.useGetCredentialWithEdits.mock.calls.every(arguments_ => arguments_.length === 1)
        ).toBe(true);
    });
});
