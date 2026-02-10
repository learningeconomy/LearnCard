/**
 * Auth Coordinator
 * 
 * Unified state machine that coordinates authentication and key derivation.
 * Provides a single source of truth for auth state across the application.
 * 
 * This coordinator is designed to be:
 * - Auth provider agnostic (Firebase, Supertokens, OIDC, etc.)
 * - Key derivation strategy agnostic (SSS, Web3Auth, MPC, etc.)
 * - Easily testable with mock providers
 * - Shareable across apps (LearnCard, Scouts, etc.)
 * 
 * The coordinator delegates all server communication and recovery logic
 * to the KeyDerivationStrategy, keeping itself a pure state machine.
 */

import { AuthSessionError } from './types';

import type {
    AuthProvider,
    AuthUser,
    AuthCoordinatorConfig,
    KeyDerivationStrategy,
    RecoveryMethodInfo,
    UnifiedAuthState,
} from './types';

export class AuthCoordinator {
    private state: UnifiedAuthState = { status: 'idle' };
    private config: AuthCoordinatorConfig;
    private keyDerivation: KeyDerivationStrategy;

    constructor(config: AuthCoordinatorConfig) {
        this.config = config;
        this.keyDerivation = config.keyDerivation;
    }

    getState(): UnifiedAuthState {
        return this.state;
    }

    private setState(newState: UnifiedAuthState): void {
        this.state = newState;
        this.config.onStateChange?.(newState);
    }

    /** Helper: get token + providerType from the auth provider */
    private async getAuthCredentials(): Promise<{ token: string; providerType: string }> {
        const token = await this.config.authProvider.getIdToken();
        const providerType = this.config.authProvider.getProviderType();
        return { token, providerType };
    }

    /**
     * Initialize the coordinator and determine the correct state.
     * 
     * Flow:
     * 0. (Private-key-first) Check for cached private key in secure storage
     * 1. Check if user is authenticated via auth provider
     * 2. If authenticated, check local key component
     * 3. Ask strategy for server key status
     * 4. Determine state: ready, needs_setup, needs_migration, needs_recovery
     */
    async initialize(): Promise<UnifiedAuthState> {
        try {
            // --- Private-key-first path ---
            if (this.config.getCachedPrivateKey && this.config.didFromPrivateKey) {
                try {
                    const cachedKey = await this.config.getCachedPrivateKey();

                    if (cachedKey) {
                        this.setState({ status: 'deriving_key' });

                        const did = await this.config.didFromPrivateKey(cachedKey);

                        if (did) {
                            let authUser: AuthUser | null = null;

                            try {
                                authUser = await this.config.authProvider.getCurrentUser();
                            } catch {
                                // Auth session unavailable — that's fine, we have the key
                            }

                            this.setState({
                                status: 'ready',
                                authUser: authUser ?? undefined,
                                did,
                                privateKey: cachedKey,
                                authSessionValid: !!authUser,
                            });

                            return this.state;
                        }
                    }
                } catch (e) {
                    console.warn('Cached private key check failed, falling through to auth flow', e);
                }
            }

            // --- Standard auth-provider-first path ---
            this.setState({ status: 'authenticating' });

            const authUser = await this.config.authProvider.getCurrentUser();

            if (!authUser) {
                this.setState({ status: 'idle' });
                return this.state;
            }

            this.setState({ status: 'authenticated', authUser });

            // Scope local storage to this user so device shares don't collide
            if (this.keyDerivation.setActiveUser) {
                this.keyDerivation.setActiveUser(authUser.id);
            }

            this.setState({ status: 'checking_key_status' });

            const { token, providerType } = await this.getAuthCredentials();

            const hasLocalKey = await this.keyDerivation.hasLocalKey();
            const serverStatus = await this.keyDerivation.fetchServerKeyStatus(token, providerType);

            // Case 1: No server record
            if (!serverStatus.exists) {
                // If the auth account is old enough, this is likely a legacy user
                // (e.g., Web3Auth era) who never got an SSS record. Treat as migration.
                const threshold = this.config.legacyAccountThresholdMs ?? 0;

                if (threshold > 0 && authUser.createdAt) {
                    const accountAgeMs = Date.now() - authUser.createdAt.getTime();

                    if (accountAgeMs > threshold) {
                        this.setState({ status: 'needs_migration', authUser });
                        return this.state;
                    }
                }

                this.setState({ status: 'needs_setup', authUser });
                return this.state;
            }

            // Case 2: Strategy says migration is needed
            if (serverStatus.needsMigration) {
                this.setState({ status: 'needs_migration', authUser });
                return this.state;
            }

            // Case 3: Server has key but no local component — needs recovery
            if (!hasLocalKey) {
                this.setState({
                    status: 'needs_recovery',
                    authUser,
                    recoveryMethods: serverStatus.recoveryMethods,
                });
                return this.state;
            }

            // Case 4: Has both local and server keys — try to connect
            this.setState({ status: 'deriving_key' });

            const localKey = await this.keyDerivation.getLocalKey();

            if (!localKey || !serverStatus.authShare) {
                this.setState({
                    status: 'needs_recovery',
                    authUser,
                    recoveryMethods: serverStatus.recoveryMethods,
                });
                return this.state;
            }

            const privateKey = await this.keyDerivation.reconstructKey(localKey, serverStatus.authShare);

            // Verify the key produces the expected DID (health check)
            if (this.config.didFromPrivateKey && serverStatus.primaryDid) {
                const derivedDid = await this.config.didFromPrivateKey(privateKey);

                if (derivedDid !== serverStatus.primaryDid) {
                    console.warn('DID mismatch - stale local key detected');
                    await this.keyDerivation.clearLocalKeys();

                    this.setState({
                        status: 'needs_recovery',
                        authUser,
                        recoveryMethods: serverStatus.recoveryMethods,
                    });
                    return this.state;
                }
            }

            let did = serverStatus.primaryDid || '';

            if (!did && this.config.didFromPrivateKey) {
                did = await this.config.didFromPrivateKey(privateKey);
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
            });

            return this.state;
        } catch (e) {
            // Typed auth session errors → idle (not error)
            if (e instanceof AuthSessionError) {
                console.warn('Auth session expired or missing — returning to idle');
                this.setState({ status: 'idle' });
                return this.state;
            }

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

            const { token, providerType } = await this.getAuthCredentials();
            const { localKey, remoteKey } = await this.keyDerivation.splitKey(privateKey);

            await this.keyDerivation.storeLocalKey(localKey);
            await this.keyDerivation.storeAuthShare(token, providerType, remoteKey, did);

            // Fire-and-forget: send email backup share if the strategy supports it
            if (this.keyDerivation.sendEmailBackupShare && authUser?.email) {
                this.keyDerivation.sendEmailBackupShare(token, providerType, privateKey, authUser.email)
                    .catch(e => console.warn('Email backup share failed (non-fatal):', e));
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
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
     * Attach strategy-specific migration data to the current needs_migration state.
     * This allows app-level code to inject data (e.g., an extracted Web3Auth key)
     * that the auto-setup hook can read to trigger migration.
     *
     * Only valid when state is 'needs_migration'.
     */
    setMigrationData(data: Record<string, unknown>): void {
        if (this.state.status !== 'needs_migration') {
            throw new Error(`Cannot set migration data in state: ${this.state.status}`);
        }

        this.setState({
            ...this.state,
            migrationData: { ...this.state.migrationData, ...data },
        });
    }

    /**
     * Migrate from a legacy key derivation strategy.
     * Only valid when state is 'needs_migration'.
     */
    async migrate(privateKey: string, did: string): Promise<UnifiedAuthState> {
        if (this.state.status !== 'needs_migration') {
            throw new Error(`Cannot migrate in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;

        try {
            this.setState({ status: 'deriving_key' });

            const { token, providerType } = await this.getAuthCredentials();
            const { localKey, remoteKey } = await this.keyDerivation.splitKey(privateKey);

            await this.keyDerivation.storeLocalKey(localKey);
            await this.keyDerivation.storeAuthShare(token, providerType, remoteKey, did);

            if (this.keyDerivation.markMigrated) {
                await this.keyDerivation.markMigrated(token, providerType);
            }

            // Fire-and-forget: send email backup share if the strategy supports it
            if (this.keyDerivation.sendEmailBackupShare && authUser?.email) {
                this.keyDerivation.sendEmailBackupShare(token, providerType, privateKey, authUser.email)
                    .catch(e => console.warn('Email backup share failed (non-fatal):', e));
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to migrate';

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
     * Delegates the actual recovery logic to the strategy's executeRecovery().
     */
    async recover(input: unknown): Promise<UnifiedAuthState> {
        if (this.state.status !== 'needs_recovery') {
            throw new Error(`Cannot recover in state: ${this.state.status}`);
        }

        const authUser = this.state.authUser;
        const recoveryMethods = this.state.recoveryMethods;

        try {
            this.setState({ status: 'deriving_key' });

            const { token, providerType } = await this.getAuthCredentials();

            const { privateKey, did } = await this.keyDerivation.executeRecovery({
                token,
                providerType,
                input,
            });

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
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
     * Verify the integrity of stored keys.
     * Returns true if keys are healthy, false otherwise.
     */
    async verifyKeyIntegrity(): Promise<boolean> {
        if (this.state.status !== 'ready') {
            return false;
        }

        try {
            const { token, providerType } = await this.getAuthCredentials();
            const serverStatus = await this.keyDerivation.fetchServerKeyStatus(token, providerType);

            if (!serverStatus.primaryDid || !this.config.didFromPrivateKey) {
                return true; // Can't verify without DID
            }

            const localKey = await this.keyDerivation.getLocalKey();

            if (!localKey || !serverStatus.authShare) {
                return false;
            }

            if (this.keyDerivation.verifyKeys) {
                return this.keyDerivation.verifyKeys(
                    localKey,
                    serverStatus.authShare,
                    serverStatus.primaryDid,
                    this.config.didFromPrivateKey
                );
            }

            // Fallback: try to reconstruct and verify DID
            const privateKey = await this.keyDerivation.reconstructKey(localKey, serverStatus.authShare);
            const derivedDid = await this.config.didFromPrivateKey(privateKey);

            return derivedDid === serverStatus.primaryDid;
        } catch (e) {
            console.error('Key integrity verification failed', e);
            return false;
        }
    }

    /**
     * Logout and clear session state.
     *
     * The device share is intentionally preserved so that returning users
     * on a trusted device can reconstruct their key without recovery.
     * To explicitly wipe the device share (e.g. on a public computer),
     * call `forgetDevice()` before or after logout.
     */
    async logout(): Promise<void> {
        await this.config.authProvider.signOut();

        if (this.keyDerivation.cleanup) {
            await this.keyDerivation.cleanup();
        }

        if (this.config.onLogout) {
            await this.config.onLogout();
        }

        this.setState({ status: 'idle' });
    }

    /**
     * Clear the local device share so this device is no longer "trusted".
     *
     * After calling this, the user will need to recover their key via a
     * recovery method (password, passkey, phrase, or backup) on next login.
     *
     * Use case: logging out on a shared / public computer.
     */
    async forgetDevice(): Promise<void> {
        await this.keyDerivation.clearLocalKeys();
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
export function createAuthCoordinator(config: AuthCoordinatorConfig): AuthCoordinator {
    return new AuthCoordinator(config);
}
