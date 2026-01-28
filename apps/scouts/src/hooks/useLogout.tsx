import React, { useEffect, useState } from 'react';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import authStore from 'learn-card-base/stores/authStore';
import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { BrandingEnum, useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import { pushUtilities } from 'learn-card-base';
import { auth } from '../firebase/firebase';
import { useWeb3AuthSFA, useWallet } from 'learn-card-base';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import { useQueryClient } from '@tanstack/react-query';
import LoggingOutModal from '../components/auth/LoggingOutModal';

const useLogout = () => {
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const { logout } = useWeb3AuthSFA();
    const { clearDB } = useSQLiteStorage();
    const firebaseAuth = auth();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const queryClient = useQueryClient();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const handleLogout = async (branding: BrandingEnum) => {
        setIsLoggingOut(true);
        newModal(<LoggingOutModal />);
        const typeOfLogin = authStore?.get?.typeOfLogin();
        const nativeSocialLogins = [
            SocialLoginTypes.apple,
            SocialLoginTypes.sms,
            SocialLoginTypes.passwordless,
            SocialLoginTypes.google,
        ];

        const redirectUrl =
            IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                ? LOGIN_REDIRECTS[branding].redirectUrl
                : LOGIN_REDIRECTS[branding].devRedirectUrl;

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
                if (nativeSocialLogins.includes(typeOfLogin) && Capacitor.isNativePlatform()) {
                    try {
                        await FirebaseAuthentication?.signOut?.();
                    } catch (e) {
                        console.log('firebase::signout::error', e);
                    }
                }

                try {
                    await clearDB();
                    await queryClient.resetQueries();
                } catch (e) {
                    console.error(e);
                }

                await logout(redirectUrl);
            } catch (e) {
                console.error('There was an issue logging out', e);
                setIsLoggingOut(false);
                closeModal();
                presentToast('Oops, there was an issue logging out', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }, 1000);
    };

    return { handleLogout, isLoggingOut };
};

export default useLogout;
