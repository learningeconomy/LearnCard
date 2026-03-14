/**
 * Generic Auth User Store
 *
 * Provider-agnostic Zustand store for the authenticated user's identity.
 * The coordinator layer reads from this store instead of any provider-specific
 * store (e.g., firebaseAuthStore).
 *
 * The `SignInAdapterProvider` subscribes to `onAuthStateChanged` and writes
 * every auth-state change here — making this the **single source of truth**
 * for authenticated-user state across the entire app.
 */

import { createStore } from '@udecode/zustood';

import type { AuthUser } from '../auth-coordinator/types';

export const authUserStore = createStore('authUserStore')<{
    currentUser: AuthUser | null;
}>(
    { currentUser: null },
    { persist: { name: 'authUser', enabled: true } }
).extendActions((set, _get) => ({
    setUser: (user: AuthUser | null) => {
        set.currentUser(user ?? null);
    },
}));

export default authUserStore;
