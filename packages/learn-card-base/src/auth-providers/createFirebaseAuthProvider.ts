/**
 * Firebase Auth Provider Factory
 * 
 * Creates an AuthProvider implementation for Firebase Authentication.
 */

import { AuthSessionError } from '@learncard/auth-types';

import type { AuthProvider, AuthUser, AuthProviderType } from '../auth-coordinator/types';

export interface FirebaseAuthConfig {
    /** Function that returns the Firebase Auth instance */
    getAuth: () => {
        currentUser: {
            uid: string;
            email: string | null;
            phoneNumber: string | null;
            displayName: string | null;
            photoURL: string | null;
            getIdToken: (forceRefresh?: boolean) => Promise<string>;
            metadata?: { creationTime?: string };
        } | null;
    };

    /** Optional sign out handler */
    onSignOut?: () => Promise<void>;

    /**
     * Re-authenticate with a server-issued token (e.g., Firebase custom token).
     * Called by `reauthenticateWithToken()`. The implementation should call
     * the provider-specific re-auth API (e.g., `signInWithCustomToken`).
     */
    onReauthenticate?: (token: string) => Promise<void>;

    /**
     * Optional native token getter for Capacitor platforms.
     *
     * On iOS/Android the native Firebase SDK is the source of truth.
     * The web SDK's cached token (set via signInWithCredential bridge) can
     * differ in claims that downstream services (e.g. Web3Auth torus nodes)
     * check. When provided, `getIdToken()` and `refreshSession()` prefer
     * this over `getAuth().currentUser.getIdToken()`.
     */
    nativeGetIdToken?: (forceRefresh?: boolean) => Promise<string>;
}

/** Map a live Firebase currentUser to a generic AuthUser. */
const firebaseUserToAuthUser = (cu: NonNullable<ReturnType<FirebaseAuthConfig['getAuth']>['currentUser']>): AuthUser => ({
    id: cu.uid,
    email: cu.email || undefined,
    phone: cu.phoneNumber || undefined,
    displayName: cu.displayName || undefined,
    photoUrl: cu.photoURL || undefined,
    providerType: 'firebase' as AuthProviderType,
    createdAt: cu.metadata?.creationTime
        ? new Date(cu.metadata.creationTime)
        : undefined,
});

/**
 * Create an AuthProvider for Firebase Authentication.
 *
 * The provider reads from `getAuth().currentUser` on every call, so it
 * does **not** depend on external reactive state. The caller is
 * responsible for gating on "is there a user?" before passing this
 * provider to the coordinator (pass `null` when unauthenticated).
 *
 * @example
 * ```tsx
 * // Register once at module level
 * registerAuthProviderFactory('firebase', () =>
 *     createFirebaseAuthProvider({ getAuth: () => auth(), ... })
 * );
 *
 * // In the component — gate on the generic authUserStore
 * const authUser = authUserStore.use.currentUser();
 * const authProvider = useMemo(
 *     () => authUser ? resolveAuthProvider(authConfig) : null,
 *     [authUser, authConfig.authProvider],
 * );
 * ```
 */
export function createFirebaseAuthProvider(config: FirebaseAuthConfig): AuthProvider {
    const { getAuth, onSignOut } = config;

    return {
        async getIdToken(forceRefresh?: boolean): Promise<string> {
            if (config.nativeGetIdToken) {
                return config.nativeGetIdToken(forceRefresh);
            }

            const cu = getAuth().currentUser;

            if (!cu) {
                throw new AuthSessionError('No Firebase user', 'no_session');
            }

            return cu.getIdToken(forceRefresh);
        },

        async getCurrentUser(): Promise<AuthUser | null> {
            const cu = getAuth().currentUser;

            if (!cu) return null;

            return firebaseUserToAuthUser(cu);
        },

        getProviderType(): AuthProviderType {
            return 'firebase';
        },

        async refreshSession(): Promise<boolean> {
            try {
                const cu = getAuth().currentUser;

                if (!cu) return false;

                // Force refresh — Firebase uses its long-lived refresh token
                // (~1 year) to mint a fresh JWT even if the current one expired.
                if (config.nativeGetIdToken) {
                    await config.nativeGetIdToken(true);
                } else {
                    await cu.getIdToken(true);
                }

                return true;
            } catch {
                return false;
            }
        },

        async reauthenticateWithToken(token: string): Promise<AuthUser | null> {
            if (!config.onReauthenticate) {
                throw new Error('reauthenticateWithToken is not configured for this auth provider');
            }

            await config.onReauthenticate(token);

            // Read the fresh user directly from the auth SDK (not the store,
            // which may be stale until the next React render cycle).
            const cu = getAuth().currentUser;

            if (!cu) return null;

            return firebaseUserToAuthUser(cu);
        },

        async signOut(): Promise<void> {
            if (onSignOut) {
                await onSignOut();
            }
        },
    };
}
