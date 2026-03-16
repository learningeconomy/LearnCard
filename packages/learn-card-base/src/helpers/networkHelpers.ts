import { LEARNCARD_NETWORK_URL } from 'learn-card-base/constants/Networks';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

/**
 * Returns true when the effective LearnCard Network URL points to production
 * (network.learncard.com). Use this to gate features that depend on
 * production-only data such as contracts, AI passport apps, etc.
 */
export const isProductionNetwork = (): boolean => {
    const overriddenNetworkUrl = typeof LCN_URL === 'string' ? LCN_URL : undefined;

    const storedNetworkUrl = networkStore.get.networkUrl();

    const effectiveNetworkUrl = overriddenNetworkUrl?.trim() ? overriddenNetworkUrl : storedNetworkUrl;

    return effectiveNetworkUrl === LEARNCARD_NETWORK_URL;
};
