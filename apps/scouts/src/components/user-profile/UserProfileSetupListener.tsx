import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { getLogger } from 'learn-card-base';
const log = getLogger('user-profile-setup-listener');
import {
    SocialLoginTypes,
    authStore,
    currentUserStore,
    useIsCurrentUserLCNUser,
    useWallet,
    useCurrentUser,
} from 'learn-card-base';
import { useJoinLCNetworkModal } from '../network-prompts/hooks/useJoinLCNetworkModal';

const AUTO_PROMPT_SESSION_KEY = 'scouts:user-profile-setup:auto-prompted';

const clearAutoPromptGuard = () => {
    try {
        window.sessionStorage.removeItem(AUTO_PROMPT_SESSION_KEY);
    } catch {
        // ignore session storage access issues
    }
};

const markAutoPromptGuard = () => {
    try {
        window.sessionStorage.setItem(AUTO_PROMPT_SESSION_KEY, 'true');
    } catch {
        // ignore session storage access issues
    }
};

const hasAutoPromptedThisSession = () => {
    try {
        return window.sessionStorage.getItem(AUTO_PROMPT_SESSION_KEY) === 'true';
    } catch {
        return false;
    }
};

export const UserProfileSetupListener: React.FC<{ loading: boolean }> = ({ loading }) => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const { data: currentUserIsLCNUser, isLoading: currentLCNUserLoading } =
        useIsCurrentUserLCNUser();

    const hasPresentedSetupModalRef = useRef(false);
    const isUserModalOpen =
        window.location.search.includes('userModalOpen=true') ||
        window.location.search.includes('profileSetup=true');

    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal(true, () => {
        clearAutoPromptGuard();
        history.replace({ search: undefined });
    });

    useEffect(() => {
        const typeOfLogin = authStore.get.typeOfLogin();
        // ! APPLE HOT FIX
        // ! apple's guidelines: additional user info should not be required
        if (typeOfLogin === SocialLoginTypes.apple) return;
        // ! APPLE HOT FIX
        // ! apple's guidelines: additional user info should not be required
        if (loading || currentLCNUserLoading) return;

        // * short circuit querying the network if the currentUserStore is already set
        if (currentUserIsLCNUser) {
            hasPresentedSetupModalRef.current = false;
            clearAutoPromptGuard();
            return;
        }

        if (hasPresentedSetupModalRef.current || hasAutoPromptedThisSession()) return;

        const getLCNeworkProfile = async () => {
            try {
                const wallet = await initWallet();
                const profile = await wallet?.invoke?.getProfile();
                if (profile) return;

                if (!isUserModalOpen && currentUser) {
                    hasPresentedSetupModalRef.current = true;
                    markAutoPromptGuard();
                    history.replace({ search: 'profileSetup=true' });
                    await handlePresentJoinNetworkModal({ forceOpen: true });
                }
            } catch (err) {
                log.debug('getLCNeworkProfile::err', err);
            }
        };

        getLCNeworkProfile();
    }, [
        currentUser,
        currentUserIsLCNUser,
        currentLCNUserLoading,
        handlePresentJoinNetworkModal,
        history,
        initWallet,
        isUserModalOpen,
    ]);

    return null;
};

export default UserProfileSetupListener;
