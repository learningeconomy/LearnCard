import ModalLayout from '../../../layout/ModalLayout';
import JoinNetworkPrompt from '../JoinNetworkPrompt';

import { ModalTypes, useIsCurrentUserLCNUser, useIsLoggedIn, useModal } from 'learn-card-base';
import OnboardingContainer from '../../onboarding/OnboardingContainer';
import deletingAccountStore from 'learn-card-base/stores/deletingAccountStore';

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

export const useJoinLCNetworkModal = (onDismiss?: () => void) => {
    const { data, isLoading } = useIsCurrentUserLCNUser();
    const isLoggedIn = useIsLoggedIn();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const presentNetworkModal = () => {
        newModal(
            <OnboardingContainer />,
            {},
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
    };

    // const [_presentNetworkModal, dismissNetworkModal] = useIonModal(NewJoinNetworkPrompt, {
    //     handleCloseModal: () => {
    //         dismissNetworkModal();
    //         //Sometiems it doesn't close it completely, leaves backdrop for some reason...
    //         closeAll?.();
    //     },
    //     showNotificationsModal: showNotificationsModal,
    // });

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
        dismissNetworkModal: closeModal,
    };
};

export default useJoinLCNetworkModal;
