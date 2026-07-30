import React, { useCallback } from 'react';
import ModalLayout from '../../../layout/ModalLayout';
import JoinNetworkPrompt from '../JoinNetworkPrompt';
import NewJoinNetworkPrompt from '../NewJoinNetworkPrompt';
import {
    useAuthStatus,
    shouldPromptProfileOnboarding,
    useModal,
    ModalTypes,
} from 'learn-card-base';
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
    const authStatus = useAuthStatus();
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
                    onDismiss?.();
                }}
                showNotificationsModal={showNotificationsModal}
            />,
            {
                sectionClassName: '!max-w-[400px]',
                cancelButtonTextOverride: 'Skip For Now',
            }
        );
    }, [newModal, closeModal, showNotificationsModal, onDismiss]);

    const handlePresentJoinNetworkModal = useCallback(
        async (options?: { forceOpen?: boolean }) => {
            const deletingAccount = deletingAccountStore.get.deletingAccount();
            if (deletingAccount) {
                return { prompted: false };
            }

            if (options?.forceOpen) {
                openNetworkModal();
                return { prompted: true };
            }

            if (shouldPromptProfileOnboarding(authStatus)) {
                openNetworkModal();
                return { prompted: true };
            }

            return { prompted: false };
        },
        [authStatus, openNetworkModal]
    );

    return {
        handlePresentJoinNetworkModal,
        dismissNetworkModal: closeModal,
    };
};

export default useJoinLCNetworkModal;
