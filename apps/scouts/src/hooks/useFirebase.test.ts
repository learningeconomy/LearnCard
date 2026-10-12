import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    adapter: {
        signInWithGoogle: vi.fn(),
        signInWithApple: vi.fn(),
        sendEmailLink: vi.fn(),
        validateEmailLink: vi.fn(),
        verifyEmailLink: vi.fn(),
        sendPhoneOtp: vi.fn(),
        confirmPhoneOtp: vi.fn(),
        checkRedirectResult: vi.fn(),
        deleteAccount: vi.fn(),
        signInWithCustomToken: vi.fn(),
        signInWithOidcCredential: vi.fn(),
        getCurrentUser: vi.fn(),
    },
    native: vi.fn(),
    analytics: vi.fn(),
    loginType: vi.fn(),
    toast: vi.fn(),
    alert: vi.fn(),
    modal: vi.fn(),
    log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: mocks.native } }));
vi.mock('@ionic/react', () => ({ useIonAlert: () => [mocks.alert] }));
vi.mock('./useFirebaseAnalytics', () => ({
    default: () => ({ logAnalyticsEvent: mocks.analytics }),
}));
vi.mock('../components/auth/GoogleLoginHelpModal', () => ({ default: () => null }));
vi.mock('../paraglide/messages.js', () => ({
    'login.linkSent': () => 'Link sent',
    'login.linkSendError': () => 'Link error',
    'login.popupsBlocked': () => 'Popups blocked',
    'login.refreshToFix': () => 'Refresh',
}));
vi.mock('learn-card-base', () => ({
    useSignInAdapter: () => mocks.adapter,
    authStore: { set: { typeOfLogin: mocks.loginType } },
    SocialLoginTypes: {
        google: 'google',
        apple: 'apple',
        sms: 'sms',
        passwordless: 'passwordless',
        scoutsSSO: 'scoutsSSO',
    },
    useModal: () => ({ newModal: mocks.modal }),
    ModalTypes: { Cancel: 'cancel' },
    useToast: () => ({ presentToast: mocks.toast }),
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    getLogger: () => mocks.log,
}));

import { useFirebase } from './useFirebase';

describe('Scouts sign-in adapter routing', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.native.mockReturnValue(false);
        vi.stubGlobal('window', {
            location: { href: 'https://pass.scout.org/login?mode=signIn&oobCode=code' },
            localStorage: { getItem: vi.fn().mockReturnValue('stored@example.org') },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it.each([
        ['auth/network-request-failed', 'error', false],
        ['auth/popup-closed-by-user', 'warn', false],
        ['auth/popup-blocked', 'warn', false],
        ['auth/cancelled-popup-request', 'warn', false],
        ['unknown', 'error', true],
    ] as const)(
        'records Google failure %s before presenting help',
        async (code, level, assertion) => {
            vi.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(31000);
            const error = assertion
                ? new Error('INTERNAL ASSERTION FAILED: Pending promise was never set')
                : { code, customData: { email: 'private@example.org', idToken: 'private-token' } };
            mocks.adapter.signInWithGoogle.mockRejectedValue(error);
            mocks.adapter.getCurrentUser.mockReturnValue({ id: 'private-user-id' });

            await useFirebase().googleLogin();

            const context = {
                attemptId: expect.any(Number),
                provider: 'google',
                isNativePlatform: false,
            };
            expect(mocks.log.info).toHaveBeenCalledWith('Google sign-in started', context);
            expect(mocks.log[level]).toHaveBeenCalledExactlyOnceWith(
                level === 'warn' ? 'Google sign-in did not complete' : 'Google sign-in failed',
                {
                    ...context,
                    elapsedMs: 30000,
                    authUserPresent: true,
                    errorCode: code,
                    internalAssertion: assertion,
                }
            );
            if (code === 'auth/cancelled-popup-request') {
                expect(mocks.modal).not.toHaveBeenCalled();
            } else {
                expect(mocks.modal).toHaveBeenCalledOnce();
                expect(mocks.log[level].mock.invocationCallOrder[0]).toBeLessThan(
                    mocks.modal.mock.invocationCallOrder[0]!
                );
            }
            expect(mocks.analytics).not.toHaveBeenCalled();
        }
    );

    it('keeps the original failure visible when reading auth state also fails', async () => {
        mocks.adapter.signInWithGoogle.mockRejectedValue({ code: 'auth/network-request-failed' });
        mocks.adapter.getCurrentUser.mockImplementation(() => {
            throw new Error('Auth unavailable');
        });

        await useFirebase().googleLogin();

        expect(mocks.modal).toHaveBeenCalledOnce();
        expect(mocks.log.error).toHaveBeenCalledWith(
            'Google sign-in failed',
            expect.objectContaining({
                errorCode: 'auth/network-request-failed',
                authUserPresent: undefined,
            })
        );
    });

    it('preserves Google login bookkeeping and help for blocked popups', async () => {
        const hook = useFirebase();
        await hook.googleLogin();
        expect(mocks.adapter.signInWithGoogle).toHaveBeenCalledOnce();
        expect(mocks.analytics).toHaveBeenCalledWith('login', { method: 'google' });
        expect(mocks.log.info).toHaveBeenCalledWith(
            'Google sign-in succeeded',
            expect.objectContaining({ provider: 'google', elapsedMs: expect.any(Number) })
        );
        mocks.adapter.signInWithGoogle.mockRejectedValue({ code: 'auth/popup-blocked' });
        await hook.googleLogin();
        expect(mocks.modal).toHaveBeenCalledOnce();
        expect(mocks.analytics).toHaveBeenCalledTimes(1);
    });

    it('retains web email-link URL selection and native stored-email selection', async () => {
        mocks.adapter.validateEmailLink.mockResolvedValue(true);
        const hook = useFirebase();
        await hook.verifySignInLinkAndLogin('entered@example.org', 'native-link');
        expect(mocks.adapter.verifyEmailLink).toHaveBeenLastCalledWith(
            'entered@example.org',
            window.location.href
        );
        expect(mocks.loginType).not.toHaveBeenCalled();
        mocks.native.mockReturnValue(true);
        await hook.verifySignInLinkAndLogin('entered@example.org', 'native-link');
        expect(mocks.adapter.verifyEmailLink).toHaveBeenLastCalledWith(
            'stored@example.org',
            'native-link'
        );
        expect(mocks.loginType).toHaveBeenCalledWith('passwordless');
    });

    it('does not verify invalid email links', async () => {
        mocks.adapter.validateEmailLink.mockResolvedValue(false);
        await useFirebase().verifySignInLinkAndLogin('email@example.org', 'link');
        expect(mocks.adapter.verifyEmailLink).not.toHaveBeenCalled();
    });

    it('confirms phone codes through adapter-owned state before success', async () => {
        const success = vi.fn();
        const error = vi.fn();
        const hook = useFirebase();
        await hook.verifySmsAuthCodeOnNative('123456', success, error);
        expect(mocks.adapter.confirmPhoneOtp).toHaveBeenCalledWith('123456');
        expect(success).toHaveBeenCalledOnce();
        expect(error).not.toHaveBeenCalled();
        expect(mocks.analytics).toHaveBeenCalledWith('login', { method: 'sms' });
    });

    it('retains phone errors and refresh toast', async () => {
        mocks.adapter.confirmPhoneOtp.mockRejectedValue({ code: 5111 });
        const success = vi.fn();
        const error = vi.fn();
        await useFirebase().verifySmsAuthCode('123456', success, error);
        expect(success).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledWith('5111');
        expect(mocks.toast).toHaveBeenCalledWith('Refresh', {
            type: 'error',
            hasDismissButton: true,
        });
    });

    it('preserves native Apple cancellation classification and no native login event', async () => {
        mocks.native.mockReturnValue(true);
        const hook = useFirebase();
        await hook.appleLogin();
        expect(mocks.analytics).not.toHaveBeenCalled();
        mocks.adapter.signInWithApple.mockRejectedValue(new Error('1001'));
        await hook.appleLogin();
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('routes both Scouts SSO exchanges and preserves their analytics', async () => {
        const hook = useFirebase();
        await hook.signInWithCustomFirebaseToken('custom-token');
        await hook.signInWithCustomOAuthProvider('oidc-token');
        expect(mocks.adapter.signInWithCustomToken).toHaveBeenCalledWith('custom-token');
        expect(mocks.adapter.signInWithOidcCredential).toHaveBeenCalledWith(
            'oidc.keycloak-world-scouts-sso',
            'oidc-token'
        );
        expect(mocks.analytics).toHaveBeenCalledTimes(2);
        expect(mocks.analytics).toHaveBeenLastCalledWith('login', { method: 'scoutsSSO' });
    });

    it('preserves the account deletion error code', async () => {
        mocks.adapter.deleteAccount.mockRejectedValue({ code: 'auth/requires-recent-login' });
        expect(await useFirebase().deleteFirebaseUser()).toEqual({
            success: false,
            message: 'auth/requires-recent-login',
        });
    });
});
