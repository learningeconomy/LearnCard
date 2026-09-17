/**
 * Firebase Provider Init (Scouts app)
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
    getLogger,
    type AuthConfig,
    type TenantFirebaseConfig,
} from 'learn-card-base';

import {
    auth,
    getNativeAuth,
    getNativeIdToken,
    initializeFirebaseFromTenant,
} from '../firebase/firebase';
import { FIREBASE_REDIRECT_URL } from '../constants/web3AuthConfig';

const log = getLogger('scouts/firebase-provider-init');

registerAuthProviderFactory('firebase', () =>
    createFirebaseAuthProvider({
        getAuth: () => auth(),
        nativeGetIdToken: Capacitor.isNativePlatform()
            ? (forceRefresh?: boolean) =>
                  getNativeIdToken(
                      authStore.get.typeOfLogin() === SocialLoginTypes.google,
                      forceRefresh
                  )
            : undefined,
        onReauthenticate: async (token: string) => {
            await getFirebaseSignInAdapter().signInWithCustomToken(token);
        },
        onSignOut: async () => {
            await getFirebaseSignInAdapter().signOut();
        },
    })
);

let firebaseSignInAdapter: ReturnType<typeof createFirebaseSignInAdapter> | undefined;
const getFirebaseSignInAdapter = (): ReturnType<typeof createFirebaseSignInAdapter> =>
    (firebaseSignInAdapter ??= createFirebaseSignInAdapter({
        getAuth: () => auth(),
        getNativeAuth,
        isNativePlatform: () => Capacitor.isNativePlatform(),
        emailLinkSettings: {
            url:
                (typeof IS_PRODUCTION !== 'undefined' && IS_PRODUCTION) ||
                Capacitor.getPlatform() === 'android'
                    ? `https://${FIREBASE_REDIRECT_URL}/login`
                    : 'http://localhost:3000/login',
        },
        nativeEmailLinkSettings: {
            url: `https://${FIREBASE_REDIRECT_URL}/login`,
            iOS: { bundleId: 'org.scoutpass.app' },
            android: { packageName: 'org.scoutpass.app', installApp: true, minimumVersion: '12' },
            dynamicLinkDomain: 'pass.scout.org',
        },
        onSignedIn: method => {
            // Google must select native token retrieval before web-layer synchronization.
            if (method === 'google') authStore.set.typeOfLogin(SocialLoginTypes.google);
        },
        onOperation: (operation, phase) => {
            if (operation === 'signOut' && phase === 'succeeded') authUserStore.set.setUser(null);
        },
        onCredentialSyncError: error =>
            log.debug('googleLogin::signInWithCredential::web::error', error),
    }));

registerSignInAdapterFactory('firebase', getFirebaseSignInAdapter);

registerAuthProviderInitializer('firebase', (config: AuthConfig) => {
    initializeFirebaseFromTenant(
        config.providerConfig.firebase as TenantFirebaseConfig | undefined
    );
});
