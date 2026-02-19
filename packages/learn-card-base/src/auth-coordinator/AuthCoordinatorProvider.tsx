/**
 * AuthCoordinatorProvider
 * 
 * Shared React provider for the unified auth + key derivation orchestration layer.
 * Can be used by any app (LearnCard, Scouts, etc.) with minimal configuration.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { AuthCoordinator, createAuthCoordinator } from './AuthCoordinator';

import type {
    AuthProvider,
    AuthProviderType,
    KeyDerivationCapabilities,
    KeyDerivationStrategy,
    UnifiedAuthState,
} from './types';

export type DebugEventLevel = 'info' | 'success' | 'warning' | 'error';

export interface AuthCoordinatorContextValue {
    state: UnifiedAuthState;
    isReady: boolean;
    isLoading: boolean;
    needsSetup: boolean;
    needsMigration: boolean;
    needsRecovery: boolean;
    hasError: boolean;
    error: string | null;

    /** The current private key (null if not ready) */
    privateKey: string | null;

    /** The current DID (null if not ready) */
    did: string | null;

    /** Whether the auth provider session (e.g. Firebase JWT) is currently valid */
    authSessionValid: boolean;

    /** Declarative feature flags from the active key derivation strategy */
    capabilities: KeyDerivationCapabilities;

    /** The key derivation strategy (for app-level recovery setup / method queries) */
    keyDerivation: KeyDerivationStrategy;

    initialize: () => Promise<void>;
    setupNewKey: (privateKey: string, did: string) => Promise<void>;
    migrate: (privateKey: string, did: string) => Promise<void>;
    setMigrationData: (data: Record<string, unknown>) => void;
    recover: (input: unknown) => Promise<void>;
    logout: () => Promise<void>;
    forgetDevice: () => Promise<void>;
    retry: () => Promise<void>;
    verifyKeyIntegrity: () => Promise<boolean>;

    /**
     * Attempt to silently refresh the auth session (e.g., refresh an expired JWT).
     * Returns true if the session was refreshed, false if full re-auth is needed.
     */
    refreshAuthSession: () => Promise<boolean>;
}

const AuthCoordinatorContext = createContext<AuthCoordinatorContextValue | null>(null);

/**
 * Hook to access the AuthCoordinator context.
 * Must be used within an AuthCoordinatorProvider.
 */
export const useAuthCoordinator = (): AuthCoordinatorContextValue => {
    const context = useContext(AuthCoordinatorContext);

    if (!context) {
        throw new Error('useAuthCoordinator must be used within AuthCoordinatorProvider');
    }

    return context;
};

/** @deprecated Use `useAuthCoordinator` instead. */
export const useAuthCoordinatorContext = useAuthCoordinator;

export interface AuthCoordinatorProviderProps {
    children: React.ReactNode;

    /** Key derivation strategy (e.g., SSS). The strategy owns server communication. */
    keyDerivation: KeyDerivationStrategy;

    /** Auth provider (e.g., Firebase) - if null, coordinator stays idle */
    authProvider: AuthProvider | null;

    /** Function to derive DID from private key */
    didFromPrivateKey?: (privateKey: string) => Promise<string>;

    /** Function to sign a DID-Auth VP JWT proving private key ownership for server write ops */
    signDidAuthVp?: (privateKey: string) => Promise<string>;

    /** Optional: retrieve a cached private key for private-key-first init */
    getCachedPrivateKey?: () => Promise<string | null>;

    /** Called after the coordinator finishes its own logout cleanup. Use for app-specific store/DB clearing. */
    onLogout?: () => Promise<void>;

    /** Debug event callback for logging/debugging */
    onDebugEvent?: (type: string, message: string, level: DebugEventLevel, data?: Record<string, unknown>) => void;

    /**
     * Kill-switch: when false the coordinator stays in `idle` and never initializes.
     * Defaults to `true`.  Set via `VITE_USE_AUTH_COORDINATOR=false` env var
     * or pass explicitly.
     */
    enabled?: boolean;

    /**
     * Threshold (in ms) for detecting legacy accounts that need migration.
     * See AuthCoordinatorConfig.legacyAccountThresholdMs for details.
     */
    legacyAccountThresholdMs?: number;
}

/**
 * Shared AuthCoordinatorProvider.
 * 
 * @example
 * ```tsx
 * import { createSSSStrategy } from '@learncard/sss-key-manager';
 * import { createFirebaseAuthProvider } from 'learn-card-base';
 * 
 * const sssStrategy = createSSSStrategy({ serverUrl: 'https://api.learncard.com' });
 * const authProvider = createFirebaseAuthProvider({
 *     getAuth: () => auth(),
 *     user: firebaseUser,
 * });
 * 
 * <AuthCoordinatorProvider
 *     keyDerivation={sssStrategy}
 *     authProvider={authProvider}
 *     didFromPrivateKey={deriveDidFromKey}
 * >
 *     <App />
 * </AuthCoordinatorProvider>
 * ```
 */
export const AuthCoordinatorProvider: React.FC<AuthCoordinatorProviderProps> = ({
    children,
    keyDerivation,
    authProvider,
    didFromPrivateKey,
    signDidAuthVp,
    getCachedPrivateKey,
    onLogout,
    onDebugEvent,
    enabled = true,
    legacyAccountThresholdMs,
}) => {
    const [state, setState] = useState<UnifiedAuthState>({ status: 'idle' });
    const coordinatorRef = useRef<AuthCoordinator | null>(null);

    // Helper to determine event level from state
    const getStateEventLevel = useCallback((newState: UnifiedAuthState): DebugEventLevel => {
        if (newState.status === 'error') return 'error';
        if (newState.status === 'ready') return 'success';
        if (newState.status === 'needs_recovery') return 'warning';
        return 'info';
    }, []);

    // Helper to extract state details for debug
    const extractStateDetails = useCallback((newState: UnifiedAuthState): Record<string, unknown> => {
        const details: Record<string, unknown> = { status: newState.status };

        if (newState.status === 'error') {
            details.error = newState.error;
            details.canRetry = newState.canRetry;
        } else if (newState.status === 'ready') {
            details.did = newState.did;
        } else if (newState.status === 'needs_recovery') {
            details.recoveryMethods = newState.recoveryMethods.map(m => m.type);
        }

        return details;
    }, []);

    // No-op auth provider stub — used when no real auth provider is available yet.
    // Allows the coordinator to run the private-key-first path on page reload
    // before Firebase restores the session.
    const noOpAuthProvider = useMemo<AuthProvider>(() => ({
        async getIdToken() { throw new Error('No auth provider available'); },
        async getCurrentUser() { return null; },
        getProviderType(): AuthProviderType { return 'firebase'; },
        async signOut() {},
    }), []);

    // Use the real auth provider if available, otherwise the no-op stub
    const effectiveAuthProvider = authProvider ?? noOpAuthProvider;

    // Create coordinator and initialize on every authProvider change.
    // When authProvider transitions null → valid (login), a new coordinator
    // is created and initialized with the real provider.
    // When `enabled` is false (kill-switch), the coordinator stays idle.
    useEffect(() => {
        if (!enabled) {
            coordinatorRef.current = null;
            setState({ status: 'idle' });
            return;
        }

        let stale = false;

        const handleStateChange = (newState: UnifiedAuthState) => {
            if (stale) return;

            setState(newState);

            onDebugEvent?.(
                'auth:state_transition',
                `State → ${newState.status}`,
                getStateEventLevel(newState),
                extractStateDetails(newState)
            );
        };

        const coordinator = createAuthCoordinator({
            authProvider: effectiveAuthProvider,
            keyDerivation,
            onStateChange: handleStateChange,
            didFromPrivateKey,
            signDidAuthVp,
            getCachedPrivateKey,
            onLogout,
            legacyAccountThresholdMs,
        });

        coordinatorRef.current = coordinator;

        coordinator.initialize();

        return () => {
            stale = true;
            coordinatorRef.current = null;
        };
    }, [enabled, effectiveAuthProvider, keyDerivation, didFromPrivateKey, signDidAuthVp, getCachedPrivateKey, onLogout, onDebugEvent, getStateEventLevel, extractStateDetails]);

    const initialize = useCallback(async () => {
        if (coordinatorRef.current) {
            await coordinatorRef.current.initialize();
        }
    }, []);

    const setupNewKey = useCallback(async (privateKey: string, did: string) => {
        if (!coordinatorRef.current) {
            throw new Error('Coordinator not initialized');
        }
        await coordinatorRef.current.setupNewKey(privateKey, did);
    }, []);

    const migrate = useCallback(async (privateKey: string, did: string) => {
        if (!coordinatorRef.current) {
            throw new Error('Coordinator not initialized');
        }
        await coordinatorRef.current.migrate(privateKey, did);
    }, []);

    const setMigrationData = useCallback((data: Record<string, unknown>) => {
        if (!coordinatorRef.current) {
            throw new Error('Coordinator not initialized');
        }
        coordinatorRef.current.setMigrationData(data);
    }, []);

    const recover = useCallback(async (input: unknown) => {
        if (!coordinatorRef.current) {
            throw new Error('Coordinator not initialized');
        }
        await coordinatorRef.current.recover(input);
    }, []);

    const logout = useCallback(async () => {
        if (coordinatorRef.current) {
            await coordinatorRef.current.logout();
        }
    }, []);

    const forgetDevice = useCallback(async () => {
        if (coordinatorRef.current) {
            await coordinatorRef.current.forgetDevice();
        }
    }, []);

    const retry = useCallback(async () => {
        if (coordinatorRef.current) {
            await coordinatorRef.current.retry();
        }
    }, []);

    const verifyKeyIntegrity = useCallback(async () => {
        if (!coordinatorRef.current) {
            return false;
        }
        return coordinatorRef.current.verifyKeyIntegrity();
    }, []);

    const refreshAuthSession = useCallback(async () => {
        if (!coordinatorRef.current) {
            return false;
        }
        return coordinatorRef.current.refreshAuthSession();
    }, []);

    // Derived state
    const isReady = state.status === 'ready';
    const isLoading = ['authenticating', 'checking_key_status', 'deriving_key'].includes(state.status);
    const needsSetup = state.status === 'needs_setup';
    const needsMigration = state.status === 'needs_migration';
    const needsRecovery = state.status === 'needs_recovery';
    const hasError = state.status === 'error';
    const error = state.status === 'error' ? state.error : null;

    const privateKey = state.status === 'ready' ? state.privateKey : null;
    const did = state.status === 'ready' ? state.did : null;
    const authSessionValid = state.status === 'ready' ? state.authSessionValid : false;

    const value: AuthCoordinatorContextValue = useMemo(() => ({
        state,
        isReady,
        isLoading,
        needsSetup,
        needsMigration,
        needsRecovery,
        hasError,
        error,
        privateKey,
        did,
        authSessionValid,
        capabilities: keyDerivation.capabilities,
        keyDerivation,
        initialize,
        setupNewKey,
        migrate,
        setMigrationData,
        recover,
        logout,
        forgetDevice,
        retry,
        verifyKeyIntegrity,
        refreshAuthSession,
    }), [
        state,
        isReady,
        isLoading,
        needsSetup,
        needsMigration,
        needsRecovery,
        hasError,
        error,
        privateKey,
        did,
        authSessionValid,
        keyDerivation,
        initialize,
        setupNewKey,
        migrate,
        setMigrationData,
        recover,
        logout,
        forgetDevice,
        retry,
        verifyKeyIntegrity,
        refreshAuthSession,
    ]);

    return (
        <AuthCoordinatorContext.Provider value={value}>
            {children}
        </AuthCoordinatorContext.Provider>
    );
};

export default AuthCoordinatorProvider;
