// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SchoolConnectPage from './SchoolConnectPage';
import {
    useFeatureConfig,
    useLinksConfig,
    useGetPreferencesForDid,
    useSchoolConnection,
} from 'learn-card-base';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { runClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';

vi.mock('learn-card-base', () => ({
    useFeatureConfig: vi.fn(),
    useLinksConfig: vi.fn(),
    useGetPreferencesForDid: vi.fn(),
    useSchoolConnection: vi.fn(),
    useClassLinkAuthorizeUrl: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: vi.fn(),
}));

vi.mock('../../auth/classlink/startClassLinkLogin', () => ({
    runClassLinkLogin: vi.fn(),
}));

vi.mock('../../components/classlink/TranscriptOptInCard', () => ({
    TranscriptOptInCard: () => <div data-testid="mock-transcript-opt-in" />,
}));

const keepAccount = vi.hoisted(() => ({
    offer: vi.fn(),
    continuity: undefined as
        | {
              nextStep: string;
              emailVerified: boolean;
              personalEmail: { allowed: boolean; reason?: string };
          }
        | undefined,
}));
vi.mock('../../components/classlink/useKeepAccountOffer', () => ({
    useKeepAccountOffer: (enabled: boolean) => {
        keepAccount.offer(enabled);
        return { offer: false, continuity: enabled ? keepAccount.continuity : undefined };
    },
}));
const openBirthDateSettings = vi.hoisted(() => vi.fn());
vi.mock('../../components/classlink/useOpenBirthDateSettings', () => ({
    useOpenBirthDateSettings: () => openBirthDateSettings,
}));
vi.mock('../../components/classlink/KeepAccountStep', () => ({
    KeepAccountStep: ({
        variant,
        source,
        onAddBirthDate,
    }: {
        variant: string;
        source: string;
        onAddBirthDate?: () => void;
    }) => (
        <section data-testid="mock-keep-account" data-variant={variant} data-source={source}>
            <button type="button" onClick={onAddBirthDate}>
                add-birth-date
            </button>
        </section>
    ),
}));

vi.mock('../../components/main-header/MainHeader', () => ({
    default: () => <div data-testid="mock-main-header" />,
}));

const mockHistoryReplace = vi.fn();
const mockHistoryPush = vi.fn();
const mockRedirect = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useHistory: () => ({
            replace: mockHistoryReplace,
            push: mockHistoryPush,
        }),
        Redirect: ({ to }: { to: string }) => {
            mockRedirect(to);
            return null;
        },
    };
});

vi.mock('../../i18n', () => ({ useLocale: () => 'en' }));

// Hooks are partially stubbed; only the fields the page reads are provided.
const stub = <T extends (...args: never[]) => unknown>(hook: T, value: unknown): void => {
    vi.mocked(hook).mockReturnValue(value as ReturnType<T>);
};

describe('SchoolConnectPage', () => {
    afterEach(() => {
        cleanup();
    });
    beforeEach(() => {
        vi.clearAllMocks();
        keepAccount.continuity = undefined;
        stub(useFeatureConfig, { schoolConnect: true, classlinkSso: true });
        stub(useLinksConfig, { supportEmail: 'support@learningeconomy.io' });
        stub(useAppAuth, { state: { status: 'ready' } });
        stub(useGetPreferencesForDid, { data: { isMinor: false } });
        stub(useSchoolConnection, {
            data: { available: true, canConnect: true, connected: false },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        });
    });

    it('redirects to /launchpad if feature flags are off', () => {
        stub(useFeatureConfig, { schoolConnect: false, classlinkSso: false });
        render(<SchoolConnectPage />);
        expect(mockRedirect).toHaveBeenCalledWith('/launchpad');
    });

    it.each([
        { schoolConnect: false, classlinkSso: true },
        { schoolConnect: true, classlinkSso: false },
    ])('makes no ClassLink calls when a flag is off (%o)', flags => {
        stub(useFeatureConfig, flags);
        render(<SchoolConnectPage />);
        expect(mockRedirect).toHaveBeenCalledWith('/launchpad');
        expect(useSchoolConnection).not.toHaveBeenCalled();
        expect(useGetPreferencesForDid).not.toHaveBeenCalled();
    });

    it('renders intro state when not connected', () => {
        render(<SchoolConnectPage />);
        expect(screen.getByText('Your school records, in your hands')).toBeTruthy();
        expect(screen.getAllByText('Connect with ClassLink')[0]).toBeTruthy();
        expect(screen.getByText('Ask us to add your school')).toBeTruthy();
    });

    it('shows warning when not locked and clicking connect', () => {
        render(<SchoolConnectPage />);
        fireEvent.click(screen.getAllByText('Connect with ClassLink')[0]);
        expect(screen.getByText('Before you connect')).toBeTruthy();
        expect(screen.getByText('Not Now')).toBeTruthy();
    });

    it('skips warning and connects directly when locked', () => {
        stub(useGetPreferencesForDid, { data: { isMinor: true } });
        vi.mocked(runClassLinkLogin).mockResolvedValue('started');
        render(<SchoolConnectPage />);
        fireEvent.click(screen.getAllByText('Connect with ClassLink')[0]);
        expect(screen.queryAllByText('Before you connect').length).toBe(0);
        expect(runClassLinkLogin).toHaveBeenCalled();
    });

    it('shows its own error only when the login could not start', async () => {
        stub(useGetPreferencesForDid, { data: { isMinor: true } });
        vi.mocked(runClassLinkLogin).mockResolvedValue('failed');
        render(<SchoolConnectPage />);
        fireEvent.click(screen.getAllByText('Connect with ClassLink')[0]);
        expect(await screen.findByText(/couldn.t connect|could not connect/i)).toBeTruthy();
    });

    it('leaves a closed or timed-out sheet to the callback route message', async () => {
        stub(useGetPreferencesForDid, { data: { isMinor: true } });
        vi.mocked(runClassLinkLogin).mockResolvedValue('handled');
        render(<SchoolConnectPage />);
        fireEvent.click(screen.getAllByText('Connect with ClassLink')[0]);
        await vi.waitFor(() => expect(runClassLinkLogin).toHaveBeenCalled());
        await Promise.resolve();
        expect(screen.queryByText(/couldn.t connect|could not connect/i)).toBeNull();
    });

    it('renders connected state with TranscriptOptInCard', () => {
        stub(useSchoolConnection, {
            data: {
                available: true,
                canConnect: true,
                connected: true,
                schoolName: 'Test High',
                lastConnectedAt: '2026-11-02T15:00:00.000Z',
                isStudent: true,
            },
            isLoading: false,
            isError: false,
        });
        render(<SchoolConnectPage />);
        expect(screen.getByText('Test High')).toBeTruthy();
        expect(screen.getByText('Connected')).toBeTruthy();
        expect(screen.getByText('Last connected Nov 2, 2026')).toBeTruthy();
        expect(screen.getByTestId('mock-transcript-opt-in')).toBeTruthy();
        expect(
            screen.getByText(
                'AI features, analytics, and bug reports are off, as your school requires.'
            )
        ).toBeTruthy();
    });

    it('fills the keep-account slot for a connected ClassLink account', () => {
        keepAccount.continuity = {
            nextStep: 'done',
            emailVerified: true,
            personalEmail: { allowed: false, reason: 'district_off' },
        };
        stub(useSchoolConnection, {
            data: { available: true, canConnect: true, connected: true, schoolName: 'Test High' },
            isLoading: false,
            isError: false,
        });
        render(<SchoolConnectPage />);
        expect(keepAccount.offer).toHaveBeenCalledWith(true);
        const slot = screen.getByTestId('mock-keep-account');
        expect(slot.dataset.variant).toBe('inline');
        expect(slot.dataset.source).toBe('school_connect');
        expect(screen.getByText('Your account')).toBeTruthy();
    });

    it('leaves out a standing refusal when there is no email to manage', () => {
        keepAccount.continuity = {
            nextStep: 'email',
            emailVerified: false,
            personalEmail: { allowed: false, reason: 'district_off' },
        };
        stub(useSchoolConnection, {
            data: { available: true, canConnect: true, connected: true, schoolName: 'Test High' },
            isLoading: false,
            isError: false,
        });
        const { rerender } = render(<SchoolConnectPage />);
        expect(screen.queryByTestId('mock-keep-account')).toBeNull();

        // Once offered, a refusal mid-flow stays visible so the step can explain it.
        keepAccount.continuity = { ...keepAccount.continuity, personalEmail: { allowed: true } };
        rerender(<SchoolConnectPage />);
        expect(screen.getByTestId('mock-keep-account')).toBeTruthy();
        keepAccount.continuity = {
            ...keepAccount.continuity,
            personalEmail: { allowed: false, reason: 'disabled' },
        };
        rerender(<SchoolConnectPage />);
        expect(screen.getByTestId('mock-keep-account')).toBeTruthy();
    });

    it('shows a missing date of birth, which the user can add from here', () => {
        keepAccount.continuity = {
            nextStep: 'email',
            emailVerified: false,
            personalEmail: { allowed: false, reason: 'age_unknown' },
        };
        stub(useSchoolConnection, {
            data: { available: true, canConnect: true, connected: true, schoolName: 'Test High' },
            isLoading: false,
            isError: false,
        });
        render(<SchoolConnectPage />);
        expect(screen.getByTestId('mock-keep-account')).toBeTruthy();
        fireEvent.click(screen.getByText('add-birth-date'));
        expect(openBirthDateSettings).toHaveBeenCalledTimes(1);
    });

    it('leaves the keep-account slot out without server state', () => {
        stub(useSchoolConnection, {
            data: { available: true, canConnect: true, connected: true, schoolName: 'Test High' },
            isLoading: false,
            isError: false,
        });
        render(<SchoolConnectPage />);
        expect(screen.queryByTestId('mock-keep-account')).toBeNull();
        expect(screen.queryByText('Your account')).toBeNull();
    });

    it('does not ask about keeping the account before connecting', () => {
        render(<SchoolConnectPage />);
        expect(keepAccount.offer).toHaveBeenCalledWith(false);
        expect(keepAccount.offer).not.toHaveBeenCalledWith(true);
    });

    it('renders not available state', () => {
        stub(useSchoolConnection, {
            data: { available: false, canConnect: false },
            isLoading: false,
            isError: false,
        });
        render(<SchoolConnectPage />);
        expect(
            screen.getByText("School Connect isn't available for your account yet.")
        ).toBeTruthy();
    });

    it('does not render mailto link if supportEmail is not set', () => {
        stub(useLinksConfig, { supportEmail: undefined });
        render(<SchoolConnectPage />);
        expect(screen.queryAllByText('Ask us to add your school').length).toBe(0);
    });
});
