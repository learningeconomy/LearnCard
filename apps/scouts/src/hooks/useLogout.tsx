import React, { useState } from 'react';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import authStore from 'learn-card-base/stores/authStore';
import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { BrandingEnum, useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import { pushUtilities } from 'learn-card-base';
import { useWallet } from 'learn-card-base';
import LoggingOutModal from '../components/auth/LoggingOutModal';

import { useAuthCoordinator } from '../providers/AuthCoordinatorProvider';

const useLogout = () => {
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const { logout: coordinatorLogout } = useAuthCoordinator();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const handleLogout = async (branding: BrandingEnum) => {
        setIsLoggingOut(true);

        newModal(
            <div className="flex flex-col items-center justify-center h-full w-full p-5">
                <LoggingOutModal />
            </div>,
            {
                hideDimmer: true,
                className: 'full-screen-modal-transparent-bg',
            }
        );

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

                // Native Firebase sign-out for Capacitor social logins
                // (web Firebase sign-out is handled by the coordinator via authProvider.signOut)
                if (typeOfLogin && nativeSocialLogins.includes(typeOfLogin) && Capacitor.isNativePlatform()) {
                    try {
                        await FirebaseAuthentication?.signOut?.();
                    } catch (e) {
                        console.log('firebase::signout::error', e);
                    }
                }

                // Coordinator handles: authProvider.signOut, clearLocalKeys, onLogout callback
                // (onLogout clears stores, queryClient, SQLite, localStorage, IndexedDB, etc.)
                await coordinatorLogout();
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
