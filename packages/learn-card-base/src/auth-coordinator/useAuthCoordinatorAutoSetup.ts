/**
 * useAuthCoordinatorAutoSetup
 * 
 * Watches the AuthCoordinator state and automatically handles:
 * - needs_setup: generates a new Ed25519 key, derives DID, calls setupNewKey
 * - needs_migration: uses the provided web3AuthKey, derives DID, calls migrate
 * 
 * For needs_recovery, the hook exposes state so the UI can show a recovery modal.
 * 
 * This hook should be used ONCE in the app-level AuthCoordinatorProvider wrapper.
 */

import { useEffect, useRef } from 'react';

import type { AuthCoordinatorContextValue } from './AuthCoordinatorProvider';

export interface AutoSetupConfig {
    /** Generate a new private key for first-time users */
    generatePrivateKey: () => Promise<string>;

    /** Derive a DID from a private key */
    didFromPrivateKey: (privateKey: string) => Promise<string>;

    /** Called when the coordinator reaches 'ready' with a private key */
    onReady?: (privateKey: string, did: string) => void;

    /** Called when auto-setup/migration fails */
    onError?: (error: string) => void;

    /** Whether to enable auto-setup (default: true) */
    enabled?: boolean;
}

export const useAuthCoordinatorAutoSetup = (
    coordinator: AuthCoordinatorContextValue,
    config: AutoSetupConfig
): void => {
    const { state, setupNewKey, migrate } = coordinator;

    const handlingRef = useRef(false);

    // Keep a ref to the latest config & actions so effects can read fresh
    // values without needing them in the dependency array (avoids re-firing
    // when callback identity changes but state.status hasn't).
    const configRef = useRef(config);
    configRef.current = config;

    const actionsRef = useRef({ setupNewKey, migrate });
    actionsRef.current = { setupNewKey, migrate };

    const enabled = config.enabled ?? true;

    // Auto-handle needs_setup
    useEffect(() => {
        if (!enabled || state.status !== 'needs_setup' || handlingRef.current) return;

        handlingRef.current = true;

        const handleSetup = async () => {
            try {
                const privateKey = await configRef.current.generatePrivateKey();

                const did = await configRef.current.didFromPrivateKey(privateKey);

                if (!did) {
                    throw new Error('Failed to derive DID from generated key');
                }

                await actionsRef.current.setupNewKey(privateKey, did);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Auto-setup failed';
                console.error('useAuthCoordinatorAutoSetup: setup failed', msg);
                configRef.current.onError?.(msg);
            } finally {
                handlingRef.current = false;
            }
        };

        handleSetup();
    }, [state.status, enabled]);

    // Auto-handle needs_migration (when migrationData contains a key to migrate)
    useEffect(() => {
        if (!enabled || state.status !== 'needs_migration' || handlingRef.current) return;

        const migrationKey = state.migrationData?.web3AuthKey as string | undefined;

        if (!migrationKey) return;

        handlingRef.current = true;

        const handleMigration = async () => {
            try {
                const web3AuthKey = migrationKey;

                const did = await configRef.current.didFromPrivateKey(web3AuthKey);

                if (!did) {
                    throw new Error('Failed to derive DID from Web3Auth key');
                }

                await actionsRef.current.migrate(web3AuthKey, did);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Auto-migration failed';
                console.error('useAuthCoordinatorAutoSetup: migration failed', msg);
                configRef.current.onError?.(msg);
            } finally {
                handlingRef.current = false;
            }
        };

        handleMigration();
    }, [state.status, enabled]);

    // Notify when ready
    useEffect(() => {
        if (state.status === 'ready' && 'privateKey' in state && 'did' in state) {
            configRef.current.onReady?.(state.privateKey, state.did);
        }
    }, [state.status]);
};

export default useAuthCoordinatorAutoSetup;
