import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useConsentToContract } from 'learn-card-base/hooks/useConsentToContract';
import FullScreenConsentFlow from './FullScreenConsentFlow';
import { ContractRequest } from '../../components/contract-requests/ContractRequest';
import type { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

const state = vi.hoisted(() => ({
    consent: vi.fn(),
    upload: vi.fn(),
    modal: vi.fn(),
    toast: vi.fn(),
    success: vi.fn(),
    referralModal: vi.fn(),
    closeToken: vi.fn(),
    getStatus: vi.fn(),
    guardian: vi.fn(),
    enabled: true,
    tenantEnabled: true,
    request: {
        requestId: 'req-smart-resume',
        status: 'pending',
        requestedBy: 'referrer',
        readStatus: 'seen',
    },
    expiresAt: '',
}));
const contract = {
    uri: 'lc:smart-resume',
    name: 'SmartResume',
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    owner: {
        did: 'did:example:owner',
        profileId: 'owner',
        displayName: 'Owner',
        shortBio: '',
        bio: '',
    },
    contract: {
        read: {
            personal: { name: { required: true }, email: { required: false } },
            credentials: { categories: { Achievement: { required: false } } },
        },
        write: { personal: {}, credentials: { categories: {} } },
    },
} satisfies ConsentFlowContractDetails;
const wallet = {
    id: { did: () => 'did:example:learner' },
    invoke: {
        getContract: async () => ({ ...contract, expiresAt: state.expiresAt }),
        consentToContract: state.consent,
        getRequestStatusForProfile: state.getStatus,
    },
    index: {
        LearnCloud: { get: async () => [{ id: 'record', uri: 'lc:original' }], update: vi.fn() },
    },
    read: { get: async () => ({ id: 'credential' }) },
    store: { LearnCloud: { uploadEncrypted: state.upload } },
};
vi.mock('learn-card-base', async () => ({
    ...(await import('learn-card-base/helpers/consentErrors')),
    useConsentToContract: (...args: Parameters<typeof useConsentToContract>) =>
        useConsentToContract(...args),
    useWallet: () => ({ initWallet: async () => wallet }),
    useCurrentUser: () => ({ name: 'Learner' }),
    useModal: () => ({
        newModal: state.modal,
        newModalWithToken: state.referralModal,
        forceCloseModalByToken: state.closeToken,
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
    }),
    useToast: () => ({ presentToast: state.toast }),
    useSyncConsentFlow: () => ({ refetch: vi.fn() }),
    useGetProfile: () => ({ data: { profileId: 'referrer', displayName: 'Hire Heroes USA' } }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: { profileId: 'learner' } }),
    useAllContractRequestsForProfile: () => ({ data: [], isPending: false, isError: false }),
    useFeatureConfig: () => ({ contractRequests: state.tenantEnabled }),
    contractCategoryNameToCategoryMetadata: (key: string) => ({ title: key }),
    useSwitchProfile: () => ({}),
    useConfirmation: () => vi.fn(),
    useWithdrawConsent: () => ({}),
    useDeleteCredentialRecord: () => ({}),
    useGetCredentialsFromContract: () => ({ data: [] }),
    switchedProfileStore: {
        use: { isSwitchedProfile: () => false, profileType: () => 'parent' },
        get: { switchedDid: () => undefined },
    },
    ModalTypes: { Right: 'right', FullScreen: 'fullscreen' },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('learn-card-base/components/modals/useModal', () => ({
    useModal: () => ({ newModal: state.modal, closeModal: vi.fn() }),
}));
vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => ({ enableContractRequests: state.enabled }),
}));
vi.mock('react-router-dom', () => ({
    useHistory: () => ({}),
    useLocation: () => ({ search: '?recipientToken=synthetic-token' }),
}));
vi.mock('@analytics', () => ({ AnalyticsEvents: {}, useAnalytics: () => ({ track: vi.fn() }) }));
vi.mock('../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: async () => ({ prompted: false }) }),
}));
vi.mock('../../hooks/useGuardianGate', () => ({
    useGuardianGate: () => ({ guardedAction: state.guardian }),
}));
vi.mock('./useConsentFlow', () => ({ default: () => ({}) }));
vi.mock('./useConsentAccountIdentity', () => ({
    useConsentAccountIdentity: () => ({
        displayName: 'Learner',
        image: undefined,
        profileId: 'learner',
        isLoading: false,
    }),
}));
vi.mock('../../helpers/contract.helpers', () => ({
    getMinimumTermsForContract: () => ({
        read: {
            personal: { name: 'Alex', email: 'alex@example.test' },
            credentials: {
                categories: { Achievement: { sharing: true, shared: ['lc:original'] } },
            },
        },
        write: { personal: {}, credentials: { categories: {} } },
    }),
}));
vi.mock('./ConsentFlowHeader', () => ({ default: () => null }));
vi.mock('./ContractPermissionsAndDetailsText', () => ({ default: () => null }));
vi.mock('./AiInsights/AiInsightsConsentFlowHeader', () => ({ default: () => null }));
vi.mock('./AiInsights/AiInsightsInlineConsentFlowRequest', () => ({ default: () => null }));
vi.mock('../../components/ai-passport-apps/AiPassportAppProfileContainer', () => ({
    default: () => null,
}));
vi.mock(
    '../../components/ai-passport-apps/AiPassportAppProfileConnectedView/AiPassportAppProfileConnectedView',
    () => ({ default: () => null })
);
vi.mock('./ConsentFlowGetAnAdult', () => ({ default: () => null }));
vi.mock('./ConsentFlowConnecting', () => ({ default: () => <div>Sending</div> }));
vi.mock('./ConsentFlowFooter', () => ({
    default: ({ onActionButtonClick }: { onActionButtonClick: () => void }) => (
        <button onClick={onActionButtonClick}>Confirm choices</button>
    ),
}));
vi.mock('./ConsentFlowPrivacyAndData', () => ({
    default: ({ setTerms }: { setTerms: (updater: (terms: ConsentFlowTerms) => void) => void }) => (
        <button
            onClick={() =>
                setTerms(terms => {
                    delete terms.read.personal.email;
                })
            }
        >
            Do not send email
        </button>
    ),
}));
let client: QueryClient;
beforeEach(() => {
    vi.clearAllMocks();
    state.enabled = true;
    state.tenantEnabled = true;
    state.request.requestId = 'req-smart-resume';
    state.request.status = 'pending';
    state.expiresAt = '';
    state.guardian.mockReset().mockImplementation(async (action: () => unknown) => action());
    state.getStatus.mockReset().mockImplementation(async () => ({ ...state.request }));
    state.referralModal.mockReturnValue({ id: 1, generation: 0 });
    state.consent.mockReset();
    client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    state.upload.mockResolvedValue('lc:encrypted-copy');
    state.consent
        .mockRejectedValueOnce(
            Object.assign(new Error('Upload failed'), { data: { code: 'BAD_GATEWAY' } })
        )
        .mockResolvedValue({ redirectUrl: '' });
});
afterEach(() => {
    cleanup();
    client.clear();
});
it.each([false, true])(
    'retries a customized decision with the same encrypted submission (intermediate network failure: %s)',
    async transientFailure => {
        if (transientFailure) {
            state.consent
                .mockReset()
                .mockRejectedValueOnce(
                    Object.assign(new Error('Upload failed'), { data: { code: 'BAD_GATEWAY' } })
                )
                .mockRejectedValueOnce(new TypeError('Failed to fetch'))
                .mockResolvedValue({ redirectUrl: '' });
        }
        render(
            <QueryClientProvider client={client}>
                <FullScreenConsentFlow
                    contractDetails={contract}
                    disableRedirect
                    successCallback={state.success}
                />
            </QueryClientProvider>
        );
        // Confirmation and its selection state are real; only its editor/footer are synthetic.
        fireEvent.click(screen.getByRole('button', { name: 'Privacy & Data' }));
        const editor = render(state.modal.mock.calls[0][0]);
        fireEvent.click(screen.getByRole('button', { name: 'Do not send email' }));
        editor.unmount();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm choices' }));
        await screen.findByText(
            'Your sharing choices are saved. Try again to finish sending them.'
        );
        const accepted = structuredClone(state.consent.mock.calls[0]);
        expect(accepted[1].terms.read.personal).toEqual({ name: 'Alex' });
        expect(accepted[1].terms.read.credentials.categories.Achievement.shared).toEqual([
            'lc:encrypted-copy',
        ]);
        expect(state.success).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        if (transientFailure) {
            await waitFor(() => expect(state.consent).toHaveBeenCalledTimes(2));
            await screen.findByText(
                'Your sharing choices are saved. Try again to finish sending them.'
            );
            expect(state.success).not.toHaveBeenCalled();
            expect(state.consent.mock.calls[1]).toEqual(accepted);
            fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        }
        await waitFor(() => expect(state.success).toHaveBeenCalledOnce());
        expect(state.consent.mock.calls[1]).toEqual(accepted);
        if (transientFailure) expect(state.consent.mock.calls[2]).toEqual(accepted);
        expect(state.upload).toHaveBeenCalledOnce();
    }
);

const openFailedReferralPublication = async () => {
    state.consent
        .mockReset()
        .mockImplementationOnce(async () => {
            state.request.status = 'accepted';
            throw Object.assign(new Error('Upload failed'), { data: { code: 'BAD_GATEWAY' } });
        })
        .mockResolvedValue({ redirectUrl: '' });
    const card = render(
        <QueryClientProvider client={client}>
            <ContractRequest contractUri={contract.uri} requestId="req-smart-resume" />
        </QueryClientProvider>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Accept & Connect' }));
    await waitFor(() => expect(state.referralModal).toHaveBeenCalledOnce());
    const saved = state.referralModal.mock.calls[0][0];
    card.unmount();
    const review = render(<QueryClientProvider client={client}>{saved}</QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Privacy & Data' }));
    const editor = render(state.modal.mock.calls.at(-1)![0]);
    fireEvent.click(screen.getByRole('button', { name: 'Do not send email' }));
    editor.unmount();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm choices' }));
    await screen.findByText('Your sharing choices are saved. Try again to finish sending them.');
    const accepted = structuredClone(state.consent.mock.calls[0]);
    expect(accepted[1].expectedRequestId).toBe('req-smart-resume');
    expect(accepted[1].terms.read.personal).toEqual({ name: 'Alex' });
    expect(state.request.status).toBe('accepted');
    return {
        accepted,
        update: () =>
            review.rerender(
                <QueryClientProvider client={client}>
                    {React.cloneElement(saved)}
                </QueryClientProvider>
            ),
    };
};

it('retries the same accepted invitation through ContractRequest and its saved consent modal', async () => {
    const { accepted } = await openFailedReferralPublication();
    const approvals = state.guardian.mock.calls.length;
    state.consent.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    await waitFor(() => expect(state.consent).toHaveBeenCalledTimes(2));
    await screen.findByText('Your sharing choices are saved. Try again to finish sending them.');
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    await waitFor(() => expect(state.consent).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull());
    expect(state.consent.mock.calls[1]).toEqual(accepted);
    expect(state.consent.mock.calls[2]).toEqual(accepted);
    expect(state.upload).toHaveBeenCalledOnce();
    expect(state.guardian.mock.calls.length).toBeGreaterThan(approvals);
});

it.each(['replacement', 'pending', 'expired', 'guardian'] as const)(
    'blocks publication retry on %s invalidation',
    async invalidation => {
        await openFailedReferralPublication();
        if (invalidation === 'replacement') state.request.requestId = 'replacement-request';
        if (invalidation === 'pending') state.request.status = 'pending';
        if (invalidation === 'expired') state.expiresAt = '2020-01-01T00:00:00.000Z';
        if (invalidation === 'guardian')
            state.guardian.mockRejectedValueOnce(new Error('Guardian declined'));
        const errors = state.toast.mock.calls.length;
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        await waitFor(() => expect(state.toast.mock.calls.length).toBeGreaterThan(errors));
        expect(state.consent).toHaveBeenCalledOnce();
        expect(state.upload).toHaveBeenCalledOnce();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeVisible();
    }
);

it.each(['enabled', 'tenantEnabled'] as const)(
    'blocks an accepted-publication retry when %s changes during request validation',
    async gate => {
        const review = await openFailedReferralPublication();
        let finish!: (value: typeof state.request) => void;
        state.getStatus.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    finish = resolve;
                })
        );
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        await waitFor(() => expect(finish).toBeDefined());
        state[gate] = false;
        review.update();
        finish({ ...state.request });
        await waitFor(() =>
            expect(state.closeToken).toHaveBeenCalledExactlyOnceWith({ id: 1, generation: 0 })
        );
        await waitFor(() => expect(state.toast).toHaveBeenCalledTimes(2));
        expect(state.consent).toHaveBeenCalledOnce();
        expect(state.upload).toHaveBeenCalledOnce();
    }
);
