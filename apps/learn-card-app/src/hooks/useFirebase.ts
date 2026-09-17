import React from 'react';
import { Capacitor } from '@capacitor/core';

import {
    useAnalytics,
    AnalyticsEvents,
    LAST_LOGIN_METHOD_KEY,
    createFlowLifecycle,
    type FlowLifecycle,
} from '@analytics';
import {
    emitAuthDebugEvent,
    emitAuthSuccess,
    emitAuthError,
} from '../components/debug/authDebugEvents';
import { useIonAlert } from '@ionic/react';

import {
    authStore,
    SocialLoginTypes,
    useSignInAdapter,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import GoogleLoginHelpModal from '../components/auth/GoogleLoginHelpModal';
import { onGoogleSignedIn } from './signInInstrumentation';

import {
    acquireSocialLoginLock,
    createSocialLoginLockOwnerId,
    refreshSocialLoginLock,
    releaseSocialLoginLock,
    SOCIAL_LOGIN_LOCK_HEARTBEAT_MS,
} from './socialLoginLock';

import { getLogger } from 'learn-card-base';
import * as m from '../paraglide/messages.js';
const log = getLogger('use-firebase');

type SocialLoginProvider = SocialLoginTypes.apple | SocialLoginTypes.google;
type SocialLoginAuthSurface = 'native_sdk' | 'web_popup';
type SocialLoginCancellationReason = 'native_cancelled' | 'popup_closed' | 'request_superseded';
type SocialLoginFailureReason =
    | 'missing_initial_state'
    | 'missing_popup_result'
    | 'missing_credential'
    | 'missing_user'
    | 'network'
    | 'popup_blocked'
    | 'provider_internal'
    | 'unknown';

interface SocialLoginAttempt {
    provider: SocialLoginProvider;
    authSurface: SocialLoginAuthSurface;
    lifecycle: FlowLifecycle;
    lockHeartbeatId?: ReturnType<typeof setInterval>;
    lockOwnerId?: string;
    releaseOnUnload?: () => void;
}

interface AuthErrorDetails {
    code?: string;
    message?: string;
}

const getErrorCode = (error: unknown): string | number | undefined => {
    if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
    return typeof error.code === 'string' || typeof error.code === 'number'
        ? error.code
        : undefined;
};

// These raw values are used only for local classification. Never forward them
// to analytics, debug events, or error reporting.
const getAuthErrorDetails = (error: unknown): AuthErrorDetails => {
    if (!error || typeof error !== 'object') return {};

    const { code, message } = error as { code?: unknown; message?: unknown };

    return {
        code: typeof code === 'string' || typeof code === 'number' ? String(code) : undefined,
        message: typeof message === 'string' ? message : undefined,
    };
};

const getSocialLoginCancellationReason = (
    error: unknown,
    authSurface: SocialLoginAuthSurface,
    provider: SocialLoginProvider
): SocialLoginCancellationReason | null => {
    const { code, message } = getAuthErrorDetails(error);

    if (code === 'auth/cancelled-popup-request' || code === 'cancelled-popup-request') {
        return 'request_superseded';
    }

    if (code === 'auth/popup-closed-by-user' || code === 'popup-closed-by-user') {
        return 'popup_closed';
    }

    const isNativeAppleCancellation =
        code === '1001' ||
        (message?.includes('1001') &&
            (message.includes('AuthenticationServices.AuthorizationError') ||
                message.includes('ASAuthorizationError')));

    if (
        authSurface === 'native_sdk' &&
        provider === SocialLoginTypes.apple &&
        isNativeAppleCancellation
    ) {
        return 'native_cancelled';
    }

    if (
        authSurface === 'native_sdk' &&
        provider === SocialLoginTypes.google &&
        (code === '-5' ||
            code === '12501' ||
            message?.toLowerCase().includes('authorization canceled') ||
            message?.toLowerCase().includes('authorization cancelled') ||
            message?.toLowerCase().includes('user canceled') ||
            message?.toLowerCase().includes('user cancelled'))
    ) {
        return 'native_cancelled';
    }

    return null;
};

const getSocialLoginFailureReason = (error: unknown): SocialLoginFailureReason => {
    const { code, message } = getAuthErrorDetails(error);

    if (code === 'auth/popup-blocked' || code === 'popup-blocked') return 'popup_blocked';
    if (code === 'auth/network-request-failed' || code === 'network-request-failed') {
        return 'network';
    }
    if (
        message?.includes('missing initial state') ||
        message?.includes('Pending promise was never set')
    ) {
        return 'missing_initial_state';
    }
    if (message?.includes('INTERNAL ASSERTION FAILED')) return 'provider_internal';
    if (message === 'No authenticated user after sign-in') return 'missing_user';
    if (message === 'Missing popup result') return 'missing_popup_result';
    if (message === 'Missing OAuth credential') return 'missing_credential';

    return 'unknown';
};

let activeSocialLoginAttemptId: string | null = null;

export const useFirebase = () => {
    const adapter = useSignInAdapter();
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { presentToast } = useToast();
    const [presentAlert] = useIonAlert();
    const { track } = useAnalytics();

    const trackLogin = (method: SocialLoginTypes): void => {
        try {
            localStorage.setItem(LAST_LOGIN_METHOD_KEY, method);
        } catch {
            log.warn('Unable to persist the last login method');
        }

        void track(AnalyticsEvents.LOGIN, { method });
    };

    const beginSocialLogin = (provider: SocialLoginProvider): SocialLoginAttempt | null => {
        if (activeSocialLoginAttemptId) {
            presentToast(m['login.social.inProgress'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return null;
        }

        const authSurface: SocialLoginAuthSurface = Capacitor.isNativePlatform()
            ? 'native_sdk'
            : 'web_popup';
        // Browser tabs need a shared lease. Native auth is coordinated by the
        // Capacitor provider and must not depend on browser storage.
        const lockOwnerId =
            authSurface === 'web_popup' ? createSocialLoginLockOwnerId() : undefined;

        if (lockOwnerId && !acquireSocialLoginLock(lockOwnerId)) {
            presentToast(m['login.social.inProgress'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return null;
        }

        const lifecycle = createFlowLifecycle();
        activeSocialLoginAttemptId = lifecycle.id;
        const releaseOnUnload = lockOwnerId ? () => releaseSocialLoginLock(lockOwnerId) : undefined;

        if (releaseOnUnload && typeof window !== 'undefined') {
            window.addEventListener('pagehide', releaseOnUnload);
        }

        const attempt: SocialLoginAttempt = {
            provider,
            authSurface,
            lifecycle,
            lockHeartbeatId: lockOwnerId
                ? setInterval(
                      () => refreshSocialLoginLock(lockOwnerId),
                      SOCIAL_LOGIN_LOCK_HEARTBEAT_MS
                  )
                : undefined,
            lockOwnerId,
            releaseOnUnload,
        };

        void track(AnalyticsEvents.SOCIAL_LOGIN_STARTED, {
            flow_id: attempt.lifecycle.id,
            provider: attempt.provider,
            auth_surface: attempt.authSurface,
        });

        return attempt;
    };

    const releaseSocialLoginAttempt = (attempt: SocialLoginAttempt): void => {
        if (activeSocialLoginAttemptId === attempt.lifecycle.id) {
            activeSocialLoginAttemptId = null;
        }

        if (attempt.releaseOnUnload && typeof window !== 'undefined') {
            window.removeEventListener('pagehide', attempt.releaseOnUnload);
        }

        if (attempt.lockHeartbeatId) {
            clearInterval(attempt.lockHeartbeatId);
        }

        if (attempt.lockOwnerId) {
            releaseSocialLoginLock(attempt.lockOwnerId);
        }
    };

    const completeSocialLogin = (attempt: SocialLoginAttempt): void => {
        if (!attempt.lifecycle.terminate()) return;

        void track(AnalyticsEvents.SOCIAL_LOGIN_SUCCEEDED, {
            flow_id: attempt.lifecycle.id,
            provider: attempt.provider,
            auth_surface: attempt.authSurface,
            duration_ms: attempt.lifecycle.durationMs(),
        });
    };

    const cancelSocialLogin = (
        attempt: SocialLoginAttempt,
        reason: SocialLoginCancellationReason
    ): void => {
        if (!attempt.lifecycle.terminate()) return;

        void track(AnalyticsEvents.SOCIAL_LOGIN_CANCELLED, {
            flow_id: attempt.lifecycle.id,
            provider: attempt.provider,
            auth_surface: attempt.authSurface,
            duration_ms: attempt.lifecycle.durationMs(),
            reason,
        });
    };

    const failSocialLogin = (
        attempt: SocialLoginAttempt,
        failureReason: SocialLoginFailureReason
    ): void => {
        if (!attempt.lifecycle.terminate()) return;

        void track(AnalyticsEvents.SOCIAL_LOGIN_FAILED, {
            flow_id: attempt.lifecycle.id,
            provider: attempt.provider,
            auth_surface: attempt.authSurface,
            duration_ms: attempt.lifecycle.durationMs(),
            failure_reason: failureReason,
        });
    };

    const presentGoogleHelpModal = (message?: string) => {
        newModal(React.createElement(GoogleLoginHelpModal, { message }), {
            sectionClassName: '!max-w-[420px]',
        });
    };

    const deleteFirebaseUser = async (): Promise<{
        success: boolean;
        message: string | number | null | undefined;
    }> => {
        try {
            await adapter.deleteAccount();
            return {
                success: true,
                message: null,
            };
        } catch (error) {
            return {
                success: false,
                message: getErrorCode(error),
            };
        }
    };

    const googleLogin = async (): Promise<boolean> => {
        const attempt = beginSocialLogin(SocialLoginTypes.google);
        if (!attempt) return false;

        emitAuthDebugEvent('auth:login_start', 'Google login initiated', {
            data: { provider: attempt.provider, flowId: attempt.lifecycle.id },
        });

        let recorded = false;
        const recordSignedIn = (): void => {
            if (recorded) return;
            recorded = true;
            authStore.set.typeOfLogin(SocialLoginTypes.google);

            emitAuthSuccess('firebase:auth_state_change', 'Firebase Google auth successful', {
                provider: attempt.provider,
                flowId: attempt.lifecycle.id,
            });

            trackLogin(SocialLoginTypes.google);
        };
        const unsubscribe = onGoogleSignedIn(recordSignedIn);

        try {
            await adapter.signInWithGoogle();
            // Other providers need not emit Firebase's pre-sync notification.
            recordSignedIn();

            completeSocialLogin(attempt);
            // AuthCoordinator auto-handles key derivation when firebaseUser changes
            return true;
        } catch (error) {
            const { code: errorCode } = getAuthErrorDetails(error);
            const cancellationReason = getSocialLoginCancellationReason(
                error,
                attempt.authSurface,
                attempt.provider
            );

            if (cancellationReason) {
                cancelSocialLogin(attempt, cancellationReason);
                emitAuthDebugEvent('auth:login_error', 'Google login cancelled', {
                    level: 'warning',
                    data: {
                        provider: attempt.provider,
                        flowId: attempt.lifecycle.id,
                        reason: cancellationReason,
                    },
                });
                log.warn('Google login cancelled', { reason: cancellationReason });
                return false;
            }

            const failureReason = getSocialLoginFailureReason(error);
            failSocialLogin(attempt, failureReason);
            emitAuthDebugEvent('auth:login_error', 'Google login failed', {
                level: 'error',
                data: {
                    provider: attempt.provider,
                    flowId: attempt.lifecycle.id,
                    failureReason,
                },
            });

            if (
                failureReason === 'network' ||
                failureReason === 'missing_initial_state' ||
                failureReason === 'provider_internal'
            ) {
                presentGoogleHelpModal(m['login.social.googleStartFailed']());
                return false;
            }

            if (failureReason === 'popup_blocked') {
                log.warn('Google login popup blocked');
                presentGoogleHelpModal(m['login.social.popupBlocked']());
            } else {
                log.error('Google login failed', {
                    failureReason,
                    hasProviderCode: Boolean(errorCode),
                });
                presentGoogleHelpModal(m['login.social.genericError']());
            }

            return false;
        } finally {
            unsubscribe();
            releaseSocialLoginAttempt(attempt);
        }
    };

    const sendSignInLink = async (email: string, customRedirectUrl?: string): Promise<void> => {
        void adapter
            .sendEmailLink(email, customRedirectUrl)
            .then(() => {
                window.localStorage.setItem('emailForSignIn', email);
                presentToast('A login link has been sent to your email.', {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });
            })
            .catch(error => {
                log.error('sendSignInLinkToEmail::error', error);
                presentToast('An error occurred, unable to send a login link!', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            });
    };

    const verifySignInLinkAndLogin = async (email: string, authLink: string): Promise<void> => {
        if (!email || !authLink) return;

        emitAuthDebugEvent('auth:login_start', 'Email link verification started', {
            data: { email },
        });

        if (Capacitor.isNativePlatform()) {
            // Get the email if available. This should be available if the user completes
            // the flow on the same device where they started it.
            const emailLink = authLink;

            try {
                // Confirm the link is a sign-in with email link.
                const isSignInWithEmailLink = await adapter.validateEmailLink(emailLink);
                const email = window.localStorage.getItem('emailForSignIn');

                if (isSignInWithEmailLink && email) {
                    // Sign in on web layer
                    const user = await adapter.verifyEmailLink(email, emailLink);

                    if (user) {
                        localStorage.removeItem('emailForSignIn');
                        authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
                        trackLogin(SocialLoginTypes.passwordless);
                        emitAuthSuccess(
                            'firebase:auth_state_change',
                            'Email link auth successful',
                            {
                                data: { uid: user.id },
                            }
                        );
                    }
                }
            } catch (error) {
                const errorCode = getErrorCode(error);
                const errorMessage = getAuthErrorDetails(error).message;

                emitAuthError('auth:login_error', `Email link login failed: ${errorCode}`, error);

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);
                if (errorMessage) presentAlert(errorMessage);
            }
        } else {
            try {
                const _isSigninWithEmailLink: boolean =
                    (await adapter.validateEmailLink(window.location.href)) && !!email;
                if (_isSigninWithEmailLink) {
                    await adapter.verifyEmailLink(email, window.location.href);
                    authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
                    trackLogin(SocialLoginTypes.passwordless);

                    localStorage.removeItem('emailForSignIn');
                }
            } catch (error) {
                const errorCode = getErrorCode(error);
                const errorMessage = getAuthErrorDetails(error).message;

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);
                if (errorMessage) presentAlert(errorMessage);
            }
        }
    };

    type AuthCallback = (error?: string | number) => void;

    const sendSmsAuthCode = async (
        phoneNumber: string,
        successCallback: AuthCallback,
        errorCallback: AuthCallback
    ) => {
        emitAuthDebugEvent('auth:login_start', 'SMS auth code requested', {
            data: { phoneNumber: phoneNumber.slice(0, 4) + '****' },
        });

        // ! https://firebase.google.com/docs/auth/web/phone-auth#integration-testing
        // ! Only fictional phone numbers can be used when testing locally

        // send sms auth code
        void adapter
            .sendPhoneOtp(phoneNumber)
            .then(() => {
                emitAuthDebugEvent('auth:login_start', 'SMS code sent successfully');
                successCallback();
            })
            .catch(error => {
                const errorCode = getErrorCode(error);

                emitAuthError('auth:login_error', `SMS send failed: ${errorCode}`, error);
                errorCallback(errorCode ?? getAuthErrorDetails(error).message);

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);
            });
    };

    const loginAfterAutoVerifiedSMS = async (
        verificationCode: string,
        successCallback: AuthCallback,
        errorCallback: AuthCallback
    ) => {
        // This has to happen before web3auth init because of a race condition when autoverifying the user,
        // where it will try to login on native before we are able to login here, so this needs to happen first.
        let user;
        try {
            user = await adapter.confirmPhoneOtp(verificationCode || '');
        } catch (error) {
            log.info('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(getAuthErrorDetails(error).message);
        }

        if (!user) {
            errorCallback('Verification code could not be verified');
            return;
        }

        try {
            if (user) {
                successCallback();
                authStore.set.typeOfLogin(SocialLoginTypes.sms);
                trackLogin(SocialLoginTypes.sms);
            }
        } catch (error) {
            log.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(getAuthErrorDetails(error).message);
        }
    };

    const verifySmsAuthCode = async (
        code: string | number,
        successCallback: AuthCallback,
        errorCallback: AuthCallback
    ) => {
        emitAuthDebugEvent('auth:login_start', 'Verifying SMS code');

        try {
            const user = await adapter.confirmPhoneOtp(code);
            authStore.set.typeOfLogin(SocialLoginTypes.sms);

            emitAuthSuccess('firebase:auth_state_change', 'SMS verification successful', {
                data: { uid: user.id },
            });
            trackLogin(SocialLoginTypes.sms);

            successCallback();
        } catch (error) {
            const errorCode = getErrorCode(error);

            errorCallback(errorCode ?? getAuthErrorDetails(error).message);

            log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);

            if (errorCode === 5111) {
                presentToast('An error occured. Please refresh to fix.', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }
    };

    const verifySmsAuthCodeOnNative = async (
        verificationCode: string | number,
        successCallback: AuthCallback,
        errorCallback: AuthCallback
    ) => {
        try {
            const user = await adapter.confirmPhoneOtp(verificationCode || '');
            if (user) {
                authStore.set.typeOfLogin(SocialLoginTypes.sms);
                trackLogin(SocialLoginTypes.sms);

                successCallback();
            }
        } catch (error) {
            log.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(getAuthErrorDetails(error).message);
        }
    };

    const appleLogin = async (): Promise<boolean> => {
        const attempt = beginSocialLogin(SocialLoginTypes.apple);
        if (!attempt) return false;

        emitAuthDebugEvent('auth:login_start', 'Apple login initiated', {
            data: { provider: attempt.provider, flowId: attempt.lifecycle.id },
        });

        try {
            await adapter.signInWithApple();
            if (Capacitor.isNativePlatform()) {
                authStore.set.typeOfLogin(SocialLoginTypes.apple);
                trackLogin(SocialLoginTypes.apple);

                emitAuthSuccess(
                    'firebase:auth_state_change',
                    'Firebase Apple auth successful (native)',
                    {
                        provider: attempt.provider,
                        flowId: attempt.lifecycle.id,
                    }
                );
            } else {
                authStore.set.typeOfLogin(SocialLoginTypes.apple);
                trackLogin(SocialLoginTypes.apple);

                emitAuthSuccess(
                    'firebase:auth_state_change',
                    'Firebase Apple auth successful (web)',
                    {
                        provider: attempt.provider,
                        flowId: attempt.lifecycle.id,
                    }
                );
            }

            completeSocialLogin(attempt);
            // AuthCoordinator auto-handles key derivation when firebaseUser changes
            return true;
        } catch (error) {
            const cancellationReason = getSocialLoginCancellationReason(
                error,
                attempt.authSurface,
                attempt.provider
            );

            if (cancellationReason) {
                cancelSocialLogin(attempt, cancellationReason);
                emitAuthDebugEvent('auth:login_error', 'Apple login cancelled', {
                    level: 'warning',
                    data: {
                        provider: attempt.provider,
                        flowId: attempt.lifecycle.id,
                        reason: cancellationReason,
                    },
                });
                log.warn('Apple login cancelled', { reason: cancellationReason });
                return false;
            }

            const failureReason = getSocialLoginFailureReason(error);
            failSocialLogin(attempt, failureReason);
            emitAuthDebugEvent('auth:login_error', 'Apple login failed', {
                level: 'error',
                data: {
                    provider: attempt.provider,
                    flowId: attempt.lifecycle.id,
                    failureReason,
                },
            });

            if (failureReason === 'popup_blocked') {
                log.warn('Apple login popup blocked');
                presentAlert(m['login.social.popupBlocked']());
            } else {
                log.error('Apple login failed', { failureReason });
                presentAlert(m['login.social.genericError']());
            }

            return false;
        } finally {
            releaseSocialLoginAttempt(attempt);
        }
    };

    const verifyAppleLogin = async (): Promise<void> => {
        if (!Capacitor.isNativePlatform()) {
            try {
                const result = await adapter.checkRedirectResult?.();
                if (!result) {
                    return;
                }
                authStore.set.typeOfLogin(SocialLoginTypes.apple);
                trackLogin(SocialLoginTypes.apple);
            } catch (error) {
                const errorCode = getErrorCode(error);
                const errorMessage = getAuthErrorDetails(error).message;

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);

                if (errorMessage) presentAlert(errorMessage);
            }
        }
    };

    const signInWithCustomFirebaseToken = async (customToken: string): Promise<void> => {
        try {
            await adapter.signInWithCustomToken(customToken);
            authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
            trackLogin(SocialLoginTypes.passwordless);
        } catch (error) {
            const errorCode = getErrorCode(error);
            const errorMessage = getAuthErrorDetails(error).message;
            log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);

            if (errorMessage) presentAlert(errorMessage);
        }
    };

    return {
        sendSignInLink,
        verifySignInLinkAndLogin,
        sendSmsAuthCode,
        verifySmsAuthCode,
        verifySmsAuthCodeOnNative,
        loginAfterAutoVerifiedSMS,
        appleLogin,
        googleLogin,
        verifyAppleLogin,
        deleteFirebaseUser,
        signInWithCustomFirebaseToken,
    };
};

export default useFirebase;
