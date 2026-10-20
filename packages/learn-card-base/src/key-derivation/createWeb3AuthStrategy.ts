/**
 * Web3Auth Key Derivation Strategy
 *
 * Implements KeyDerivationStrategy using Web3Auth Single Factor Auth (SFA).
 * The key is derived deterministically from the Firebase auth token + verifier,
 * so there are no persistent local shares and no server-side key components
 * to manage.
 *
 * This strategy enables a smooth rollout path:
 *   1. Deploy with VITE_KEY_DERIVATION=web3auth  (existing behavior)
 *   2. Test SSS in staging
 *   3. Flip to  VITE_KEY_DERIVATION=sss  — migration is automatic
 *
 * Recovery is handled internally by Web3Auth's MPC network and is not
 * exposed through the KeyDerivationStrategy recovery interface.
 */

import { Web3Auth } from '@web3auth/single-factor-auth';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

import type { KeyDerivationStrategy, ServerKeyStatus } from '@learncard/types';
import { AuthSessionError } from '@learncard/types';
import { getLogger } from '../logging/logger';

const log = getLogger('web3auth-key-derivation');
const DERIVATION_LOCK = 'learncard:web3auth:key-derivation';
const LOCK_WAIT_TIMEOUT_MS = 30_000;
const LOCK_WAIT_NOTICE_MS = 1_000;
let derivationAttempt = 0;
// Also deduplicate coordinator recreation within a document, including hosts
// without Web Locks. Entries live only until the operation settles.
const pendingDerivations = new Map<string, Promise<string>>();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface Web3AuthStrategyConfig {
    /** Web3Auth client ID from the dashboard */
    clientId: string;

    /** Web3Auth network (e.g. 'sapphire_mainnet', 'sapphire_devnet', 'testnet', 'cyan') */
    web3AuthNetwork: string;

    /** Firebase verifier name registered with Web3Auth */
    verifier: string;

    /**
     * When true (default), returns the same key as the PnP Web SDK.
     * Set to false to get the CoreKit key instead.
     */
    usePnPKey?: boolean;

    /** Recheck live auth after waiting for another tab, and before returning its key. */
    isSessionCurrent?: (uid: string) => Promise<boolean>;

    /** Optional Ethereum chain config overrides */
    chainConfig?: {
        chainId?: string;
        rpcTarget?: string;
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode the `sub` (subject / uid) claim from a JWT without any dependencies.
 * Only the payload is parsed — no signature verification (the server already verified it).
 */
const decodeJwtSub = (token: string): string => {
    const parts = token.split('.');

    if (parts.length !== 3) {
        throw new Error('Invalid JWT format — expected 3 parts');
    }

    const payload = parts[1]!;

    // base64url → base64 → decode
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed: Record<string, unknown> = JSON.parse(decoded);

    if (!parsed.sub || typeof parsed.sub !== 'string') {
        throw new Error('JWT missing `sub` claim (uid)');
    }

    return parsed.sub;
};

// ---------------------------------------------------------------------------
// Strategy factory
// ---------------------------------------------------------------------------

/**
 * Create a Web3Auth key derivation strategy.
 *
 * The strategy caches the Firebase ID token from `fetchServerKeyStatus` and
 * uses it in `reconstructKey` to connect to Web3Auth SFA and derive the
 * private key.
 *
 * @example
 * ```ts
 * import { createWeb3AuthStrategy } from 'learn-card-base';
 *
 * const strategy = createWeb3AuthStrategy({
 *     clientId: 'BPi5PB_...',
 *     web3AuthNetwork: 'sapphire_devnet',
 *     verifier: 'learncardapp-firebase',
 * });
 * ```
 */
export const createWeb3AuthStrategy = (
    config: Web3AuthStrategyConfig
): KeyDerivationStrategy<never, never, never> => {
    // Cached credentials from fetchServerKeyStatus → used by reconstructKey
    let cachedToken: string | null = null;
    let cachedUid: string | null = null;

    /**
     * Connect to Web3Auth SFA and extract the Ethereum private key.
     */
    const deriveKeyFromWeb3Auth = async (idToken: string, uid: string): Promise<string> => {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
            config: {
                chainConfig: {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: config.chainConfig?.chainId ?? '0x1',
                    rpcTarget: config.chainConfig?.rpcTarget ?? 'https://cloudflare-eth.com',
                },
            },
        });

        const web3auth = new Web3Auth({
            clientId: config.clientId,
            web3AuthNetwork: config.web3AuthNetwork as Parameters<
                typeof Web3Auth
            >[0]['web3AuthNetwork'],
            privateKeyProvider,
            usePnPKey: config.usePnPKey ?? true,
        });

        await web3auth.init();
        log.info('Web3Auth session checked', { restoredSession: web3auth.connected });

        // A persisted session can outlive an account switch. Remove the wrong
        // session under the same lock before connecting the current account.
        if (web3auth.connected) {
            const restoredUser = await web3auth.getUserInfo();
            if (restoredUser.verifierId !== uid || restoredUser.verifier !== config.verifier) {
                log.warn('Web3Auth restored session identity mismatch; reconnecting');
                await web3auth.logout();
            }
        }

        // After init(), Web3Auth may have auto-restored a persisted session
        // (e.g. on Android app resume). Calling connect() when already
        // connected throws "Already connected", so skip it in that case.
        if (!web3auth.connected) {
            await web3auth.connect({
                verifier: config.verifier,
                verifierId: uid,
                idToken,
            });
        }

        // A session restored from shared SDK storage must belong to this login.
        // Never return a different account's key just because init() connected.
        const userInfo = await web3auth.getUserInfo();
        if (userInfo.verifierId !== uid || userInfo.verifier !== config.verifier) {
            throw new Error('Web3Auth restored session identity mismatch');
        }

        const provider = web3auth.provider;

        if (!provider) {
            throw new Error('Web3Auth provider unavailable after connect');
        }

        const privateKey = await provider.request({ method: 'eth_private_key' });

        if (!privateKey || typeof privateKey !== 'string') {
            throw new Error('Failed to extract private key from Web3Auth provider');
        }

        return privateKey;
    };

    const deriveKey = (idToken: string, uid: string): Promise<string> => {
        const identity = JSON.stringify([
            config.clientId,
            config.web3AuthNetwork,
            config.verifier,
            config.usePnPKey ?? true,
            uid,
        ]);
        const pending = pendingDerivations.get(identity);
        if (pending) return pending;

        const startedAt = performance.now();
        const setupAttemptId = ++derivationAttempt;
        const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
        log.info('Web3Auth account setup started', {
            setupAttemptId,
            crossTabLockAvailable: Boolean(locks),
        });
        const lockWaitController = locks ? new AbortController() : undefined;
        let lockWaitTimedOut = false;
        let waitTimeout: ReturnType<typeof setTimeout> | undefined;
        let waitNotice: ReturnType<typeof setTimeout> | undefined;
        const clearLockWait = (): void => {
            clearTimeout(waitTimeout);
            clearTimeout(waitNotice);
        };
        const action = async (): Promise<string> => {
            // Only queued acquisition has a deadline. Once acquired, retain the
            // lock until the SDK settles, even if the network takes longer.
            clearLockWait();
            const assertSessionCurrent = async (): Promise<void> => {
                if (config.isSessionCurrent && !(await config.isSessionCurrent(uid))) {
                    throw new AuthSessionError('Sign-in changed while waiting.', 'no_session');
                }
            };
            await assertSessionCurrent();
            log.info('Web3Auth account setup running', {
                setupAttemptId,
                waitMs: Math.round(performance.now() - startedAt),
            });
            // Acquire before init(): the preceding tab must finish publishing
            // its SDK session before this tab attempts session restoration.
            const privateKey = await deriveKeyFromWeb3Auth(idToken, uid);
            await assertSessionCurrent();
            return privateKey;
        };
        if (lockWaitController) {
            waitNotice = setTimeout(() => {
                log.info('Waiting for another tab to finish sign-in', { setupAttemptId });
            }, LOCK_WAIT_NOTICE_MS);
            waitTimeout = setTimeout(() => {
                lockWaitTimedOut = true;
                lockWaitController.abort();
            }, LOCK_WAIT_TIMEOUT_MS);
        }
        const operation = (
            locks && lockWaitController
                ? locks.request(DERIVATION_LOCK, { signal: lockWaitController.signal }, action)
                : action()
        )
            .then(privateKey => {
                log.info('Web3Auth account setup completed', {
                    setupAttemptId,
                    elapsedMs: Math.round(performance.now() - startedAt),
                });
                return privateKey;
            })
            .catch((error: unknown) => {
                if (error instanceof AuthSessionError) {
                    log.info('Web3Auth account setup cancelled', { setupAttemptId });
                    throw error;
                }
                const message = error instanceof Error ? error.message : '';
                const tokenAlreadyUsed = /token is used|duplicate token/i.test(message);
                log.error('Web3Auth account setup failed', {
                    setupAttemptId,
                    replayedCredential: tokenAlreadyUsed,
                    restoredIdentityMismatch:
                        message === 'Web3Auth restored session identity mismatch',
                    crossTabLockAvailable: Boolean(locks),
                    lockWaitTimedOut,
                    elapsedMs: Math.round(performance.now() - startedAt),
                });
                // Torus errors can embed the full OAuth JWT. Do not propagate
                // them into coordinator state, debug events, or the overlay.
                throw new Error(
                    lockWaitTimedOut
                        ? 'Sign-in is taking longer in another tab. Please close that tab and try again.'
                        : tokenAlreadyUsed
                          ? 'Sign-in is already completing in another tab. Please wait a moment and try again.'
                          : 'We couldn’t finish signing you in. Please try again.'
                );
            })
            .finally(() => {
                clearLockWait();
                pendingDerivations.delete(identity);
            });
        pendingDerivations.set(identity, operation);
        return operation;
    };

    // -----------------------------------------------------------------------
    // KeyDerivationStrategy implementation
    // -----------------------------------------------------------------------

    return {
        name: 'web3auth',

        capabilities: {
            recovery: false,
            deviceLinking: false,
            localKeyPersistence: false,
            contactMethodUpgrade: false,
        },

        // --- Key lifecycle ---
        // Web3Auth derives keys on-demand from the auth token. There are no
        // persistent local shares to manage — these are all no-ops.

        hasLocalKey: async () => true,

        getLocalKey: async () => cachedUid ?? 'web3auth',

        storeLocalKey: async () => {},

        clearLocalKeys: async () => {
            cachedToken = null;
            cachedUid = null;
        },

        splitKey: async (privateKey: string) => ({
            localKey: privateKey,
            remoteKey: privateKey,
        }),

        reconstructKey: async (_localKey: string, _remoteKey: string): Promise<string> => {
            if (!cachedToken || !cachedUid) {
                throw new Error(
                    'Web3Auth credentials not available — fetchServerKeyStatus must be called first'
                );
            }

            return deriveKey(cachedToken, cachedUid);
        },

        // --- Server communication ---

        fetchServerKeyStatus: async (
            token: string,
            _providerType: string
        ): Promise<ServerKeyStatus> => {
            // Cache the token and decode the uid for use in reconstructKey
            cachedToken = token;
            cachedUid = decodeJwtSub(token);

            // Web3Auth always has a key for any authenticated user —
            // the key is derived deterministically from token + verifier.
            return {
                exists: true,
                needsMigration: false,
                primaryDid: null,
                recoveryMethods: [],
                authShare: 'web3auth', // placeholder — coordinator requires non-null to proceed
                shareVersion: null,
                sssActivationState: null,
            };
        },

        storeAuthShare: async () => {},

        // --- Recovery ---
        // Web3Auth handles key recovery internally via its MPC network.

        executeRecovery: async (): Promise<never> => {
            throw new Error(
                'Recovery is not supported with the Web3Auth strategy. ' +
                    'Web3Auth handles key availability internally via its MPC network.'
            );
        },

        // --- Cleanup ---

        getPreservedStorageKeys: () => [],
    };
};

/**
 * Extract a legacy Web3Auth key for an account upgrade through the same
 * coordination, identity checks and safe errors as ordinary Web3Auth sign-in.
 */
export const deriveWeb3AuthKey = async (
    config: Web3AuthStrategyConfig,
    idToken: string
): Promise<string> => {
    const strategy = createWeb3AuthStrategy(config);
    try {
        await strategy.fetchServerKeyStatus(idToken, 'firebase');
    } catch {
        // JSON parsing errors may include fragments of a malformed credential.
        log.error('Web3Auth account upgrade credentials invalid');
        throw new Error('We couldn’t finish signing you in. Please try again.');
    }
    // The Web3Auth strategy uses its cached credentials, not these share values.
    return strategy.reconstructKey('web3auth', 'web3auth');
};
