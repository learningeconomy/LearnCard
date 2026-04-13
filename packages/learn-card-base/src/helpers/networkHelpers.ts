import { LEARNCARD_NETWORK_URL } from 'learn-card-base/constants/Networks';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

/**
 * Returns true when the effective LearnCard Network URL points to production
 * (network.learncard.com). Use this to gate features that depend on
 * production-only data such as contracts, AI passport apps, etc.
 */
export const isProductionNetwork = (): boolean => {
    const effectiveNetworkUrl = networkStore.get.networkUrl();

    return effectiveNetworkUrl === LEARNCARD_NETWORK_URL;
};
