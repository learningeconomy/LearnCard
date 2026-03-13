/**
 * SignInAdapterProvider
 *
 * Provides the resolved SignInAdapter via React context and manages the
 * auth-state subscription.  When the adapter emits a new user (or null),
 * the provider writes it to `authUserStore` — making it the **single
 * source of truth** for authenticated-user state.
 *
 * This replaces the Phase 1 bridge effect that manually mirrored
 * `firebaseAuthStore` → `authUserStore`.
 *
 * Usage (in the app's root provider tree):
 * ```tsx
 * <SignInAdapterProvider>
 *     <BaseAuthCoordinatorProvider ...>
 *         {children}
 *     </BaseAuthCoordinatorProvider>
 * </SignInAdapterProvider>
 * ```
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';

import type { SignInAdapter, AuthUser } from '../auth-coordinator/types';
import { getAuthConfig } from '../config/authConfig';
import { resolveSignInAdapter } from '../config/providerRegistry';
import { authUserStore } from '../stores/authUserStore';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SignInAdapterContext = createContext<SignInAdapter | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current SignInAdapter from context.
 * Throws if called outside `<SignInAdapterProvider>`.
 */
export const useSignInAdapter = (): SignInAdapter => {
    const adapter = useContext(SignInAdapterContext);

    if (!adapter) {
        throw new Error(
            'useSignInAdapter must be used within a <SignInAdapterProvider>. ' +
            'Ensure the provider is mounted above any component that calls useSignInAdapter().'
        );
    }

    return adapter;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface SignInAdapterProviderProps {
    children: React.ReactNode;

    /**
     * Optional override — if provided, this adapter is used instead of
     * resolving from the registry.  Useful for tests or one-off overrides.
     */
    adapter?: SignInAdapter;
}

export const SignInAdapterProvider: React.FC<SignInAdapterProviderProps> = ({ children, adapter: adapterOverride }) => {
    const authConfig = getAuthConfig();

    // Resolve the adapter once from the registry (or use override).
    const adapter = useMemo(
        () => adapterOverride ?? resolveSignInAdapter(authConfig),
        [adapterOverride, authConfig.authProvider],
    );

    // Subscribe to auth-state changes and write to the generic authUserStore.
    // This is the SINGLE subscription that replaces the Phase 1 bridge effect.
    useEffect(() => {
        const unsubscribe = adapter.subscribe((user: AuthUser | null) => {
            authUserStore.set.setUser(user ?? null);
        });

        return () => {
            unsubscribe();
        };
    }, [adapter]);

    return (
        <SignInAdapterContext.Provider value={adapter}>
            {children}
        </SignInAdapterContext.Provider>
    );
};
