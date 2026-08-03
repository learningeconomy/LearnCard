import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsEvents } from '../analytics/events';
import { SOCIAL_LOGIN_LOCK_KEY } from './socialLoginLock';

const mocks = vi.hoisted(() => ({
    appleSignIn: vi.fn(),
    debugEvent: vi.fn(),
    firebaseAuth: { currentUser: null as null | { getIdToken: () => Promise<string> } },
    flowNumber: 0,
    getCurrentUser: vi.fn(),
    getIdToken: vi.fn(),
    googleSignIn: vi.fn(),
    isNative: true,
    logError: vi.fn(),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    presentAlert: vi.fn(),
    presentToast: vi.fn(),
    signInWithCredential: vi.fn(),
    signInWithPopup: vi.fn(),
    track: vi.fn<(event: string, properties: Record<string, unknown>) => Promise<void>>(() =>
        Promise.resolve()
    ),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => mocks.isNative,
    },
}));

vi.mock('@capacitor-firebase/authentication', () => ({
    FirebaseAuthentication: {
        getCurrentUser: mocks.getCurrentUser,
        getIdToken: mocks.getIdToken,
        sendSignInLinkToEmail: vi.fn(),
        signInWithApple: mocks.appleSignIn,
        signInWithGoogle: mocks.googleSignIn,
    },
}));

vi.mock('firebase/auth', () => {
    class OAuthProvider {
        credential = vi.fn(() => ({}));

        static credentialFromError = vi.fn(() => null);
        static credentialFromResult = vi.fn(() => ({}));
    }

    return {
        deleteUser: vi.fn(),
        EmailAuthProvider: { credentialWithLink: vi.fn() },
        getRedirectResult: vi.fn(),
        GoogleAuthProvider: { credential: vi.fn(() => ({})) },
        isSignInWithEmailLink: vi.fn(),
        OAuthProvider,
        PhoneAuthProvider: { credential: vi.fn() },
        sendSignInLinkToEmail: vi.fn(),
        signInWithCredential: mocks.signInWithCredential,
        signInWithCustomToken: vi.fn(),
        signInWithEmailLink: vi.fn(),
        signInWithPhoneNumber: vi.fn(),
        signInWithPopup: mocks.signInWithPopup,
    };
});

vi.mock('@analytics', () => ({
    AnalyticsEvents: {
        LOGIN: 'login',
        SOCIAL_LOGIN_CANCELLED: 'social_login_cancelled',
        SOCIAL_LOGIN_FAILED: 'social_login_failed',
        SOCIAL_LOGIN_STARTED: 'social_login_started',
        SOCIAL_LOGIN_SUCCEEDED: 'social_login_succeeded',
    },
    LAST_LOGIN_METHOD_KEY: 'lastLoginMethod',
    createFlowLifecycle: () => {
        const id = `flow-${++mocks.flowNumber}`;
        const startedAt = Date.now();
        let terminated = false;

        return {
            id,
            startedAt,
            durationMs: () => Date.now() - startedAt,
            hasTerminated: () => terminated,
            terminate: () => {
                if (terminated) return false;
                terminated = true;
                return true;
            },
        };
    },
    useAnalytics: () => ({ track: mocks.track }),
}));

vi.mock('../components/debug/authDebugEvents', () => ({
    emitAuthDebugEvent: mocks.debugEvent,
    emitAuthError: vi.fn(),
    emitAuthSuccess: vi.fn(),
}));

vi.mock('@ionic/react', () => ({
    useIonAlert: () => [mocks.presentAlert],
}));

vi.mock('learn-card-base', () => ({
    authStore: { set: { typeOfLogin: vi.fn() } },
    destroyRecaptcha: vi.fn(),
    ensureRecaptcha: vi.fn(),
    firebaseAuthStore: { set: { firebaseAuth: vi.fn() } },
    getLogger: () => ({
        error: mocks.logError,
        info: mocks.logInfo,
        warn: mocks.logWarn,
    }),
    LOGIN_REDIRECTS: {},
    ModalTypes: { Cancel: 'cancel' },
    SocialLoginTypes: {
        apple: 'apple',
        google: 'google',
        passwordless: 'passwordless',
        sms: 'sms',
    },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    useModal: () => ({ closeModal: vi.fn(), newModal: vi.fn() }),
    useToast: () => ({ presentToast: mocks.presentToast }),
}));

vi.mock('../firebase/firebase', () => ({
    auth: () => mocks.firebaseAuth,
}));

vi.mock('../components/auth/GoogleLoginHelpModal', () => ({
    default: () => null,
}));

vi.mock('../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://learncard.app',
    getFirebaseDynamicLinkDomain: () => 'learncard.page.link',
    getFirebaseRedirectDomain: () => 'learncard.app',
    getNativeBundleId: () => 'com.learncard.app',
}));

import useFirebase from './useFirebase';

const getTrackedEvents = (event: string) =>
    mocks.track.mock.calls.filter(([trackedEvent]) => trackedEvent === event);

describe('useFirebase social login hardening', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.firebaseAuth.currentUser = null;
        mocks.flowNumber = 0;
        mocks.isNative = true;
        mocks.signInWithCredential.mockResolvedValue({});
        localStorage.clear();
    });

    it('allows only one provider attempt while a social login is pending', async () => {
        let resolveGoogleSignIn:
            | ((value: { user: object; credential: object }) => void)
            | undefined;
        const googleUser = { uid: 'google-user' };

        mocks.googleSignIn.mockReturnValue(
            new Promise(resolve => {
                resolveGoogleSignIn = resolve;
            })
        );
        mocks.getCurrentUser.mockResolvedValue({ user: googleUser });
        mocks.getIdToken.mockResolvedValue({ token: 'not-recorded' });

        const { result } = renderHook(() => useFirebase());

        let googleAttempt: Promise<void> | undefined;
        await act(async () => {
            googleAttempt = result.current.googleLogin();
            await result.current.appleLogin();
        });

        expect(mocks.googleSignIn).toHaveBeenCalledOnce();
        expect(mocks.appleSignIn).not.toHaveBeenCalled();
        expect(localStorage.getItem(SOCIAL_LOGIN_LOCK_KEY)).toBeNull();
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_STARTED)).toHaveLength(1);

        await act(async () => {
            resolveGoogleSignIn?.({ user: googleUser, credential: {} });
            await googleAttempt;
        });

        const started = getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_STARTED)[0]![1];
        const succeeded = getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_SUCCEEDED)[0]![1];

        expect(succeeded.flow_id).toBe(started.flow_id);
        expect(succeeded).toMatchObject({ provider: 'google', auth_surface: 'native_sdk' });
        expect(JSON.stringify(mocks.track.mock.calls)).not.toContain('not-recorded');
    });

    it('shares the social-login lease across hook instances', async () => {
        mocks.isNative = false;

        let resolveGoogleSignIn:
            | ((value: { user: object; credential: object }) => void)
            | undefined;
        const googleUser = { uid: 'google-user' };

        mocks.googleSignIn.mockReturnValue(
            new Promise(resolve => {
                resolveGoogleSignIn = resolve;
            })
        );
        mocks.getCurrentUser.mockResolvedValue({ user: googleUser });
        mocks.getIdToken.mockResolvedValue({ token: 'not-recorded' });

        const firstTab = renderHook(() => useFirebase());
        const secondTab = renderHook(() => useFirebase());

        let googleAttempt: Promise<void> | undefined;
        await act(async () => {
            googleAttempt = firstTab.result.current.googleLogin();
            await secondTab.result.current.appleLogin();
        });

        expect(mocks.googleSignIn).toHaveBeenCalledOnce();
        expect(mocks.signInWithPopup).not.toHaveBeenCalled();
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_STARTED)).toHaveLength(1);
        expect(mocks.presentToast).toHaveBeenCalledWith(
            'A sign-in is already in progress. Finish it before trying again.',
            expect.objectContaining({ hasDismissButton: true })
        );

        await act(async () => {
            resolveGoogleSignIn?.({ user: googleUser, credential: {} });
            await googleAttempt;
        });

        const appleUser = { getIdToken: vi.fn(() => Promise.resolve('not-recorded')) };
        mocks.signInWithPopup.mockResolvedValue({ user: appleUser });

        await act(async () => {
            await secondTab.result.current.appleLogin();
        });

        expect(mocks.signInWithPopup).toHaveBeenCalledOnce();
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_STARTED)).toHaveLength(2);
    });

    it('invokes the popup synchronously after acquiring the web lease', async () => {
        mocks.isNative = false;

        let resolveAppleSignIn:
            | ((value: { user: { getIdToken: () => Promise<string> } }) => void)
            | undefined;
        mocks.signInWithPopup.mockReturnValue(
            new Promise(resolve => {
                resolveAppleSignIn = resolve;
            })
        );

        const { result } = renderHook(() => useFirebase());
        let appleAttempt: Promise<void> | undefined;

        act(() => {
            appleAttempt = result.current.appleLogin();
            expect(mocks.signInWithPopup).toHaveBeenCalledOnce();
        });

        await act(async () => {
            resolveAppleSignIn?.({
                user: { getIdToken: () => Promise.resolve('not-recorded') },
            });
            await appleAttempt;
        });
    });

    it('releases the web lease when the popup is closed', async () => {
        mocks.isNative = false;
        mocks.googleSignIn.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

        const { result } = renderHook(() => useFirebase());

        await act(async () => {
            await result.current.googleLogin();
        });

        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_CANCELLED)).toHaveLength(1);
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_FAILED)).toHaveLength(0);

        const appleUser = { getIdToken: vi.fn(() => Promise.resolve('not-recorded')) };
        mocks.signInWithPopup.mockResolvedValue({ user: appleUser });

        await act(async () => {
            await result.current.appleLogin();
        });

        expect(mocks.signInWithPopup).toHaveBeenCalledOnce();
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_STARTED)).toHaveLength(2);
    });

    it('records native Google cancellation without recording the provider message', async () => {
        mocks.googleSignIn.mockRejectedValue({
            code: null,
            message:
                'Authorization canceled. https://learncard.app/__/auth/handler?code=oauth-secret&state=state-secret',
        });

        const { result } = renderHook(() => useFirebase());

        await act(async () => {
            await result.current.googleLogin();
        });

        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_CANCELLED)).toHaveLength(1);
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_FAILED)).toHaveLength(0);
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_SUCCEEDED)).toHaveLength(0);
        expect(getTrackedEvents(AnalyticsEvents.SOCIAL_LOGIN_CANCELLED)[0]![1]).toMatchObject({
            provider: 'google',
            auth_surface: 'native_sdk',
            reason: 'native_cancelled',
        });

        const recordedData = JSON.stringify({
            analytics: mocks.track.mock.calls,
            debug: mocks.debugEvent.mock.calls,
            errors: mocks.logError.mock.calls,
            info: mocks.logInfo.mock.calls,
            warnings: mocks.logWarn.mock.calls,
        });

        expect(recordedData).not.toContain('oauth-secret');
        expect(recordedData).not.toContain('state-secret');
        expect(recordedData).not.toContain('/__/auth/handler');
    });
});
