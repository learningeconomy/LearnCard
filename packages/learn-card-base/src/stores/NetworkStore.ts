import { createStore } from '@udecode/zustood';
import {
    LCA_API_ENDPOINT,
    LEARNCLOUD_URL,
    LEARNCARD_NETWORK_URL,
    LEARNCARD_NETWORK_API_URL,
} from 'learn-card-base/constants/Networks';

import type { TenantApiConfig } from 'learn-card-base/config/tenantConfig';

export const networkStore = createStore('networkStore')<{
    networkUrl: string;
    networkApiUrl: string;
    cloudUrl: string;
    xapiUrl: string;
    apiEndpoint: string;
}>(
    {
        networkUrl: LEARNCARD_NETWORK_URL,
        networkApiUrl: LEARNCARD_NETWORK_API_URL,
        cloudUrl: LEARNCLOUD_URL,
        xapiUrl: '',
        apiEndpoint: LCA_API_ENDPOINT,
    },
    { persist: { name: 'networkStore', enabled: true } }
);

/**
 * Populate the network store from a TenantConfig's API settings.
 *
 * Call this once at app boot, after resolving the TenantConfig.
 * Values set here will override the hardcoded defaults from Networks.ts.
 * The persisted store means subsequent boots will use these until overridden again.
 */
export const initNetworkStoreFromTenant = (apis: TenantApiConfig): void => {
    networkStore.set.networkUrl(apis.brainService);
    networkStore.set.networkApiUrl(apis.brainServiceApi);
    networkStore.set.cloudUrl(apis.cloudService);
    networkStore.set.xapiUrl(apis.xapi ?? apis.cloudService.replace(/\/trpc\/?$/, '/xapi'));
    networkStore.set.apiEndpoint(apis.lcaApi);
};
