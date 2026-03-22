import { networkStore } from 'learn-card-base/stores/NetworkStore';

const getNetworkHost = (): string => {
    const networkUrl = networkStore.get.networkApiUrl();

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
