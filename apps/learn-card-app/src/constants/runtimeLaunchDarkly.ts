import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';

export const ANONYMOUS_CONTEXT = {
    kind: 'user',
    key: 'anonymous',
};

export const getLaunchDarklyConfig = (): {
    clientSideID: string;
    context: typeof ANONYMOUS_CONTEXT;
    timeout: number;
} => {
    const config = getResolvedTenantConfig();

    return {
        clientSideID: config.observability.launchDarklyClientId,
        context: ANONYMOUS_CONTEXT,
        // Seconds: render the app even if flag requests stall while the network
        // interface remains connected. The provider still receives flags on recovery.
        timeout: 3,
    };
};
