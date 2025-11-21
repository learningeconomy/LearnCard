import ModalLayout from '../../../layout/ModalLayout';
import JoinNetworkPrompt from '../JoinNetworkPrompt';
import NewJoinNetworkPrompt from '../NewJoinNetworkPrompt';
import { useIonModal } from '@ionic/react';
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
    // const { newModal, closeModal } = useModal({
    //     desktop: ModalTypes.Cancel,
    //     mobile: ModalTypes.Cancel,
    // });

    const [presentNetworkModal, dismissNetworkModal] = useIonModal(NewJoinNetworkPrompt, {
        handleCloseModal: () => {
            dismissNetworkModal();
            //Sometiems it doesn't close it completely, leaves backdrop for some reason...
            closeAll?.();
        },
        showNotificationsModal: showNotificationsModal,
    });

    // const presentNetworkModal = () => {
    // newModal(<NewJoinNetworkPrompt handleCloseModal={closeModal} />, {
    //     sectionClassName: '!max-w-[400px]',
    //     cancelButtonTextOverride: 'Skip for Now',
    //     onClose: () => {
    //         onDismiss?.();
    //     },
    // });
    // };

    const handlePresentJoinNetworkModal = async () => {
        const deletingAccount = deletingAccountStore.get.deletingAccount();
        if (deletingAccount) {
            return { prompted: false };
        }
        if (!isLoading && !data && isLoggedIn) {
            presentNetworkModal();
            return { prompted: true };
        }
        return { prompted: false };
    };

    return {
        handlePresentJoinNetworkModal,
        dismissNetworkModal,
    };
};

export default useJoinLCNetworkModal;
