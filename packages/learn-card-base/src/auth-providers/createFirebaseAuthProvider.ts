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
            getIdToken: (forceRefresh?: boolean) => Promise<string>;
            metadata?: { creationTime?: string };
        } | null;
    };

    /** Current user data from your app's auth store */
    user: {
        uid: string | null | undefined;
        email?: string | null;
        phoneNumber?: string | null;
    } | null;

    /** Optional sign out handler */
    onSignOut?: () => Promise<void>;

    /**
     * Re-authenticate with a server-issued token (e.g., Firebase custom token).
     * Called by `reauthenticateWithToken()`. The implementation should call
     * the provider-specific re-auth API (e.g., `signInWithCustomToken`).
     */
    onReauthenticate?: (token: string) => Promise<void>;
}

/**
 * Create an AuthProvider for Firebase Authentication.
 * 
 * @example
 * ```tsx
 * const authProvider = createFirebaseAuthProvider({
 *     getAuth: () => auth(),
 *     user: firebaseAuthStore.use.currentUser(),
 * });
 * ```
 */
export function createFirebaseAuthProvider(config: FirebaseAuthConfig): AuthProvider | null {
    const { getAuth, user, onSignOut } = config;

    if (!user?.uid) {
        return null;
    }

    return {
        async getIdToken(): Promise<string> {
            const firebaseAuth = getAuth();
            const currentUser = firebaseAuth.currentUser;

            if (!currentUser) {
                throw new AuthSessionError('No Firebase user', 'no_session');
            }

            return currentUser.getIdToken();
        },

        async getCurrentUser(): Promise<AuthUser | null> {
            if (!user?.uid) {
                return null;
            }

            // Verify the Firebase SDK session is actually active — the store
            // may have a stale user from a previous session that wasn't cleared.
            const firebaseAuth = getAuth();

            if (!firebaseAuth.currentUser) {
                return null;
            }

            const creationTime = firebaseAuth.currentUser?.metadata?.creationTime;

            return {
                id: user.uid,
                email: user.email || undefined,
                phone: user.phoneNumber || undefined,
                providerType: 'firebase' as AuthProviderType,
                createdAt: creationTime ? new Date(creationTime) : undefined,
            };
        },

        getProviderType(): AuthProviderType {
            return 'firebase';
        },

        async refreshSession(): Promise<boolean> {
            try {
                const firebaseAuth = getAuth();
                const currentUser = firebaseAuth.currentUser;

                if (!currentUser) {
                    return false;
                }

                // Force refresh — Firebase uses its long-lived refresh token
                // (~1 year) to mint a fresh JWT even if the current one expired.
                await currentUser.getIdToken(true);

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
            const firebaseAuth = getAuth();
            const cu = firebaseAuth.currentUser;

            if (!cu) return null;

            return {
                id: cu.uid,
                email: cu.email || undefined,
                phone: cu.phoneNumber || undefined,
                providerType: 'firebase' as AuthProviderType,
                createdAt: cu.metadata?.creationTime
                    ? new Date(cu.metadata.creationTime)
                    : undefined,
            };
        },

        async signOut(): Promise<void> {
            if (onSignOut) {
                await onSignOut();
            }
        },
    };
}
