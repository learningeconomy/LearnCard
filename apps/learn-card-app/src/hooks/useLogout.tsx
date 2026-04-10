import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import authStore from 'learn-card-base/stores/authStore';

import {
    pushUtilities,
    SocialLoginTypes,
    useToast,
    useWallet,
    ToastTypeEnum,
} from 'learn-card-base';
import { resumeBuilderStore } from '../stores/resumeBuilderStore';

import { useAuthCoordinator } from '../providers/AuthCoordinatorProvider';
import { getLoginRedirectUrl } from '../config/bootstrapTenantConfig';

const useLogout = () => {
    const { initWallet } = useWallet();
    const { logout: coordinatorLogout } = useAuthCoordinator();

    const { presentToast } = useToast();

    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

    const handleLogout = async (
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

        const baseRedirectUrl = getLoginRedirectUrl();

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

                // Native Firebase sign-out for Capacitor social logins.
                // The coordinator's onSignOut also calls this, but we do it here first
                // to ensure native session is cleared before the coordinator runs.
                // Double-calling FirebaseAuthentication.signOut() is harmless.
                const isNativeSocialLogin =
                    !!typeOfLogin && nativeSocialLogins.includes(typeOfLogin as SocialLoginTypes);

                if (isNativeSocialLogin && Capacitor.isNativePlatform()) {
                    try {
                        await FirebaseAuthentication?.signOut?.();
                    } catch (e) {
                        console.warn('firebase::signout::error', e);
                    }
                }

                // Coordinator handles: authProvider.signOut, clearLocalKeys, onLogout callback
                resumeBuilderStore.set.resetStore();
                // (onLogout clears stores, queryClient, SQLite, localStorage, IndexedDB, etc.)
                await coordinatorLogout();

                // Hard redirect — localStorage.clear() in the logout callback wipes
                // Ionic's internal router state, so client-side history.push would
                // land on a white screen. A full page reload reinitializes cleanly.
                window.location.href = '/login';
            } catch (e) {
                console.error('There was an issue logging out', e);
                setIsLoggingOut(false);
                presentToast(`Oops, we had an issue logging out.`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }, 1000);
    };

    return { handleLogout, isLoggingOut };
};

export default useLogout;
