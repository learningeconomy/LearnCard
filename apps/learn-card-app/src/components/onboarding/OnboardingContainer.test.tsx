import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingContainer from './OnboardingContainer';

const mockNewModal = vi.fn();
const mockCloseModal = vi.fn();
const mockHandleLogout = vi.fn();
const mockSetupNewKey = vi.fn();
const mockGenerateEd25519PrivateKey = vi.fn();
const mockGetSigningLearnCard = vi.fn();
const mockCalculateAge = vi.fn();
const mockIsFutureDate = vi.fn();
const mockIsOnboardingOpen = vi.fn();
const mockInstallIntent = vi.fn(() => null);

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

const setupNewKeyDeferred = createDeferred<boolean>();

vi.mock('learn-card-base', () => ({
    ModalTypes: { FullScreen: 'full-screen', Center: 'center' },
    useModal: () => ({
        newModal: (...args: unknown[]) => {
            lastModalElement = args[0] as React.ReactElement;
            mockNewModal(...args);
        },
        closeModal: mockCloseModal,
    }),
}));

vi.mock('learn-card-base/helpers/dateHelpers', () => ({
    calculateAge: (...args: unknown[]) => mockCalculateAge(...args),
    isFutureDate: (...args: unknown[]) => mockIsFutureDate(...args),
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

vi.mock('@learncard/sss-key-manager', () => ({
    generateEd25519PrivateKey: (...args: unknown[]) => mockGenerateEd25519PrivateKey(...args),
}));

vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: { status: 'needs_setup' },
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

vi.mock('./onboardingRoles/OnboardingRoles', () => ({
    __esModule: true,
    default: () => <div data-testid="onboarding-roles" />,
}));

vi.mock('./onboardingFooter/OnboardingFooter', () => ({
    __esModule: true,
    default: () => <div data-testid="onboarding-footer" />,
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

        mockGenerateEd25519PrivateKey.mockResolvedValue('private-key');
        mockGetSigningLearnCard.mockResolvedValue({
            id: {
                did: () => 'did:example:test',
            },
        });
        mockCalculateAge.mockReturnValue(12);
        mockIsFutureDate.mockReturnValue(false);
        mockSetupNewKey.mockReturnValue(setupNewKeyDeferred.promise);
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
            expect(screen.getByTestId('onboarding-roles')).toBeInTheDocument();
        });
    });
});
