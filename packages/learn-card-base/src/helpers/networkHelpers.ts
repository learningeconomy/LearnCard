import { networkStore } from 'learn-card-base/stores/NetworkStore';

export const PRODUCTION_NETWORK_URL = 'https://network.learncard.com/trpc';

/**
 * Returns true when the effective LearnCard Network URL points to production
 * (network.learncard.com). Use this to gate features that depend on
 * production-only data such as contracts, AI passport apps, etc.
 *
 * NOTE: this is effectively "isLearnCardProductionNetwork". e.g. it will return false
 * in Scouts production (but currently okay since we only use this variable for LCA specific features)
 */
export const isProductionNetwork = (): boolean => {
    const effectiveNetworkUrl = networkStore.get.networkUrl();

    return effectiveNetworkUrl === PRODUCTION_NETWORK_URL;
};
