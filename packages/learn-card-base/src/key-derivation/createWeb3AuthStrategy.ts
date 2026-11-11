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

import { Capacitor } from '@capacitor/core';
import { SDK_MODE, Web3Auth } from '@web3auth/single-factor-auth';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

import type { KeyDerivationStrategy, ServerKeyStatus } from '@learncard/types';
import { AuthSessionError } from '@learncard/types';
import { getLogger } from '../logging/logger';
import { isNetworkError } from '../helpers/networkError';
import { ACCOUNT_USES_NEWER_SIGN_IN_MESSAGE } from './accountSignInErrors';

const log = getLogger('web3auth-key-derivation');
const DERIVATION_LOCK = 'learncard:web3auth:key-derivation';
const LOCK_WAIT_TIMEOUT_MS = 30_000;
const LOCK_WAIT_NOTICE_MS = 1_000;
let derivationAttempt = 0;
// Also deduplicate coordinator recreation within a document, including hosts
// without Web Locks. Entries live only until the operation settles.
const pendingDerivations = new Map<string, Promise<string>>();

/** The SDK step a derivation attempt last entered; reported when it fails. */
type Web3AuthSetupStage =
    | 'lock_wait'
    | 'session_check'
    | 'init'
    | 'restored_session_check'
    | 'restored_session_logout'
    | 'connect'
    | 'identity_check'
    | 'private_key';

const MAX_FAILURE_MESSAGE_LENGTH = 300;

/**
 * Error with a stable `code` so the coordinator's network classifier routes it
 * to `idle` (quiet retry) instead of the hard error overlay.
 */
class Web3AuthNetworkError extends Error {
    readonly code = 'network_error';

    constructor() {
        super('Network error while signing in. Please check your connection and try again.');
        this.name = 'Web3AuthNetworkError';
    }
}

/**
 * The account already signs in with SSS. Deriving a Web3Auth key for it would
 * produce a different, empty identity, so sign-in stops instead.
 */
export class AccountUsesNewerSignInError extends Error {
    readonly code = 'account_uses_newer_sign_in';

    constructor() {
        super(ACCOUNT_USES_NEWER_SIGN_IN_MESSAGE);
        this.name = 'AccountUsesNewerSignInError';
    }
}

/**
 * Per-attempt lookup deadlines. Each failed attempt (e.g. a cold lca-api that
 * missed the first deadline) gets the next, longer one when the user retries;
 * a successful lookup starts over. Kept under the coordinator's status deadline
 * (`ACCOUNT_LOOKUP_STATUS_TIMEOUT_MS`), so a slow lookup ends in a visible
 * retryable error rather than the coordinator's silent return to idle.
 */
const ACCOUNT_LOOKUP_TIMEOUTS_MS = [3_500, 7_000, 14_000, 28_000] as const;

/**
 * Coordinator `serverStatusTimeoutMs` for strategies that set `accountLookup`:
 * the longest lookup deadline plus headroom.
 */
export const ACCOUNT_LOOKUP_STATUS_TIMEOUT_MS =
    ACCOUNT_LOOKUP_TIMEOUTS_MS[ACCOUNT_LOOKUP_TIMEOUTS_MS.length - 1] + 2_000;

const LOOKUP_FAILED_MESSAGE = 'We couldn’t finish signing you in. Please try again.';

/** lca-api's `verifyAndGetContactMethod` refusal (`routes/keys.ts`). */
const MISSING_CONTACT_METHOD_MESSAGE = 'User must have an email or phone number';

const isMissingContactMethod = async (response: Response): Promise<boolean> => {
    const body = (await response.json().catch(() => undefined)) as
        { code?: unknown; message?: unknown } | undefined;
    return body?.code === 'BAD_REQUEST' && body.message === MISSING_CONTACT_METHOD_MESSAGE;
};

/** Linear, unlike a `/\/+$/` replace on configured input. */
const trimTrailingSlashes = (url: string): string => {
    let end = url.length;
    while (end > 0 && url[end - 1] === '/') end--;
    return url.slice(0, end);
};

/**
 * Whether Web3Auth would derive a different key than the signed-in account's:
 * lca-api has a key record for this login and does not confirm
 * (`isWeb3AuthLogin`) that Web3Auth through this login derives that account's
 * key. That covers SSS accounts and logins linked to a mid-migration account by
 * PIN sign-in. Only a missing record (a `null` body) skips the check. lca-api
 * answers a missing record with `null`, never 404, so a 404 means a wrong URL.
 *
 * Anything that cannot be read fails closed. A device the browser reports as
 * offline gets a network error (the offline UI owns it); a timeout or an
 * unreachable server on an online device gets a visible, retryable error, since
 * a network error would return a signed-in user to the login page silently.
 */
const web3AuthWouldSplitAccount = async (
    lookup: NonNullable<Web3AuthStrategyConfig['accountLookup']>,
    token: string,
    providerType: string,
    timeoutMs: number
): Promise<boolean> => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    try {
        let response: Response;
        try {
            response = await fetch(`${trimTrailingSlashes(lookup.serverUrl)}/keys/auth-share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(lookup.tenantId ? { 'X-Tenant-Id': lookup.tenantId } : {}),
                },
                signal: controller.signal,
                body: JSON.stringify({ authToken: token, providerType }),
            });
        } catch (error) {
            const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
            log.warn('Web3Auth account lookup failed', {
                timedOut,
                timeoutMs,
                offline,
                networkFailure: isNetworkError(error),
            });
            if (offline) throw new Web3AuthNetworkError();
            throw new Error(LOOKUP_FAILED_MESSAGE, { cause: error });
        }

        if (!response.ok) {
            // lca-api refuses a login with no email or phone before any lookup. Every
            // route that creates or links an SSS login requires one, so such a login
            // cannot reach an SSS account: keep Web3Auth (it signed in before lookups).
            if (response.status === 400 && (await isMissingContactMethod(response))) {
                log.info('Web3Auth account lookup skipped: login has no email or phone');
                return false;
            }
            log.warn('Web3Auth account lookup refused', { httpStatus: response.status });
            throw new Error(LOOKUP_FAILED_MESSAGE);
        }

        // The body includes the SSS auth share; only `isWeb3AuthLogin` is read.
        const data = (await response.json().catch(() => undefined)) as
            { isWeb3AuthLogin?: unknown } | null | undefined;
        if (data === undefined) {
            log.warn('Web3Auth account lookup unreadable', { timedOut, timeoutMs });
            throw new Error(LOOKUP_FAILED_MESSAGE);
        }

        // An older lca-api omits `isWeb3AuthLogin`: every existing record then stops.
        return data !== null && data.isWeb3AuthLogin !== true;
    } finally {
        clearTimeout(timer);
    }
};

/**
 * The shape of a JWT: a base64url JSON header (`{"` encodes to `eyJ`) followed
 * by two more dot-separated segments. Anchored on `eyJ` so hostnames such as
 * `api.web3auth.io` survive in diagnostics.
 */
const JWT_SHAPE_RE = /eyJ[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Best-effort readable text for whatever the SDK rejected with. */
const rawFailureText = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string') return message;
        try {
            return JSON.stringify(error) ?? String(error);
        } catch {
            return String(error);
        }
    }
    return String(error);
};

/**
 * Describe an SDK failure for diagnostics without leaking credentials. Handles
 * `Error`s, strings and plain objects (the SDK and Torus do not always reject
 * with an `Error`). Torus errors can embed the OAuth JWT, so the known token
 * (and each of its segments), the account uid, and any JWT-shaped string are
 * removed here before truncation; the logger additionally redacts bearer,
 * long-hex and long-base64 shapes. Keys deliberately avoid the logger's
 * scrubbed substrings (`name`, `token`, ...).
 */
const describeFailure = (
    error: unknown,
    secrets: { idToken: string; uid: string }
): Record<string, unknown> => {
    const code =
        typeof error === 'object' && error !== null
            ? (error as { code?: unknown }).code
            : undefined;
    const known: Array<[string, string]> = [secrets.idToken, ...secrets.idToken.split('.')]
        .filter(part => part.length >= 8)
        .map(part => [part, '[redacted]']);
    if (secrets.uid) known.push([secrets.uid, '[uid]']);

    let failureMessage = rawFailureText(error);
    for (const [value, replacement] of known) {
        failureMessage = failureMessage.replace(new RegExp(escapeRegExp(value), 'g'), replacement);
    }
    failureMessage = failureMessage
        .replace(JWT_SHAPE_RE, '[redacted]')
        .slice(0, MAX_FAILURE_MESSAGE_LENGTH);

    return {
        errorType: error instanceof Error ? error.name || 'Error' : typeof error,
        ...(typeof code === 'string' || typeof code === 'number' ? { errorCode: code } : {}),
        failureMessage,
    };
};

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

    /**
     * Before deriving, ask lca-api which method this account signs in with and
     * stop if it is already SSS (see `AccountUsesNewerSignInError`). Set for
     * sign-in, so a stale build or a config rollback cannot split an SSS
     * account; omit for legacy-key extraction during migration.
     */
    accountLookup?: {
        /** lca-api base URL (`auth.sss.serverUrl`). */
        serverUrl: string;
        tenantId?: string;
    };

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
    // Consecutive failed account lookups; picks the next lookup deadline.
    let lookupFailures = 0;

    /**
     * Connect to Web3Auth SFA and extract the Ethereum private key.
     */
    const deriveKeyFromWeb3Auth = async (
        idToken: string,
        uid: string,
        progress: { stage: Web3AuthSetupStage }
    ): Promise<string> => {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
            config: {
                chainConfig: {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: config.chainConfig?.chainId ?? '0x1',
                    rpcTarget: config.chainConfig?.rpcTarget ?? 'https://cloudflare-eth.com',
                },
            },
        });

        const isLocalhost =
            typeof window !== 'undefined' && window.location.hostname === 'localhost';

        const web3auth = new Web3Auth({
            clientId: config.clientId,
            web3AuthNetwork: config.web3AuthNetwork as Parameters<
                typeof Web3Auth
            >[0]['web3AuthNetwork'],
            privateKeyProvider,
            usePnPKey: config.usePnPKey ?? true,
            // session.web3auth.io rejects localhost CORS, including browser dev
            // servers, so connect() fails while saving the already-derived key.
            // Node mode skips new session writes and keeps derivation identical.
            // An old SDK session can still attempt a restore in init(); the SDK
            // catches that read failure. Other web hosts keep session persistence.
            ...(Capacitor.isNativePlatform() || isLocalhost ? { mode: SDK_MODE.NODE } : {}),
        });

        progress.stage = 'init';
        await web3auth.init();
        log.info('Web3Auth session checked', { restoredSession: web3auth.connected });

        // A persisted session can outlive an account switch. Remove the wrong
        // session under the same lock before connecting the current account.
        if (web3auth.connected) {
            progress.stage = 'restored_session_check';
            const restoredUser = await web3auth.getUserInfo();
            if (restoredUser.verifierId !== uid || restoredUser.verifier !== config.verifier) {
                log.warn('Web3Auth restored session identity mismatch; reconnecting');
                progress.stage = 'restored_session_logout';
                await web3auth.logout();
            }
        }

        // After init(), Web3Auth may have auto-restored a persisted session
        // (e.g. on Android app resume). Calling connect() when already
        // connected throws "Already connected", so skip it in that case.
        if (!web3auth.connected) {
            progress.stage = 'connect';
            await web3auth.connect({
                verifier: config.verifier,
                verifierId: uid,
                idToken,
            });
        }

        // A session restored from shared SDK storage must belong to this login.
        // Never return a different account's key just because init() connected.
        progress.stage = 'identity_check';
        const userInfo = await web3auth.getUserInfo();
        if (userInfo.verifierId !== uid || userInfo.verifier !== config.verifier) {
            throw new Error('Web3Auth restored session identity mismatch');
        }

        progress.stage = 'private_key';
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
        const progress: { stage: Web3AuthSetupStage } = { stage: 'lock_wait' };
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
            progress.stage = 'session_check';
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
            const privateKey = await deriveKeyFromWeb3Auth(idToken, uid, progress);
            progress.stage = 'session_check';
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
                const message = rawFailureText(error);
                const tokenAlreadyUsed = /token is used|duplicate token/i.test(message);
                const networkFailure =
                    !lockWaitTimedOut && (isNetworkError(error) || isNetworkError(message));
                log.error('Web3Auth account setup failed', {
                    setupAttemptId,
                    failureStage: progress.stage,
                    ...describeFailure(error, { idToken, uid }),
                    networkFailure,
                    replayedCredential: tokenAlreadyUsed,
                    restoredIdentityMismatch:
                        message === 'Web3Auth restored session identity mismatch',
                    crossTabLockAvailable: Boolean(locks),
                    lockWaitTimedOut,
                    elapsedMs: Math.round(performance.now() - startedAt),
                });
                // Connectivity failures keep a network-class error so the
                // coordinator returns to idle and retries, as it did before
                // this wrapper existed, instead of showing the error overlay.
                if (networkFailure) throw new Web3AuthNetworkError();
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
            providerType: string
        ): Promise<ServerKeyStatus> => {
            // Credentials are replaced only once this sign-in may proceed, and cleared
            // when it stops, so an in-flight derivation keeps its own until then.
            const forgetCredentials = (): void => {
                cachedToken = null;
                cachedUid = null;
            };
            let uid: string;
            try {
                uid = decodeJwtSub(token);
            } catch (error) {
                forgetCredentials();
                throw error;
            }

            if (config.accountLookup) {
                const timeoutMs =
                    ACCOUNT_LOOKUP_TIMEOUTS_MS[
                        Math.min(lookupFailures, ACCOUNT_LOOKUP_TIMEOUTS_MS.length - 1)
                    ]!;
                let wouldSplit: boolean;
                try {
                    wouldSplit = await web3AuthWouldSplitAccount(
                        config.accountLookup,
                        token,
                        providerType,
                        timeoutMs
                    );
                } catch (error) {
                    lookupFailures++;
                    forgetCredentials();
                    throw error;
                }
                lookupFailures = 0;
                if (wouldSplit) {
                    forgetCredentials();
                    log.warn(
                        'Web3Auth sign-in stopped: this login does not derive the account key'
                    );
                    throw new AccountUsesNewerSignInError();
                }
            }

            // Cache the token and uid for use in reconstructKey
            cachedToken = token;
            cachedUid = uid;

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
