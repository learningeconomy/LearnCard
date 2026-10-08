/**
 * Firebase Provider Init (learn-card-app)
 *
 * Every call site that touches the Firebase SDK for the auth provider /
 * sign-in adapter lives here, so `AuthCoordinatorProvider.tsx` and
 * `bootstrapTenantConfig.ts` stay provider-agnostic. Registering the
 * factories/initializer below only populates the `providerRegistry` maps —
 * the actual Firebase SDK calls (`initializeFirebaseFromTenant`, `auth()`,
 * etc.) run later, and only for a tenant with `getAuthConfig().authProvider
 * === 'firebase'` (see `resolveAuthProvider` / `resolveSignInAdapter` /
 * `initializeAuthProvider` in `providerRegistry.ts`).
 */

import { Capacitor } from '@capacitor/core';

import {
    createFirebaseAuthProvider,
    createFirebaseSignInAdapter,
    registerAuthProviderFactory,
    registerAuthProviderInitializer,
    registerSignInAdapterFactory,
    authStore,
    authUserStore,
    SocialLoginTypes,
    type AuthConfig,
    type TenantFirebaseConfig,
} from 'learn-card-base';

import {
    auth,
    FirebaseAuthentication,
    getFirebaseIdToken,
    initializeFirebaseFromTenant,
} from '../firebase/firebase';
import { notifyGoogleSignedIn } from '../hooks/signInInstrumentation';
import {
    getAppBaseUrl,
    getFirebaseRedirectDomain,
    getFirebaseDynamicLinkDomain,
    getNativeBundleId,
} from '../config/bootstrapTenantConfig';

registerAuthProviderFactory('firebase', () =>
    createFirebaseAuthProvider({
        getAuth: () => auth(),
        nativeGetIdToken: Capacitor.isNativePlatform()
            ? async (forceRefresh?: boolean) => {
                  return getFirebaseIdToken(
                      authStore.get.typeOfLogin() === SocialLoginTypes.google,
                      forceRefresh
                  );
              }
            : undefined,
        onReauthenticate: async (token: string) => {
            await getFirebaseSignInAdapter().signInWithCustomToken(token);
        },
        onSignOut: async () => {
            await getFirebaseSignInAdapter().signOut();
            authUserStore.set.setUser(null);
        },
    })
);

let firebaseSignInAdapter: ReturnType<typeof createFirebaseSignInAdapter> | undefined;
const getFirebaseSignInAdapter = (): ReturnType<typeof createFirebaseSignInAdapter> =>
    (firebaseSignInAdapter ??= createFirebaseSignInAdapter({
        getAuth: () => auth(),
        getNativeAuth: () => FirebaseAuthentication,
        isNativePlatform: () => Capacitor.isNativePlatform(),
        onSignedIn: method => {
            if (method === 'google') {
                authStore.set.typeOfLogin(SocialLoginTypes.google);
                notifyGoogleSignedIn();
            }
        },
        emailLinkSettings: {
            url: `${getAppBaseUrl()}/login`,
        },
        nativeEmailLinkSettings: {
            url: `https://${getFirebaseRedirectDomain()}/login`,
            iOS: { bundleId: getNativeBundleId() },
            android: { packageName: getNativeBundleId(), installApp: true, minimumVersion: '12' },
            dynamicLinkDomain: getFirebaseDynamicLinkDomain(),
        },
    }));

registerSignInAdapterFactory('firebase', getFirebaseSignInAdapter);

registerAuthProviderInitializer('firebase', (config: AuthConfig) => {
    initializeFirebaseFromTenant(
        config.providerConfig.firebase as TenantFirebaseConfig | undefined
    );
});
