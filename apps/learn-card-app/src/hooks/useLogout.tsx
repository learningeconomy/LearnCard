import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useHistory } from 'react-router-dom';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import { auth } from '../firebase/firebase';
import authStore from 'learn-card-base/stores/authStore';

import {
    useModal,
    BrandingEnum,
    pushUtilities,
    LOGIN_REDIRECTS,
    SocialLoginTypes,
    useWeb3AuthSFA,
    useToast,
    useWallet,
    ToastTypeEnum,
    useSQLiteStorage,
} from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';

const useLogout = () => {
    const firebaseAuth = auth();
    const history = useHistory();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { clearDB } = useSQLiteStorage();
    const { logout, loggingOut: web3AuthLoggingOut } = useWeb3AuthSFA();

    const { closeAllModals } = useModal();
    const { presentToast } = useToast();

    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

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

                    // Clear CLI-related localStorage
                    localStorage.removeItem('learncard-cli-welcomed');
                    localStorage.removeItem('learncard-cli-chains');
                } catch (e) {
                    console.error(e);
                }

                await logout();

                // handle redirect from within LCA over web3Auth redirect
                history.push(redirectUrl);
            } catch (e) {
                console.error('There was an issue logging out', e);
                setIsLoggingOut(false);
                presentToast(`Oops, we had an issue logging out.`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }, 1000);

        closeAllModals();
    };

    return { handleLogout, isLoggingOut: isLoggingOut || web3AuthLoggingOut };
};

export default useLogout;
