import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { LEARNCARD_NETWORK_STAGING_URL, LEARNCARD_NETWORK_URL } from './Networks';

/** LearnCard AI consent contract on production (network.learncard.com). */
export const LEARNCARD_AI_PASSPORT_CONTRACT_URI =
    'lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b';

/** LearnCard AI consent contract on staging (staging.network.learncard.com), owned by learn-cloud. */
export const LEARNCARD_AI_PASSPORT_STAGING_CONTRACT_URI =
    'lc:network:staging.network.learncard.com/trpc:contract:9eade6a7-7181-4509-b805-d26e30a8f7f1';

const normalizeNetworkUrl = (url?: string | null): string => (url ?? '').replace(/\/+$/, '');

const isStagingNetworkUrl = (networkUrl?: string | null): boolean =>
    normalizeNetworkUrl(networkUrl) === LEARNCARD_NETWORK_STAGING_URL;

const currentNetworkUrl = (): string => networkStore.get.networkUrl();

/**
 * The LearnCard AI consent contract for the network the app is pointed at. Staging gets the
 * staging contract; every other network keeps the production default.
 */
export const getLearnCardAiPassportContractUri = (
    networkUrl: string = currentNetworkUrl()
): string =>
    isStagingNetworkUrl(networkUrl)
        ? LEARNCARD_AI_PASSPORT_STAGING_CONTRACT_URI
        : LEARNCARD_AI_PASSPORT_CONTRACT_URI;

/**
 * True when the LearnCard AI consent contract exists on this network (production or staging),
 * so auto-consent can run. Local and other networks have no contract.
 */
export const hasLearnCardAiPassportContract = (
    networkUrl: string = currentNetworkUrl()
): boolean => {
    const normalized = normalizeNetworkUrl(networkUrl);

    return normalized === LEARNCARD_NETWORK_URL || normalized === LEARNCARD_NETWORK_STAGING_URL;
};

/** Matches the LearnCard AI consent contract on either production or staging. */
export const isLearnCardAiPassportContractUri = (contractUri?: string | null): boolean => {
    return (
        contractUri === LEARNCARD_AI_PASSPORT_CONTRACT_URI ||
        contractUri === LEARNCARD_AI_PASSPORT_STAGING_CONTRACT_URI
    );
};
