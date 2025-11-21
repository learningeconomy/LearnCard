import { createStore } from '@udecode/zustood';
import {
    LCA_API_ENDPOINT,
    LEARNCLOUD_URL,
    LEARNCARD_NETWORK_URL,
} from 'learn-card-base/constants/Networks';

export const networkStore = createStore('networkStore')<{
    networkUrl: string;
    cloudUrl: string;
    apiEndpoint: string;
}>(
    { networkUrl: LEARNCARD_NETWORK_URL, cloudUrl: LEARNCLOUD_URL, apiEndpoint: LCA_API_ENDPOINT },
    { persist: { name: 'networkStore', enabled: true } }
);
