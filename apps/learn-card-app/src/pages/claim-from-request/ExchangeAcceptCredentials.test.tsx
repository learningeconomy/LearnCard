import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC, VP } from '@learncard/types';
import { createDeferred } from 'learn-card-base/helpers/deferred';

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
    IonIcon: ({ icon }: { icon: string }) => <span data-testid={`ion-icon-${icon}`} />,
    IonLoading: () => null,
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('ionicons/icons', () => ({
    alertCircleOutline: 'alert',
    closeCircleOutline: 'close',
    homeOutline: 'home',
    refreshOutline: 'refresh',
    timeOutline: 'time',
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
    getCredentialName: (value: VC) => value.name,
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
    'claim.accept.exists': () => 'Credential exists',
    'claim.accept.noneTitle': () => 'No credentials found',
    'claim.accept.noneSub': () => 'This link contains no credentials',
    'claim.accept.noneDesc': () => 'There are no credentials to claim',
    'claim.accept.reason1': () => 'Already claimed',
    'claim.accept.reason2': () => 'Link expired',
    'claim.accept.reason3': () => 'Removed by sender',
    'claim.accept.whatToDo': () => 'What to do',
    'claim.accept.noneHelp': () => 'Contact the sender',
    'claim.accept.goHome': () => 'Go to home',
    'claim.accept.support': () => 'Contact support',
    'claim.duplicate.skippedToast': () => 'Duplicate skipped',
    'claim.modal.credentialFallback': () => 'Credential',
    'claim.pending.title': () => 'Waiting for guardian approval',
    'claim.pending.rejectedTitle': () => 'Guardian approval declined',
    'claim.pending.rejectedSubtitle': () => 'Your guardian did not approve these credentials.',
    'claim.pending.subtitle': () => 'Some credentials need a guardian to approve them.',
    'claim.pending.awaiting.one': ({ count }: { count: number }) =>
        `${count} credential is waiting for approval.`,
    'claim.pending.awaiting.other': ({ count }: { count: number }) =>
        `${count} credentials are waiting for approval.`,
    'claim.pending.awaitingHint': () => 'Check again soon.',
    'claim.pending.rejected.one': ({ count }: { count: number }) =>
        `${count} credential was declined by a guardian.`,
    'claim.pending.rejected.other': ({ count }: { count: number }) =>
        `${count} credentials were declined by a guardian.`,
    'claim.pending.checkAgain': () => 'Check again',
    'claim.pending.checking': () => 'Checking',
    'claim.pending.checkAgainError': () => 'Could not check for updates.',
    'claim.pending.goHome': () => 'Go to home',
    'common.accept': () => 'Claim My Credential',
    'common.loading': () => 'Loading',
    'toasts.selectCredential': () => 'Select a credential',
}));
vi.mock('uuid', () => ({ v4: () => 'event-id' }));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => <div>Credential card</div>,
}));
vi.mock('../../components/accessibility/AccessibleBoostFooterLayout', () => ({
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

    it('passes the stable inbox id to storage when the claimed credential has no id', async () => {
        const idless = { ...credential };
        delete idless.id;
        mocks.requestDuplicateResolution.mockResolvedValue({ action: 'save', isDuplicate: false });
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={{ ...presentation, verifiableCredential: [idless] }}
                inboxDeliveries={[{ id: 'inbox-delivery', credential: idless }]}
                onAccept={mocks.onAccept}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Claim My Credential' }));
        await waitFor(() =>
            expect(mocks.storeAndAddVCToWallet).toHaveBeenCalledWith(
                idless,
                expect.objectContaining({ inboxDeliveryId: 'inbox-delivery' }),
                'LearnCloud',
                true
            )
        );
    });

    it('uses the compact claim loading label while checking for a saved copy', async () => {
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={presentation}
                onAccept={mocks.onAccept}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate
                sourceBoostUri={sourceBoostUri}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
            expect(screen.getByRole('status')).toHaveTextContent('Claiming Credential');
        });
        expect(screen.queryByText('Checking saved credentials')).not.toBeInTheDocument();
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
                compareByContent: true,
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
        const { promise: storeResult, resolve: resolveStore } = createDeferred<{
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
                compareByContent: true,
            });
        });
        expect(mocks.storeAndAddVCToWallet).not.toHaveBeenCalled();
        expect(mocks.onAccept).not.toHaveBeenCalled();
    });
});

describe('ExchangeAcceptCredentials guardian outcomes', () => {
    const awaiting = { id: 'awaiting-1', status: 'AWAITING_GUARDIAN' as const };
    const rejected = { id: 'rejected-1', status: 'GUARDIAN_REJECTED' as const };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.initWallet.mockResolvedValue({
            invoke: { verifyCredential: vi.fn().mockResolvedValue([]) },
        });
        mocks.storeAndAddVCToWallet.mockResolvedValue({
            result: true,
            credentialUri: 'lc:credential:new-copy',
        });
        mocks.requestDuplicateResolution.mockResolvedValue({ action: 'save', isDuplicate: false });
    });

    it('shows a pending summary instead of the empty state for a pending-only inbox response', () => {
        const onCheckAgain = vi.fn();
        const onGoHome = vi.fn();

        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={{ type: ['VerifiablePresentation'] } as VP}
                inboxClaimOutcomes={[awaiting, rejected]}
                onAccept={mocks.onAccept}
                onCheckAgain={onCheckAgain}
                onGoHome={onGoHome}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
            />
        );

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Waiting for guardian approval');
        expect(status).toHaveTextContent('1 credential is waiting for approval.');
        expect(status).toHaveTextContent('1 credential was declined by a guardian.');
        expect(screen.queryByText('No credentials found')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /check again/i }));
        fireEvent.click(screen.getByRole('button', { name: /go to home/i }));

        expect(onCheckAgain).toHaveBeenCalledTimes(1);
        expect(onGoHome).toHaveBeenCalledTimes(1);
    });

    it('keeps the genuine empty state for a legacy response with no outcomes', () => {
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={{ type: ['VerifiablePresentation'] } as VP}
                onAccept={mocks.onAccept}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
            />
        );

        expect(screen.getByText('No credentials found')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows eligible cards and the pending summary for a mixed batch', () => {
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={presentation}
                inboxClaimOutcomes={[awaiting]}
                onAccept={mocks.onAccept}
                onCheckAgain={vi.fn()}
                onGoHome={vi.fn()}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
                sourceBoostUri={sourceBoostUri}
            />
        );

        expect(screen.getByText('Credential card')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Waiting for guardian approval');
    });

    it('replaces eligible cards with the pending summary after local acceptance', async () => {
        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={presentation}
                inboxClaimOutcomes={[awaiting]}
                onAccept={mocks.onAccept}
                onCheckAgain={vi.fn()}
                onGoHome={vi.fn()}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
                sourceBoostUri={sourceBoostUri}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Claim My Credential' }));

        await waitFor(() => expect(mocks.storeAndAddVCToWallet).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(mocks.onAccept).toHaveBeenCalledWith({}, 1));

        // Accepted credentials must not be offered for a second save.
        await waitFor(() => expect(screen.queryByText('Credential card')).not.toBeInTheDocument());
        expect(screen.getByRole('status')).toHaveTextContent('Waiting for guardian approval');
    });

    it('preserves the pending summary when every selected credential is skipped as a duplicate', async () => {
        mocks.requestDuplicateResolution.mockResolvedValue({ action: 'skip', isDuplicate: true });

        render(
            <ExchangeAcceptCredentials
                verifiablePresentation={presentation}
                inboxClaimOutcomes={[awaiting]}
                onAccept={mocks.onAccept}
                onCheckAgain={vi.fn()}
                onGoHome={vi.fn()}
                requestDuplicateResolution={mocks.requestDuplicateResolution}
                isCheckingDuplicate={false}
                sourceBoostUri={sourceBoostUri}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Claim My Credential' }));

        await waitFor(() => expect(mocks.onAccept).toHaveBeenCalledWith({}, 1));
        expect(mocks.storeAndAddVCToWallet).not.toHaveBeenCalled();

        await waitFor(() => expect(screen.queryByText('Credential card')).not.toBeInTheDocument());
        expect(screen.getByRole('status')).toHaveTextContent('Waiting for guardian approval');
    });
});
