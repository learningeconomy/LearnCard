import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';

export const ANONYMOUS_CONTEXT = {
    kind: 'user',
    key: 'anonymous',
};

export const getLaunchDarklyConfig = (): {
    clientSideID: string;
    context: typeof ANONYMOUS_CONTEXT;
} => {
    const config = getResolvedTenantConfig();

    return {
        clientSideID: config.observability.launchDarklyClientId,
        context: ANONYMOUS_CONTEXT,
    };
};
