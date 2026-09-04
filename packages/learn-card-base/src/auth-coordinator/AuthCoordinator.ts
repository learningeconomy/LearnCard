import { getLogger } from '../logging/logger';
const log = getLogger('auth-coordinator');
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

import { withDeadline, withDeadlineOr, isDeadlineError } from '../helpers/withDeadline';
import { withNetworkFault } from '../helpers/networkFault';
import { IdentityRecoverySessionConsumedError } from '@learncard/sss-key-manager';

import { AuthSessionError } from './types';

const DEFAULT_AUTH_SESSION_TIMEOUT_MS = 2500;
const DEFAULT_SERVER_STATUS_TIMEOUT_MS = 4000;

/**
 * Whether a thrown error is a transient connectivity failure rather than a real
 * fault. Offline boot must treat these as "no session yet" (→ idle) instead of
 * a hard `error`, which would otherwise surface an error overlay and drive a
 * re-init loop while the device is offline. Covers Firebase's
 * `auth/network-request-failed`, our own deadline timeouts, and common fetch
 * failure messages across browsers/webviews.
 */
const isNetworkError = (e: unknown): boolean => {
    if (isDeadlineError(e)) return true;

    if (typeof (e as { code?: unknown })?.code === 'string') {
        const code = (e as { code: string }).code.toLowerCase();
        if (code.includes('network-request-failed') || code.includes('network_error')) return true;
    }

    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();

    return (
        msg.includes('network-request-failed') ||
        msg.includes('network request failed') ||
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network error') ||
        msg.includes('err_internet_disconnected') ||
        msg.includes('load failed')
    );
};

import type {
    AuthProvider,
    AuthUser,
    AuthCoordinatorConfig,
    KeyDerivationStrategy,
    RecoveryMethodInfo,
    RecoveryReason,
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

    /** Helper: get token + providerType from the auth provider.
     *  Always force-refreshes the token so downstream consumers (e.g. Web3Auth)
     *  receive a recently-issued JWT. Web3Auth's server rejects signed params
     *  whose timestamp is more than 6 minutes old, so a stale cached token
     *  (common after Android backgrounds/kills the app) would fail. */
    private async getAuthCredentials(): Promise<{ token: string; providerType: string }> {
        const token = await this.config.authProvider.getIdToken(true);
        const providerType = this.config.authProvider.getProviderType();
        return { token, providerType };
    }

    private async getFreshDidAuthVp(privateKey: string, did: string): Promise<string | undefined> {
        if (!this.config.signDidAuthVp) return undefined;

        if (this.keyDerivation.getFreshDidAuthVp) {
            return this.keyDerivation.getFreshDidAuthVp(privateKey, did, this.config.signDidAuthVp);
        }

        return this.config.signDidAuthVp(privateKey);
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
                            // Opportunistic + bounded: offline/slow auth must not
                            // block a cached-key resume from reaching `ready`.
                            const authUser: AuthUser | null = await withDeadlineOr(
                                withNetworkFault('getCurrentUser(pk-first)', () =>
                                    this.config.authProvider.getCurrentUser()
                                ),
                                null,
                                {
                                    ms:
                                        this.config.authSessionTimeoutMs ??
                                        DEFAULT_AUTH_SESSION_TIMEOUT_MS,
                                    label: 'getCurrentUser(pk-first)',
                                }
                            );

                            // Scope storage even on pk-first path so getLocalKey works later
                            if (authUser && this.keyDerivation.setActiveUser) {
                                this.keyDerivation.setActiveUser(authUser.id);
                            }

                            // If the strategy supports recovery (SSS) and we have an
                            // auth session, verify the server has a record for this user.
                            // A missing record means the key was created under a different
                            // strategy (e.g. Web3Auth) and needs to be migrated to SSS
                            // so it's protected by split shares + recovery methods.
                            let sssActivationState: 'provisional' | 'active' | null = null;

                            if (authUser && this.keyDerivation.capabilities?.recovery) {
                                try {
                                    const serverStatus = await withDeadline(
                                        withNetworkFault(
                                            'fetchServerKeyStatus(pk-first)',
                                            async () => {
                                                const { token, providerType } =
                                                    await this.getAuthCredentials();
                                                return this.keyDerivation.fetchServerKeyStatus(
                                                    token,
                                                    providerType
                                                );
                                            }
                                        ),
                                        {
                                            ms:
                                                this.config.serverStatusTimeoutMs ??
                                                DEFAULT_SERVER_STATUS_TIMEOUT_MS,
                                            label: 'fetchServerKeyStatus(pk-first)',
                                        }
                                    );

                                    sssActivationState = serverStatus.sssActivationState ?? null;

                                    if (
                                        !serverStatus.exists ||
                                        (serverStatus.needsMigration &&
                                            sssActivationState !== 'provisional')
                                    ) {
                                        this.setState({
                                            status: 'needs_migration',
                                            authUser,
                                            migrationData: { web3AuthKey: cachedKey },
                                        });

                                        return this.state;
                                    }
                                } catch (e) {
                                    // Server check failed — proceed to ready.
                                    // Migration will be caught on the next full init.
                                    log.warn(
                                        'Server key verification failed on pk-first path, proceeding to ready',
                                        e
                                    );
                                }
                            }

                            this.setState({
                                status: 'ready',
                                authUser: authUser ?? undefined,
                                did,
                                privateKey: cachedKey,
                                authSessionValid: !!authUser,
                                sssActivationState,
                            });

                            return this.state;
                        }
                    }
                } catch (e) {
                    log.warn('Cached private key check failed, falling through to auth flow', e);
                }
            }

            // --- Standard auth-provider-first path ---
            this.setState({ status: 'authenticating' });

            // Bound the probe so a stalled network can't hang boot; a timeout
            // surfaces as a retryable error (via the outer catch), while real
            // provider errors propagate unchanged to preserve existing handling.
            const authUser = await withDeadline(
                withNetworkFault('getCurrentUser(standard)', () =>
                    this.config.authProvider.getCurrentUser()
                ),
                {
                    ms: this.config.authSessionTimeoutMs ?? DEFAULT_AUTH_SESSION_TIMEOUT_MS,
                    label: 'getCurrentUser(standard)',
                }
            );

            if (!authUser) {
                this.setState({ status: 'idle' });
                return this.state;
            }

            this.setState({ status: 'authenticated', authUser });

            // Scope local storage to this user so device shares don't collide
            if (this.keyDerivation.setActiveUser) {
                this.keyDerivation.setActiveUser(authUser.id);
            }

            if (
                this.keyDerivation.hasPendingIdentityRecovery?.() &&
                this.keyDerivation.completeIdentityRecovery
            ) {
                this.setState({ status: 'deriving_key' });
                const { token, providerType } = await this.getAuthCredentials();
                const result = await this.keyDerivation.completeIdentityRecovery({
                    token,
                    providerType,
                    signDidAuthVp: this.config.signDidAuthVp,
                });

                this.setState({
                    status: 'identity_recovery_success',
                    authUser,
                    did: result.did,
                    privateKey: result.privateKey,
                });

                return this.state;
            }

            this.setState({ status: 'checking_key_status' });

            const { token, providerType } = await this.getAuthCredentials();

            const hasLocalKey = await this.keyDerivation.hasLocalKey();
            const serverStatus = await withDeadline(
                withNetworkFault('fetchServerKeyStatus(standard)', () =>
                    this.keyDerivation.fetchServerKeyStatus(token, providerType)
                ),
                {
                    ms: this.config.serverStatusTimeoutMs ?? DEFAULT_SERVER_STATUS_TIMEOUT_MS,
                    label: 'fetchServerKeyStatus(standard)',
                }
            );

            // Resolve recovery methods through the strategy (which may inject
            // client-side-only methods like email backup) when available,
            // falling back to the raw server list.
            const recoveryMethods = this.keyDerivation.getAvailableRecoveryMethods
                ? await this.keyDerivation.getAvailableRecoveryMethods(token, providerType)
                : serverStatus.recoveryMethods;

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
            if (serverStatus.needsMigration && serverStatus.sssActivationState !== 'provisional') {
                this.setState({ status: 'needs_migration', authUser });
                return this.state;
            }

            // Case 3: Server has key but no local component — needs recovery
            if (!hasLocalKey) {
                this.setState({
                    status: 'needs_recovery',
                    authUser,
                    recoveryMethods,
                    recoveryReason: 'new_device',
                    maskedRecoveryEmail: serverStatus.maskedRecoveryEmail ?? null,
                    sssActivationState: serverStatus.sssActivationState ?? null,
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
                    recoveryMethods,
                    recoveryReason: 'missing_server_data',
                    maskedRecoveryEmail: serverStatus.maskedRecoveryEmail ?? null,
                    sssActivationState: serverStatus.sssActivationState ?? null,
                });
                return this.state;
            }

            let privateKey = await this.keyDerivation.reconstructKey(
                localKey,
                serverStatus.authShare
            );

            // Verify the key produces the expected DID (health check)
            if (this.config.didFromPrivateKey && serverStatus.primaryDid) {
                const derivedDid = await this.config.didFromPrivateKey(privateKey);

                if (derivedDid !== serverStatus.primaryDid) {
                    const reconciled = this.keyDerivation.reconcileShares
                        ? await this.keyDerivation.reconcileShares({
                              token,
                              providerType,
                              expectedDid: serverStatus.primaryDid,
                              didFromPrivateKey: this.config.didFromPrivateKey,
                              signDidAuthVp: this.config.signDidAuthVp,
                          })
                        : null;

                    if (reconciled) {
                        privateKey = reconciled.privateKey;
                    } else {
                        log.warn('DID mismatch - stale local key detected');
                        await this.keyDerivation.clearLocalKeys();

                        this.setState({
                            status: 'needs_recovery',
                            authUser,
                            recoveryMethods,
                            recoveryReason: 'stale_local_key',
                            maskedRecoveryEmail: serverStatus.maskedRecoveryEmail ?? null,
                            sssActivationState: serverStatus.sssActivationState ?? null,
                        });
                        return this.state;
                    }
                } else if (this.keyDerivation.reconcileShares) {
                    const reconciled = await this.keyDerivation.reconcileShares({
                        token,
                        providerType,
                        expectedDid: serverStatus.primaryDid,
                        didFromPrivateKey: this.config.didFromPrivateKey,
                        signDidAuthVp: this.config.signDidAuthVp,
                    });

                    if (reconciled) privateKey = reconciled.privateKey;
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
                sssActivationState: serverStatus.sssActivationState ?? null,
            });

            return this.state;
        } catch (e) {
            // Typed auth session errors → idle (not error)
            if (e instanceof AuthSessionError) {
                log.warn('Auth session expired or missing — returning to idle');
                this.setState({ status: 'idle' });
                return this.state;
            }

            // Connectivity failures are not hard errors: fall back to idle so
            // the offline UI (banner / boot gate) owns the UX and initialize()
            // re-runs cleanly on reconnect — never an error overlay + retry loop.
            if (isNetworkError(e)) {
                log.warn('Network unavailable during init — returning to idle', e);
                this.setState({ status: 'idle' });
                return this.state;
            }

            const errorMessage =
                e instanceof Error ? e.message : 'Unknown error during initialization';

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

            if (this.keyDerivation.atomicUpdateShares) {
                await this.keyDerivation.atomicUpdateShares({
                    token,
                    providerType,
                    privateKey,
                    did,
                    signDidAuthVp: this.config.signDidAuthVp,
                });
            } else {
                const didAuthVp = await this.getFreshDidAuthVp(privateKey, did);
                const { localKey, remoteKey } = await this.keyDerivation.splitKey(privateKey);

                await this.keyDerivation.storeLocalKey(localKey);
                await this.keyDerivation.storeAuthShare(
                    token,
                    providerType,
                    remoteKey,
                    did,
                    didAuthVp
                );
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
                sssActivationState: 'provisional',
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

            if (this.keyDerivation.atomicUpdateShares) {
                await this.keyDerivation.atomicUpdateShares({
                    token,
                    providerType,
                    privateKey,
                    did,
                    signDidAuthVp: this.config.signDidAuthVp,
                });
            } else {
                const didAuthVp = await this.getFreshDidAuthVp(privateKey, did);
                const { localKey, remoteKey } = await this.keyDerivation.splitKey(privateKey);

                await this.keyDerivation.storeLocalKey(localKey);
                await this.keyDerivation.storeAuthShare(
                    token,
                    providerType,
                    remoteKey,
                    did,
                    didAuthVp
                );
            }

            if (this.keyDerivation.markMigrated) {
                const didAuthVp = await this.getFreshDidAuthVp(privateKey, did);
                await this.keyDerivation.markMigrated(token, providerType, didAuthVp);
            }

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
                sssActivationState: 'provisional',
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
     * Commit a provisioned SSS key after recovery enrollment succeeds.
     * The server re-checks the recovery-method invariant atomically.
     */
    async activate(): Promise<UnifiedAuthState> {
        if (this.state.status !== 'ready' || this.state.sssActivationState !== 'provisional') {
            throw new Error(`Cannot activate key in state: ${this.state.status}`);
        }

        if (!this.keyDerivation.activate) {
            throw new Error('The active key derivation strategy does not support activation');
        }

        const readyState = this.state;
        const { token, providerType } = await this.getAuthCredentials();
        const didAuthVp = await this.getFreshDidAuthVp(readyState.privateKey, readyState.did);

        await this.keyDerivation.activate(token, providerType, didAuthVp);

        this.setState({ ...readyState, sssActivationState: 'active' });

        return this.state;
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
        const recoveryReason = this.state.recoveryReason;
        const maskedRecoveryEmail = this.state.maskedRecoveryEmail;
        const sssActivationState = this.state.sssActivationState;

        try {
            this.setState({ status: 'deriving_key' });

            const { token, providerType } = await this.getAuthCredentials();

            const { privateKey, did } = await this.keyDerivation.executeRecovery({
                token,
                providerType,
                input,
                didFromPrivateKey: this.config.didFromPrivateKey,
                signDidAuthVp: this.config.signDidAuthVp,
            });

            this.setState({
                status: 'ready',
                authUser,
                did,
                privateKey,
                authSessionValid: true,
                sssActivationState,
            });

            return this.state;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Recovery failed';

            this.setState({
                status: 'error',
                error: errorMessage,
                canRetry: true,
                previousState: {
                    status: 'needs_recovery',
                    authUser,
                    recoveryMethods,
                    recoveryReason,
                    maskedRecoveryEmail,
                    sssActivationState,
                },
            });

            return this.state;
        }
    }

    beginIdentityRecovery(): UnifiedAuthState {
        if (this.state.status !== 'idle') {
            throw new Error(`Cannot start identity recovery in state: ${this.state.status}`);
        }
        if (!this.keyDerivation.startIdentityRecovery) {
            throw new Error('Identity recovery is not supported');
        }

        this.setState({
            status: 'identity_recovery',
            phase: 'enter_email',
            recoveryMethods: [],
        });
        return this.state;
    }

    async sendIdentityRecoveryCode(email: string): Promise<UnifiedAuthState> {
        if (
            this.state.status !== 'identity_recovery' ||
            !this.keyDerivation.startIdentityRecovery
        ) {
            throw new Error('Identity recovery has not been started');
        }

        await this.keyDerivation.startIdentityRecovery(email);
        this.setState({
            status: 'identity_recovery',
            phase: 'verify_email',
            email: email.trim().toLowerCase(),
            recoveryMethods: [],
        });
        return this.state;
    }

    async verifyIdentityRecoveryCode(code: string): Promise<UnifiedAuthState> {
        if (
            this.state.status !== 'identity_recovery' ||
            this.state.phase !== 'verify_email' ||
            !this.state.email ||
            !this.keyDerivation.verifyIdentityRecovery
        ) {
            throw new Error('No recovery code is waiting to be verified');
        }

        const session = await this.keyDerivation.verifyIdentityRecovery(this.state.email, code);
        this.setState({
            status: 'identity_recovery',
            phase: 'choose_method',
            email: this.state.email,
            recoverySessionToken: session.recoverySessionToken,
            recoveryMethods: session.recoveryMethods,
        });
        return this.state;
    }

    async prepareIdentityRecovery(input: unknown): Promise<UnifiedAuthState> {
        if (
            this.state.status !== 'identity_recovery' ||
            this.state.phase !== 'choose_method' ||
            !this.state.recoverySessionToken ||
            !this.keyDerivation.prepareIdentityRecovery ||
            !this.config.didFromPrivateKey
        ) {
            throw new Error('Identity recovery is not ready for a recovery method');
        }

        const email = this.state.email;
        const recoveryMethods = this.state.recoveryMethods;

        try {
            const result = await this.keyDerivation.prepareIdentityRecovery({
                recoverySessionToken: this.state.recoverySessionToken,
                input,
                didFromPrivateKey: this.config.didFromPrivateKey,
            });

            this.setState({
                status: 'identity_recovery',
                phase: 'new_login',
                email,
                recoveryMethods,
                recoveredDid: result.did,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Identity recovery failed';

            if (error instanceof IdentityRecoverySessionConsumedError) {
                this.keyDerivation.cancelIdentityRecovery?.();
                this.setState({
                    status: 'identity_recovery',
                    phase: 'enter_email',
                    email,
                    recoveryMethods: [],
                    error: errorMessage,
                });
            } else {
                this.setState({
                    status: 'identity_recovery',
                    phase: 'choose_method',
                    email,
                    recoverySessionToken: this.state.recoverySessionToken,
                    recoveryMethods,
                    error: errorMessage,
                });
            }
        }

        return this.state;
    }

    continueIdentityRecoveryLogin(): UnifiedAuthState {
        if (this.state.status !== 'identity_recovery' || this.state.phase !== 'new_login') {
            throw new Error('Identity recovery is not waiting for a new sign-in');
        }

        this.setState({ status: 'awaiting_rebind', did: this.state.recoveredDid ?? '' });
        return this.state;
    }

    finishIdentityRecovery(): UnifiedAuthState {
        if (this.state.status !== 'identity_recovery_success') {
            throw new Error('Identity recovery has not completed');
        }

        this.setState({
            status: 'ready',
            authUser: this.state.authUser,
            did: this.state.did,
            privateKey: this.state.privateKey,
            authSessionValid: true,
            sssActivationState: 'active',
        });
        return this.state;
    }

    cancelIdentityRecovery(): UnifiedAuthState {
        if (this.state.status !== 'identity_recovery' && this.state.status !== 'awaiting_rebind') {
            return this.state;
        }

        this.keyDerivation.cancelIdentityRecovery?.();
        this.setState({ status: 'idle' });
        return this.state;
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
            const privateKey = await this.keyDerivation.reconstructKey(
                localKey,
                serverStatus.authShare
            );
            const derivedDid = await this.config.didFromPrivateKey(privateKey);

            return derivedDid === serverStatus.primaryDid;
        } catch (e) {
            log.error('Key integrity verification failed', e);
            return false;
        }
    }

    /**
     * Attempt to refresh the auth session without navigating away.
     *
     * Layer 1: Silent refresh via the provider's refreshSession() (e.g.,
     *          Firebase force-refreshes the JWT using the refresh token).
     * Layer 2: Falls back to getIdToken() which may also trigger a refresh.
     *
     * On success, updates the current ready state with authSessionValid: true.
     * Returns true if the session was refreshed, false if full re-auth is needed.
     */
    async refreshAuthSession(): Promise<boolean> {
        // Only makes sense when we're in the ready state
        if (this.state.status !== 'ready') {
            return false;
        }

        // Layer 1: Try the provider's dedicated refresh method
        if (this.config.authProvider.refreshSession) {
            const refreshed = await this.config.authProvider.refreshSession();

            if (refreshed) {
                // Also re-fetch the authUser so it's up to date
                let authUser = this.state.authUser;

                try {
                    const freshUser = await this.config.authProvider.getCurrentUser();

                    if (freshUser) {
                        authUser = freshUser;
                    }
                } catch {
                    // Non-critical — keep existing authUser
                }

                this.setState({
                    ...this.state,
                    authUser,
                    authSessionValid: true,
                });

                return true;
            }
        }

        // Layer 2: Try getIdToken() directly (may use cached refresh token)
        try {
            await this.config.authProvider.getIdToken();

            let authUser = this.state.authUser;

            try {
                const freshUser = await this.config.authProvider.getCurrentUser();

                if (freshUser) {
                    authUser = freshUser;
                }
            } catch {
                // Non-critical
            }

            this.setState({
                ...this.state,
                authUser,
                authSessionValid: true,
            });

            return true;
        } catch {
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
