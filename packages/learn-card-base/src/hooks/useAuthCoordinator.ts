/**
 * useAuthCoordinator
 * 
 * React hook wrapper for the AuthCoordinator state machine.
 * Provides a unified interface for auth + key derivation state management.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import {
    AuthCoordinator,
    createAuthCoordinator,
    type UnifiedAuthState,
    type AuthCoordinatorConfig,
    type AuthCoordinatorApi,
    type StorageFunctions,
} from '@learncard/sss-key-manager';
import type { AuthProvider, RecoveryMethod } from '@learncard/sss-key-manager';

export interface UseAuthCoordinatorConfig {
    authProvider: AuthProvider | null;
    serverUrl: string;
    didFromPrivateKey?: (privateKey: string) => Promise<string>;
    getWeb3AuthKey?: () => Promise<string | null>;
    storage?: StorageFunctions;
}

export interface UseAuthCoordinatorApi {
    fetchServerKeyStatus: AuthCoordinatorApi['fetchServerKeyStatus'];
    storeAuthShare: AuthCoordinatorApi['storeAuthShare'];
    markMigrated: AuthCoordinatorApi['markMigrated'];
}

export interface UseAuthCoordinatorReturn {
    state: UnifiedAuthState;
    isReady: boolean;
    isLoading: boolean;
    needsSetup: boolean;
    needsMigration: boolean;
    needsRecovery: boolean;
    hasError: boolean;
    error: string | null;

    initialize: () => Promise<void>;
    setupNewKey: (privateKey: string, did: string) => Promise<void>;
    migrate: (privateKey: string, did: string) => Promise<void>;
    recover: (recoveryShare: string, did: string) => Promise<void>;
    logout: () => Promise<void>;
    retry: () => Promise<void>;
    verifyKeyIntegrity: () => Promise<boolean>;
}

export const useAuthCoordinator = (
    config: UseAuthCoordinatorConfig,
    api: UseAuthCoordinatorApi
): UseAuthCoordinatorReturn => {
    const [state, setState] = useState<UnifiedAuthState>({ status: 'idle' });
    const coordinatorRef = useRef<AuthCoordinator | null>(null);
    const initializedRef = useRef(false);

    // Create coordinator when auth provider is available
    useEffect(() => {
        if (!config.authProvider) {
            setState({ status: 'idle' });
            return;
        }

        const coordinator = createAuthCoordinator(
            {
                authProvider: config.authProvider,
                serverUrl: config.serverUrl,
                didFromPrivateKey: config.didFromPrivateKey,
                getWeb3AuthKey: config.getWeb3AuthKey,
                storage: config.storage,
                onStateChange: setState,
            },
            api
        );

        coordinatorRef.current = coordinator;

        // Auto-initialize on mount
        if (!initializedRef.current) {
            initializedRef.current = true;
            coordinator.initialize();
        }

        return () => {
            coordinatorRef.current = null;
        };
    }, [config.authProvider, config.serverUrl, api]);

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

    const recover = useCallback(async (recoveryShare: string, did: string) => {
        if (!coordinatorRef.current) {
            throw new Error('Coordinator not initialized');
        }
        await coordinatorRef.current.recover(recoveryShare, did);
    }, []);

    const logout = useCallback(async () => {
        if (coordinatorRef.current) {
            await coordinatorRef.current.logout();
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

    // Derived state
    const isReady = state.status === 'ready';
    const isLoading = ['authenticating', 'checking_key_status', 'deriving_key'].includes(state.status);
    const needsSetup = state.status === 'needs_setup';
    const needsMigration = state.status === 'needs_migration';
    const needsRecovery = state.status === 'needs_recovery';
    const hasError = state.status === 'error';
    const error = state.status === 'error' ? state.error : null;

    return {
        state,
        isReady,
        isLoading,
        needsSetup,
        needsMigration,
        needsRecovery,
        hasError,
        error,
        initialize,
        setupNewKey,
        migrate,
        recover,
        logout,
        retry,
        verifyKeyIntegrity,
    };
};

export default useAuthCoordinator;
