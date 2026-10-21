import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import ClaimBoost from './ClaimBoost';

const mocks = vi.hoisted(() => ({
    addVCtoWallet: vi.fn(),
    claimBoostWithLink: vi.fn(),
    initWallet: vi.fn(),
    presentClaimSuccessToast: vi.fn(),
    presentToast: vi.fn(),
    replace: vi.fn(),
    requestDuplicateResolution: vi.fn(),
    track: vi.fn(),
    verifyCredential: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: vi.fn(), replace: mocks.replace }),
}));
vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@learncard/react', () => ({ getVCDisplayCardVariant: () => 'default' }));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSpinner: () => <div role="status">Loading</div>,
    useIonAlert: () => [vi.fn(), vi.fn()],
    useIonModal: () => [vi.fn(), vi.fn()],
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { achievement: 'Achievement', family: 'Family' },
    ModalTypes: { Right: 'right' },
    ProfilePicture: () => null,
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    boostPreviewStore: {
        set: { updateSelectedDisplayView: vi.fn() },
        useTracked: { selectedDisplayView: () => 'default' },
    },
    connectionPromptKeys: { all: ['connectionPrompts'] },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    redirectStore: { set: { lcnRedirect: vi.fn() } },
    useDeviceTypeByWidth: () => ({ isMobile: true }),
    useGetCredentialWithEdits: () => ({ credentialWithEdits: undefined }),
    useGetVCInfo: () => ({ issuerName: 'Issuer', issuerProfileImageElement: null }),
    useIsLoggedIn: () => true,
    useModal: () => ({ closeModal: vi.fn(), newModal: vi.fn() }),
    usePathQuery: () => new URLSearchParams('boostUri=lc%3Aboost%3Aone&challenge=challenge'),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({
        addVCtoWallet: mocks.addVCtoWallet,
        initWallet: mocks.initWallet,
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
    ProfileBuildMethod: { ClaimLink: 'claim_link' },
    SESSION_START_KEY: 'session-start',
    createFlowLifecycle: () => ({
        durationMs: () => 10,
        id: 'flow-id',
        terminate: vi.fn(() => true),
    }),
    newFlowId: () => 'presented-flow-id',
    useAnalytics: () => ({ track: mocks.track }),
    useProfileSnapshotCapture: () => ({
        capture: vi.fn(),
        snapshotRef: { current: { credentialCount: 0 } },
    }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => ({ name: 'Learner' }),
}));
vi.mock('../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: vi.fn().mockResolvedValue({ prompted: false }) }),
}));
vi.mock('../../hooks/useUploadVcFromText', () => ({
    useUploadVcFromText: () => ({ uploadVcFromTextAndAddToWallet: vi.fn() }),
}));
vi.mock('../../feedback/useClaimSuccessToast', () => ({
    useClaimSuccessToast: () => mocks.presentClaimSuccessToast,
}));
vi.mock('../../components/credentials/duplicate-credential/useDuplicateCredentialGuard', () => ({
    useDuplicateCredentialGuard: () => ({
        duplicateCredentialPrompt: null,
        isCheckingDuplicate: false,
        requestDuplicateResolution: mocks.requestDuplicateResolution,
    }),
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getEmojiFromDidString: () => 'I',
    getUserHandleFromDid: () => undefined,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getAchievementType: () => 'Achievement',
    getCredentialName: (credential: VC) => credential.name,
    getDefaultCategoryForCredential: () => 'Achievement',
    unwrapBoostCredential: (credential: VC) => credential,
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: { get: { networkApiUrl: () => 'https://network.example' } },
}));
vi.mock('@learncard/render-method-plugin', () => ({
    getSvgMustacheRenderMethod: () => null,
}));
vi.mock('learn-card-base/stores/boostPreviewStore', () => ({
    BoostPreviewDisplayViewEnum: { Default: 'default', Issuer: 'issuer' },
}));
vi.mock('../../paraglide/messages.js', () => ({
    'claim.boost.accepted': () => 'Accepted',
    'claim.boost.expiredHeader': () => 'Unable to claim',
    'claim.by': () => 'By',
    'claim.duplicate.skippedToast': () => 'Skipped',
    'claim.modal.credentialFallback': () => 'Credential',
    'claim.notFound.message': () => 'Not found',
    'claim.notFound.title': () => 'Not found',
    'common.accept': () => 'Accept',
    'common.loading': () => 'Loading',
    'contacts.joinBoost': () => 'Join',
    'contacts.joined': () => 'Joined',
    'contacts.joining': () => 'Joining',
    'contacts.okay': () => 'Okay',
    'toasts.credentialClaimFailed': () => 'Claim failed',
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
vi.mock('../../components/accessibility/AccessibleCredentialCard', () => ({
    default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => <div>Credential preview</div>,
}));
vi.mock('../../components/render-method/RenderMethodDisplay', () => ({ default: () => null }));
vi.mock(
    'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt',
    () => ({ default: () => null })
);
vi.mock('./ClaimBoostLoading', () => ({ default: () => null }));
vi.mock('../../components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu', () => ({
    default: () => null,
}));
vi.mock('../../components/boost/boostCMS/BoostPreview/BoostDetailsSideBar', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    default: () => null,
    getInfoFromCredential: () => ({}),
}));

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => {
        resolve = res;
    });

    return { promise, resolve };
};

const boost = {
    id: 'urn:uuid:boost',
    issuer: 'did:key:issuer',
    name: 'Safety Training',
    issuanceDate: '2026-08-20T00:00:00.000Z',
    type: ['VerifiableCredential'],
    credentialSubject: { id: 'did:key:viewer' },
} as VC;

describe('ClaimBoost connection prompt cache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requestDuplicateResolution.mockResolvedValue({ action: 'save', isDuplicate: false });
        mocks.verifyCredential.mockResolvedValue([]);
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ status: 200, json: vi.fn().mockResolvedValue(boost) })
        );
    });

    it('invalidates prompts only after the server claim and local wallet storage succeed', async () => {
        const serverClaim = deferred<string>();
        const add = deferred<boolean>();
        mocks.claimBoostWithLink.mockReturnValue(serverClaim.promise);
        mocks.addVCtoWallet.mockReturnValue(add.promise);
        mocks.initWallet.mockResolvedValue({
            invoke: {
                claimBoostWithLink: mocks.claimBoostWithLink,
                verifyCredential: mocks.verifyCredential,
            },
        });

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const promptQueryKey = ['connectionPrompts', 'pending', 'did:key:viewer'];
        queryClient.setQueryData(promptQueryKey, [{ id: 'prompt-1' }]);

        render(
            <QueryClientProvider client={queryClient}>
                <ClaimBoost />
            </QueryClientProvider>
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
        await waitFor(() => expect(mocks.claimBoostWithLink).toHaveBeenCalled());

        await act(async () => serverClaim.resolve('lc:credential:claimed'));
        await waitFor(() => {
            expect(mocks.addVCtoWallet).toHaveBeenCalledWith({
                boostUri: 'lc:boost:one',
                uri: 'lc:credential:claimed',
            });
        });
        expect(queryClient.getQueryState(promptQueryKey)?.isInvalidated).toBe(false);

        await act(async () => add.resolve(true));
        await waitFor(() => {
            expect(queryClient.getQueryState(promptQueryKey)?.isInvalidated).toBe(true);
        });
    });
});
