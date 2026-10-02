import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useConsentToContract } from 'learn-card-base/hooks/useConsentToContract';
import FullScreenConsentFlow from './FullScreenConsentFlow';
import type { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

const state = vi.hoisted(() => ({
    consent: vi.fn(),
    upload: vi.fn(),
    modal: vi.fn(),
    toast: vi.fn(),
    success: vi.fn(),
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
    invoke: { getContract: async () => contract, consentToContract: state.consent },
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
    useModal: () => ({ newModal: state.modal, closeModal: vi.fn(), closeAllModals: vi.fn() }),
    useToast: () => ({ presentToast: state.toast }),
    useSyncConsentFlow: () => ({ refetch: vi.fn() }),
    useGetProfile: () => ({}),
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
vi.mock('react-router-dom', () => ({
    useHistory: () => ({}),
    useLocation: () => ({ search: '?recipientToken=synthetic-token' }),
}));
vi.mock('@analytics', () => ({ AnalyticsEvents: {}, useAnalytics: () => ({ track: vi.fn() }) }));
vi.mock('../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: async () => ({ prompted: false }) }),
}));
vi.mock('../../hooks/useGuardianGate', () => ({
    useGuardianGate: () => ({ guardedAction: async (action: () => unknown) => action() }),
}));
vi.mock('./useConsentFlow', () => ({ default: () => ({}) }));
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
it('retries a customized decision from real confirmation state with exactly the accepted encrypted submission', async () => {
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
    await screen.findByText('Your sharing choices are saved. Try again to finish sending them.');
    const accepted = structuredClone(state.consent.mock.calls[0]);
    expect(accepted[1].terms.read.personal).toEqual({ name: 'Alex' });
    expect(accepted[1].terms.read.credentials.categories.Achievement.shared).toEqual([
        'lc:encrypted-copy',
    ]);
    expect(state.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    await waitFor(() => expect(state.success).toHaveBeenCalledOnce());
    expect(state.consent.mock.calls[1]).toEqual(accepted);
    expect(state.upload).toHaveBeenCalledOnce();
});
