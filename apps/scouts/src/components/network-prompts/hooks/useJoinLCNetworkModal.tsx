import React, { useCallback } from 'react';
import ModalLayout from '../../../layout/ModalLayout';
import JoinNetworkPrompt from '../JoinNetworkPrompt';
import NewJoinNetworkPrompt from '../NewJoinNetworkPrompt';
import { useIsCurrentUserLCNUser, useIsLoggedIn, useModal, ModalTypes } from 'learn-card-base';
import deletingAccountStore from 'learn-card-base/stores/deletingAccountStore';

import { closeAll } from '../../../helpers/uiHelpers';

export const JoinNetworkModalWrapper: React.FC<{
    handleCloseModal: () => void;
    showNotificationsModal: boolean;
}> = ({ handleCloseModal, showNotificationsModal }) => {
    return (
        <ModalLayout handleOnClick={handleCloseModal} allowScroll>
            <JoinNetworkPrompt
                handleCloseModal={handleCloseModal}
                showNotificationsModal={showNotificationsModal}
            />
        </ModalLayout>
    );
};

export const useJoinLCNetworkModal = (
    showNotificationsModal: boolean = false,
    onDismiss?: () => void
) => {
    const { data, isLoading } = useIsCurrentUserLCNUser();

    const isLoggedIn = useIsLoggedIn();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const openNetworkModal = useCallback(() => {
        newModal(
            <NewJoinNetworkPrompt
                handleCloseModal={() => {
                    closeModal();
                    closeAll?.();
                }}
                showNotificationsModal={showNotificationsModal}
            />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [newModal, closeModal, showNotificationsModal]);

    const handlePresentJoinNetworkModal = useCallback(async () => {
        const deletingAccount = deletingAccountStore.get.deletingAccount();
        if (deletingAccount) {
            return { prompted: false };
        }
        if (!isLoading && !data && isLoggedIn) {
            openNetworkModal();
            return { prompted: true };
        }
        return { prompted: false };
    }, [isLoading, data, isLoggedIn, openNetworkModal]);

    return {
        handlePresentJoinNetworkModal,
        dismissNetworkModal: closeModal,
    };
};


export default useJoinLCNetworkModal;
