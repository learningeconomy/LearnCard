import React, { useEffect, useState } from 'react';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import authStore from 'learn-card-base/stores/authStore';
import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { BrandingEnum } from 'learn-card-base';
import { pushUtilities } from 'learn-card-base';
import { auth } from '../firebase/firebase';
import { useWeb3AuthSFA, useWallet } from 'learn-card-base';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import { useQueryClient } from '@tanstack/react-query';
import { useIonToast, IonLoading } from '@ionic/react';

const useLogout = () => {
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const { logout, loggingOut: web3AuthLoggingOut } = useWeb3AuthSFA();
    const { clearDB } = useSQLiteStorage();
    const firebaseAuth = auth();
    const { initWallet } = useWallet();
    const [presentToast] = useIonToast();
    const queryClient = useQueryClient();

    const handleLogout = async (
        branding: BrandingEnum,
        options?: { appendQuery?: Record<string, string>; overrideRedirectUrl?: string }
    ) => {
        setIsLoggingOut(true);
        const typeOfLogin = authStore?.get?.typeOfLogin();
        const nativeSocialLogins = [
            SocialLoginTypes.apple,
            SocialLoginTypes.sms,
            SocialLoginTypes.passwordless,
            SocialLoginTypes.google,
        ];

        const baseRedirectUrl =
            IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                ? LOGIN_REDIRECTS[branding].redirectUrl
                : LOGIN_REDIRECTS[branding].devRedirectUrl;

        const appendParams = (url: string, params?: Record<string, string>) => {
            if (!params || Object.keys(params).length === 0) return url;
            const hasQuery = url.includes('?');
            const usp = new URLSearchParams(params);
            return `${url}${hasQuery ? '&' : '?'}${usp.toString()}`;
        };

        const redirectUrl = options?.overrideRedirectUrl
            ? options.overrideRedirectUrl
            : appendParams(baseRedirectUrl, options?.appendQuery);

        setTimeout(async () => {
            try {
                const deviceToken = authStore?.get?.deviceToken();
                if (deviceToken) {
                    try {
                        await pushUtilities.revokePushToken(initWallet, deviceToken);
                    } catch (e) {
                        console.error('Error revoking push token', e);
                    }
                }

                await firebaseAuth.signOut(); // sign out of web layer
                const isNativeSocialLogin =
                    !!typeOfLogin && nativeSocialLogins.includes(typeOfLogin as SocialLoginTypes);
                if (isNativeSocialLogin && Capacitor.isNativePlatform()) {
                    try {
                        await FirebaseAuthentication?.signOut?.();
                    } catch (e) {
                        console.log('firebase::signout::error', e);
                    }
                }

                try {
                    // Clear React Query cache FIRST while SQLite is still available for persistence
                    await queryClient.resetQueries();

                    // Then clear the database
                    await clearDB();
                } catch (e) {
                    console.error(e);
                }

                await logout(redirectUrl);
            } catch (e) {
                console.error('There was an issue logging out', e);
                setIsLoggingOut(false);
                presentToast({
                    message: `Oops, we had an issue logging out.`,
                    duration: 3000,
                    cssClass: 'login-link-warning-toast ion-toast-bottom-nav-offset',
                });
            }
        }, 1000);
    };

    return { handleLogout, isLoggingOut: isLoggingOut || web3AuthLoggingOut };
};

export default useLogout;
