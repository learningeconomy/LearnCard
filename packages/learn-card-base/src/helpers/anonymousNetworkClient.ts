import { getAnonymousClient } from '@learncard/network-brain-client';

import { networkStore } from '../stores/NetworkStore';

let cached: { url: string; client: ReturnType<typeof getAnonymousClient> } | undefined;

/**
 * A no-auth client for the network's public routes, on the current network (tenants and dev tools
 * can switch it). Public reads go through this so a signed-out visitor never builds a throwaway
 * wallet, and a signed-in one doesn't wait on wallet start-up.
 */
export const getAnonymousNetworkClient = () => {
    const url = networkStore.get.networkUrl();
    if (cached?.url !== url) cached = { url, client: getAnonymousClient(url) };
    return cached.client;
};
