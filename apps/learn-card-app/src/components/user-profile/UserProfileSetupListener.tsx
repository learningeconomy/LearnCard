import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { IonModal } from '@ionic/react';
import NewJoinNetworkPrompt from '../network-prompts/NewJoinNetworkPrompt';

import {
    SocialLoginTypes,
    authStore,
    useIsCurrentUserLCNUser,
    useWallet,
    useCurrentUser,
} from 'learn-card-base';

export const UserProfileSetupListener: React.FC<{ loading: boolean }> = ({ loading }) => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const { data: currentUserIsLCNUser, isLoading: currentLCNUserLoading } =
        useIsCurrentUserLCNUser();

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const isUserModalOpen =
        window.location.search.includes('userModalOpen=true') ||
        window.location.search.includes('profileSetup=true');

    const presentCenterModal = () => setIsModalOpen(true);

    useEffect(() => {
        const typeOfLogin = authStore.get.typeOfLogin();
        // ! APPLE HOT FIX
        // ! apple's guidelines: additional user info should not be required
        if (typeOfLogin === SocialLoginTypes.apple) return;
        // ! APPLE HOT FIX
        // ! apple's guidelines: additional user info should not be required

        // * short circuit querying the network if the currentUserStore is already set
        if (currentUserIsLCNUser) return;

        const getLCNeworkProfile = async () => {
            try {
                const wallet = await initWallet();
                const profile = await wallet?.invoke?.getProfile();

                if (profile) return;

                if (!isUserModalOpen && currentUser && !isModalOpen) {
                    history.replace({ search: 'profileSetup=true' });
                    presentCenterModal();
                }
            } catch (err) {
                if (!isUserModalOpen && currentUser && !isModalOpen) {
                    history.replace({ search: 'profileSetup=true' });
                    presentCenterModal();
                }

                console.log('getLCNeworkProfile::err', err);
            }
        };

        getLCNeworkProfile();
    }, [currentUser, currentUserIsLCNUser, currentLCNUserLoading]);

    return (
        <IonModal
            isOpen={isModalOpen}
            className="generic-modal show-modal ion-disable-focus-trap"
            backdropDismiss={false}
            onDidDismiss={() => history.replace({ search: undefined })}
        >
            <NewJoinNetworkPrompt
                title="Setup Your Profile"
                handleCloseModal={() => setIsModalOpen(false)}
                handleLogout={() => { }}
                showCancelButton={false}
                showDeleteAccountButton={false}
                showNetworkModal
                showNotificationsModal
            />
        </IonModal>
    );
};

export default UserProfileSetupListener;
