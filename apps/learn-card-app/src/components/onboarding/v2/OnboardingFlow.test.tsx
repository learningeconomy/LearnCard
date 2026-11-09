import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingFlow from './OnboardingFlow';
import * as m from '../../../paraglide/messages.js';
import {
    setClassLinkDisplayName,
    clearClassLinkDisplayName,
    getClassLinkDisplayName,
} from '../../../auth/classlink/classlinkDisplayName';

const mocks = vi.hoisted(() => ({
    loginType: 'apple',
    authName: '',
    localName: '',
    occupiedHandle: '',
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    updateCurrentUser: vi.fn(),
    setCurrentUser: vi.fn(),
    track: vi.fn(),
    refetch: vi.fn(),
    transcriptsGetStatus: vi.fn(),
    requestTranscript: vi.fn(),
    isClassLinkStudent: false,
    transcriptFlag: false,
    updatePreferences: vi.fn(),
}));
const stableAdapter = vi.hoisted(() => ({
    getCurrentUser: () => ({ displayName: mocks.authName }),
    updateProfile: mocks.updateProfile,
}));
vi.mock('learn-card-base', () => ({
    useSignInAdapter: () => stableAdapter,
    authUserStore: { use: { currentUser: () => ({ displayName: mocks.authName }) } },
    authStore: { use: { typeOfLogin: () => mocks.loginType } },
    SocialLoginTypes: { apple: 'apple', classlink: 'classlink' },
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                createProfile: mocks.createProfile,
                resetLCAClient: vi.fn(),
                transcriptsGetStatus: mocks.transcriptsGetStatus,
            },
        }),
    }),
    useGetProfile: (profileId: string) => ({
        data: mocks.occupiedHandle && profileId === mocks.occupiedHandle ? {} : null,
        isFetching: false,
    }),
    useGetCurrentLCNUser: () => ({ refetch: mocks.refetch }),
    useIsCurrentUserLCNUser: () => ({ refetch: mocks.refetch }),
    getNotificationsEndpoint: () => 'https://example.com/notifications',
    useUpdatePreferences: () => ({ mutateAsync: mocks.updatePreferences }),
    useSQLiteStorage: () => ({ updateCurrentUser: mocks.updateCurrentUser }),
    currentUserStore: { set: { currentUser: mocks.setCurrentUser } },
    ModalTypes: {},
    useDeviceTypeByWidth: () => ({ isDesktop: false }),
    useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    Toggle: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input type="checkbox" {...props} />
    ),
    getSSSConfig: () => ({ escrowEnclaveMode: 'off' }),
    useRequestTranscript: () => ({ mutateAsync: mocks.requestTranscript, isPending: false }),
    useTranscriptStatus: () => ({ data: { eligible: true, stateDisplayName: 'Example' } }),
    useFeatureConfig: () => ({ classlinkTranscriptOptIn: mocks.transcriptFlag }),
    Checkbox: ({
        checked,
        onChange,
        label,
    }: {
        checked: boolean;
        onChange: (value: boolean) => void;
        label: string;
    }) => (
        <input
            type="checkbox"
            aria-label={label}
            checked={checked}
            onChange={event => onChange(event.target.checked)}
        />
    ),
}));
vi.mock('../../../auth/classlink/classlinkProfileDefaults', () => ({
    getClassLinkProfileDefaults: async () => ({}),
    isClassLinkStudentSession: async () => mocks.isClassLinkStudent,
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => ({ uid: 'user-1', privateKey: 'test-key', name: mocks.localName }),
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
vi.mock('../../../hooks/useTranscriptArrival', () => ({
    useTranscriptArrival: () => ({ isPollingExhausted: false }),
}));
vi.mock('../../../hooks/useReceivedTranscript', () => ({
    useReceivedTranscript: () => ({ entry: undefined, model: null }),
}));
vi.mock('../../boost/boost-earned-card/BoostEarnedCard', () => ({ default: () => null }));
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

const openProfile = async (): Promise<ReturnType<typeof render>> => {
    const view = render(<OnboardingFlow />);
    fireEvent.click(screen.getByText('Set birthday'));
    fireEvent.click(screen.getByRole('button', { name: m['onboarding.v2.continue']() }));
    await screen.findByLabelText(/Full Name/);
    return view;
};
const createButton = (): HTMLElement =>
    screen.getByRole('button', {
        name: m['onboarding.v2.createMy']({ brand: 'LearnCard' }),
    });

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    clearClassLinkDisplayName();
    localStorage.clear();
    mocks.loginType = 'apple';
    mocks.authName = '';
    mocks.localName = '';
    mocks.occupiedHandle = '';
    mocks.createProfile.mockResolvedValue('did:web:example.com');
    mocks.isClassLinkStudent = false;
    mocks.transcriptFlag = false;
    mocks.transcriptsGetStatus.mockResolvedValue({
        eligible: true,
        stateDisplayName: 'Example State',
        issuerDid: 'did:web:issuer.example.com',
    });
    mocks.requestTranscript.mockResolvedValue({ status: 'requested' });
    mocks.updatePreferences.mockReset().mockResolvedValue(true);
});

describe('Apple profile onboarding', () => {
    it('keeps ClassLink collision replacements anonymous after editing the name', async () => {
        mocks.loginType = 'classlink';
        setClassLinkDisplayName('Example Learner');
        const view = await openProfile();
        const handle = screen.getByLabelText(m['onboarding.v2.publicHandle']()) as HTMLInputElement;
        mocks.occupiedHandle = handle.value;
        view.rerender(<OnboardingFlow />);
        await waitFor(() => expect(handle.value).not.toBe(mocks.occupiedHandle));
        const replacement = handle.value;
        expect(replacement).toMatch(/^learner-[a-z0-9]{4}$/);
        fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Other Person' } });
        await new Promise(resolve => setTimeout(resolve, 450));
        expect(handle.value).toBe(replacement);
    });
    it('keeps ClassLink names editable but never uses them as public identifiers', async () => {
        mocks.loginType = 'classlink';
        mocks.authName = 'Legacy Name';
        setClassLinkDisplayName('Example Learner');
        await openProfile();
        const name = screen.getByLabelText(/Full Name/);
        expect(name).toHaveValue('Example Learner');
        expect(
            screen.getByText('Only people you connect with can see your name.')
        ).toBeInTheDocument();
        const handle = screen.getByLabelText(m['onboarding.v2.publicHandle']()) as HTMLInputElement;
        const original = handle.value;
        expect(original).toMatch(/^learner-[a-z0-9]{4}$/);
        expect(handle).toHaveAttribute('readonly');
        fireEvent.change(name, { target: { value: 'Changed Person' } });
        fireEvent.change(handle, { target: { value: 'changed-person' } });
        await waitFor(() => expect(createButton()).toBeEnabled());
        expect(handle.value).toBe(original);
        fireEvent.click(createButton());
        await waitFor(() =>
            expect(mocks.createProfile).toHaveBeenCalledWith(
                expect.objectContaining({ profileId: original, displayName: 'Changed Person' })
            )
        );
        await waitFor(() => expect(getClassLinkDisplayName()).toBe(''));
        for (const [profile] of mocks.updateProfile.mock.calls) {
            expect(profile).not.toHaveProperty('displayName');
        }
    });

    it('does not fall back to a persisted name for ClassLink', async () => {
        mocks.loginType = 'classlink';
        mocks.authName = 'Legacy Name';
        mocks.localName = 'Cached Name';
        await openProfile();
        expect(screen.getByLabelText(/Full Name/)).toHaveValue('');
    });
    it('preserves AI and bug-report opt-outs after an unavailable analytics authority', async () => {
        mocks.updatePreferences.mockRejectedValueOnce({ data: { code: 'SERVICE_UNAVAILABLE' } });
        await openProfile();
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: m['onboarding.v2.brandAi']({ brand: 'LearnCard' }),
            })
        );
        fireEvent.click(screen.getByRole('checkbox', { name: m['onboarding.v2.bugReports']() }));
        await waitFor(() => expect(createButton()).toBeEnabled());
        fireEvent.click(createButton());
        await waitFor(() => expect(mocks.updatePreferences).toHaveBeenCalledTimes(2));
        expect(mocks.updatePreferences.mock.calls[0][0]).toMatchObject({
            analyticsEnabled: true,
            aiEnabled: false,
            bugReportsEnabled: false,
        });
        const retry = mocks.updatePreferences.mock.calls[1][0];
        expect(retry).toMatchObject({ aiEnabled: false, bugReportsEnabled: false });
        expect(retry).not.toHaveProperty('analyticsEnabled');
    });

    it.each(['SERVICE_UNAVAILABLE', 'UNAUTHORIZED'])(
        'does not loop when preference persistence fails with %s',
        async code => {
            mocks.updatePreferences.mockRejectedValue({ data: { code } });
            await openProfile();
            await waitFor(() => expect(createButton()).toBeEnabled());
            fireEvent.click(createButton());
            await waitFor(() => expect(mocks.updateCurrentUser).toHaveBeenCalled());
            expect(mocks.updatePreferences).toHaveBeenCalledTimes(
                code === 'SERVICE_UNAVAILABLE' ? 2 : 1
            );
        }
    );

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

    it('prefers the live Apple name over a stale local name', async () => {
        mocks.authName = 'Live Apple Name';
        mocks.localName = 'Stale Local Name';
        await openProfile();
        expect(screen.getByLabelText(/Full Name/)).toHaveValue('Live Apple Name');
    });

    it.each(['', 'Stale Local Name'])(
        'uses late Apple enrichment instead of the initial name %j',
        async localName => {
            mocks.loginType = 'google';
            mocks.localName = localName;
            const view = await openProfile();
            mocks.authName = 'Late Apple Name';
            mocks.loginType = 'apple';
            view.rerender(<OnboardingFlow />);
            expect(screen.getByLabelText(/Full Name/)).toHaveValue('Late Apple Name');
            await waitFor(() => expect(createButton()).toBeEnabled());
            fireEvent.click(createButton());
            await waitFor(() =>
                expect(mocks.createProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ displayName: 'Late Apple Name' })
                )
            );
            await waitFor(() =>
                expect(mocks.updateProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ displayName: 'Late Apple Name' })
                )
            );
        }
    );

    it('observes enrichment even when the login type remains Apple', async () => {
        const view = await openProfile();
        mocks.authName = 'Late Apple Name';
        view.rerender(<OnboardingFlow />);
        expect(screen.getByLabelText(/Full Name/)).toHaveValue('Late Apple Name');
    });

    it.each(['', 'Chosen Name'])(
        'preserves the intentional edit %j when Apple enrichment finishes',
        async editedName => {
            mocks.localName = 'Local Name';
            const view = await openProfile();
            fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: editedName } });
            mocks.authName = 'Late Apple Name';
            view.rerender(<OnboardingFlow />);
            expect(screen.getByLabelText(/Full Name/)).toHaveValue(editedName);
        }
    );

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

describe('ClassLink transcript onboarding step', () => {
    const createProfile = async (): Promise<void> => {
        mocks.loginType = 'google';
        await openProfile();
        fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Student' } });
        await waitFor(() => expect(createButton()).toBeEnabled());
        fireEvent.click(createButton());
        await waitFor(() => expect(mocks.createProfile).toHaveBeenCalled());
    };
    const consentLabel = m['transcriptOptIn.consent']({ state: 'Example State' });

    it('is offered to an eligible ClassLink student when the tenant flag is on', async () => {
        mocks.transcriptFlag = true;
        mocks.isClassLinkStudent = true;
        await createProfile();

        await screen.findByTestId('onboarding-transcript-step');
        // Same consent control as the wallet card; nothing is sent until it is ticked.
        expect(screen.getByTestId('onboarding-transcript-get')).toBeDisabled();
        fireEvent.click(screen.getByLabelText(consentLabel));
        fireEvent.click(screen.getByTestId('onboarding-transcript-get'));

        await waitFor(() => expect(mocks.requestTranscript).toHaveBeenCalledTimes(1));
        // The guided flow stays on screen with live progress instead of closing.
        await screen.findByTestId('transcript-flow-on-the-way');
        expect(screen.getByTestId('onboarding-transcript-step')).toBeInTheDocument();
    });

    it('surfaces a request failure and lets the student retry or skip', async () => {
        mocks.transcriptFlag = true;
        mocks.isClassLinkStudent = true;
        mocks.requestTranscript.mockRejectedValueOnce(
            Object.assign(new Error('Records are offline'), {
                data: { code: 'SERVICE_UNAVAILABLE' },
            })
        );
        await createProfile();

        await screen.findByTestId('onboarding-transcript-step');
        fireEvent.click(screen.getByLabelText(consentLabel));
        fireEvent.click(screen.getByTestId('onboarding-transcript-get'));

        expect(await screen.findByRole('alert')).toHaveTextContent('Records are offline');
        expect(screen.getByTestId('onboarding-transcript-step')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('onboarding-transcript-skip'));
        await waitFor(() =>
            expect(screen.queryByTestId('onboarding-transcript-step')).not.toBeInTheDocument()
        );
        expect(screen.queryByText(m['onboarding.transcript.onItsWay']())).not.toBeInTheDocument();
    });

    it('is not offered (and status is not fetched) when the tenant flag is off', async () => {
        mocks.transcriptFlag = false;
        mocks.isClassLinkStudent = true;
        await createProfile();

        await screen.findByText(m['onboarding.v2.ready']({ brand: 'LearnCard' }));
        expect(mocks.transcriptsGetStatus).not.toHaveBeenCalled();
        expect(screen.queryByTestId('onboarding-transcript-step')).not.toBeInTheDocument();
    });

    it('is not offered to non-ClassLink sign-ins', async () => {
        mocks.transcriptFlag = true;
        mocks.isClassLinkStudent = false;
        await createProfile();

        await screen.findByText(m['onboarding.v2.ready']({ brand: 'LearnCard' }));
        expect(mocks.transcriptsGetStatus).not.toHaveBeenCalled();
    });

    it('is not offered when a request is already on record', async () => {
        mocks.transcriptFlag = true;
        mocks.isClassLinkStudent = true;
        mocks.transcriptsGetStatus.mockResolvedValue({
            eligible: true,
            stateDisplayName: 'Example State',
            latest: { status: 'requested', requestId: 'r', requestedAt: '2026-01-01' },
        });
        await createProfile();

        await screen.findByText(m['onboarding.v2.ready']({ brand: 'LearnCard' }));
        expect(screen.queryByTestId('onboarding-transcript-step')).not.toBeInTheDocument();
    });
});
