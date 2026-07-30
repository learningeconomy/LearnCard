import JoinNetworkPrompt from '../JoinNetworkPrompt';

import {
    ModalTypes,
    useAuthStatus,
    shouldPromptProfileOnboarding,
    useModal,
} from 'learn-card-base';
import OnboardingFlow from '../../onboarding/v2/OnboardingFlow';
import redirectStore from 'learn-card-base/stores/redirectStore';
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
    const authStatus = useAuthStatus();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const presentNetworkModal = (onSuccess?: () => void) => {
        // OnboardingFlow unmount owns the `isOnboardingOpen(false)` reset.
        redirectStore.set.isOnboardingOpen(true);

        newModal(
            <OnboardingFlow onSuccess={onSuccess} />,
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

        if (shouldPromptProfileOnboarding(authStatus)) {
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
