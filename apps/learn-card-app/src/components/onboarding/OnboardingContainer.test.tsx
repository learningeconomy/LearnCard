import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingContainer from './OnboardingContainer';
import { OnboardingStepsEnum } from './onboarding.helpers';

const mockNewModal = vi.fn();
const mockCloseModal = vi.fn();
const mockHandleLogout = vi.fn();
const mockSetupNewKey = vi.fn();
const mockGenerateEd25519PrivateKey = vi.fn();
const mockGetSigningLearnCard = vi.fn();
const mockCalculateAge = vi.fn();
const mockIsFutureDate = vi.fn();
const mockIsOnboardingOpen = vi.fn();
const mockInstallIntent = vi.fn((_value?: unknown) => null);
const mockUpdatePreferences = vi.fn();
const mockSetAnalyticsEnabled = vi.fn();
let mockAuthState: { status: 'needs_setup' | 'ready' } = { status: 'needs_setup' };
let mockCurrentLCNUser: {
    displayName: string;
    image?: string;
    dob?: string;
    country?: string;
} | null = null;
let mockCurrentLCNUserLoading = false;
let mockCurrentLCNUserError = false;

let lastModalElement: React.ReactElement | null = null;

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
};

let setupNewKeyDeferred = createDeferred<boolean>();

vi.mock('learn-card-base', () => ({
    ModalTypes: { FullScreen: 'full-screen', Center: 'center' },
    useModal: () => ({
        newModal: (...args: unknown[]) => {
            lastModalElement = args[0] as React.ReactElement;
            mockNewModal(...args);
        },
        closeModal: mockCloseModal,
    }),
    useGetProfile: () => ({
        data: mockCurrentLCNUser,
        isLoading: mockCurrentLCNUserLoading,
        isError: mockCurrentLCNUserError,
    }),
    useUpdatePreferences: () => ({
        mutateAsync: (...args: unknown[]) => mockUpdatePreferences(...args),
    }),
}));

vi.mock('learn-card-base/helpers/dateHelpers', () => ({
    calculateAge: (...args: unknown[]) => mockCalculateAge(...args),
    isFutureDate: (...args: unknown[]) => mockIsFutureDate(...args),
}));

vi.mock('learn-card-base/constants/gdprAgeLimits', () => ({
    getMinorAgeThreshold: () => 18,
}));

vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getSigningLearnCard: (...args: unknown[]) => mockGetSigningLearnCard(...args),
}));

vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => ({
        name: 'Test User',
        profileImage: 'https://example.com/avatar.png',
    }),
}));

vi.mock('learn-card-base/stores/redirectStore', () => ({
    default: {
        set: {
            isOnboardingOpen: (value: boolean) => mockIsOnboardingOpen(value),
            installIntent: (value: unknown) => mockInstallIntent(value),
        },
        get: {
            installIntent: () => mockInstallIntent(),
        },
    },
}));

vi.mock('@analytics', () => ({
    ONBOARDING_STARTED_AT_KEY: 'onboarding-started-at-test-key',
    useAnalytics: () => ({
        setEnabled: (...args: unknown[]) => mockSetAnalyticsEnabled(...args),
    }),
}));

vi.mock('@learncard/sss-key-manager', () => ({
    generateEd25519PrivateKey: (...args: unknown[]) => mockGenerateEd25519PrivateKey(...args),
}));

vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: mockAuthState,
        setupNewKey: (...args: unknown[]) => mockSetupNewKey(...args),
    }),
}));

vi.mock('../../hooks/useLogout', () => ({
    __esModule: true,
    default: () => ({ handleLogout: mockHandleLogout }),
}));

vi.mock('./OnboardingAgeGate', () => ({
    __esModule: true,
    default: ({ onDobChange, onCountryChange, onContinue }: any) => (
        <div data-testid="age-gate">
            <button type="button" onClick={() => onDobChange('2015-01-01')}>
                set dob
            </button>
            <button type="button" onClick={() => onCountryChange('US')}>
                set country
            </button>
            <button type="button" onClick={() => void onContinue()}>
                continue
            </button>
        </div>
    ),
}));

vi.mock('./OnboardingPrivacyDataStep', () => ({
    __esModule: true,
    default: ({ onContinue, preferences }: any) => (
        <div data-testid="privacy-step">
            <div data-testid="privacy-step-state">{JSON.stringify(preferences)}</div>
            <button type="button" onClick={() => void onContinue()}>
                continue privacy
            </button>
        </div>
    ),
}));

vi.mock('./onboardingRoles/OnboardingRoles', () => ({
    __esModule: true,
    default: () => <div data-testid="onboarding-roles" />,
}));

vi.mock('./onboardingFooter/OnboardingFooter', () => ({
    __esModule: true,
    default: ({ step, setStep, showBackButton }: any) => (
        <div data-testid="onboarding-footer">
            {showBackButton && (
                <button
                    type="button"
                    onClick={() => {
                        if (step === OnboardingStepsEnum.selectRole) {
                            setStep?.(OnboardingStepsEnum.privacyData);
                            return;
                        }

                        if (step === OnboardingStepsEnum.joinNetwork) {
                            setStep?.(OnboardingStepsEnum.selectRole);
                        }
                    }}
                >
                    footer back
                </button>
            )}
            <button
                type="button"
                onClick={() => {
                    if (step === OnboardingStepsEnum.selectRole) {
                        setStep?.(OnboardingStepsEnum.joinNetwork);
                    }
                }}
            >
                footer continue
            </button>
        </div>
    ),
}));

vi.mock('./onboardingHeader/OnboardingHeader', () => ({
    __esModule: true,
    default: () => <div data-testid="onboarding-header" />,
}));

vi.mock('./onboardingNetworkForm/OnboardingNetworkForm', () => ({
    __esModule: true,
    default: () => <div data-testid="onboarding-network-form" />,
}));

vi.mock('./onboardingNetworkForm/components/UnderageModalContent', () => ({
    __esModule: true,
    default: () => <div data-testid="underage-modal" />,
}));

vi.mock('./onboardingNetworkForm/components/EUParentalConsentModalContent', () => ({
    __esModule: true,
    default: () => <div data-testid="eu-consent-modal" />,
}));

vi.mock('./onboardingNetworkForm/components/USConsentNoticeModalContent', () => ({
    __esModule: true,
    default: () => <div data-testid="us-consent-modal" />,
}));

vi.mock('./onboardingNetworkForm/helpers/gdpr', () => ({
    isEUCountry: () => false,
    requiresEUParentalConsent: () => false,
}));

describe('OnboardingContainer school-code bypass', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        lastModalElement = null;
        mockAuthState = { status: 'needs_setup' };
        mockCurrentLCNUser = null;
        mockCurrentLCNUserLoading = false;
        mockCurrentLCNUserError = false;
        setupNewKeyDeferred = createDeferred<boolean>();

        vi.stubGlobal('localStorage', {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        });

        mockGenerateEd25519PrivateKey.mockResolvedValue('private-key');
        mockGetSigningLearnCard.mockResolvedValue({
            id: {
                did: () => 'did:example:test',
            },
        });
        mockCalculateAge.mockReturnValue(12);
        mockIsFutureDate.mockReturnValue(false);
        mockSetupNewKey.mockReturnValue(setupNewKeyDeferred.promise);
        mockUpdatePreferences.mockResolvedValue(true);
        mockSetAnalyticsEnabled.mockImplementation(() => undefined);
        mockIsOnboardingOpen.mockImplementation(() => undefined);
        mockInstallIntent.mockImplementation(() => null);
    });

    it('waits for key generation before advancing from the school-code bypass path', async () => {
        render(<OnboardingContainer />);

        fireEvent.click(screen.getByRole('button', { name: 'set dob' }));
        fireEvent.click(screen.getByRole('button', { name: 'set country' }));
        fireEvent.click(screen.getByRole('button', { name: 'continue' }));

        await waitFor(() => {
            expect(mockNewModal).toHaveBeenCalled();
        });

        expect(lastModalElement).not.toBeNull();
        const onBypass = lastModalElement?.props?.onBypass as
            | ((code: string) => Promise<void>)
            | undefined;
        expect(onBypass).toBeDefined();

        let bypassPromise!: Promise<void>;

        await act(async () => {
            bypassPromise = onBypass!('SCHOOL-123');
        });

        expect(mockGenerateEd25519PrivateKey).toHaveBeenCalledTimes(1);

        await waitFor(() => {
            expect(mockSetupNewKey).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByTestId('onboarding-roles')).toBeNull();

        await act(async () => {
            setupNewKeyDeferred.resolve(true);
            await bypassPromise;
        });

        await waitFor(() => {
            expect(screen.getByTestId('privacy-step')).toBeInTheDocument();
        });
    });

    it('honors the requested initial step when the profile already has age data', async () => {
        mockAuthState = { status: 'ready' };
        mockCurrentLCNUser = {
            displayName: 'Test User',
            image: 'https://example.com/avatar.png',
            dob: '2000-01-01',
            country: 'US',
        };

        render(<OnboardingContainer initialStep={OnboardingStepsEnum.joinNetwork} />);

        await waitFor(() => {
            expect(screen.getByTestId('onboarding-network-form')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('age-gate')).toBeNull();
    });

    it('does not drop an existing user onto the age gate when the profile fetch errors', async () => {
        mockAuthState = { status: 'ready' };
        mockCurrentLCNUser = null;
        mockCurrentLCNUserLoading = false;
        mockCurrentLCNUserError = true;

        render(<OnboardingContainer initialStep={OnboardingStepsEnum.joinNetwork} />);

        await waitFor(() => {
            expect(screen.getByTestId('onboarding-network-form')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('age-gate')).toBeNull();
    });

    it('routes a freshly keyed user to the privacy step before role selection', async () => {
        mockCalculateAge.mockReturnValue(18);

        render(<OnboardingContainer />);

        fireEvent.click(screen.getByRole('button', { name: 'set dob' }));
        fireEvent.click(screen.getByRole('button', { name: 'set country' }));
        fireEvent.click(screen.getByRole('button', { name: 'continue' }));

        await waitFor(() => {
            expect(mockGenerateEd25519PrivateKey).toHaveBeenCalledTimes(1);
            expect(mockSetupNewKey).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            mockAuthState = { status: 'ready' };
            setupNewKeyDeferred.resolve(true);
        });

        await waitFor(() => {
            expect(screen.getByTestId('privacy-step')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('age-gate')).toBeNull();
    });

    it('saves privacy preferences before advancing to role selection', async () => {
        mockCalculateAge.mockReturnValue(18);

        render(<OnboardingContainer />);

        fireEvent.click(screen.getByRole('button', { name: 'set dob' }));
        fireEvent.click(screen.getByRole('button', { name: 'set country' }));
        fireEvent.click(screen.getByRole('button', { name: 'continue' }));

        await waitFor(() => {
            expect(mockGenerateEd25519PrivateKey).toHaveBeenCalledTimes(1);
            expect(mockSetupNewKey).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            mockAuthState = { status: 'ready' };
            setupNewKeyDeferred.resolve(true);
        });

        await waitFor(() => {
            expect(screen.getByTestId('privacy-step')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'continue privacy' }));

        await waitFor(() => {
            expect(mockUpdatePreferences).toHaveBeenCalledTimes(1);
            expect(mockSetAnalyticsEnabled).toHaveBeenCalledWith(true);
            expect(screen.getByTestId('onboarding-roles')).toBeInTheDocument();
        });
    });

    it('lets users go back from role selection to the privacy step', async () => {
        mockCalculateAge.mockReturnValue(18);

        render(<OnboardingContainer />);

        fireEvent.click(screen.getByRole('button', { name: 'set dob' }));
        fireEvent.click(screen.getByRole('button', { name: 'set country' }));
        fireEvent.click(screen.getByRole('button', { name: 'continue' }));

        await waitFor(() => {
            expect(mockGenerateEd25519PrivateKey).toHaveBeenCalledTimes(1);
            expect(mockSetupNewKey).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            mockAuthState = { status: 'ready' };
            setupNewKeyDeferred.resolve(true);
        });

        await waitFor(() => {
            expect(screen.getByTestId('privacy-step')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'continue privacy' }));

        await waitFor(() => {
            expect(screen.getByTestId('onboarding-roles')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'footer back' })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'footer back' }));

        await waitFor(() => {
            expect(screen.getByTestId('privacy-step')).toBeInTheDocument();
        });
    });

    it('passes minor-default privacy preferences into the privacy step', async () => {
        render(<OnboardingContainer />);

        fireEvent.click(screen.getByRole('button', { name: 'set dob' }));
        fireEvent.click(screen.getByRole('button', { name: 'set country' }));
        fireEvent.click(screen.getByRole('button', { name: 'continue' }));

        await waitFor(() => {
            expect(mockNewModal).toHaveBeenCalled();
        });

        const onBypass = lastModalElement?.props?.onBypass as
            | ((code: string) => Promise<void>)
            | undefined;
        expect(onBypass).toBeDefined();

        await act(async () => {
            const bypassPromise = onBypass!('SCHOOL-123');
            setupNewKeyDeferred.resolve(true);
            await bypassPromise;
        });

        await waitFor(() => {
            expect(screen.getByTestId('privacy-step')).toBeInTheDocument();
            expect(screen.getByTestId('privacy-step-state')).toHaveTextContent('"aiEnabled":false');
            expect(screen.getByTestId('privacy-step-state')).toHaveTextContent(
                '"analyticsEnabled":false'
            );
            expect(screen.getByTestId('privacy-step-state')).toHaveTextContent(
                '"bugReportsEnabled":false'
            );
            expect(screen.getByTestId('privacy-step-state')).toHaveTextContent('"isMinor":true');
        });
    });

    it('does not bounce a freshly keyed user back to age gate when the profile is sparse', async () => {
        mockCalculateAge.mockReturnValue(18);
        mockCurrentLCNUser = {
            displayName: 'Test User',
            image: 'https://example.com/avatar.png',
        };

        render(<OnboardingContainer />);

        fireEvent.click(screen.getByRole('button', { name: 'set dob' }));
        fireEvent.click(screen.getByRole('button', { name: 'set country' }));
        fireEvent.click(screen.getByRole('button', { name: 'continue' }));

        await waitFor(() => {
            expect(mockGenerateEd25519PrivateKey).toHaveBeenCalledTimes(1);
            expect(mockSetupNewKey).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            mockAuthState = { status: 'ready' };
            setupNewKeyDeferred.resolve(true);
        });

        await waitFor(() => {
            expect(screen.getByTestId('privacy-step')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('age-gate')).toBeNull();
    });
});
