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
            getIdToken: () => Promise<string>;
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

        async signOut(): Promise<void> {
            if (onSignOut) {
                await onSignOut();
            }
        },
    };
}
