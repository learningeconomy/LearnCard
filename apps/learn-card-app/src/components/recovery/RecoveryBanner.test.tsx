import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    isPublic: false,
    isNative: false,
    webAuthnSupported: true,
    track: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => mocks.isNative },
}));

vi.mock('@learncard/sss-key-manager', () => ({
    isPublicComputerMode: () => mocks.isPublic,
    isWebAuthnSupported: () => mocks.webAuthnSupported,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('@analytics', () => ({
    AnalyticsEvents: {
        DASHBOARD_RECOVERY_PROMPT_INTERACTED: 'dashboard_recovery_prompt_interacted',
    },
    useAnalytics: () => ({ track: mocks.track }),
}));

import firstStartupStore, {
    RECOVERY_PROMPT_SNOOZE_MS,
} from 'learn-card-base/stores/firstStartupStore';
import RecoveryBanner from './RecoveryBanner';

const renderPrompt = (overrides: Partial<React.ComponentProps<typeof RecoveryBanner>> = {}) => {
    const onSetup = vi.fn();
    const onSetupPin = vi.fn();
    const props: React.ComponentProps<typeof RecoveryBanner> = {
        recoverySupported: true,
        recoveryMethodCount: 0,
        totalCredentialCount: 1,
        onSetup,
        onSetupPin,
        ...overrides,
    };

    return { ...render(<RecoveryBanner {...props} />), onSetup, onSetupPin, props };
};

describe('RecoveryBanner', () => {
    beforeEach(() => {
        mocks.isPublic = false;
        mocks.isNative = false;
        mocks.webAuthnSupported = true;
        mocks.track.mockClear();
        firstStartupStore.set.recoveryPromptSnoozedUntil(0);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('does not render while unresolved, unsupported, protected, or empty in calm mode', () => {
        const { rerender } = renderPrompt({ recoveryMethodCount: null });
        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();

        rerender(
            <RecoveryBanner
                recoverySupported={false}
                recoveryMethodCount={0}
                totalCredentialCount={1}
                onSetup={vi.fn()}
            />
        );
        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();

        rerender(
            <RecoveryBanner
                recoverySupported
                recoveryMethodCount={1}
                totalCredentialCount={1}
                onSetup={vi.fn()}
            />
        );
        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();

        rerender(
            <RecoveryBanner
                recoverySupported
                recoveryMethodCount={0}
                totalCredentialCount={0}
                onSetup={vi.fn()}
            />
        );
        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();
    });

    it('renders separate accessible action and snooze buttons and tracks shown once', () => {
        vi.stubGlobal('navigator', { userAgent: 'Macintosh' });
        const { rerender, props } = renderPrompt();

        const action = screen.getByRole('button', { name: 'Set up a way to sign back in' });
        const snooze = screen.getByRole('button', { name: 'Remind me in 7 days' });
        expect(action.contains(snooze)).toBe(false);
        expect(screen.getByText('Use Face ID or Touch ID')).toBeVisible();

        rerender(<RecoveryBanner {...props} />);
        expect(
            mocks.track.mock.calls.filter(([, payload]) => payload.action === 'shown')
        ).toHaveLength(1);
    });

    it('shows Windows Hello on Windows', () => {
        vi.stubGlobal('navigator', { userAgent: 'Windows NT 10.0' });
        renderPrompt();
        expect(screen.getByText('Use Windows Hello')).toBeVisible();
    });

    it('shows Face ID or Touch ID on Mac', () => {
        vi.stubGlobal('navigator', { userAgent: 'Macintosh' });
        renderPrompt();
        expect(screen.getByText('Use Face ID or Touch ID')).toBeVisible();
    });

    it('shows fingerprint or face unlock on Android', () => {
        vi.stubGlobal('navigator', { userAgent: 'Android 13' });
        renderPrompt();
        expect(screen.getByText('Use fingerprint or face unlock')).toBeVisible();
    });

    it('shows generic passkey on Linux', () => {
        vi.stubGlobal('navigator', { userAgent: 'Linux x86_64' });
        renderPrompt();
        expect(screen.getByText('Use a passkey')).toBeVisible();
    });

    it('snoozes the calm prompt for seven days', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-01T12:00:00Z'));
        renderPrompt();

        fireEvent.click(screen.getByRole('button', { name: 'Remind me in 7 days' }));

        expect(firstStartupStore.get.recoveryPromptSnoozedUntil()).toBe(
            Date.now() + RECOVERY_PROMPT_SNOOZE_MS
        );
        act(() => vi.advanceTimersByTime(300));
        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();

        act(() => vi.advanceTimersByTime(RECOVERY_PROMPT_SNOOZE_MS - 300));
        expect(screen.getByTestId('dashboard-recovery-prompt')).toBeVisible();
    });

    it('shows the urgent prompt despite credentials and snooze, without a close button', () => {
        mocks.isPublic = true;
        firstStartupStore.set.recoveryPromptSnoozedUntil(Date.now() + RECOVERY_PROMPT_SNOOZE_MS);
        renderPrompt({ totalCredentialCount: 0 });

        expect(screen.getByText('This session ends when you close the tab')).toBeVisible();
        expect(
            screen.queryByRole('button', { name: 'Remind me in 7 days' })
        ).not.toBeInTheDocument();
    });

    it('opens the named method and confirms completion in place before exiting', () => {
        vi.useFakeTimers();
        const { onSetup } = renderPrompt();

        fireEvent.click(screen.getByRole('button', { name: 'Set up a way to sign back in' }));
        const [{ initialMethod, onCompleted }] = onSetup.mock.calls[0];
        expect(initialMethod).toBe('passkey');

        act(() => {
            onCompleted('passkey');
            onCompleted('passkey');
        });
        expect(screen.getByRole('status')).toHaveTextContent("You're covered");
        expect(
            mocks.track.mock.calls.filter(([, payload]) => payload.action === 'completed')
        ).toEqual([
            [
                'dashboard_recovery_prompt_interacted',
                expect.objectContaining({ action: 'completed', method: 'passkey', weight: 'calm' }),
            ],
        ]);

        act(() => vi.advanceTimersByTime(4000));
        act(() => vi.advanceTimersByTime(300));
        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();
    });

    it('coalesces repeated setup requests and unlocks after the modal closes', () => {
        const { onSetup } = renderPrompt();
        const action = screen.getByRole('button', { name: 'Set up a way to sign back in' });

        fireEvent.click(action);
        fireEvent.click(action);

        expect(onSetup).toHaveBeenCalledOnce();
        expect(
            mocks.track.mock.calls.filter(([, payload]) => payload.action === 'clicked')
        ).toHaveLength(1);

        act(() => onSetup.mock.calls[0][0].onClosed());
        fireEvent.click(action);

        expect(onSetup).toHaveBeenCalledTimes(2);
    });

    it('cleans up the success timer when unmounted', () => {
        vi.useFakeTimers();
        const clearTimeout = vi.spyOn(window, 'clearTimeout');
        const { onSetup, unmount } = renderPrompt();

        fireEvent.click(screen.getByRole('button', { name: 'Set up a way to sign back in' }));
        act(() => onSetup.mock.calls[0][0].onCompleted('passkey'));
        unmount();

        expect(clearTimeout).toHaveBeenCalled();
        clearTimeout.mockRestore();
    });

    it('falls back to a recovery phrase when passkeys are unavailable', () => {
        mocks.webAuthnSupported = false;
        const { onSetup } = renderPrompt();

        expect(screen.getByText('Save a recovery phrase')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Set up a way to sign back in' }));
        expect(onSetup.mock.calls[0][0].initialMethod).toBe('phrase');
    });

    it('renders PIN variant when escrowEnrolled and pinEnabled is false', () => {
        const { onSetupPin } = renderPrompt({
            recoveryMethodCount: 1,
            escrowEnrolled: true,
            pinEnabled: false,
        });

        expect(screen.getByText('Add a recovery PIN')).toBeVisible();
        expect(screen.getByText('Set a 6-digit PIN')).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Set up a way to sign back in' }));
        expect(onSetupPin).toHaveBeenCalledOnce();
        expect(
            mocks.track.mock.calls.filter(
                ([, payload]) => payload.action === 'clicked' && payload.method === 'pin'
            )
        ).toHaveLength(1);
    });

    it('does not render PIN variant when pinEnabled is null', () => {
        renderPrompt({
            recoveryMethodCount: 1,
            escrowEnrolled: true,
            pinEnabled: null,
        });

        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();
    });

    it('shows orAction when both standard and PIN variants are eligible', () => {
        const { onSetupPin } = renderPrompt({
            recoveryMethodCount: 0,
            escrowEnrolled: true,
            pinEnabled: false,
        });

        expect(screen.getByText('Add a way back in')).toBeVisible();
        const orAction = screen.getByText('Or set a 6-digit recovery PIN');
        expect(orAction).toBeVisible();

        fireEvent.click(orAction);
        expect(onSetupPin).toHaveBeenCalledOnce();
        expect(
            mocks.track.mock.calls.filter(
                ([, payload]) => payload.action === 'clicked' && payload.method === 'pin'
            )
        ).toHaveLength(1);
    });
});
