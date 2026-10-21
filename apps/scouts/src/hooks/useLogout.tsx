import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import authStore from 'learn-card-base/stores/authStore';
import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import {
    BrandingEnum,
    useToast,
    ToastTypeEnum,
    useModal,
    ModalTypes,
    useSignInAdapter,
} from 'learn-card-base';
import { pushUtilities } from 'learn-card-base';
import { useWallet } from 'learn-card-base';
import LoggingOutModal from '../components/auth/LoggingOutModal';
import * as m from '../paraglide/messages.js';

import { useAuthCoordinator } from '../providers/AuthCoordinatorProvider';
import { getLogger } from 'learn-card-base';
const log = getLogger('use-logout');

const useLogout = () => {
    const adapter = useSignInAdapter();
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
                        log.error('Error revoking push token', e);
                    }
                }

                // A cached-key session can have no coordinator auth provider but still
                // have a native session. Always sign out the registered adapter too.
                try {
                    await adapter.signOut();
                } catch (error) {
                    log.debug('Adapter sign-out failed', error);
                }
                // Coordinator handles: authProvider.signOut, clearLocalKeys, onLogout callback
                // (onLogout clears stores, queryClient, SQLite, localStorage, IndexedDB, etc.)
                await coordinatorLogout();

                // Hard redirect — localStorage.clear() in the logout callback wipes
                // Ionic's internal router state, so client-side navigation would
                // land on a white screen. A full page reload reinitializes cleanly.
                window.location.href = '/login';
            } catch (e) {
                log.error('There was an issue logging out', e);
                setIsLoggingOut(false);
                closeModal();
                presentToast(m['login.logoutError'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }, 1000);
    };

    return { handleLogout, isLoggingOut };
};

export default useLogout;
