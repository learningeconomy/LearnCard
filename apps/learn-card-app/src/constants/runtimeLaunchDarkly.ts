import { basicLogger, type ProviderConfig } from 'launchdarkly-react-client-sdk';
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
        // Seconds: stop waiting for the first flag response and listen for recovery instead.
        // The app renders before this either way.
        timeout: 3,
    };
};

/**
 * Props for the non-blocking `LDProvider`. The app mounts right away with the flags cached
 * from the last launch (or no flags, so every consumer's default applies) and picks up live
 * flags when they arrive.
 *
 * DEV access to assistant routes/debug tools is handled by their consumers. An object
 * bootstrap would make the React SDK prefer those defaults over already-fetched flags,
 * losing flags on fast initialization/page reloads; `localStorage` is only a starting point.
 */
export const getLaunchDarklyProviderProps = (): ProviderConfig => ({
    ...getLaunchDarklyConfig(),
    options: {
        bootstrap: 'localStorage',
        logger: basicLogger({ level: 'none' }),
        diagnosticOptOut: true,
        sendEvents: false,
    },
    reactOptions: {
        sendEventsOnFlagRead: false,
    },
});
