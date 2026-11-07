import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import CreateConsentContractModal from './CreateConsentContractModal';

const state = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
    createContract: vi.fn(),
    consent: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useModal: () => ({
        newModal: state.newModal,
        closeModal: state.closeModal,
        closeAllModals: vi.fn(),
    }),
    useWallet: () => ({
        initWallet: async () => ({ invoke: { createContract: state.createContract } }),
    }),
    useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
    useToast: () => ({ presentToast: vi.fn() }),
    useCurrentUser: () => null,
    useConfirmation: () => vi.fn(),
    useConsentToContract: () => ({ mutateAsync: state.consent }),
    useSyncConsentFlow: () => ({ refetch: vi.fn() }),
    useGetProfile: () => ({ data: undefined }),
    useSwitchProfile: () => ({}),
    useWithdrawConsent: () => ({}),
    useDeleteCredentialRecord: () => ({}),
    useGetCredentialsFromContract: () => ({ data: [] }),
    switchedProfileStore: {
        use: { isSwitchedProfile: () => false, profileType: () => 'parent' },
    },
    ModalTypes: { Center: 'center', Right: 'right', FullScreen: 'fullscreen' },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
}));
vi.mock('react-router-dom', () => ({
    useHistory: () => ({}),
    useLocation: () => ({ search: '' }),
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('../../../config/brandingAssets', () => ({
    useTenantBrandingAssets: () => ({ appIcon: '/icon.png' }),
}));
vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({ colors: { defaults: { primaryColor: 'grayscale-900' } } }),
}));
vi.mock('@analytics', () => ({
    AnalyticsEvents: {},
    useAnalytics: () => ({ track: vi.fn() }),
}));
vi.mock('../../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: async () => ({ prompted: false }) }),
}));
vi.mock('../../../hooks/useGuardianGate', () => ({
    useGuardianGate: () => ({ guardedAction: async (action: () => unknown) => action() }),
}));
vi.mock('../../consentFlow/useConsentFlow', () => ({ default: () => ({}) }));
vi.mock('../../consentFlow/useConsentAccountIdentity', () => ({
    useConsentAccountIdentity: () => ({ isLoading: false }),
}));
vi.mock('../../../helpers/contract.helpers', () => ({
    CONTRACT_CATEGORIES: [],
    getMinimumTermsForContract: () => ({
        read: { personal: {}, credentials: { categories: {} } },
        write: { personal: {}, credentials: { categories: {} } },
    }),
}));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
vi.mock('../../hidden/ContractCategoryMultiSelect', () => ({ default: () => null }));
vi.mock('../../consentFlow/ConsentFlowPrivacyAndData', () => ({ default: () => null }));
vi.mock('../../consentFlow/ContractPermissionsAndDetailsText', () => ({ default: () => null }));
vi.mock('../../consentFlow/ConsentFlowConnecting', () => ({ default: () => null }));
vi.mock('../../consentFlow/ConsentFlowGetAnAdult', () => ({ default: () => null }));
vi.mock('../../consentFlow/GameFlow/FullScreenGameFlow', () => ({ default: () => null }));
vi.mock('../../consentFlow/AiInsights/AiInsightsConsentFlowHeader', () => ({
    default: () => null,
}));
vi.mock('../../consentFlow/AiInsights/AiInsightsInlineConsentFlowRequest', () => ({
    default: () => null,
}));
vi.mock('../../../components/ai-passport-apps/AiPassportAppProfileContainer', () => ({
    default: () => null,
}));
vi.mock(
    '../../../components/ai-passport-apps/AiPassportAppProfileConnectedView/AiPassportAppProfileConnectedView',
    () => ({ default: () => null })
);

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it('previews an unsaved request without publishing and reflects edits when reopened', () => {
    render(<CreateConsentContractModal />);
    const nameInput = screen.getByPlaceholderText('Contract Name *');
    fireEvent.change(nameInput, { target: { value: 'LC-2194 QA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Contract' }));

    const preview = render(state.newModal.mock.calls[0][0]);
    expect(within(preview.container).getByText('LC-2194 QA')).toBeInTheDocument();
    const accept = within(preview.container).getByRole('button', { name: 'Accept' });
    expect(accept).toBeDisabled();
    fireEvent.click(accept);
    expect(state.createContract).not.toHaveBeenCalled();
    expect(state.consent).not.toHaveBeenCalled();

    fireEvent.click(within(preview.container).getByRole('button', { name: 'Cancel' }));
    expect(state.closeModal).toHaveBeenCalledOnce();
    preview.unmount();

    fireEvent.change(nameInput, { target: { value: 'Updated QA request' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Contract' }));
    const reopened = render(state.newModal.mock.calls[1][0]);
    expect(within(reopened.container).getByText('Updated QA request')).toBeInTheDocument();
    expect(within(reopened.container).getByRole('button', { name: 'Accept' })).toBeDisabled();
    expect(state.createContract).not.toHaveBeenCalled();
    expect(state.consent).not.toHaveBeenCalled();
});
