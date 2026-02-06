/**
 * Auth Coordinator
 * 
 * Unified state machine that coordinates authentication and key derivation.
 * Provides a single source of truth for auth state across the application.
 * 
 * This coordinator is designed to be:
 * - Auth provider agnostic (Firebase, Supertokens, OIDC, etc.)
 * - Key derivation provider agnostic (SSS, Web3Auth, etc.)
 * - Easily testable with mock providers
 * - Shareable across apps (LearnCard, Scouts, etc.)
 */

import type {
    AuthProvider,
    AuthUser,
    RecoveryMethod,
    RecoveryMethodInfo,
    KeyDerivationProvider,
} from './types';

import { splitAndVerify, atomicShareUpdate, verifyStoredShares } from './atomic-operations';
import { reconstructFromShares } from './sss';
import {
    storeDeviceShare as defaultStoreDeviceShare,
    getDeviceShare as defaultGetDeviceShare,
    hasDeviceShare as defaultHasDeviceShare,
    clearAllShares as defaultClearAllShares,
} from './storage';

export interface StorageFunctions {
    storeDeviceShare: (share: string) => Promise<void>;
    getDeviceShare: () => Promise<string | null>;
    hasDeviceShare: () => Promise<boolean>;
    clearAllShares: () => Promise<void>;
}

const defaultStorage: StorageFunctions = {
    storeDeviceShare: defaultStoreDeviceShare,
    getDeviceShare: defaultGetDeviceShare,
    hasDeviceShare: defaultHasDeviceShare,
    clearAllShares: defaultClearAllShares,
};

export type UnifiedAuthState =
    | { status: 'idle' }
    | { status: 'authenticating' }
    | { status: 'authenticated'; authUser: AuthUser }
    | { status: 'checking_key_status' }
    | { status: 'needs_setup'; authUser: AuthUser }
    | { status: 'needs_migration'; authUser: AuthUser; web3AuthKey?: string }
    | { status: 'needs_recovery'; authUser: AuthUser; recoveryMethods: RecoveryMethodInfo[] }
    | { status: 'deriving_key' }
    | { status: 'ready'; authUser: AuthUser; did: string; privateKey: string }
    | { status: 'error'; error: string; canRetry: boolean; previousState?: UnifiedAuthState };

export interface ServerKeyStatus {
    exists: boolean;
    keyProvider: 'sss' | 'web3auth' | null;
    primaryDid: string | null;
    recoveryMethods: RecoveryMethodInfo[];
    authShare: string | null;
}

export interface AuthCoordinatorConfig {
    authProvider: AuthProvider;
    serverUrl: string;
    onStateChange?: (state: UnifiedAuthState) => void;
    didFromPrivateKey?: (privateKey: string) => Promise<string>;
    getWeb3AuthKey?: () => Promise<string | null>;
    storage?: StorageFunctions;
}

export interface AuthCoordinatorApi {
    fetchServerKeyStatus: (authProvider: AuthProvider) => Promise<ServerKeyStatus>;
    storeAuthShare: (authProvider: AuthProvider, authShare: string, primaryDid: string) => Promise<void>;
    markMigrated: (authProvider: AuthProvider) => Promise<void>;
}

export class AuthCoordinator {
    private state: UnifiedAuthState = { status: 'idle' };
    private config: AuthCoordinatorConfig;
    private api: AuthCoordinatorApi;
    private storage: StorageFunctions;

    constructor(config: AuthCoordinatorConfig, api: AuthCoordinatorApi) {
        this.config = config;
        this.api = api;
        this.storage = config.storage || defaultStorage;
    }

    getState(): UnifiedAuthState {
        return this.state;
    }

    private setState(newState: UnifiedAuthState): void {
        this.state = newState;
        this.config.onStateChange?.(newState);
    }

    /**
     * Initialize the coordinator and determine the correct state.
     * 
     * Flow:
     * 1. Check if user is authenticated via auth provider
     * 2. If authenticated, check local device share
     * 3. Check server for auth share and key status
     * 4. Determine state: ready, needs_setup, needs_migration, needs_recovery
     */
    async initialize(): Promise<UnifiedAuthState> {
        try {
            this.setState({ status: 'authenticating' });

            const authUser = await this.config.authProvider.getCurrentUser();

            if (!authUser) {
                this.setState({ status: 'idle' });
                return this.state;
            }

            this.setState({ status: 'authenticated', authUser });
            this.setState({ status: 'checking_key_status' });

            const hasLocalShare = await this.storage.hasDeviceShare();
            const serverStatus = await this.api.fetchServerKeyStatus(this.config.authProvider);

            // Case 1: No server record - new user needs setup
            if (!serverStatus.exists) {
                this.setState({ status: 'needs_setup', authUser });
                return this.state;
            }

            // Case 2: Server has web3auth - user needs migration
            if (serverStatus.keyProvider === 'web3auth') {
                let web3AuthKey: string | undefined;

                if (this.config.getWeb3AuthKey) {
                    try {
                        web3AuthKey = (await this.config.getWeb3AuthKey()) ?? undefined;
                    } catch (e) {
                        console.warn('Failed to get Web3Auth key for migration', e);
                    }
                }

                this.setState({ status: 'needs_migration', authUser, web3AuthKey });
                return this.state;
            }

            // Case 3: Server has SSS but no local device share - needs recovery
            if (!hasLocalShare) {
                this.setState({
                    status: 'needs_recovery',
                    authUser,
                    recoveryMethods: serverStatus.recoveryMethods,
                });
                return this.state;
            }

            // Case 4: Has both local and server shares - try to connect
            this.setState({ status: 'deriving_key' });

            const deviceShare = await this.storage.getDeviceShare();

            if (!deviceShare || !serverStatus.authShare) {
                this.setState({
                    status: 'needs_recovery',
                    authUser,
                    recoveryMethods: serverStatus.recoveryMethods,
                });
                return this.state;
            }

            const privateKey = await reconstructFromShares([deviceShare, serverStatus.authShare]);

            // Verify the key produces the expected DID (health check)
            if (this.config.didFromPrivateKey && serverStatus.primaryDid) {
                const derivedDid = await this.config.didFromPrivateKey(privateKey);

                if (derivedDid !== serverStatus.primaryDid) {
                    // Stale device share - clear and force recovery
                    console.warn('DID mismatch - stale device share detected');
                    await this.storage.clearAllShares();

                    this.setState({
                        status: 'needs_recovery',
                        authUser,
                        recoveryMethods: serverStatus.recoveryMethods,
                    });
                    return this.state;
                }
            }

            this.setState({
                status: 'ready',
                authUser,
                did: serverStatus.primaryDid || '',
                privateKey,
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error during initialization';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: this.state,
            });

            return this.state;
        }
    }

    /**
     * Set up a new key for a new user.
     * Only valid when state is 'needs_setup'.
     */
    async setupNewKey(privateKey: string, did: string): Promise<UnifiedAuthState> {
        if (this.state.status !== 'needs_setup') {
            throw new Error(`Cannot setup key in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;

        try {
            this.setState({ status: 'deriving_key' });

            const { shares } = await splitAndVerify(privateKey);

            await this.storage.storeDeviceShare(shares.deviceShare);
            await this.api.storeAuthShare(this.config.authProvider, shares.authShare, did);

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to setup new key';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: { status: 'needs_setup', authUser },
            });

            return this.state;
        }
    }

    /**
     * Migrate from Web3Auth to SSS.
     * Only valid when state is 'needs_migration'.
     */
    async migrate(privateKey: string, did: string): Promise<UnifiedAuthState> {
        if (this.state.status !== 'needs_migration') {
            throw new Error(`Cannot migrate in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;

        try {
            this.setState({ status: 'deriving_key' });

            const { shares } = await splitAndVerify(privateKey);

            await this.storage.storeDeviceShare(shares.deviceShare);
            await this.api.storeAuthShare(this.config.authProvider, shares.authShare, did);
            await this.api.markMigrated(this.config.authProvider);

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to migrate from Web3Auth';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: { status: 'needs_migration', authUser },
            });

            return this.state;
        }
    }

    /**
     * Recover account using a recovery method.
     * Only valid when state is 'needs_recovery'.
     * 
     * @param recoveryShare - The decrypted recovery share
     * @param did - The user's DID
     */
    async recover(recoveryShare: string, did: string): Promise<UnifiedAuthState> {
        if (this.state.status !== 'needs_recovery') {
            throw new Error(`Cannot recover in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;
        const recoveryMethods = this.state.recoveryMethods;

        try {
            this.setState({ status: 'deriving_key' });

            // Fetch auth share from server
            const serverStatus = await this.api.fetchServerKeyStatus(this.config.authProvider);

            if (!serverStatus.authShare) {
                throw new Error('No auth share found on server');
            }

            // Reconstruct private key
            const privateKey = await reconstructFromShares([recoveryShare, serverStatus.authShare]);

            // Verify DID matches
            if (this.config.didFromPrivateKey) {
                const derivedDid = await this.config.didFromPrivateKey(privateKey);

                if (derivedDid !== did && derivedDid !== serverStatus.primaryDid) {
                    throw new Error('Recovery failed: DID mismatch');
                }
            }

            // Generate new shares atomically
            const { shares } = await splitAndVerify(privateKey);

            await this.storage.storeDeviceShare(shares.deviceShare);
            await this.api.storeAuthShare(
                this.config.authProvider,
                shares.authShare,
                serverStatus.primaryDid || did
            );

            this.setState({
                status: 'ready',
                authUser,
                did: serverStatus.primaryDid || did,
                privateKey,
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Recovery failed';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: { status: 'needs_recovery', authUser, recoveryMethods },
            });

            return this.state;
        }
    }

    /**
     * Verify the integrity of stored shares.
     * Returns true if shares are healthy, false otherwise.
     */
    async verifyKeyIntegrity(): Promise<boolean> {
        if (this.state.status !== 'ready') {
            return false;
        }

        try {
            const serverStatus = await this.api.fetchServerKeyStatus(this.config.authProvider);

            if (!serverStatus.primaryDid || !this.config.didFromPrivateKey) {
                return true; // Can't verify without DID
            }

            const result = await verifyStoredShares(
                {
                    getDevice: this.storage.getDeviceShare,
                    getAuth: async () => serverStatus.authShare,
                },
                serverStatus.primaryDid,
                this.config.didFromPrivateKey
            );

            return result.healthy;
        } catch (e) {
            console.error('Key integrity verification failed', e);
            return false;
        }
    }

    /**
     * Logout and clear local state.
     */
    async logout(): Promise<void> {
        await this.config.authProvider.signOut();
        await this.storage.clearAllShares();

        this.setState({ status: 'idle' });
    }

    /**
     * Retry from an error state.
     */
    async retry(): Promise<UnifiedAuthState> {
        if (this.state.status !== 'error') {
            return this.state;
        }

        const previousState = this.state.previousState;

        if (previousState) {
            this.setState(previousState);
        } else {
            this.setState({ status: 'idle' });
        }

        return this.initialize();
    }
}

/**
 * Create an AuthCoordinator instance.
 */
export function createAuthCoordinator(
    config: AuthCoordinatorConfig,
    api: AuthCoordinatorApi
): AuthCoordinator {
    return new AuthCoordinator(config, api);
}
