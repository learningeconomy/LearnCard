import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import {
    getLogger,
    SocialLoginTypes,
    authStore,
    useIsCurrentUserLCNUser,
    useWallet,
    useCurrentUser,
} from 'learn-card-base';
import { useJoinLCNetworkModal } from '../network-prompts/hooks/useJoinLCNetworkModal';
import userProfileSetupStore from '../../stores/userProfileSetupStore';

const log = getLogger('user-profile-setup-listener');

export const UserProfileSetupListener: React.FC = () => {
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
        userProfileSetupStore.set.clearAutoPrompted();
        const params = new URLSearchParams(window.location.search);
        params.delete('profileSetup');
        const remaining = params.toString();
        history.replace({ search: remaining || undefined });
    });

    useEffect(() => {
        const typeOfLogin = authStore.get.typeOfLogin();
        // ! APPLE HOT FIX
        // ! apple's guidelines: additional user info should not be required
        if (typeOfLogin === SocialLoginTypes.apple) return;
        // ! APPLE HOT FIX
        // ! apple's guidelines: additional user info should not be required
        if (currentLCNUserLoading) return;

        if (!currentUser) {
            hasPresentedSetupModalRef.current = false;
            userProfileSetupStore.set.clearAutoPrompted();
            return;
        }

        // * short circuit querying the network if the currentUserStore is already set
        if (currentUserIsLCNUser) {
            hasPresentedSetupModalRef.current = false;
            userProfileSetupStore.set.clearAutoPrompted();
            return;
        }

        if (hasPresentedSetupModalRef.current || userProfileSetupStore.get.autoPrompted()) return;

        const getLCNeworkProfile = async () => {
            try {
                const wallet = await initWallet();
                const profile = await wallet?.invoke?.getProfile();
                if (profile) {
                    hasPresentedSetupModalRef.current = false;
                    userProfileSetupStore.set.clearAutoPrompted();
                    return;
                }

                if (!isUserModalOpen && currentUser) {
                    hasPresentedSetupModalRef.current = true;
                    userProfileSetupStore.set.markAutoPrompted();
                    const params = new URLSearchParams(window.location.search);
                    params.set('profileSetup', 'true');
                    history.replace({ search: params.toString() });
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
