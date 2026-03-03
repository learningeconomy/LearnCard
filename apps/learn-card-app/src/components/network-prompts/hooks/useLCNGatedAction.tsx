import { useIsCurrentUserLCNUser } from 'learn-card-base';

import useJoinLCNetworkModal from './useJoinLCNetworkModal';
import useEUParentalConsentModal from './useEUParentalConsentModal';

export const useLCNGatedAction = () => {
    const { data: isLCNUser, isLoading, refetch } = useIsCurrentUserLCNUser();

    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { handlePresentEUParentalConsentModal } = useEUParentalConsentModal();

    const gate = async (): Promise<{ prompted: boolean }> => {
        let lcn = isLCNUser;

        if (isLoading) {
            const result = await refetch();
            lcn = Boolean(result.data);
        }

        if (!lcn) {
            await handlePresentJoinNetworkModal();
            return { prompted: true };
        }

        const { prompted } = await handlePresentEUParentalConsentModal();
        if (prompted) return { prompted: true };

        return { prompted: false };
    };

    return { gate };
};

export default useLCNGatedAction;
