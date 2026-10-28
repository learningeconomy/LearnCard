import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';
import { environment } from '../config/environment';

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
        clientSideID:
            environment.VITE_LAUNCHDARKLY_CLIENT_ID ?? config.observability.launchDarklyClientId,
        context: ANONYMOUS_CONTEXT,
        // Seconds: render the app even if flag requests stall while the network
        // interface remains connected. The provider still receives flags on recovery.
        timeout: 3,
    };
};
