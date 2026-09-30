// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    sent: undefined as (() => void) | undefined,
    failed: undefined as ((error: unknown) => void) | undefined,
    completed: undefined as ((code: string | undefined) => void) | undefined,
    send: vi.fn(),
    cleanup: vi.fn(),
    toast: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('../../../hooks/useFirebase', () => ({
    useFirebase: () => ({ loginAfterAutoVerifiedSMS: vi.fn(), verifySmsAuthCodeOnNative: vi.fn() }),
}));
vi.mock('learn-card-base', () => {
    const adapter = {
        sendPhoneOtp: mocks.send,
        cleanup: mocks.cleanup,
        onPhoneCodeSent: (callback: () => void) => {
            mocks.sent = callback;
            return () => {
                mocks.sent = undefined;
            };
        },
        onPhoneVerificationCompleted: (callback: (code: string | undefined) => void) => {
            mocks.completed = callback;
            return () => {
                mocks.completed = undefined;
            };
        },
        onPhoneVerificationFailed: (callback: (error: unknown) => void) => {
            mocks.failed = callback;
            return () => {
                mocks.failed = undefined;
            };
        },
    };
    return {
        useSignInAdapter: () => adapter,
        useToast: () => ({ presentToast: mocks.toast }),
        ToastTypeEnum: { Success: 'success' },
        PhoneFormStepsEnum: { phone: 'phone', verification: 'verification' },
        getLogger: () => ({ error: vi.fn() }),
    };
});
vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonInput: () => null,
    IonCheckbox: () => null,
    IonToggle: () => null,
    IonRouterLink: () => null,
}));
vi.mock('react-phone-number-input', () => ({
    default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
        <input aria-label="Phone" value={value} onChange={event => onChange(event.target.value)} />
    ),
}));
vi.mock('react-code-input', () => ({ default: () => <div>Code entry</div> }));
vi.mock('../../../i18n/TransP', () => ({ TransP: () => <span>Enter code</span> }));
vi.mock('../../../paraglide/messages.js', () => ({
    'common.sendingCode': () => 'Sending',
    'common.resendCode': () => 'Resend',
    'common.loading': () => 'Loading',
    'common.verifying': () => 'Verifying',
    'common.verify': () => 'Verify',
    'login.sendCode': () => 'Send code',
    'login.loginWithPhone': () => 'Phone login',
    'login.phonePlaceholder': () => 'Phone',
    'login.verificationSentToast': () => 'Sent',
    'common.enterVerificationCode': () => 'Enter code',
}));

import PhoneForm from './PhoneForm';

describe('native phone session ownership', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.send.mockResolvedValue({ verificationId: 'opaque' });
    });
    afterEach(cleanup);

    it('cancels the adapter session and subscriptions when the form unmounts', () => {
        const view = render(<PhoneForm />);
        expect(mocks.sent).toBeTypeOf('function');
        view.unmount();
        expect(mocks.cleanup).toHaveBeenCalledOnce();
        expect(mocks.sent).toBeUndefined();
        expect(mocks.failed).toBeUndefined();
        expect(mocks.completed).toBeUndefined();
    });

    it('returns to a retryable phone form on failure after code-sent', () => {
        render(<PhoneForm />);
        act(() => mocks.sent?.());
        expect(screen.getByText('Code entry')).toBeTruthy();
        act(() => mocks.failed?.(new Error('Verification failed')));
        expect(screen.getByText('Verification failed')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Send code' })).toBeTruthy();
        expect(screen.queryByText('Code entry')).toBeNull();
    });

    it('shows failed resends instead of leaving an unusable code-entry step', async () => {
        render(<PhoneForm />);
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+15555550123' } });
        act(() => mocks.sent?.());
        mocks.send.mockRejectedValue(new Error('Resend failed'));
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Resend' })));
        expect(screen.getByText('Resend failed')).toBeTruthy();
        expect(screen.queryByText('Code entry')).toBeNull();
    });
});
