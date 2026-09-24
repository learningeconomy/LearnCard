import { Capacitor } from '@capacitor/core';
import {
    createKeycloakAuthProvider,
    createKeycloakSignInAdapter,
    getKeycloakConfig,
    registerAuthProviderFactory,
    registerSignInAdapterFactory,
} from 'learn-card-base';
import { getResolvedTenantConfig } from '../config/tenantConfigState';
import { openNativeAuthSession } from './nativeAuthSession';
import { getNativeAppleIdToken, getNativeGoogleIdToken } from './nativeSocialTokens';
import { requestEmailOtpTicket, requestSocialTicket } from './keycloakTickets';
import { clearKeycloakReauth, readKeycloakReauth, validateKeycloakReauth } from './keycloakReauth';
import { resolveKeycloakBridgeUrl } from './keycloakBridge';

/** Register lazily: Firebase tenants never construct a Keycloak session. */
export const registerKeycloakFactories = (): void => {
    const native = Capacitor.isNativePlatform();

    /** Native builds must ship a bundle ID; there is no web-origin fallback for it. */
    const resolveNativeBundleId = (): string => {
        const bundleId = getResolvedTenantConfig().native?.bundleId;
        if (!bundleId) {
            throw new Error(
                'Native Keycloak sign-in requires the tenant config native.bundleId to be set'
            );
        }
        return bundleId;
    };

    let provider: ReturnType<typeof createKeycloakAuthProvider> | undefined;
    const getProvider = (): ReturnType<typeof createKeycloakAuthProvider> => {
        if (provider) return provider;
        const config = getKeycloakConfig();
        if (!config) throw new Error('Keycloak configuration is missing');
        const redirectUri = native
            ? `${resolveNativeBundleId()}://login`
            : `${window.location.origin}/login`;
        provider = createKeycloakAuthProvider({
            ...config,
            redirectUri,
            // No end_session redirect on native: signOut takes the removeUser+revoke path.
            postLogoutRedirectUri: native ? undefined : `${window.location.origin}/login`,
            validateRedirectUser: validateKeycloakReauth,
            ...(native
                ? {
                      navigate: async (authorizeUrl: string): Promise<void> => {
                          const bridgeUrl = await resolveKeycloakBridgeUrl(
                              authorizeUrl,
                              config.authBridgeUrl
                          );
                          const callbackUrl = await openNativeAuthSession(bridgeUrl, {
                              callbackUrlPrefix: redirectUri,
                              callbackScheme: resolveNativeBundleId(),
                          });
                          await getProvider().handleRedirectCallback(callbackUrl);
                      },
                  }
                : {}),
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
                // Android/iOS Custom Tabs and SFSafariViewController share the system
                // browser's Keycloak SSO cookie; without prompt=login, a second
                // account's ticket could silently resolve to the previous session.
                const extraQueryParams = native
                    ? { ...args.extraQueryParams, prompt: 'login' }
                    : args.extraQueryParams;
                return getProvider().userManager.signinRedirect({
                    ...args,
                    extraQueryParams,
                    ...(intent ? { state: { reauthId: intent.id } } : {}),
                });
            },
            isNative: () => Capacitor.isNativePlatform(),
            ...(native
                ? { nativeSocial: { google: getNativeGoogleIdToken, apple: getNativeAppleIdToken } }
                : {}),
        })
    );
};
