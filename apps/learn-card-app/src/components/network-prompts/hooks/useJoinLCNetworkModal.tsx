import JoinNetworkPrompt from '../JoinNetworkPrompt';

import { ModalTypes, useIsCurrentUserLCNUser, useIsLoggedIn, useModal } from 'learn-card-base';
import OnboardingContainer from '../../onboarding/OnboardingContainer';
import deletingAccountStore from 'learn-card-base/stores/deletingAccountStore';

export const JoinNetworkModalWrapper: React.FC<{
    handleCloseModal: () => void;
    showNotificationsModal: boolean;
}> = ({ handleCloseModal, showNotificationsModal }) => {
    return (
        <JoinNetworkPrompt
            handleCloseModal={handleCloseModal}
            showNotificationsModal={showNotificationsModal}
        />
    );
};

export const useJoinLCNetworkModal = (onDismiss?: () => void) => {
    const { data, isLoading } = useIsCurrentUserLCNUser();
    const isLoggedIn = useIsLoggedIn();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const presentNetworkModal = (onSuccess?: () => void) => {
        newModal(
            <OnboardingContainer onSuccess={onSuccess} />,
            {},
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
    };

    const handlePresentJoinNetworkModal = async (onSuccess?: () => void) => {
        const deletingAccount = deletingAccountStore.get.deletingAccount();
        if (deletingAccount) {
            return { prompted: false };
        }

        if (!isLoading && !data && isLoggedIn) {
            presentNetworkModal(onSuccess);
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
