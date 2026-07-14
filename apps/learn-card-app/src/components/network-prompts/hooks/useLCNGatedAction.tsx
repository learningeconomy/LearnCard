import useJoinLCNetworkModal from './useJoinLCNetworkModal';
import useEUParentalConsentModal from './useEUParentalConsentModal';

export const useLCNGatedAction = () => {
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { handlePresentEUParentalConsentModal } = useEUParentalConsentModal();

    const gate = async (): Promise<{ prompted: boolean }> => {
        // Ask the join-network prompt directly instead of short-circuiting on
        // `!isLCNUser`. `isLCNUser` is false for every non-`present` auth state
        // (loading / error / resolving / absent), but onboarding only actually
        // fires on a confirmed `absent`. Returning `prompted: true` for the other
        // states without showing anything dead-locks every gated action, so defer
        // to the prompt's own canonical decision and report what it really did.
        const join = await handlePresentJoinNetworkModal();
        if (join.prompted) return { prompted: true };

        const consent = await handlePresentEUParentalConsentModal();
        return { prompted: consent.prompted };
    };

    return { gate };
};

export default useLCNGatedAction;
