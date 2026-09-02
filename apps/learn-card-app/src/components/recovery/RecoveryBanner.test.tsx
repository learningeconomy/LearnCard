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
    const props: React.ComponentProps<typeof RecoveryBanner> = {
        recoverySupported: true,
        recoveryMethodCount: 0,
        totalCredentialCount: 1,
        onSetup,
        ...overrides,
    };

    return { ...render(<RecoveryBanner {...props} />), onSetup, props };
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

        act(() => onCompleted('passkey'));
        expect(screen.getByRole('status')).toHaveTextContent("You're covered");
        expect(mocks.track).toHaveBeenCalledWith(
            'dashboard_recovery_prompt_interacted',
            expect.objectContaining({ action: 'completed', method: 'passkey', weight: 'calm' })
        );

        act(() => vi.advanceTimersByTime(4000));
        act(() => vi.advanceTimersByTime(300));
        expect(screen.queryByTestId('dashboard-recovery-prompt')).not.toBeInTheDocument();
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

        expect(screen.getByText('Get a recovery phrase')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Set up a way to sign back in' }));
        expect(onSetup.mock.calls[0][0].initialMethod).toBe('phrase');
    });
});
