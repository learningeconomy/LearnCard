import { Capacitor } from '@capacitor/core';
import {
    createKeycloakAuthProvider,
    createKeycloakSignInAdapter,
    getKeycloakConfig,
    registerAuthProviderFactory,
    registerSignInAdapterFactory,
} from 'learn-card-base';
import { requestEmailOtpTicket, requestSocialTicket } from './keycloakTickets';

/** Register lazily: Firebase tenants never construct a Keycloak session. */
export const registerKeycloakFactories = (): void => {
    let provider: ReturnType<typeof createKeycloakAuthProvider> | undefined;
    const getProvider = (): ReturnType<typeof createKeycloakAuthProvider> => {
        if (provider) return provider;
        const config = getKeycloakConfig();
        if (!config) throw new Error('Keycloak configuration is missing');
        provider = createKeycloakAuthProvider({
            ...config,
            redirectUri: `${window.location.origin}/login`,
            postLogoutRedirectUri: `${window.location.origin}/login`,
        });
        return provider;
    };

    registerAuthProviderFactory('keycloak', getProvider);
    registerSignInAdapterFactory('keycloak', () =>
        createKeycloakSignInAdapter({
            provider: getProvider(),
            requestEmailOtpTicket,
            requestSocialTicket,
            // The current native token source is Firebase-only; do not initialize it here.
            isNative: () => Capacitor.isNativePlatform(),
        })
    );
};
