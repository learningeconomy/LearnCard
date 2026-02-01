import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { LEARNCARD_NETWORK_API_URL } from 'learn-card-base/constants/Networks';

declare const LCN_API_URL: string | undefined;

const getNetworkHost = (): string => {
    const networkUrl = LCN_API_URL || networkStore.get.networkUrl() || LEARNCARD_NETWORK_API_URL;

    try {
        return new URL(networkUrl).host.replace(/:/g, '%3A');
    } catch {
        return window.location.host.replace(/:/g, '%3A');
    }
};

export const getAppDidFromSlug = (slug: string): string => {
    const host = getNetworkHost();

    return `did:web:${host}:app:${slug}`;
};
