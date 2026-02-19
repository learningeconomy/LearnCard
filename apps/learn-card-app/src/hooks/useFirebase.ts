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

import useFirebaseAnalytics from './useFirebaseAnalytics';
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
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import GoogleLoginHelpModal from '../components/auth/GoogleLoginHelpModal';

import { FIREBASE_REDIRECT_URL } from '../constants/web3AuthConfig';

export const useFirebase = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { presentToast } = useToast();
    const [presentAlert] = useIonAlert();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

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

    const googleLogin = async () => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        emitAuthDebugEvent('auth:login_start', 'Google login initiated');

        try {
            const signInWithGoogleRes = await FirebaseAuthentication.signInWithGoogle();
            const { user } = await FirebaseAuthentication.getCurrentUser();

            if (signInWithGoogleRes.user && user) {
                const { token } = await FirebaseAuthentication.getIdToken();

                authStore.set.typeOfLogin(SocialLoginTypes.google);
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
                firebaseAuthStore.set.setFirebaseCurrentUser(user);

                emitAuthSuccess('firebase:auth_state_change', 'Firebase Google auth successful', {
                    data: { uid: user?.uid, email: user?.email },
                });

                logAnalyticsEvent('login', { method: SocialLoginTypes.google });

                // sign in on web-layer
                if (Capacitor.isNativePlatform()) {
                    try {
                        const credential = await GoogleAuthProvider.credential(
                            signInWithGoogleRes.credential?.idToken
                        );
                        await signInWithCredential(firebaseAuth, credential);
                    } catch (error) {
                        console.log('googleLogin::signInWithCredential::web::error', error);
                    }
                }

                // AuthCoordinator auto-handles key derivation when firebaseUser changes
            }
        } catch (error) {
            const errorCode = error?.code;
            const errorMessage = error?.message;

            emitAuthError('auth:login_error', `Google login failed: ${errorCode}`, error);

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
                if (errorCode) console.warn(errorCode);
                if (errorMessage) console.warn(errorMessage);
                presentGoogleHelpModal(
                    'Popups are blocked in your browser. Please enable popups in your browser and try again.'
                );
            } else if (errorCode === 'auth/cancelled-popup-request') {
                if (errorCode) console.warn(errorCode);
                if (errorMessage) console.warn(errorMessage);
                return;
            } else {
                if (errorCode) console.warn(errorCode);
                if (errorMessage) {
                    console.error('errorMessage', errorMessage);
                    presentGoogleHelpModal(errorMessage);
                }
            }
        }
    };

    const sendSignInLink = async (email: string, customRedirectUrl?: string) => {
        if (Capacitor.isNativePlatform()) {
            let url = `https://${FIREBASE_REDIRECT_URL}/login`;
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
                        bundleId: 'com.learncard.app',
                    },
                    android: {
                        packageName: 'com.learncard.app',
                        installApp: true,
                        minimumVersion: '12',
                    },
                    dynamicLinkDomain: 'learncard.app',
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
                    console.error('sendSignInLinkToEmail::error', error);
                    presentToast('An error occurred, unable to send a login link!', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                });
        } else {
            let url =
                IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                    ? `https://${FIREBASE_REDIRECT_URL}/login`
                    : 'http://localhost:3000/login';
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
                    console.error('sendSignInLinkToEmail::error', error);
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
                            logAnalyticsEvent('login', { method: SocialLoginTypes.passwordless });
                            firebaseAuthStore.set.setFirebaseCurrentUser(user);
                            firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);

                            emitAuthSuccess('firebase:auth_state_change', 'Email link auth successful', {
                                data: { uid: user?.uid },
                            });

                            // AuthCoordinator auto-handles key derivation when firebaseUser changes
                        }
                    }
                }
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                emitAuthError('auth:login_error', `Email link login failed: ${errorCode}`, error);

                if (errorCode) console.error('errorCode', errorCode);
                if (errorMessage) {
                    console.error('errorMessage', errorMessage);
                    presentAlert(errorMessage);
                }
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
                    logAnalyticsEvent('login', { method: SocialLoginTypes.passwordless });
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);

                    if (token) {
                        // AuthCoordinator auto-handles key derivation when firebaseUser changes
                        localStorage.removeItem('emailForSignIn');
                    }
                }
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                if (errorCode) console.error('errorCode', errorCode);
                if (errorMessage) {
                    console.error('errorMessage', errorMessage);
                    presentAlert(errorMessage);
                }
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

                console.error('errorCode', errorCode);
                console.error('errorMessage', errorMessage);
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
            console.log('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
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
                    logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);

                    // AuthCoordinator auto-handles key derivation when firebaseUser changes
                }
            }
        } catch (error) {
            console.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
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
            logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
            firebaseAuthStore.set.setFirebaseCurrentUser(user);

            if (token) {
                successCallback();
                // AuthCoordinator auto-handles key derivation when firebaseUser changes
            }
        } catch (error) {
            const errorCode = error?.code;
            const errorMessage = error?.message;

            errorCallback(errorCode);

            console.error('errorCode', errorCode);
            console.error('errorMessage', errorMessage);

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
                logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
                firebaseAuthStore.set.setFirebaseCurrentUser(user);

                if (token) {
                    successCallback();
                    // AuthCoordinator auto-handles key derivation when firebaseUser changes
                }
            }
        } catch (error) {
            console.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(error?.message);
        }
    };

    const appleLogin = async () => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

        emitAuthDebugEvent('auth:login_start', 'Apple login initiated');

        if (Capacitor.isNativePlatform()) {
            try {
                let signInWithAppleResult = await FirebaseAuthentication.signInWithApple({
                    skipNativeAuth: true,
                });

                // sign in on web-layer
                const provider = new OAuthProvider('apple.com');
                const credential = provider.credential({
                    idToken: signInWithAppleResult.credential?.idToken,
                    rawNonce: signInWithAppleResult.credential?.nonce,
                });
                await signInWithCredential(firebaseAuth, credential);
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                // user cancelled apple login
                if (errorMessage?.includes('1001')) {
                    if (errorCode) console.warn('errorCode', errorCode);
                    if (errorMessage) console.warn('errorMessage', errorMessage);
                } else {
                    if (errorCode) console.error('errorCode', errorCode);
                    if (errorMessage) {
                        console.error('errorMessage', errorMessage);
                        presentAlert(errorMessage);
                    }
                }
            }

            // get current logged in user
            const user = firebaseAuth.currentUser;

            if (user) {
                // get current firebase user idToken
                const token = await firebaseAuth.currentUser.getIdToken();
                authStore.set.typeOfLogin(SocialLoginTypes.apple);
                logAnalyticsEvent('login', { method: SocialLoginTypes.apple });
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
                firebaseAuthStore.set.setFirebaseCurrentUser(user);

                emitAuthSuccess('firebase:auth_state_change', 'Firebase Apple auth successful (native)', {
                    data: { uid: user?.uid },
                });

                if (token) {
                    // AuthCoordinator auto-handles key derivation when firebaseUser changes
                }
            }
        } else {
            try {
                const provider = new OAuthProvider('apple.com');

                const result = await signInWithPopup(firebaseAuth, provider);
                if (!result) {
                    return;
                }
                const credential = OAuthProvider.credentialFromResult(result);
                const user = result?.user;

                if (credential && user) {
                    const token = await user.getIdToken(true);
                    authStore.set.typeOfLogin(SocialLoginTypes.apple);
                    logAnalyticsEvent('login', { method: SocialLoginTypes.apple });
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);

                    emitAuthSuccess('firebase:auth_state_change', 'Firebase Apple auth successful (web)', {
                        data: { uid: user?.uid },
                    });

                    if (token) {
                        // AuthCoordinator auto-handles key derivation when firebaseUser changes
                    }
                }
            } catch (error) {
                // Handle Errors here.
                const errorCode = error?.code;
                const errorMessage = error?.message;

                emitAuthError('auth:login_error', `Apple login failed: ${errorCode}`, error);

                const credential = OAuthProvider.credentialFromError(error);

                if (errorCode === 'auth/popup-blocked') {
                    if (errorCode) console.warn(errorCode);
                    if (errorMessage) console.warn(errorMessage);
                    presentAlert(
                        'Popups are blocked in your browser. Please enable Popups to login with this method.'
                    );
                } else if (
                    errorCode === 'auth/cancelled-popup-request' ||
                    errorCode === 'auth/popup-closed-by-user'
                ) {
                    if (errorCode) console.warn(errorCode);
                    if (errorMessage) console.warn(errorMessage);
                    return;
                } else {
                    if (errorCode) console.error('errorCode', errorCode);
                    if (errorMessage) {
                        console.error('errorMessage', errorMessage);
                        presentAlert(errorMessage);
                    }
                }
            }
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
                    logAnalyticsEvent('login', { method: SocialLoginTypes.apple });
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);

                    if (token) {
                        // AuthCoordinator auto-handles key derivation when firebaseUser changes
                    }
                }
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                console.error('errorCode', errorCode);
                console.error('errorMessage', errorMessage);

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
                firebaseAuthStore.set.setFirebaseCurrentUser(user);

                logAnalyticsEvent('login', { method: SocialLoginTypes.passwordless });

                // AuthCoordinator auto-handles key derivation when firebaseUser changes
            }
        } catch (error) {
            const errorCode = error?.code;
            const errorMessage = error?.message;
            console.error('errorCode', errorCode);
            console.error('errorMessage', errorMessage);

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
