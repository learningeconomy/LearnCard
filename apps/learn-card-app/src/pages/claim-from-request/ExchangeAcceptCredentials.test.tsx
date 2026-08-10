import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC, VP } from '@learncard/types';

import ExchangeAcceptCredentials from './ExchangeAcceptCredentials';

const mocks = vi.hoisted(() => ({
    initWallet: vi.fn(),
    onAccept: vi.fn(),
    presentToast: vi.fn(),
    publishWalletEvent: vi.fn(),
    requestDuplicateResolution: vi.fn(),
    storeAndAddVCToWallet: vi.fn(),
    track: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@learncard/react', () => ({
    getVCDisplayCardVariant: () => 'default',
}));
vi.mock('@ionic/react', () => ({
    IonContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonLoading: () => null,
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('learn-card-base', () => ({
    BoostPageViewMode: { Card: 'card' },
    CredentialCategoryEnum: { achievement: 'Achievement' },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    ModalTypes: { Right: 'right' },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    useDeviceTypeByWidth: () => ({ isMobile: true }),
    useModal: () => ({ newModal: vi.fn() }),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({
        initWallet: mocks.initWallet,
        storeAndAddVCToWallet: mocks.storeAndAddVCToWallet,
    }),
}));
vi.mock('@analytics', () => ({
    ACCOUNT_CREATED_AT_KEY: 'account-created-at',
    AnalyticsEvents: {
        CLAIM_BOOST: 'claim_boost',
        CREDENTIAL_CLAIM_CANCELLED: 'credential_claim_cancelled',
        CREDENTIAL_CLAIM_FAILED: 'credential_claim_failed',
        CREDENTIAL_CLAIM_PRESENTED: 'credential_claim_presented',
        CREDENTIAL_CLAIM_STARTED: 'credential_claim_started',
        CREDENTIAL_CLAIM_SUCCEEDED: 'credential_claim_succeeded',
        PROFILE_ITEM_ADDED: 'profile_item_added',
    },
    ProfileBuildMethod: { VcApiRequest: 'vc_api_request' },
    SESSION_START_KEY: 'session-start',
    createFlowLifecycle: () => ({
        id: 'flow-id',
        durationMs: () => 10,
        terminate: () => true,
    }),
    newFlowId: () => 'presented-flow-id',
    useAnalytics: () => ({ track: mocks.track }),
    useProfileSnapshotCapture: () => ({
        capture: vi.fn(),
        snapshotRef: { current: { credentialCount: 0 } },
    }),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getAchievementType: () => 'Achievement',
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('learn-card-base/helpers/verificationPrettifier', () => ({
    prettifyVerificationItems: () => [],
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getUserHandleFromDid: () => undefined,
}));
vi.mock('../../paraglide/messages.js', () => ({
    'claim.accept.claimed': () => 'Claimed',
    'claim.accept.claiming': () => 'Claiming Credential',
    'claim.accept.failed': () => 'Unable to claim credential',
    'claim.accept.success': () => 'Credential claimed',
    'claim.duplicate.checking': () => 'Checking saved credentials',
    'claim.accept.exists': () => 'Credential exists',
    'claim.duplicate.skippedToast': () => 'Duplicate skipped',
    'common.accept': () => 'Claim My Credential',
    'common.loading': () => 'Loading',
    'toasts.selectCredential': () => 'Select a credential',
}));
vi.mock('uuid', () => ({ v4: () => 'event-id' }));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => <div>Credential card</div>,
}));
vi.mock('learn-card-base/components/boost/boostFooter/BoostFooterLayout', () => ({
    default: ({
        children,
        footerProps,
    }: React.PropsWithChildren<{
        footerProps: {
            claimBtnText: string;
            disableClaimButton: boolean;
            handleClaim: () => void;
        };
    }>) => (
        <div>
            {children}
            <button onClick={footerProps.handleClaim} disabled={footerProps.disableClaimButton}>
                {footerProps.claimBtnText}
            </button>
        </div>
    ),
}));
vi.mock('../../components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu', () => ({
    default: () => null,
}));
vi.mock('../../components/boost/boostCMS/BoostPreview/BoostDetailsSideBar', () => ({
    default: () => null,
}));
vi.mock('../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    BoostEarnedCard: () => null,
}));
vi.mock('../pathways/events/walletEventBus', () => ({
    publishWalletEvent: mocks.publishWalletEvent,
}));

const sourceBoostUri = 'lc:network:localhost%3A4000/trpc:boost:boost-id';

const credential = {
    id: 'urn:uuid:issued-instance',
    issuer: 'did:key:issuer',
    name: 'Safety Training',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
} as VC;

const presentation = {
    type: ['VerifiablePresentation'],
    verifiableCredential: [credential],
} as VP;

describe('ExchangeAcceptCredentials duplicate handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.initWallet.mockResolvedValue({
            invoke: { verifyCredential: vi.fn().mockResolvedValue([]) },
        });
        mocks.requestDuplicateResolution.mockResolvedValue({
            action: 'skip',
            isDuplicate: true,
        });
        mocks.storeAndAddVCToWallet.mockResolvedValue({
            result: true,
            credentialUri: 'lc:credential:new-copy',
        });
    });

    it('checks the credential and skips wallet storage when the learner skips a duplicate', async () => {
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={presentation}
                onAccept={mocks.onAccept}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
                sourceBoostUri={sourceBoostUri}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Claim My Credential' }));

        await waitFor(() => {
            expect(mocks.requestDuplicateResolution).toHaveBeenCalledWith(credential, {
                boostUri: sourceBoostUri,
            });
        });
        expect(mocks.storeAndAddVCToWallet).not.toHaveBeenCalled();
        expect(mocks.onAccept).toHaveBeenCalledWith({}, 1);
    });

    it('stores another copy with a unique wallet index ID when the learner chooses save', async () => {
        mocks.requestDuplicateResolution.mockResolvedValue({
            action: 'save',
            isDuplicate: true,
        });
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={presentation}
                onAccept={mocks.onAccept}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
                sourceBoostUri={sourceBoostUri}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Claim My Credential' }));

        await waitFor(() => {
            expect(mocks.storeAndAddVCToWallet).toHaveBeenCalledWith(
                credential,
                { title: 'Safety Training', allowDuplicate: true, boostUri: sourceBoostUri },
                'LearnCloud',
                true
            );
        });
        expect(mocks.onAccept).toHaveBeenCalledWith({}, 1);
    });

    it('removes the inline claim overlay when exchange completion unmounts the claim screen', async () => {
        const { promise: storeResult, resolve: resolveStore } = Promise.withResolvers<{
            result: boolean;
            credentialUri: string;
        }>();
        mocks.requestDuplicateResolution.mockResolvedValue({
            action: 'save',
            isDuplicate: false,
        });
        mocks.storeAndAddVCToWallet.mockReturnValue(storeResult);

        const Harness = () => {
            const [complete, setComplete] = React.useState(false);
            return complete ? (
                <div>Exchange complete</div>
            ) : (
                <ExchangeAcceptCredentials
                    verifiablePresentation={presentation}
                    onAccept={() => setComplete(true)}
                    requestDuplicateResolution={mocks.requestDuplicateResolution}
                    isCheckingDuplicate={false}
                    sourceBoostUri={sourceBoostUri}
                />
            );
        };

        render(<Harness />);
        fireEvent.click(screen.getByRole('button', { name: 'Claim My Credential' }));

        expect(await screen.findByRole('status')).toHaveTextContent('Claiming Credential');

        await act(async () => {
            resolveStore({ result: true, credentialUri: 'lc:credential:stored' });
        });

        expect(await screen.findByText('Exchange complete')).toBeVisible();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('does not store or complete the exchange when the learner cancels', async () => {
        mocks.requestDuplicateResolution.mockResolvedValue({
            action: 'cancel',
            isDuplicate: true,
        });
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={presentation}
                onAccept={mocks.onAccept}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
                sourceBoostUri={sourceBoostUri}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Claim My Credential' }));

        await waitFor(() => {
            expect(mocks.requestDuplicateResolution).toHaveBeenCalledWith(credential, {
                boostUri: sourceBoostUri,
            });
        });
        expect(mocks.storeAndAddVCToWallet).not.toHaveBeenCalled();
        expect(mocks.onAccept).not.toHaveBeenCalled();
    });
});
