import { Capacitor } from '@capacitor/core';
import {
    createKeycloakAuthProvider,
    createKeycloakSignInAdapter,
    getKeycloakConfig,
    registerAuthProviderFactory,
    registerSignInAdapterFactory,
} from 'learn-card-base';
import { requestEmailOtpTicket, requestSocialTicket } from './keycloakTickets';
import { clearKeycloakReauth, readKeycloakReauth, validateKeycloakReauth } from './keycloakReauth';

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
            validateRedirectUser: validateKeycloakReauth,
        });
        return provider;
    };

    registerAuthProviderFactory('keycloak', getProvider);
    registerSignInAdapterFactory('keycloak', () =>
        createKeycloakSignInAdapter({
            provider: getProvider(),
            requestEmailOtpTicket,
            requestSocialTicket,
            openAuthorization: args => {
                if (args.extraQueryParams.prompt !== 'login') clearKeycloakReauth();
                const intent = readKeycloakReauth();
                return getProvider().userManager.signinRedirect({
                    ...args,
                    ...(intent ? { state: { reauthId: intent.id } } : {}),
                });
            },
            // The current native token source is Firebase-only; do not initialize it here.
            isNative: () => Capacitor.isNativePlatform(),
        })
    );
};
