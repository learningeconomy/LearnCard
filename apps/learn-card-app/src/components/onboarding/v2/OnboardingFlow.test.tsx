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
    country: 'US',
    dob: '1990-01-01',
    sendGuardianApprovalEmail: vi.fn(),
    updatePreferences: vi.fn(),
    setIsOnboardingOpen: vi.fn(),
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
                sendGuardianApprovalEmail: mocks.sendGuardianApprovalEmail,
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
    default: { set: { isOnboardingOpen: mocks.setIsOnboardingOpen } },
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
vi.mock('../../../i18n', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../i18n')>()),
    useLocale: () => 'en',
}));
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
vi.mock('./countryInference', () => ({ inferCountryCode: () => mocks.country }));
vi.mock('./BirthdayPicker', () => ({
    default: ({ onChange }: { onChange: (value: string) => void }) => (
        <button onClick={() => onChange(mocks.dob)}>Set birthday</button>
    ),
}));
vi.mock('../onboardingNetworkForm/components/EUParentalConsentModalContent', () => ({
    default: () => null,
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
    mocks.country = 'US';
    mocks.dob = '1990-01-01';
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

describe('onboarding open flag', () => {
    it('stays set when the analytics provider is swapped mid-onboarding, and clears on unmount', () => {
        const originalTrack = mocks.track;
        mocks.setIsOnboardingOpen.mockClear();
        try {
            const { rerender, unmount } = render(<OnboardingFlow />);
            mocks.track = vi.fn();
            rerender(<OnboardingFlow />);

            expect(mocks.setIsOnboardingOpen.mock.calls).toEqual([[true]]);

            unmount();
            expect(mocks.setIsOnboardingOpen).toHaveBeenLastCalledWith(false);
        } finally {
            mocks.track = originalTrack;
        }
    });
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

    describe('EU guardian approval email entry and send outcome', () => {
        const fifteenYearsAgo = (): string => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 15);
            return date.toISOString().slice(0, 10);
        };

        const completeAsEUTeen = async (): Promise<void> => {
            mocks.country = 'DE';
            mocks.dob = fifteenYearsAgo();
            const view = render(<OnboardingFlow />);
            fireEvent.click(screen.getByText('Set birthday'));
            const guardianInput = view.container.querySelector(
                '#onboarding-guardian-email'
            ) as HTMLInputElement;
            fireEvent.change(guardianInput, { target: { value: 'guardian@example.com' } });
            fireEvent.click(screen.getByRole('button', { name: m['onboarding.v2.continue']() }));
            await screen.findByLabelText(/Full Name/);
            await waitFor(() => expect(createButton()).toBeEnabled());
            fireEvent.click(createButton());
            await screen.findByText(m['onboarding.v2.almostThere']());
        };

        it('sends the guardian email and shows the guardian emailed message', async () => {
            mocks.sendGuardianApprovalEmail.mockResolvedValue({
                message: 'ok',
                approvalUrl: 'https://example.com/approve',
                status: 'accepted',
            });

            await completeAsEUTeen();

            expect(mocks.sendGuardianApprovalEmail).toHaveBeenCalledWith({
                guardianEmail: 'guardian@example.com',
            });
            expect(screen.getByText(m['onboarding.v2.guardianEmailed']())).toBeInTheDocument();
        });

        it('still finishes onboarding when the send fails, says the email was not sent, and leaves resending to the dashboard', async () => {
            mocks.sendGuardianApprovalEmail.mockRejectedValue(new Error('provider down'));

            await completeAsEUTeen();

            const status = await screen.findByRole('status');
            expect(status).toHaveTextContent(
                m['onboarding.v2.guardianEmailFailed']({ email: 'guardian@example.com' })
            );
            expect(
                screen.queryByText(m['onboarding.v2.guardianEmailed']())
            ).not.toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: m['common.tryAgain']() })
            ).not.toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: m['onboarding.consent.eu.sendRequest']() })
            ).not.toBeInTheDocument();
        });

        it.each([
            'guardian',
            'guardian@',
            '@example.com',
            'guardian@example',
            'guard ian@example.com',
        ])(
            'blocks continuing with the malformed guardian email %j and explains why',
            invalidEmail => {
                mocks.country = 'DE';
                mocks.dob = fifteenYearsAgo();
                const view = render(<OnboardingFlow />);
                fireEvent.click(screen.getByText('Set birthday'));
                const guardianInput = view.container.querySelector(
                    '#onboarding-guardian-email'
                ) as HTMLInputElement;

                fireEvent.change(guardianInput, { target: { value: invalidEmail } });
                fireEvent.blur(guardianInput);

                expect(
                    screen.getByRole('button', { name: m['onboarding.v2.continue']() })
                ).toBeDisabled();
                expect(screen.getByRole('alert')).toHaveTextContent(
                    m['onboarding.consent.eu.error.invalidEmail']()
                );
                expect(guardianInput).toHaveAttribute('aria-invalid', 'true');

                fireEvent.change(guardianInput, { target: { value: 'guardian@example.com' } });

                expect(guardianInput).toHaveValue('guardian@example.com');
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
                expect(
                    screen.getByRole('button', { name: m['onboarding.v2.continue']() })
                ).toBeEnabled();
            }
        );

        describe('validation timing', () => {
            const renderGuardianStep = (): HTMLInputElement => {
                mocks.country = 'DE';
                mocks.dob = fifteenYearsAgo();
                const view = render(<OnboardingFlow />);
                fireEvent.click(screen.getByText('Set birthday'));
                return view.container.querySelector(
                    '#onboarding-guardian-email'
                ) as HTMLInputElement;
            };
            const type = (input: HTMLInputElement, value: string): void => {
                fireEvent.change(input, { target: { value } });
            };
            const continueButton = (): HTMLElement =>
                screen.getByRole('button', { name: m['onboarding.v2.continue']() });

            it('does not show the error while the user is still typing', () => {
                const input = renderGuardianStep();

                type(input, 'guardian');
                type(input, 'guardian@');

                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
                expect(input).toHaveAttribute('aria-invalid', 'false');
                expect(continueButton()).toBeDisabled();
            });

            it('shows the error when the field loses focus', () => {
                const input = renderGuardianStep();

                type(input, 'guardian@');
                fireEvent.blur(input);

                expect(screen.getByRole('alert')).toHaveTextContent(
                    m['onboarding.consent.eu.error.invalidEmail']()
                );
                expect(screen.getByRole('alert')).toHaveClass('text-red-600');
                expect(input).toHaveAttribute('aria-invalid', 'true');
            });

            it('keeps the error while still invalid and clears it as soon as the email is valid', () => {
                const input = renderGuardianStep();

                type(input, 'guardian@');
                fireEvent.blur(input);
                type(input, 'guardian@example');
                expect(screen.getByRole('alert')).toBeInTheDocument();

                type(input, 'guardian@example.com');
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
                expect(continueButton()).toBeEnabled();

                type(input, 'guardian@example.co m');
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
                fireEvent.blur(input);
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });

            it('does not advance when the disabled Continue button is clicked', () => {
                const input = renderGuardianStep();

                type(input, 'guardian@');
                expect(continueButton()).toBeDisabled();
                fireEvent.click(continueButton());

                expect(screen.queryByLabelText(/Full Name/)).not.toBeInTheDocument();
                expect(input).toBeInTheDocument();
            });
        });

        it('sends a trimmed guardian address', async () => {
            mocks.sendGuardianApprovalEmail.mockResolvedValue({
                message: 'ok',
                status: 'accepted',
            });
            mocks.country = 'DE';
            mocks.dob = fifteenYearsAgo();
            const view = render(<OnboardingFlow />);
            fireEvent.click(screen.getByText('Set birthday'));
            fireEvent.change(
                view.container.querySelector('#onboarding-guardian-email') as HTMLInputElement,
                { target: { value: '  guardian@example.com  ' } }
            );
            fireEvent.click(screen.getByRole('button', { name: m['onboarding.v2.continue']() }));
            await screen.findByLabelText(/Full Name/);
            await waitFor(() => expect(createButton()).toBeEnabled());
            fireEvent.click(createButton());

            await waitFor(() =>
                expect(mocks.sendGuardianApprovalEmail).toHaveBeenCalledWith({
                    guardianEmail: 'guardian@example.com',
                })
            );
        });
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
