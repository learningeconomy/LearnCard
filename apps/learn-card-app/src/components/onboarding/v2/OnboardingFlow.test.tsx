import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingFlow from './OnboardingFlow';
import * as m from '../../../paraglide/messages.js';

const mocks = vi.hoisted(() => ({
    loginType: 'apple',
    authName: '',
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    updateCurrentUser: vi.fn(),
    setCurrentUser: vi.fn(),
    track: vi.fn(),
    refetch: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useSignInAdapter: () => ({
        getCurrentUser: () => ({ displayName: mocks.authName }),
        updateProfile: mocks.updateProfile,
    }),
    authStore: { use: { typeOfLogin: () => mocks.loginType } },
    SocialLoginTypes: { apple: 'apple' },
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                createProfile: mocks.createProfile,
                resetLCAClient: vi.fn(),
            },
        }),
    }),
    useGetProfile: () => ({ data: null, isFetching: false }),
    useGetCurrentLCNUser: () => ({ refetch: mocks.refetch }),
    useIsCurrentUserLCNUser: () => ({ refetch: mocks.refetch }),
    getNotificationsEndpoint: () => 'https://example.com/notifications',
    useUpdatePreferences: () => ({ mutateAsync: async () => undefined }),
    useSQLiteStorage: () => ({ updateCurrentUser: mocks.updateCurrentUser }),
    currentUserStore: { set: { currentUser: mocks.setCurrentUser } },
    ModalTypes: {},
    useDeviceTypeByWidth: () => ({ isDesktop: false }),
    useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    Toggle: () => null,
    getSSSConfig: () => ({ escrowEnclaveMode: 'off' }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => ({ uid: 'user-1', privateKey: 'test-key' }),
}));
vi.mock('learn-card-base/helpers/authHelpers', () => ({ getAuthToken: () => 'test-token' }));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({ getSigningLearnCard: vi.fn() }));
vi.mock('learn-card-base/stores/redirectStore', () => ({
    default: { set: { isOnboardingOpen: vi.fn() } },
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('../../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({ state: { status: 'ready' } }),
}));
vi.mock('@learncard/sss-key-manager', () => ({ generateEd25519PrivateKey: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ resetQueries: vi.fn() }) }));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: vi.fn() }) }));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
vi.mock('../../../hooks/useLogout', () => ({ default: () => ({ handleLogout: vi.fn() }) }));
vi.mock('../../../hooks/useAutoConsentLearnCardAi', () => ({
    default: () => ({ autoConsentLearnCardAi: vi.fn() }),
}));
vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: mocks.track }),
    AnalyticsEvents: {},
    NEW_SIGNUP_FLAG_KEY: 'new-signup',
    ONBOARDING_STARTED_AT_KEY: 'onboarding-start',
    LAST_LOGIN_METHOD_KEY: 'login-method',
    newFlowId: () => 'test-flow',
    createFlowLifecycle: () => ({ terminate: () => true }),
    getOrCreateSignupFlow: () => ({ flowId: 'test-flow', startedAtMs: Date.now(), isNew: false }),
    clearSignupFlow: vi.fn(),
}));
vi.mock('./countryInference', () => ({ inferCountryCode: () => 'US' }));
vi.mock('./BirthdayPicker', () => ({
    default: ({ onChange }: { onChange: (value: string) => void }) => (
        <button onClick={() => onChange('1990-01-01')}>Set birthday</button>
    ),
}));
vi.mock('./RecoveryPinStep', () => ({ RecoveryPinStep: () => null }));
vi.mock('../onboardingNetworkForm/components/CountrySelectorModal', () => ({
    default: () => null,
}));
vi.mock('../onboardingNetworkForm/components/UnderageModalContent', () => ({
    default: () => null,
}));
vi.mock('../GuardianLinkedModal', () => ({ default: () => null }));
vi.mock('../../../pages/issue/components/Confetti', () => ({ Confetti: () => null }));

const openProfile = async (): Promise<void> => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText('Set birthday'));
    fireEvent.click(screen.getByRole('button', { name: m['onboarding.v2.continue']() }));
    await screen.findByLabelText(/Full Name/);
};
const createButton = (): HTMLElement =>
    screen.getByRole('button', {
        name: m['onboarding.v2.createMy']({ brand: 'LearnCard' }),
    });

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.loginType = 'apple';
    mocks.authName = '';
    mocks.createProfile.mockResolvedValue('did:web:example.com');
});

describe('Apple profile onboarding', () => {
    it('creates a profile with no name or email entry using the generated public handle', async () => {
        await openProfile();
        expect(screen.getByLabelText('Full Name (optional)')).not.toBeRequired();
        expect(screen.queryByRole('textbox', { name: /email/i })).not.toBeInTheDocument();
        const handle = screen.getByLabelText(m['onboarding.v2.publicHandle']()) as HTMLInputElement;
        expect(handle.value).toMatch(/^learner-[a-z0-9]{4}$/);
        await waitFor(() => expect(createButton()).toBeEnabled());
        fireEvent.click(createButton());
        await waitFor(() =>
            expect(mocks.createProfile).toHaveBeenCalledWith(
                expect.objectContaining({ profileId: handle.value, displayName: handle.value })
            )
        );
        await waitFor(() =>
            expect(mocks.updateCurrentUser).toHaveBeenCalledWith(
                'user-1',
                expect.objectContaining({ name: handle.value })
            )
        );
    });

    it('prefills the Apple name but lets the user clear it and choose a handle', async () => {
        mocks.authName = 'Apple User';
        await openProfile();
        const name = screen.getByLabelText('Full Name (optional)');
        expect(name).toHaveValue('Apple User');
        fireEvent.change(name, { target: { value: '' } });
        fireEvent.change(screen.getByLabelText(m['onboarding.v2.publicHandle']()), {
            target: { value: 'chosen-handle' },
        });
        await waitFor(() => expect(createButton()).toBeEnabled());
        expect(name).toHaveValue('');
        fireEvent.click(createButton());
        await waitFor(() =>
            expect(mocks.createProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    profileId: 'chosen-handle',
                    displayName: 'chosen-handle',
                })
            )
        );
    });

    it.each(['google', 'email', 'sms'])('still requires a name for %s sign-in', async loginType => {
        mocks.loginType = loginType;
        await openProfile();
        const name = screen.getByLabelText('Full Name');
        expect(name).toBeRequired();
        fireEvent.change(screen.getByLabelText(m['onboarding.v2.publicHandle']()), {
            target: { value: 'chosen-handle' },
        });
        expect(createButton()).toBeDisabled();
        fireEvent.change(name, { target: { value: '   ' } });
        expect(createButton()).toBeDisabled();
        fireEvent.change(name, { target: { value: 'New User' } });
        await waitFor(() => expect(createButton()).toBeEnabled());
    });
});
