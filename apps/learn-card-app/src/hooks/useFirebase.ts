import React from 'react';
import { Capacitor } from '@capacitor/core';
import {
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,
    signInWithPhoneNumber,
    RecaptchaVerifier,
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
import { useIonAlert } from '@ionic/react';

import {
    authStore,
    SocialLoginTypes,
    firebaseAuthStore,
    useWeb3AuthSFA,
    useWeb3Auth,
    useSSSKeyManager,
    shouldUseSSSKeyManager,
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
import { WALLET_ADAPTERS } from '@web3auth/base';

export const useFirebase = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { web3AuthSFAInit } = useWeb3AuthSFA();
    const { web3AuthInit } = useWeb3Auth();
    const { connect: sssConnect, setupWithPrivateKey: sssSetup } = useSSSKeyManager();
    const { presentToast } = useToast();
    const [presentAlert] = useIonAlert();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const useSSS = shouldUseSSSKeyManager();
    const setInitLoading = authStore.set.initLoading;

    const presentGoogleHelpModal = (message?: string) => {
        newModal(React.createElement(GoogleLoginHelpModal, { message }), {
            sectionClassName: '!max-w-[420px]',
        });
    };

    const web3AuthMfaFallbackLogin = async (token: string) => {
        try {
            const web3Auth = await web3AuthInit({
                redirectUrl:
                    IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                        ? LOGIN_REDIRECTS?.[BrandingEnum.learncard]?.redirectUrl
                        : LOGIN_REDIRECTS?.[BrandingEnum.learncard]?.devRedirectUrl,
                showLoading: false,
                branding: BrandingEnum.learncard,
            });
            await web3Auth?.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
                loginProvider: 'learncardFirebase',
                enableMfa: true,
                mfaLevel: 'mandatory',
                extraLoginOptions: {
                    id_token: token,
                    verifierIdField: 'sub', // same as your JWT Verifier ID
                    domain:
                        IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                            ? `https://${FIREBASE_REDIRECT_URL}`
                            : 'http://localhost:3000',
                },
            });
            closeModal();
        } catch (err) {
            const errorMessage = error?.message;
            console.log('web3AuthMfa::error', errorMessage);

            if (errorMessage) presentAlert(errorMessage);
        }
    };

    const createFirebaseAuthProvider = (
        getIdToken: (forceRefresh?: boolean) => Promise<string>,
        userUid: string,
        email?: string,
        phone?: string
    ) => ({
        getIdToken: async () => getIdToken(false),
        getCurrentUser: async () => ({
            id: userUid,
            email: email || undefined,
            phone: phone || undefined,
        }),
        getProviderType: () => 'firebase' as const,
        signOut: async () => {},
    });

    const sssFirebaseLogin = async (
        token: string,
        userUid: string,
        getIdToken: (forceRefresh?: boolean) => Promise<string>,
        email?: string,
        phone?: string
    ) => {
        try {
            const authProvider = createFirebaseAuthProvider(getIdToken, userUid, email, phone);

            const privateKey = await sssConnect(authProvider);

            if (privateKey) {
                closeModal();
            } else {
                console.log('SSS: No existing key found, user may need setup or migration');
                setInitLoading(false);
            }
        } catch (error) {
            setInitLoading(false);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log('sssFirebaseLogin::error', errorMessage);
            presentAlert(errorMessage);
        }
    };

    const web3AuthSfaFirebaseLogin = async (
        token: string,
        userUid: string,
        getIdToken: (forceRefresh?: boolean) => Promise<string>,
        suppressError?: boolean
    ) => {
        if (useSSS) {
            const firebaseUser = firebaseAuthStore.get.currentUser();
            await sssFirebaseLogin(
                token,
                userUid,
                getIdToken,
                firebaseUser?.email || undefined,
                firebaseUser?.phoneNumber || undefined
            );
            return;
        }

        const web3Auth = await web3AuthSFAInit();

        if (!web3Auth) {
            setInitLoading(false);
            return;
        }

        try {
            await web3Auth.connect({
                verifier: 'learncardapp-firebase',
                verifierId: userUid,
                idToken: token,
            });
            closeModal();
        } catch (error) {
            setInitLoading(false);

            const errorMessage = error?.message;
            console.log('web3AuthSfa::error', errorMessage);

            if (errorMessage.includes('User has already enabled mfa')) {
                const refreshedToken = await getIdToken(true);
                await web3AuthMfaFallbackLogin(refreshedToken);
            } else {
                if (errorMessage && !suppressError) presentAlert(errorMessage);
            }
        }
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

        try {
            const signInWithGoogleRes = await FirebaseAuthentication.signInWithGoogle();
            const { user } = await FirebaseAuthentication.getCurrentUser();

            setInitLoading(true);

            if (signInWithGoogleRes.user && user) {
                const { token } = await FirebaseAuthentication.getIdToken();

                authStore.set.typeOfLogin(SocialLoginTypes.google);
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
                firebaseAuthStore.set.setFirebaseCurrentUser(user);

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

                await web3AuthSfaFirebaseLogin(token, user?.uid, async (forceRefresh: boolean) => {
                    const { token: refreshedToken } = await FirebaseAuthentication.getIdToken({
                        forceRefresh,
                    });

                    return refreshedToken;
                });
            }
        } catch (error) {
            setInitLoading(false);

            const errorCode = error?.code;
            const errorMessage = error?.message;

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
                        setInitLoading(true);
                        const token = await user.getIdToken();

                        if (token) {
                            // Clear email from storage.
                            localStorage.removeItem('emailForSignIn');
                            authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
                            logAnalyticsEvent('login', { method: SocialLoginTypes.passwordless });
                            firebaseAuthStore.set.setFirebaseCurrentUser(user);
                            firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);

                            await web3AuthSfaFirebaseLogin(
                                token,
                                user?.uid,
                                async (forceRefresh: boolean) => {
                                    const refreshedToken = await user.getIdToken(forceRefresh);
                                    return refreshedToken;
                                }
                            );
                        }
                    }
                }
            } catch (error) {
                setInitLoading(false);
                const errorCode = error?.code;
                const errorMessage = error?.message;

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
                        setInitLoading(true);
                        await web3AuthSfaFirebaseLogin(
                            token,
                            user?.uid,
                            async (forceRefresh: boolean) => {
                                const refreshedToken = await result.user.getIdToken(forceRefresh);
                                return refreshedToken;
                            }
                        );
                        localStorage.removeItem('emailForSignIn');
                    }
                }
            } catch (error) {
                const errorCode = error?.code;
                const errorMessage = error?.message;

                setInitLoading(false);

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

        // ! https://firebase.google.com/docs/auth/web/phone-auth#integration-testing
        // ! Only fictional phone numbers can be used when testing locally

        destroyRecaptcha();
        await ensureRecaptcha(firebaseAuth);

        // send sms auth code
        signInWithPhoneNumber(firebaseAuth, phoneNumber, window.recaptchaVerifier)
            .then(confirmationResult => {
                window.confirmationResult = confirmationResult;
                successCallback();
            })
            .catch(error => {
                destroyRecaptcha();
                const errorCode = error?.code;
                const errorMessage = error?.message;

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
                    setInitLoading(true);
                    successCallback();
                    authStore.set.typeOfLogin(SocialLoginTypes.sms);
                    logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);

                    if (token) {
                        // log user into web3Auth via idToken
                        await web3AuthSfaFirebaseLogin(
                            token,
                            user?.uid,
                            async (forceRefresh: boolean) => {
                                const refreshedToken = await user.getIdToken(forceRefresh);
                                return refreshedToken;
                            }
                        );
                    }
                }
            }
        } catch (error) {
            setInitLoading(false);
            console.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(error?.message);
        }
    };

    const verifySmsAuthCode = async (
        code: string | number,
        successCallback: any,
        errorCallback: any
    ) => {
        try {
            const result = await window?.confirmationResult?.confirm(code);
            const user = result?.user;
            const token = await result?.user?.getIdToken(true);
            authStore.set.typeOfLogin(SocialLoginTypes.sms);
            logAnalyticsEvent('login', { method: SocialLoginTypes.sms });
            firebaseAuthStore.set.setFirebaseCurrentUser(user);

            if (token) {
                setInitLoading(true);
                successCallback();
                await web3AuthSfaFirebaseLogin(token, user?.uid, async (forceRefresh: boolean) => {
                    const refreshedToken = await user.getIdToken(forceRefresh);
                    return refreshedToken;
                });
            }
        } catch (error) {
            setInitLoading(false);

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
                    setInitLoading(true);
                    successCallback();

                    // log user into web3Auth via idToken
                    await web3AuthSfaFirebaseLogin(
                        token,
                        user?.uid,
                        async (forceRefresh: boolean) => {
                            const refreshedToken = await user.getIdToken(forceRefresh);
                            return refreshedToken;
                        }
                    );
                }
            }
        } catch (error) {
            setInitLoading(false);
            console.error('googleLogin::verifySmsAuthCodeOnNative::web::error', error);
            errorCallback(error?.message);
        }
    };

    const appleLogin = async () => {
        const firebaseAuth = auth();

        if (!firebaseAuth) return;

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
                setInitLoading(false);

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

                if (token) {
                    setInitLoading(true);
                    await web3AuthSfaFirebaseLogin(
                        token,
                        user?.uid,
                        async (forceRefresh: boolean) => {
                            const refreshedToken = await user.getIdToken(forceRefresh);
                            return refreshedToken;
                        }
                    );
                }
            }
        } else {
            try {
                const provider = new OAuthProvider('apple.com');

                const result = await signInWithPopup(firebaseAuth, provider);
                if (!result) {
                    setInitLoading(false);
                    return;
                }
                const credential = OAuthProvider.credentialFromResult(result);
                const user = result?.user;

                if (credential && user) {
                    const token = await user.getIdToken(true);
                    authStore.set.typeOfLogin(SocialLoginTypes.apple);
                    logAnalyticsEvent('login', { method: SocialLoginTypes.apple });
                    firebaseAuthStore.set.setFirebaseCurrentUser(user);

                    if (token) {
                        setInitLoading(true);
                        await web3AuthSfaFirebaseLogin(
                            token,
                            user?.uid,
                            async (forceRefresh: boolean) => {
                                const refreshedToken = await user.getIdToken(forceRefresh);
                                return refreshedToken;
                            }
                        );
                    }
                }
            } catch (error) {
                setInitLoading(false);
                // Handle Errors here.
                const errorCode = error?.code;
                const errorMessage = error?.message;

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
                    setInitLoading(false);
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
                        setInitLoading(true);
                        await web3AuthSfaFirebaseLogin(
                            token,
                            user?.uid,
                            async (forceRefresh: boolean) => {
                                const refreshedToken = await user.getIdToken(forceRefresh);
                                return refreshedToken;
                            }
                        );
                    }
                }
            } catch (error) {
                setInitLoading(false);
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
                setInitLoading(true);
                authStore.set.typeOfLogin(SocialLoginTypes.passwordless);
                firebaseAuthStore.set.firebaseAuth(FirebaseAuthentication);
                firebaseAuthStore.set.setFirebaseCurrentUser(user);

                logAnalyticsEvent('login', { method: SocialLoginTypes.passwordless });

                try {
                    await web3AuthSfaFirebaseLogin(
                        token,
                        user?.uid,
                        async (forceRefresh: boolean) => {
                            const refreshedToken = await user.getIdToken(forceRefresh);
                            return refreshedToken;
                        },
                        true
                    );
                } catch (error) {
                    console.error('web3AuthSfaFirebaseLogin error', error);
                }
            }
        } catch (error) {
            setInitLoading(false);
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
