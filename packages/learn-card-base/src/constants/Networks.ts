declare const LCN_URL: string | undefined;
declare const LCN_API_URL: string | undefined;
declare const CLOUD_URL: string | undefined;
declare const API_URL: string | undefined;

const getRuntimeUrl = (runtimeUrl: string | undefined, fallbackUrl: string): string => {
    return runtimeUrl ?? fallbackUrl;
};

// LCN
export const LEARNCARD_NETWORK_URL = getRuntimeUrl(
    typeof LCN_URL !== 'undefined' ? LCN_URL : undefined,
    'https://network.learncard.com/trpc'
);
export const SCOUTPASS_NETWORK_URL = getRuntimeUrl(
    typeof LCN_URL !== 'undefined' ? LCN_URL : undefined,
    'https://scoutnetwork.org/trpc'
);
// Network Staging
export const LEARNCARD_NETWORK_STAGING_URL = 'https://staging.network.learncard.com/trpc';

// LCN API URL
export const LEARNCARD_NETWORK_API_URL = getRuntimeUrl(
    typeof LCN_API_URL !== 'undefined' ? LCN_API_URL : undefined,
    'https://network.learncard.com/api'
);
export const SCOUTPASS_NETWORK_API_URL = getRuntimeUrl(
    typeof LCN_API_URL !== 'undefined' ? LCN_API_URL : undefined,
    'https://scoutnetwork.org/api'
);

// LearnCloud
export const LEARNCLOUD_URL = getRuntimeUrl(
    typeof CLOUD_URL !== 'undefined' ? CLOUD_URL : undefined,
    'https://cloud.learncard.com/trpc'
);
export const SCOUTCLOUD_URL = getRuntimeUrl(
    typeof CLOUD_URL !== 'undefined' ? CLOUD_URL : undefined,
    'https://cloud.scoutnetwork.org/trpc'
);
// Storage Staging
export const LEARNCLOUD_STAGING_URL = 'https://staging.cloud.learncard.com/trpc';

// API
export const LCA_API_ENDPOINT = getRuntimeUrl(
    typeof API_URL !== 'undefined' ? API_URL : undefined,
    'https://api.learncard.app/trpc'
);
export const SCOUTPASS_API_ENDPOINT = getRuntimeUrl(
    typeof API_URL !== 'undefined' ? API_URL : undefined,
    'https://api.scoutnetwork.org/trpc'
);

// LearnCard AI
export const LEARNCARD_AI_URL = 'https://api.learncloud.ai';
// export const LEARNCARD_AI_URL = 'http://localhost:3001'; // For local dev / testing
