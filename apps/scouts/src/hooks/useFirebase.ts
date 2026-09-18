import React from 'react';
import { Capacitor } from '@capacitor/core';
import { useIonAlert } from '@ionic/react';
import {
    authStore,
    SocialLoginTypes,
    useSignInAdapter,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
    getLogger,
} from 'learn-card-base';
import * as m from '../paraglide/messages.js';
import useFirebaseAnalytics from './useFirebaseAnalytics';
import GoogleLoginHelpModal from '../components/auth/GoogleLoginHelpModal';

const log = getLogger('use-firebase');
const authError = (error: unknown): { code?: string | number; message?: string } => {
    if (!error || typeof error !== 'object') return {};
    const { code, message } = error as { code?: unknown; message?: unknown };
    const normalizedCode = typeof code === 'string' || typeof code === 'number' ? code : undefined;
    const normalizedMessage = typeof message === 'string' ? message : undefined;
    return { code: normalizedCode, message: normalizedMessage };
};
type SuccessCallback = () => void;
type ErrorCallback = (error: string) => void;

export const useFirebase = () => {
    const adapter = useSignInAdapter();
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });
    const { presentToast } = useToast();
    const [presentAlert] = useIonAlert();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const presentGoogleHelpModal = (message?: string): void => {
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
            return { success: true, message: null };
        } catch (error) {
            return { success: false, message: authError(error).code };
        }
    };

    const googleLogin = async (): Promise<void> => {
        try {
            await adapter.signInWithGoogle();
            authStore.set.typeOfLogin(SocialLoginTypes.google);
            void logAnalyticsEvent('login', { method: SocialLoginTypes.google });
        } catch (error) {
            const { code: errorCode, message: errorMessage } = authError(error);
            if (
                errorCode === 'auth/popup-closed-by-user' ||
                errorCode === 'auth/network-request-failed' ||
                (typeof errorMessage === 'string' &&
                    (errorMessage.includes('Pending promise was never set') ||
                        errorMessage.includes('INTERNAL ASSERTION FAILED')))
            ) {
                presentGoogleHelpModal(
                    'Google sign-in failed to start. If the issue persists, please check your browser settings, clear the site data, refresh the page and try again. You may also try using a different browser or incognito mode.'
                );
                return;
            }
            if (errorCode === 'auth/popup-blocked') {
                log.warn(`googleLogin popup blocked (${errorCode ?? 'unknown'})`, error);
                presentGoogleHelpModal(
                    'Popups are blocked in your browser. Please enable popups in your browser and try again.'
                );
            } else if (errorCode === 'auth/cancelled-popup-request') {
                log.warn(`googleLogin cancelled (${errorCode ?? 'unknown'})`, error);
            } else {
                log.error(`googleLogin failed (${errorCode ?? 'unknown'})`, error);
                if (errorMessage) presentGoogleHelpModal(errorMessage);
            }
        }
    };

    const sendSignInLink = async (email: string): Promise<void> => {
        // Preserve the fire-and-forget form interaction and toast feedback.
        void adapter
            .sendEmailLink(email)
            .then(() => {
                presentToast(m['login.linkSent'](), {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });
            })
            .catch(error => {
                log.error('sendSignInLinkToEmail::error', error);
                presentToast(m['login.linkSendError'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            });
    };

    const verifySignInLinkAndLogin = async (email: string, authLink: string): Promise<void> => {
        if (!email || !authLink) return;
        const native = Capacitor.isNativePlatform();
        const link = native ? authLink : window.location.href;
        const loginEmail = native ? window.localStorage.getItem('emailForSignIn') : email;
        try {
            if (!loginEmail || !(await adapter.validateEmailLink(link))) return;
            await adapter.verifyEmailLink(loginEmail, link);
            if (native) authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
            void logAnalyticsEvent('login', { method: SocialLoginTypes.passwordless });
        } catch (error) {
            const { code, message } = authError(error);
            log.error(`firebase auth failed (${code ?? 'unknown'})`, error);
            if (message) void presentAlert(message);
        }
    };

    const sendSmsAuthCode = async (
        phoneNumber: string,
        successCallback: SuccessCallback,
        errorCallback: ErrorCallback
    ): Promise<void> => {
        try {
            await adapter.sendPhoneOtp(phoneNumber);
            successCallback();
        } catch (error) {
            const { code, message } = authError(error);
            errorCallback(code === undefined ? (message ?? '') : String(code));
            log.error(`firebase auth failed (${code ?? 'unknown'})`, error);
        }
    };

    const loginAfterAutoVerifiedSMS = async (
        verificationCode: string | undefined,
        successCallback: SuccessCallback,
        errorCallback: ErrorCallback
    ): Promise<void> => {
        try {
            // Complete the web-layer session before the coordinator derives keys.
            await adapter.confirmPhoneOtp(verificationCode || '');
        } catch (error) {
            log.debug('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(authError(error).message || 'Verification code could not be verified');
            return;
        }
        successCallback();
        authStore.set.typeOfLogin(SocialLoginTypes.sms);
        void logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
    };

    const verifySmsAuthCode = async (
        code: string | number,
        successCallback: SuccessCallback,
        errorCallback: ErrorCallback
    ): Promise<void> => {
        try {
            await adapter.confirmPhoneOtp(code);
            authStore.set.typeOfLogin(SocialLoginTypes.sms);
            void logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
            successCallback();
        } catch (error) {
            const { code: errorCode, message } = authError(error);
            errorCallback(errorCode === undefined ? (message ?? '') : String(errorCode));
            log.error(`firebase auth failed (${errorCode ?? 'unknown'})`, error);
            if (errorCode === 5111) {
                presentToast(m['login.refreshToFix'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }
    };

    const verifySmsAuthCodeOnNative = async (
        verificationCode: string | number,
        successCallback: SuccessCallback,
        errorCallback: ErrorCallback
    ): Promise<void> => {
        try {
            await adapter.confirmPhoneOtp(verificationCode || '');
            authStore.set.typeOfLogin(SocialLoginTypes.sms);
            void logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
            successCallback();
        } catch (error) {
            log.debug('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(authError(error).message ?? '');
        }
    };

    const appleLogin = async (): Promise<void> => {
        try {
            await adapter.signInWithApple();
            authStore.set.typeOfLogin(SocialLoginTypes.apple);
            if (!Capacitor.isNativePlatform())
                void logAnalyticsEvent('login', { method: SocialLoginTypes.apple });
        } catch (error) {
            const { code: errorCode, message: errorMessage } = authError(error);
            if (Capacitor.isNativePlatform()) {
                if (errorMessage?.includes('1001')) {
                    log.warn(`appleLogin cancelled (${errorCode ?? 'unknown'})`, error);
                } else {
                    log.error(`appleLogin failed (${errorCode ?? 'unknown'})`, error);
                    if (errorMessage) void presentAlert(errorMessage);
                }
                if (adapter.getCurrentUser()) authStore.set.typeOfLogin(SocialLoginTypes.apple);
            } else if (errorCode === 'auth/popup-blocked') {
                log.warn(`appleLogin popup blocked (${errorCode ?? 'unknown'})`, error);
                void presentAlert(m['login.popupsBlocked']());
            } else if (
                errorCode === 'auth/cancelled-popup-request' ||
                errorCode === 'auth/popup-closed-by-user'
            ) {
                log.warn(`appleLogin cancelled (${errorCode ?? 'unknown'})`, error);
            } else {
                log.error(`appleLogin failed (${errorCode ?? 'unknown'})`, error);
                if (errorMessage) void presentAlert(errorMessage);
            }
        }
    };

    const verifyAppleLogin = async (): Promise<void> => {
        if (Capacitor.isNativePlatform()) return;
        try {
            if (!(await adapter.checkRedirectResult?.())) return;
            authStore.set.typeOfLogin(SocialLoginTypes.apple);
            void logAnalyticsEvent('login', { method: SocialLoginTypes.apple });
        } catch (error) {
            const { code, message } = authError(error);
            log.error(`firebase auth failed (${code ?? 'unknown'})`, error);
            if (message) void presentAlert(message);
        }
    };

    const signInWithCustomFirebaseToken = async (customToken: string): Promise<void> => {
        try {
            await adapter.signInWithCustomToken(customToken);
            authStore.set.typeOfLogin(SocialLoginTypes.scoutsSSO);
            void logAnalyticsEvent('login', { method: SocialLoginTypes.scoutsSSO });
        } catch (error) {
            const { code, message } = authError(error);
            log.error(`firebase auth failed (${code ?? 'unknown'})`, error);
            if (message) void presentAlert(message);
        }
    };

    const signInWithCustomOAuthProvider = async (token: string): Promise<void> => {
        try {
            if (!adapter.signInWithOidcCredential) throw new Error('SSO sign-in is not available');
            await adapter.signInWithOidcCredential('oidc.keycloak-world-scouts-sso', token);
            authStore.set.typeOfLogin(SocialLoginTypes.scoutsSSO);
            void logAnalyticsEvent('login', { method: SocialLoginTypes.scoutsSSO });
        } catch (error) {
            const { code, message } = authError(error);
            log.error(`firebase auth failed (${code ?? 'unknown'})`, error);
            if (message) void presentAlert(message);
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
        signInWithCustomOAuthProvider,
    };
};

export default useFirebase;
