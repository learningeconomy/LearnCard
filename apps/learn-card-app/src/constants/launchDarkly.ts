import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';

export const ANONYMOUS_CONTEXT = {
    kind: 'user',
    key: 'anonymous',
};

const getLaunchDarklyClientId = (): string => {
    try {
        const config = getResolvedTenantConfig();
        return config.observability.launchDarklyClientId;
    } catch {
        // Fallback to Vite globals if TenantConfig is not yet resolved
        return (typeof IS_PRODUCTION !== 'undefined' && IS_PRODUCTION)
            ? '63dabf3982caed12cac3e55c'
            : '63dabf3982caed12cac3e55b';
    }
};

export const LAUNCH_DARKLY_CONFIG = {
    clientSideID: getLaunchDarklyClientId(),
    context: ANONYMOUS_CONTEXT,
};