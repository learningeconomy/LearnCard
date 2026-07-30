import useJoinLCNetworkModal from './useJoinLCNetworkModal';
import { useIsCurrentUserLCNUser } from 'learn-card-base';

export const useCheckIfUserInNetwork = () => {
    const { data: isNetworkUser, isLoading: isNetworkUserLoading } = useIsCurrentUserLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const checkIfUserInNetwork = () => {
        if (isNetworkUserLoading) {
            return false;
        }

        if (!isNetworkUser) {
            void handlePresentJoinNetworkModal({ forceOpen: true });
            return false;
        }
        return true;
    };

    return checkIfUserInNetwork;
};
