// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    sent: undefined as (() => void) | undefined,
    failed: undefined as ((error: unknown) => void) | undefined,
    send: vi.fn().mockResolvedValue({ verificationId: 'opaque' }),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('../../../hooks/useFirebase', () => ({ useFirebase: () => ({}) }));
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
vi.mock('./AccessibleCodeInput', () => ({ default: () => <div>Code entry</div> }));
vi.mock('react-countdown', () => ({ default: () => null }));
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
}));

import PhoneForm from './PhoneForm';

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
        expect(screen.getByRole('alert').textContent).toBe('Verification failed');
        expect(screen.queryByText('Code entry')).toBeNull();
        expect(setShowSocialLogins).toHaveBeenLastCalledWith(true);
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send code' })));
        expect(mocks.send).toHaveBeenCalledWith('+15555550123');
        view.unmount();
        expect(mocks.failed).toBeUndefined();
    });
});
