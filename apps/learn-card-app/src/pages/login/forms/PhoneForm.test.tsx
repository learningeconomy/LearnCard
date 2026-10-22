// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    sent: undefined as (() => void) | undefined,
    failed: undefined as ((error: unknown) => void) | undefined,
    send: vi.fn().mockResolvedValue({ verificationId: 'opaque' }),
    verifyNative: vi.fn(),
    countdownDates: [] as number[],
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('../../../hooks/useFirebase', () => ({
    useFirebase: () => ({ verifySmsAuthCodeOnNative: mocks.verifyNative }),
}));
vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({ theme: { colors: { defaults: {} } } }),
}));
vi.mock('learn-card-base', () => {
    const adapter = {
        sendPhoneOtp: mocks.send,
        cleanup: vi.fn(),
        onPhoneCodeSent: (callback: () => void) => {
            mocks.sent = callback;
            return () => {
                mocks.sent = undefined;
            };
        },
        onPhoneVerificationCompleted: () => vi.fn(),
        onPhoneVerificationFailed: (callback: (error: unknown) => void) => {
            mocks.failed = callback;
            return () => {
                mocks.failed = undefined;
            };
        },
    };
    return {
        useSignInAdapter: () => adapter,
        useToast: () => ({ presentToast: vi.fn() }),
        ToastTypeEnum: { Success: 'success' },
        PhoneFormStepsEnum: { phone: 'phone', verification: 'verification' },
        getLogger: () => ({ error: vi.fn() }),
    };
});
vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('react-phone-number-input', () => ({
    default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
        <input aria-label="Phone" value={value} onChange={event => onChange(event.target.value)} />
    ),
}));
vi.mock('./AccessibleCodeInput', () => ({
    default: ({ onChange }: { onChange: (value: string) => void }) => (
        <div>
            Code entry
            <input aria-label="Code" onChange={event => onChange(event.target.value)} />
        </div>
    ),
}));
vi.mock('react-countdown', () => ({
    default: ({ date }: { date: number }) => {
        mocks.countdownDates.push(date);
        return null;
    },
}));
vi.mock('../appStoreButtons/AppStoreDownloadButtons', () => ({ default: () => null }));
vi.mock('../../../i18n/TransP', () => ({ TransP: () => <span>Enter code</span> }));
vi.mock('../../../paraglide/messages.js', () => ({
    'common.sendingCode': () => 'Sending',
    'common.resendCode': () => 'Resend',
    'common.loading': () => 'Loading',
    'common.verifying': () => 'Verifying',
    'common.verify': () => 'Verify',
    'login.phone.button': () => 'Send code',
    'login.phone.placeholder': () => 'Phone',
    'login.phone.smsSent': () => 'Sent',
    'common.enterVerificationCode': () => 'Enter code',
    'login.phone.error.invalidCode': () => 'Invalid or expired code.',
    'login.phone.error.tooManyAttempts': () => 'Too many attempts',
    'login.phone.error.tooManyRequests': () => 'Wait 10-15 minutes',
    'login.phone.error.generic': () => 'Something went wrong',
}));

import PhoneForm from './PhoneForm';

const isAbove = (a: Element, b: Element): boolean =>
    Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('native phone verification failure', () => {
    afterEach(cleanup);

    it('returns to a retryable phone form on failure after code-sent', async () => {
        const setShowSocialLogins = vi.fn();
        const view = render(
            <PhoneForm showSocialLogins setShowSocialLogins={setShowSocialLogins} />
        );
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+15555550123' } });
        act(() => mocks.sent?.());
        expect(screen.getByText('Code entry')).toBeTruthy();
        act(() => mocks.failed?.(new Error('Verification failed')));
        expect(screen.getByRole('alert').textContent).toContain('Something went wrong');
        expect(screen.queryByText('Code entry')).toBeNull();
        expect(setShowSocialLogins).toHaveBeenLastCalledWith(true);
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send code' })));
        expect(mocks.send).toHaveBeenCalledWith('+15555550123');
        view.unmount();
        expect(mocks.failed).toBeUndefined();
    });

    it('shows a cooldown message when the number is temporarily blocked', async () => {
        mocks.send.mockRejectedValueOnce(new Error('Firebase: Error (auth/too-many-requests).'));
        render(<PhoneForm showSocialLogins setShowSocialLogins={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+15555550123' } });
        const sendButton = screen.getByRole('button', { name: 'Send code' });
        await act(async () => fireEvent.click(sendButton));
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Wait 10-15 minutes');
        expect(isAbove(alert, sendButton)).toBe(true);
    });
});

describe('phone code attempts', () => {
    afterEach(() => {
        cleanup();
        mocks.verifyNative.mockReset();
        mocks.countdownDates.length = 0;
    });

    it('shows invalid-code errors, then the 6th-attempt rate-limit, above Verify', async () => {
        mocks.verifyNative.mockImplementation(
            async (_code: string, _ok: () => void, onError: (err: string) => void) =>
                onError('Firebase: Error (auth/invalid-verification-code).')
        );
        mocks.countdownDates.length = 0;
        render(<PhoneForm showSocialLogins setShowSocialLogins={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+15555550123' } });
        act(() => mocks.sent?.());

        await act(async () => {
            fireEvent.change(screen.getByLabelText('Code'), { target: { value: '123456' } });
        });
        const verify = screen.getByRole('button', { name: 'Verify' });
        expect(screen.getByRole('alert').textContent).toContain('Invalid or expired code.');
        expect(isAbove(screen.getByRole('alert'), verify)).toBe(true);

        for (let i = 0; i < 4; i += 1) {
            await act(async () => fireEvent.click(verify));
        }
        expect(screen.getByRole('alert').textContent).toContain('Invalid or expired code.');
        expect((verify as HTMLButtonElement).disabled).toBe(false);

        await act(async () => fireEvent.click(verify));

        expect(mocks.verifyNative).toHaveBeenCalledTimes(5);
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Too many attempts');
        expect(isAbove(alert, verify)).toBe(true);
        expect((verify as HTMLButtonElement).disabled).toBe(true);
        expect(new Set(mocks.countdownDates).size).toBe(1);
    });
});
