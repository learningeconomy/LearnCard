// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as m from '../../paraglide/messages.js';

type Continuity = {
    personalEmail: { allowed: boolean; reason?: string };
    emailVerified: boolean;
    maskedEmail?: string;
    recoveryEmailVerified: boolean;
    hasServerConfirmedMethod: boolean;
    hasUserRecoveryMethod: boolean;
    nextStep: 'email' | 'method' | 'done';
};
type SetupOptions = {
    initialMethod: string;
    onCompleted: (method: string) => void;
    onClosed: () => void;
};

const mocks = vi.hoisted(() => ({
    continuity: undefined as Continuity | undefined,
    start: vi.fn(),
    verify: vi.fn(),
    remove: vi.fn(),
    invalidate: vi.fn(),
    openRecoverySetup: vi.fn(),
    track: vi.fn(),
    webAuthn: true,
    loading: false,
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@learncard/sss-key-manager', () => ({ isWebAuthnSupported: () => mocks.webAuthn }));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock('learn-card-base', () => ({
    useClassLinkAccountContinuity: () => ({ data: mocks.continuity, isLoading: mocks.loading }),
    useStartPersonalEmail: () => ({ mutateAsync: mocks.start, isPending: false }),
    useVerifyPersonalEmail: () => ({ mutateAsync: mocks.verify, isPending: false }),
    useRemovePersonalEmail: () => ({ mutateAsync: mocks.remove, isPending: false }),
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({ openRecoverySetup: mocks.openRecoverySetup }),
}));
vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: mocks.track }),
    AnalyticsEvents: {
        KEEP_ACCOUNT_SHOWN: 'shown',
        KEEP_ACCOUNT_STEP_COMPLETED: 'completed',
        KEEP_ACCOUNT_DISMISSED: 'dismissed',
    },
}));

import { KeepAccountStep, type KeepAccountStepProps } from './KeepAccountStep';

const state = (overrides: Partial<Continuity> = {}): Continuity => ({
    personalEmail: { allowed: true },
    emailVerified: false,
    recoveryEmailVerified: false,
    hasServerConfirmedMethod: false,
    hasUserRecoveryMethod: false,
    nextStep: 'email',
    ...overrides,
});
const METHOD = state({
    emailVerified: true,
    maskedEmail: 'm***@example.org',
    recoveryEmailVerified: true,
    nextStep: 'method',
});
const DONE = { ...METHOD, hasUserRecoveryMethod: true, nextStep: 'done' as const };

const renderStep = (props: Partial<KeepAccountStepProps> = {}) => {
    const callbacks = { onComplete: vi.fn(), onDismiss: vi.fn(), onBeforeMethod: vi.fn() };
    const view = render(
        <KeepAccountStep variant="sheet" source="dashboard" {...callbacks} {...props} />
    );
    return { ...callbacks, ...view };
};

const verifyEmail = async (): Promise<void> => {
    fireEvent.change(screen.getByTestId('classlink-email-input'), {
        target: { value: 'me@example.org' },
    });
    await act(async () => {
        fireEvent.click(screen.getByTestId('classlink-email-submit'));
    });
    fireEvent.change(screen.getByTestId('classlink-email-code'), { target: { value: '123456' } });
    await act(async () => {
        fireEvent.click(screen.getByTestId('classlink-email-submit'));
    });
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.continuity = state();
    mocks.webAuthn = true;
    mocks.loading = false;
    mocks.start.mockResolvedValue({ success: true });
    mocks.verify.mockResolvedValue({ success: true, recoveryEmailSet: true });
    mocks.remove.mockResolvedValue({ success: true });
});
afterEach(cleanup);

describe('KeepAccountStep', () => {
    it('starts at the email step with a note on what is stored', () => {
        renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('email');
        expect(screen.getByText(m['classlinkKeepAccount.storedNote']())).toBeTruthy();
        // Recovery framing only: no promise of signing in with this email.
        expect(screen.queryByText(/sign in with/i)).toBeNull();
        expect(mocks.track).toHaveBeenCalledWith('shown', { source: 'dashboard', step: 'email' });
    });

    it('verifies the email with one code and tracks no address', async () => {
        renderStep();
        await verifyEmail();
        expect(mocks.start).toHaveBeenCalledWith({ email: 'me@example.org' });
        expect(mocks.verify).toHaveBeenCalledWith({ email: 'me@example.org', code: '123456' });
        expect(mocks.track).toHaveBeenCalledWith('completed', {
            source: 'dashboard',
            step: 'code',
        });
        expect(JSON.stringify(mocks.track.mock.calls)).not.toContain('me@example.org');
    });

    it('asks for a different email when another account already recovers with it', async () => {
        mocks.verify.mockResolvedValue({
            success: true,
            recoveryEmailSet: false,
            recoveryEmailSkipped: 'shared',
        });
        renderStep();
        await verifyEmail();
        expect(screen.getByRole('status').textContent).toBe(
            m['classlinkKeepAccount.sharedEmail']()
        );
        expect((screen.getByTestId('classlink-email-input') as HTMLInputElement).value).toBe('');
    });

    it('offers a passkey next, closing the host sheet before the overlay opens', () => {
        mocks.continuity = METHOD;
        const { onBeforeMethod } = renderStep();
        fireEvent.click(screen.getByTestId('keep-account-method'));
        expect(onBeforeMethod).toHaveBeenCalledTimes(1);
        expect(mocks.openRecoverySetup).toHaveBeenCalledTimes(1);
        const options = mocks.openRecoverySetup.mock.calls[0][0] as SetupOptions;
        expect(options.initialMethod).toBe('passkey');
        expect(onBeforeMethod.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.openRecoverySetup.mock.invocationCallOrder[0]
        );

        act(() => options.onCompleted('passkey'));
        expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['classlinkAccountContinuity'] });
        expect(mocks.track).toHaveBeenCalledWith('completed', {
            source: 'dashboard',
            step: 'method',
        });
    });

    it('falls back to a recovery phrase where passkeys are unavailable', () => {
        mocks.continuity = METHOD;
        mocks.webAuthn = false;
        renderStep();
        expect(screen.getByText(m['classlinkKeepAccount.addPhrase']())).toBeTruthy();
        fireEvent.click(screen.getByTestId('keep-account-method'));
        expect(mocks.openRecoverySetup.mock.calls[0][0].initialMethod).toBe('phrase');
    });

    it('is done only when the server says so, and lets the user remove the email', async () => {
        mocks.continuity = DONE;
        const { onComplete } = renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('done');
        expect(screen.getByText(/your recovery email/)).toBeTruthy();
        expect(screen.queryByText(/m\*\*\*@example\.org/)).toBeNull();
        expect(screen.getByText(new RegExp(m['recovery.identity.lostSchoolLogin']()))).toBeTruthy();

        fireEvent.click(screen.getByTestId('keep-account-continue'));
        expect(onComplete).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId('keep-account-remove'));
        expect(mocks.remove).not.toHaveBeenCalled();
        await act(async () => {
            fireEvent.click(screen.getByTestId('keep-account-remove-confirm'));
        });
        expect(mocks.remove).toHaveBeenCalledTimes(1);
        expect(mocks.invalidate).toHaveBeenCalled();
    });

    it('explains why when the server does not allow a personal email', () => {
        mocks.continuity = state({
            personalEmail: { allowed: false, reason: 'students_excluded' },
        });
        const { onDismiss } = renderStep();
        expect(screen.getByTestId('keep-account-blocked').textContent).toBe(
            m['classlinkKeepAccount.reason.studentsExcluded']()
        );
        expect(screen.queryByTestId('classlink-email-input')).toBeNull();
        fireEvent.click(screen.getByText(m['common.continue']()));
        expect(onDismiss).toHaveBeenCalled();
        expect(mocks.track).toHaveBeenCalledWith('dismissed', {
            source: 'dashboard',
            step: 'blocked',
        });
    });

    it('renders nothing while the feature is switched off on the server', () => {
        mocks.continuity = state({ personalEmail: { allowed: false, reason: 'disabled' } });
        const { onDismiss } = renderStep({ variant: 'inline' });
        expect(screen.queryByTestId('keep-account-step')).toBeNull();
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it.each(['sheet', 'onboarding'] as const)(
        'leaves a %s host once, instead of sitting empty, when there is nothing to show',
        variant => {
            mocks.continuity = state({ personalEmail: { allowed: false, reason: 'disabled' } });
            const { onDismiss, rerender } = renderStep({ variant });
            expect(screen.queryByTestId('keep-account-step')).toBeNull();
            mocks.continuity = undefined;
            rerender(
                <KeepAccountStep variant={variant} source="dashboard" onDismiss={onDismiss} />
            );
            expect(onDismiss).toHaveBeenCalledTimes(1);
            expect(mocks.track).not.toHaveBeenCalled();
        }
    );

    it('names the loading state for screen readers', () => {
        mocks.loading = true;
        mocks.continuity = undefined;
        const { onDismiss } = renderStep();
        expect(screen.getByRole('status', { name: m['common.loading']() })).toBeTruthy();
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('uses an h3 title inside a page section and an h2 elsewhere', () => {
        renderStep({ variant: 'inline' });
        expect(
            screen.getByRole('heading', { level: 3, name: m['classlinkKeepAccount.title']() })
        ).toBeTruthy();
        cleanup();
        renderStep();
        expect(
            screen.getByRole('heading', { level: 2, name: m['classlinkKeepAccount.title']() })
        ).toBeTruthy();
    });

    it('keeps keyboard focus through the remove confirmation', () => {
        mocks.continuity = DONE;
        renderStep();
        fireEvent.click(screen.getByTestId('keep-account-remove'));
        expect(document.activeElement).toBe(screen.getByTestId('keep-account-remove-confirm'));
        fireEvent.click(screen.getByText(m['common.cancel']()));
        expect(document.activeElement).toBe(screen.getByTestId('keep-account-remove'));
    });

    it('hands back to an email-only host once the email is verified', () => {
        mocks.continuity = METHOD;
        const { onComplete } = renderStep({ variant: 'onboarding', emailOnly: true });
        expect(screen.queryByTestId('keep-account-step')).toBeNull();
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(mocks.openRecoverySetup).not.toHaveBeenCalled();
    });

    it('lets the user leave with Not now', () => {
        const { onDismiss } = renderStep();
        fireEvent.click(screen.getByTestId('keep-account-not-now'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(mocks.track).toHaveBeenCalledWith('dismissed', {
            source: 'dashboard',
            step: 'email',
        });
    });
});
