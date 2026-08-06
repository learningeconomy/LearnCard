import React from 'react';
import { Capacitor } from '@capacitor/core';
import {
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,
    signInWithPhoneNumber,
    signInWithPopup,
    OAuthProvider,
    getRedirectResult,
    signInWithCredential,
    GoogleAuthProvider,
    PhoneAuthProvider,
    deleteUser,
    EmailAuthProvider,
    signInWithCustomToken,
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

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
    firebaseAuthStore,
    LOGIN_REDIRECTS,
    useModal,
    ModalTypes,
    ensureRecaptcha,
    destroyRecaptcha,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { auth } from '../firebase/firebase';
import GoogleLoginHelpModal from '../components/auth/GoogleLoginHelpModal';

import {
    getAppBaseUrl,
    getFirebaseRedirectDomain,
    getFirebaseDynamicLinkDomain,
    getNativeBundleId,
} from '../config/bootstrapTenantConfig';
import {
    acquireSocialLoginLock,
    createSocialLoginLockOwnerId,
    refreshSocialLoginLock,
    releaseSocialLoginLock,
    SOCIAL_LOGIN_LOCK_HEARTBEAT_MS,
} from './socialLoginLock';

import { getLogger } from 'learn-card-base';
const log = getLogger('use-firebase');

type SocialLoginProvider = SocialLoginTypes.apple | SocialLoginTypes.google;
type SocialLoginAuthSurface = 'native_sdk' | 'web_popup';
type SocialLoginCancellationReason = 'native_cancelled' | 'popup_closed' | 'request_superseded';
type SocialLoginFailureReason =
    | 'missing_initial_state'
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
}

interface AuthErrorDetails {
    code?: string;
    message?: string;
}

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

    if (
        authSurface === 'native_sdk' &&
        provider === SocialLoginTypes.apple &&
        (code === '1001' || message?.includes('1001'))
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

    return 'unknown';
};

export const useFirebase = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { presentToast } = useToast();
    const [presentAlert] = useIonAlert();
    const { track } = useAnalytics();
    const socialLoginInFlightRef = React.useRef(false);

    const trackLogin = (method: SocialLoginTypes) => {
        try {
            localStorage.setItem(LAST_LOGIN_METHOD_KEY, method);
        } catch {
            log.warn('Unable to persist the last login method');
        }

        void track(AnalyticsEvents.LOGIN, { method });
    };

    const beginSocialLogin = (provider: SocialLoginProvider): SocialLoginAttempt | null => {
        if (socialLoginInFlightRef.current) return null;

        const authSurface: SocialLoginAuthSurface = Capacitor.isNativePlatform()
            ? 'native_sdk'
            : 'web_popup';
        // Browser tabs need a shared lease. Native auth is coordinated by the
        // Capacitor provider and must not depend on browser storage.
        const lockOwnerId =
            authSurface === 'web_popup' ? createSocialLoginLockOwnerId() : undefined;

        if (lockOwnerId && !acquireSocialLoginLock(lockOwnerId)) {
            presentToast('A sign-in is already in progress. Finish it before trying again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return null;
        }

        socialLoginInFlightRef.current = true;

        const attempt: SocialLoginAttempt = {
            provider,
            authSurface,
            lifecycle: createFlowLifecycle(),
            lockHeartbeatId: lockOwnerId
                ? setInterval(
                      () => refreshSocialLoginLock(lockOwnerId),
                      SOCIAL_LOGIN_LOCK_HEARTBEAT_MS
                  )
                : undefined,
            lockOwnerId,
        };

        void track(AnalyticsEvents.SOCIAL_LOGIN_STARTED, {
            flow_id: attempt.lifecycle.id,
            provider: attempt.provider,
            auth_surface: attempt.authSurface,
        });

        return attempt;
    };

    const releaseSocialLoginAttempt = (attempt: SocialLoginAttempt): void => {
        socialLoginInFlightRef.current = false;

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

    const deleteFirebaseUser = async () => {
        const firebaseAuth = auth();

        const currentUser = firebaseAuth.currentUser;

        try {
            await deleteUser(currentUser);
            return {
                success: true,
                message: null,
            };
        } catch (error) {
            return {
                success: false,
                message: error?.code,
            };
        }
    };

    const googleLogin = async (): Promise<void> => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        const attempt = beginSocialLogin(SocialLoginTypes.google);
        if (!attempt) return;

        emitAuthDebugEvent('auth:login_start', 'Google login initiated', {
            data: { provider: attempt.provider, flowId: attempt.lifecycle.id },
        });

        try {
            const signInWithGoogleRes = await FirebaseAuthentication.signInWithGoogle();
            const { user } = await FirebaseAuthentication.getCurrentUser();

            if (!signInWithGoogleRes.user || !user) {
                failSocialLogin(attempt, 'missing_user');
                return;
            }

            await FirebaseAuthentication.getIdToken();

            authStore.set.typeOfLogin(SocialLoginTypes.google);
            firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
            // Phase 2: firebaseAuthStore.set.setFirebaseCurrentUser removed —
            // the SignInAdapter subscription writes to authUserStore via onAuthStateChanged.

            emitAuthSuccess('firebase:auth_state_change', 'Firebase Google auth successful', {
                provider: attempt.provider,
                flowId: attempt.lifecycle.id,
            });

            trackLogin(SocialLoginTypes.google);

            // sign in on web-layer
            if (Capacitor.isNativePlatform()) {
                try {
                    const credential = GoogleAuthProvider.credential(
                        signInWithGoogleRes.credential?.idToken
                    );
                    await signInWithCredential(firebaseAuth, credential);
                } catch (error) {
                    log.info('Google web-layer credential sign-in failed', {
                        failureReason: getSocialLoginFailureReason(error),
                    });
                }
            }

            completeSocialLogin(attempt);
            // AuthCoordinator auto-handles key derivation when firebaseUser changes
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
                return;
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
                presentGoogleHelpModal(
                    'Google sign-in failed to start. If the issue persists, please check your browser settings, clear the site data, refresh the page and try again. You may also try using a different browser or incognito mode.'
                );
                return;
            }

            if (failureReason === 'popup_blocked') {
                log.warn('Google login popup blocked');
                presentGoogleHelpModal(
                    'Popups are blocked in your browser. Please enable popups in your browser and try again.'
                );
            } else {
                log.error('Google login failed', {
                    failureReason,
                    hasProviderCode: Boolean(errorCode),
                });
                presentGoogleHelpModal('Something went wrong. Please try again.');
            }
        } finally {
            releaseSocialLoginAttempt(attempt);
        }
    };

    const sendSignInLink = async (email: string, customRedirectUrl?: string) => {
        const firebaseRedirectDomain = getFirebaseRedirectDomain();
        const bundleId = getNativeBundleId();
        const dynamicLinkDomain = getFirebaseDynamicLinkDomain();

        if (Capacitor.isNativePlatform()) {
            let url = `https://${firebaseRedirectDomain}/login`;
            if (customRedirectUrl) url = customRedirectUrl;

            FirebaseAuthentication.sendSignInLinkToEmail({
                email,
                actionCodeSettings: {
                    // URL you want to redirect back to. The domain (www.example.com) for this
                    // URL must be in the authorized domains list in the Firebase Console.
                    url,
                    // This must be true.
                    handleCodeInApp: true,
                    iOS: {
                        bundleId,
                    },
                    android: {
                        packageName: bundleId,
                        installApp: true,
                        minimumVersion: '12',
                    },
                    dynamicLinkDomain,
                },
            })
                .then(res => {
                    // The link was successfully sent. Inform the user.
                    // Save the email locally so you don't need to ask the user for it again
                    // if they open the link on the same device.
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
        } else {
            let url = `${getAppBaseUrl()}/login`;
            if (customRedirectUrl) url = customRedirectUrl;

            const actionCodeSettings = {
                // URL you want to redirect back to. The domain (www.example.com) for this
                // URL must be in the authorized domains list in the Firebase Console.
                url,

                // This must be true.
                handleCodeInApp: true,
            };
            sendSignInLinkToEmail(auth(), email, actionCodeSettings)
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
        }
    };

    const verifySignInLinkAndLogin = async (email: string, authLink: string) => {
        if (!email || !authLink) return;

        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        emitAuthDebugEvent('auth:login_start', 'Email link verification started', {
            data: { email },
        });

        if (Capacitor.isNativePlatform()) {
            // Get the email if available. This should be available if the user completes
            // the flow on the same device where they started it.
            const emailLink = authLink;

            try {
                // Confirm the link is a sign-in with email link.
                const { isSignInWithEmailLink } =
                    await FirebaseAuthentication.isSignInWithEmailLink({
                        emailLink,
                    });
                const email = window.localStorage.getItem('emailForSignIn');

                if (isSignInWithEmailLink && email) {
                    // Sign in on web layer
                    const credential = EmailAuthProvider.credentialWithLink(email, emailLink);
                    const { user } = await signInWithCredential(firebaseAuth, credential);

                    if (user) {
                        const token = await user.getIdToken();

                        if (token) {
                            // Clear email from storage.
                            localStorage.removeItem('emailForSignIn');
                            authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
                            trackLogin(SocialLoginTypes.passwordless);
                            firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);

                            emitAuthSuccess(
                                'firebase:auth_state_change',
                                'Email link auth successful',
                                {
                                    data: { uid: user?.uid },
                                }
                            );

                            // AuthCoordinator auto-handles key derivation when firebaseUser changes
                        }
                    }
                }
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                emitAuthError('auth:login_error', `Email link login failed: ${errorCode}`, error);

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);
                if (errorMessage) presentAlert(errorMessage);
            }
        } else {
            try {
                const _isSigninWithEmailLink: boolean =
                    isSignInWithEmailLink(firebaseAuth, window.location.href) && !!email;
                if (_isSigninWithEmailLink) {
                    const result = await signInWithEmailLink(
                        firebaseAuth,
                        email,
                        window.location.href
                    );
                    const token = await result.user.getIdToken(true);
                    const user = result?.user;
                    authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
                    trackLogin(SocialLoginTypes.passwordless);

                    if (token) {
                        // AuthCoordinator auto-handles key derivation when firebaseUser changes
                        localStorage.removeItem('emailForSignIn');
                    }
                }
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);
                if (errorMessage) presentAlert(errorMessage);
            }
        }
    };

    const sendSmsAuthCode = async (
        phoneNumber: string,
        successCallback: any,
        errorCallback: any
    ) => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        emitAuthDebugEvent('auth:login_start', 'SMS auth code requested', {
            data: { phoneNumber: phoneNumber.slice(0, 4) + '****' },
        });

        // ! https://firebase.google.com/docs/auth/web/phone-auth#integration-testing
        // ! Only fictional phone numbers can be used when testing locally

        destroyRecaptcha();
        await ensureRecaptcha(firebaseAuth);

        // send sms auth code
        signInWithPhoneNumber(firebaseAuth, phoneNumber, window.recaptchaVerifier)
            .then(confirmationResult => {
                window.confirmationResult = confirmationResult;
                emitAuthDebugEvent('auth:login_start', 'SMS code sent successfully');
                successCallback();
            })
            .catch(error => {
                destroyRecaptcha();
                const errorCode = error?.code;
                const errorMessage = error?.message;

                emitAuthError('auth:login_error', `SMS send failed: ${errorCode}`, error);
                errorCallback(errorCode);

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);
            });
    };

    const loginAfterAutoVerifiedSMS = async (
        verificationCode: string,
        successCallback: any,
        errorCallback: any
    ) => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        // This has to happen before web3auth init because of a race condition when autoverifying the user,
        // where it will try to login on native before we are able to login here, so this needs to happen first.
        let user;
        try {
            const verificationId = authStore.get.verificationId();

            const credential = PhoneAuthProvider.credential(
                verificationId || '', // verificationId stored in local storage
                verificationCode || '' // verification code passed in from the phoneVerificationCompleted event
            );

            const res = await signInWithCredential(firebaseAuth, credential);
            user = res?.user;
        } catch (error) {
            log.info('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(error?.message);
        }

        if (!user) {
            errorCallback('Verification code could not be verified');
            return;
        }

        try {
            if (user) {
                // get current firebase user idToken
                const token = await user.getIdToken();
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);

                if (token) {
                    successCallback();
                    authStore.set.typeOfLogin(SocialLoginTypes.sms);
                    trackLogin(SocialLoginTypes.sms);

                    // AuthCoordinator auto-handles key derivation when authUser changes
                }
            }
        } catch (error) {
            log.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(error?.message);
        }
    };

    const verifySmsAuthCode = async (
        code: string | number,
        successCallback: any,
        errorCallback: any
    ) => {
        emitAuthDebugEvent('auth:login_start', 'Verifying SMS code');

        try {
            const result = await window?.confirmationResult?.confirm(code);
            const user = result?.user;
            const token = await result?.user?.getIdToken(true);
            authStore.set.typeOfLogin(SocialLoginTypes.sms);

            emitAuthSuccess('firebase:auth_state_change', 'SMS verification successful', {
                data: { uid: user?.uid },
            });
            trackLogin(SocialLoginTypes.sms);

            if (token) {
                successCallback();
                // AuthCoordinator auto-handles key derivation when firebaseUser changes
            }
        } catch (error) {
            const errorCode = error?.code;
            const errorMessage = error?.message;

            errorCallback(errorCode);

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
        verificationId: string | null,
        verificationCode: string | number,
        successCallback: any,
        errorCallback: any
    ) => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        try {
            // sign in on web layer
            const credential = PhoneAuthProvider.credential(
                verificationId || '',
                verificationCode || ''
            );
            const res = await signInWithCredential(firebaseAuth, credential);
            const user = res?.user;
            if (user) {
                // get current firebase user idToken
                const token = await res.user.getIdToken();
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
                authStore.set.typeOfLogin(SocialLoginTypes.sms);
                trackLogin(SocialLoginTypes.sms);

                if (token) {
                    successCallback();
                    // AuthCoordinator auto-handles key derivation when firebaseUser changes
                }
            }
        } catch (error) {
            log.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(error?.message);
        }
    };

    const appleLogin = async (): Promise<void> => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        const attempt = beginSocialLogin(SocialLoginTypes.apple);
        if (!attempt) return;

        emitAuthDebugEvent('auth:login_start', 'Apple login initiated', {
            data: { provider: attempt.provider, flowId: attempt.lifecycle.id },
        });

        try {
            if (Capacitor.isNativePlatform()) {
                const signInWithAppleResult = await FirebaseAuthentication.signInWithApple({
                    skipNativeAuth: true,
                });

                // sign in on web-layer
                const provider = new OAuthProvider('apple.com');
                const credential = provider.credential({
                    idToken: signInWithAppleResult.credential?.idToken,
                    rawNonce: signInWithAppleResult.credential?.nonce,
                });
                await signInWithCredential(firebaseAuth, credential);

                // get current logged in user
                const user = firebaseAuth.currentUser;
                if (!user) {
                    failSocialLogin(attempt, 'missing_user');
                    return;
                }

                // get current firebase user idToken
                await user.getIdToken();
                authStore.set.typeOfLogin(SocialLoginTypes.apple);
                trackLogin(SocialLoginTypes.apple);
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);

                emitAuthSuccess(
                    'firebase:auth_state_change',
                    'Firebase Apple auth successful (native)',
                    {
                        provider: attempt.provider,
                        flowId: attempt.lifecycle.id,
                    }
                );
            } else {
                const provider = new OAuthProvider('apple.com');

                const result = await signInWithPopup(firebaseAuth, provider);
                if (!result) {
                    failSocialLogin(attempt, 'missing_user');
                    return;
                }
                const credential = OAuthProvider.credentialFromResult(result);
                const user = result?.user;

                if (!credential || !user) {
                    failSocialLogin(attempt, 'missing_user');
                    return;
                }

                await user.getIdToken(true);
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
                return;
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
                presentAlert(
                    'Popups are blocked in your browser. Please enable popups and try again.'
                );
            } else {
                log.error('Apple login failed', { failureReason });
                presentAlert('Something went wrong. Please try again.');
            }
        } finally {
            releaseSocialLoginAttempt(attempt);
        }
    };

    const verifyAppleLogin = async () => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        if (!Capacitor.isNativePlatform()) {
            try {
                const result = await getRedirectResult(firebaseAuth);
                if (!result) {
                    return;
                }
                const credential = OAuthProvider.credentialFromResult(result);
                const user = result?.user;
                if (credential) {
                    const token = await result.user.getIdToken(true);
                    authStore.set.typeOfLogin(SocialLoginTypes.apple);
                    trackLogin(SocialLoginTypes.apple);

                    if (token) {
                        // AuthCoordinator auto-handles key derivation when authUser changes
                    }
                }
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);

                if (errorMessage) presentAlert(errorMessage);

                // The credential that was used.
                const credential = OAuthProvider.credentialFromError(error);
            }
        }
    };

    const signInWithCustomFirebaseToken = async (customToken: string) => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        try {
            const result = await signInWithCustomToken(auth(), customToken);
            const token = await result?.user.getIdToken();
            const user = result?.user;

            if (token) {
                authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);

                trackLogin(SocialLoginTypes.passwordless);

                // AuthCoordinator auto-handles key derivation when firebaseUser changes
            }
        } catch (error) {
            const errorCode = error?.code;
            const errorMessage = error?.message;
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
