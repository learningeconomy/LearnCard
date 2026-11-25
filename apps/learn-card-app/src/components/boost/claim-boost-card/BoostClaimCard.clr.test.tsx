import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import type * as IonicReact from '@ionic/react';
import { clrMixedCareerRecord } from '@learncard/credential-library';
import { createClrVerificationSnapshot } from 'learn-card-base/helpers/credentials/clr/verification';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { setLocale } from '../../../paraglide/runtime.js';

const mocks = vi.hoisted(() => ({
    accept: vi.fn(),
    resolveDuplicate: vi.fn(),
    verifyOuter: vi.fn(),
    track: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: vi.fn() }) }));
vi.mock('@ionic/react', async importOriginal => ({
    ...(await importOriginal<typeof IonicReact>()),
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSpinner: () => null,
    useIonAlert: () => [vi.fn(), vi.fn()],
    IonIcon: () => null,
}));
vi.mock('@learncard/react', () => ({ getVCDisplayCardVariant: () => 'certificate' }));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ info: vi.fn(), error: vi.fn() }),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    ModalTypes: { Right: 'right' },
    useWallet: () => ({
        initWallet: async () => ({ invoke: { verifyCredential: mocks.verifyOuter } }),
        addVCtoWallet: vi.fn(),
    }),
    useDeviceTypeByWidth: () => ({ isMobile: false }),
    useGetResolvedCredential: () => ({ data: undefined }),
    useGetProfile: () => ({ data: undefined }),
    useToast: () => ({ presentToast: vi.fn() }),
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    useAcceptCredentialMutation: () => ({
        mutate: mocks.accept,
        isPending: false,
        isSuccess: false,
    }),
    CredentialCategoryEnum: { family: 'family', learningHistory: 'learningHistory' },
    BoostCategoryOptionsEnum: { learningHistory: 'learningHistory' },
    boostPreviewStore: {
        useTracked: { selectedDisplayView: () => 'issuer' },
        set: { updateSelectedDisplayView: vi.fn() },
    },
    isSkillCompetencyAlignment: () => false,
    SkillCompetencyCard: () => null,
    CertificateDisplayIcon: () => null,
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({ useIsLoggedIn: () => true }));
vi.mock('learn-card-base/stores/boostPreviewStore', () => ({
    BoostPreviewDisplayViewEnum: { Issuer: 'issuer', Default: 'default' },
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getUserHandleFromDid: () => undefined,
    getBespokeLearnCard: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useRegistry', () => ({
    useKnownDIDRegistry: () => ({ data: undefined }),
}));
vi.mock('@analytics', () => ({
    AnalyticsEvents: {},
    ProfileBuildMethod: { Notification: 'notification' },
    useAnalytics: () => ({ track: mocks.track }),
    useProfileSnapshotCapture: () => ({
        capture: vi.fn(),
        snapshotRef: { current: { credentialCount: 0 } },
    }),
    createFlowLifecycle: () => ({ id: 'claim', terminate: () => true, durationMs: () => 0 }),
    newFlowId: () => 'flow',
    ACCOUNT_CREATED_AT_KEY: 'account-created',
    SESSION_START_KEY: 'session-start',
}));
vi.mock('@learncard/render-method-plugin', () => ({
    getSvgMustacheRenderMethod: () => ({ template: 'issuer template' }),
}));
vi.mock('../../render-method/RenderMethodDisplay', () => ({
    default: () => <div>Issuer certificate preview</div>,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => <div>Generic credential preview</div>,
}));
vi.mock('../boostCMS/BoostPreview/BoostDetailsSideBar', () => ({ default: () => null }));
vi.mock('../boostCMS/BoostPreview/BoostDetailsSideMenu', () => ({ default: () => null }));
vi.mock('../boostLinkedCredentials/BoostLinkedCredentialsBox', () => ({ default: () => null }));
vi.mock('../boostLinkedCredentials/ClrAchievementsSummaryBox', () => ({ default: () => null }));
vi.mock('../../boost-endorsements/EndorsementRequestForm/ViewEndorsementRequest', () => ({
    default: () => null,
}));
vi.mock('../../credentials/duplicate-credential/useDuplicateCredentialGuard', () => ({
    useDuplicateCredentialGuard: () => ({
        isCheckingDuplicate: false,
        requestDuplicateResolution: mocks.resolveDuplicate,
        duplicateCredentialPrompt: null,
    }),
}));
vi.mock('../../boost/boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('learn-card-base/components/profilePicture/ProfilePicture', () => ({
    UserProfilePicture: () => null,
}));
vi.mock('../../clr-transcript/ClrCourseDetailPanel', () => ({ default: () => null }));
vi.mock('../../clr-transcript/ClrProgramDetailPanel', () => ({ default: () => null }));
vi.mock('../../clr-transcript/ClrAssessmentDetailPanel', () => ({ default: () => null }));
vi.mock('../../clr-transcript/ClrCompetencyDetailPanel', () => ({ default: () => null }));
// Keep the real transcript and verification presentation; isolate network verification.
vi.mock('../../clr-transcript/useClrVerification', () => ({
    useClrVerification: (model: ClrTranscriptDisplayModel) => {
        const snapshot = createClrVerificationSnapshot(model.canonical);
        const first = Object.keys(snapshot.records)[0];
        return {
            snapshot: {
                ...snapshot,
                complete: true,
                outer: { ...snapshot.outer, proof: 'verified' },
                records: first
                    ? {
                          ...snapshot.records,
                          [first]: {
                              ...snapshot.records[first],
                              proof: 'verified',
                              lifecycle: 'revoked',
                          },
                      }
                    : snapshot.records,
            },
            retry: vi.fn(),
        };
    },
}));

import BoostClaimCard from './BoostClaimCard';

const transcript = clrMixedCareerRecord.credential as VC;

beforeEach(() => {
    setLocale('en', { reload: false });
    mocks.accept.mockReset();
    mocks.verifyOuter.mockReset().mockResolvedValue([{ status: 'Success', check: 'proof' }]);
    mocks.resolveDuplicate.mockReset().mockResolvedValue({ action: 'save', isDuplicate: false });
});

describe('incoming credential preview', () => {
    it('shows the transcript and verification instead of the issuer certificate, and can accept it with a revoked child', async () => {
        render(<BoostClaimCard credential={transcript} credentialUri="urn:incoming:transcript" />);
        expect((await screen.findAllByText('Applied Systems Thinking')).length).toBeGreaterThan(0);
        expect(
            screen.getAllByText('Career Record Assembly Service (Fictional)').length
        ).toBeGreaterThan(0);
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent('Verified');
        expect(screen.queryByText('Issuer certificate preview')).not.toBeInTheDocument();
        expect(screen.getAllByText(/Revoked/i).length).toBeGreaterThan(0);

        const accept = screen.getByRole('button', { name: 'Accept' });
        await waitFor(() => expect(mocks.verifyOuter).toHaveBeenCalled());
        expect(accept).toBeEnabled();
        fireEvent.click(accept);
        await waitFor(() =>
            expect(mocks.accept).toHaveBeenCalledWith(
                { uri: 'urn:incoming:transcript', metadata: undefined },
                expect.any(Object)
            )
        );
    });

    it('keeps an ordinary credential on its issuer preview', () => {
        const credential = { ...transcript, type: ['VerifiableCredential'] } as VC;
        render(<BoostClaimCard credential={credential} />);
        expect(screen.getByText('Issuer certificate preview')).toBeInTheDocument();
        expect(screen.queryByText('Applied Systems Thinking')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
    });

    it('shows the transcript when a CLR is inside a certified boost wrapper', () => {
        const wrapper = {
            ...transcript,
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: transcript,
        } as VC;
        render(<BoostClaimCard credential={wrapper} />);
        expect(screen.getAllByText('Applied Systems Thinking').length).toBeGreaterThan(0);
        expect(screen.queryByText('Issuer certificate preview')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
    });
});
