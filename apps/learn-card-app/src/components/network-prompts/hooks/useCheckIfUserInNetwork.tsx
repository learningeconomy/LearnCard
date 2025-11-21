import useJoinLCNetworkModal from './useJoinLCNetworkModal';
import { useIsCurrentUserLCNUser } from 'learn-card-base';

export const useCheckIfUserInNetwork = () => {
    const { data: isNetworkUser, isLoading: isNetworkUserLoading } = useIsCurrentUserLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const checkIfUserInNetwork = () => {
        if (!isNetworkUser && !isNetworkUserLoading) {
            handlePresentJoinNetworkModal();
            return false;
        }
        return true;
    };

    return checkIfUserInNetwork;
};
