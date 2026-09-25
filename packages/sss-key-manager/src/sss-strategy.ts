/**
 * SSS Key Derivation Strategy
 *
 * Implements KeyDerivationStrategy using Shamir's Secret Sharing.
 * This is the default key derivation strategy for LearnCard.
 *
 * The strategy owns:
 * - Local key storage (IndexedDB device share)
 * - Key splitting and reconstruction (SSS 2-of-4)
 * - Server communication for auth shares
 * - Optional email backup share delivery
 * - Recovery method execution and setup
 * - Storage cleanup knowledge
 */

import type {
    SSSKeyDerivationStrategy,
    ServerKeyStatus,
    AuthProviderType,
    AuthUser,
    RecoveryInput,
    RecoveryResult,
    RecoverySetupInput,
    RecoverySetupResult,
    RecoveryConfirmationInput,
    RecoveryMethodInfo,
    IdentityRecoverySession,
    BackupFile,
    DidAuthVpSigner,
} from './types';
import type { EmailRelayBranding } from './email-relay-crypto';

import {
    AtomicUpdateError,
    ShareWriteRejectedError,
    atomicRecovery,
    atomicShareUpdate,
    splitAndVerify,
    verifyStoredShares,
} from './atomic-operations';
import type { SSSShares } from './sss';
import { reconstructFromShares } from './sss';
import {
    storeDeviceShare as defaultStoreDeviceShare,
    getDeviceShare as defaultGetDeviceShare,
    hasDeviceShare as defaultHasDeviceShare,
    clearAllShares as defaultClearAllShares,
    storeShareVersion as defaultStoreShareVersion,
    getShareVersion as defaultGetShareVersion,
} from './storage';
import { bytesToHex, encryptWithPassword, decryptWithPassword } from './crypto';
import { encryptEmailRelayPayload, generateEmailRelayConfirmationCode } from './email-relay-crypto';
import {
    createPasskeyCredential,
    encryptShareWithPasskey,
    decryptShareWithPasskey,
    isWebAuthnSupported,
    type PasskeyCredential,
} from './passkey';
import {
    shareToRecoveryPhrase,
    recoveryPhraseToShare,
    validateRecoveryPhrase,
} from './recovery-phrase';

const SSS_DB_NAME = 'lcb-sss-keys';
const MAX_RECONCILIATION_HISTORY = 5;

export interface SSSStorageFunctions {
    storeDeviceShare: (share: string, id?: string) => Promise<void>;
    getDeviceShare: (id?: string) => Promise<string | null>;
    hasDeviceShare: (id?: string) => Promise<boolean>;
    clearAllShares: (id?: string) => Promise<void>;
    storeShareVersion: (version: number, id?: string) => Promise<void>;
    getShareVersion: (id?: string) => Promise<number | null>;
}

export interface SSSStrategyConfig {
    /** Server URL for key share operations */
    serverUrl: string;

    /** Custom storage functions (defaults to IndexedDB) */
    storage?: SSSStorageFunctions;

    /**
     * Whether email recovery enrollment is enabled. Delivery is synchronous
     * and must be confirmed with the code included in the recovery email.
     *
     * Defaults to false. Controlled by VITE_ENABLE_EMAIL_BACKUP_SHARE env var.
     */
    enableEmailBackupShare?: boolean;

    /** Base64 DER/SPKI P-256 public key pinned for the isolated email relay. */
    escrowRelayPublicKey?: string;

    /** Identifier selecting the matching relay private key during rotation. */
    escrowRelayKeyId?: string;

    /** Tenant branding encrypted into the relay payload with the recovery key. */
    emailBranding?: EmailRelayBranding;

    /**
     * Tenant identifier forwarded as `X-Tenant-Id` on every server request.
     * The lca-api uses this to brand recovery / OTP emails for the active
     * tenant. Defaults to the server's fallback tenant (learncard) when unset.
     */
    tenantId?: string;
}

const defaultStorage: SSSStorageFunctions = {
    storeDeviceShare: defaultStoreDeviceShare,
    getDeviceShare: defaultGetDeviceShare,
    hasDeviceShare: defaultHasDeviceShare,
    clearAllShares: defaultClearAllShares,
    storeShareVersion: defaultStoreShareVersion,
    getShareVersion: defaultGetShareVersion,
};

// ---------------------------------------------------------------------------
// Server helpers (internal)
// ---------------------------------------------------------------------------

const buildHeaders = (
    token: string,
    didAuthVp?: string,
    tenantId?: string
): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(didAuthVp ? { Authorization: `Bearer ${didAuthVp}` } : {}),
    ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
});

const fetchAuthShareRaw = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    shareVersion?: number,
    tenantId?: string
) => {
    const response = await fetch(`${serverUrl}/keys/auth-share`, {
        method: 'POST',
        headers: buildHeaders(token, undefined, tenantId),
        body: JSON.stringify({
            authToken: token,
            providerType,
            ...(shareVersion != null ? { shareVersion } : {}),
        }),
    });

    if (!response.ok) {
        if (response.status === 404) return null;

        throw new Error(`Failed to fetch key status: ${response.statusText}`);
    }

    return response.json();
};

const putAuthShare = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    authShare: string,
    primaryDid: string,
    didAuthVp?: string,
    tenantId?: string,
    expectedShareVersion?: number
): Promise<{ shareVersion: number; expectedShareVersionChecked: boolean }> => {
    const response = await fetch(`${serverUrl}/keys/auth-share`, {
        method: 'PUT',
        headers: buildHeaders(token, didAuthVp, tenantId),
        body: JSON.stringify({
            authToken: token,
            providerType,
            authShare: { encryptedData: authShare, encryptedDek: '', iv: '' },
            primaryDid,
            securityLevel: 'basic',
            sssActivationState: 'provisional',
            expectedShareVersion,
        }),
    });

    if (!response.ok) {
        const message = `Failed to store auth share: ${response.statusText}`;
        // A gateway/server failure or request timeout can arrive AFTER commit.
        // Only an explicit client rejection proves this write was not accepted.
        if (response.status >= 400 && response.status < 500 && response.status !== 408) {
            throw new ShareWriteRejectedError(message);
        }
        throw new Error(message);
    }

    const data = await response.json();

    return {
        shareVersion: data.shareVersion ?? 1,
        expectedShareVersionChecked: data.expectedShareVersionChecked === true,
    };
};

const authShareToString = (authShare: unknown): string | null => {
    if (typeof authShare === 'string') return authShare;

    if (
        typeof authShare === 'object' &&
        authShare !== null &&
        'encryptedData' in authShare &&
        typeof authShare.encryptedData === 'string'
    ) {
        return authShare.encryptedData;
    }

    return null;
};

/**
 * Obtain a server-issued nonce and sign a DID-Auth VP specifically for one
 * write. The server consumes the nonce while creating request context, so a
 * VP returned here cannot authorize a second request.
 */
const requestFreshDidAuthVp = async (
    serverUrl: string,
    privateKey: string,
    did: string,
    signDidAuthVp: DidAuthVpSigner,
    tenantId?: string
): Promise<string> => {
    const bootstrapVp = await signDidAuthVp(privateKey);
    const response = await fetch(`${serverUrl}/keys/challenge`, {
        method: 'POST',
        headers: buildHeaders('', bootstrapVp, tenantId),
        body: JSON.stringify({ did }),
    });

    if (!response.ok) {
        throw new Error(`Failed to request DID challenge: ${response.statusText}`);
    }

    const data = (await response.json()) as { challenge?: string };

    if (!data.challenge) throw new Error('DID challenge response was empty');

    return signDidAuthVp(privateKey, data.challenge);
};

interface RecoveryShareResponse {
    encryptedShare?: { encryptedData: string; iv: string; salt?: string };
    shareVersion?: number;
}

const fetchRecoveryShare = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    type: string,
    credentialId?: string,
    tenantId?: string
): Promise<RecoveryShareResponse> => {
    // P0-4: this GET has no body, so — unlike the authToken-in-body pattern
    // used elsewhere in this file — the token travels as an X-Auth-Token
    // header (not Authorization, which is reserved for a DID-Auth VP on
    // this same route for other callers). Never as a query param: those
    // land in proxy/ALB access logs.
    const params = new URLSearchParams({ type, providerType });

    if (credentialId) {
        params.set('credentialId', credentialId);
    }

    const response = await fetch(`${serverUrl}/keys/recovery?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
            ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`No ${type} recovery share found`);
    }

    return response.json();
};

interface IdentityRecoverySessionResponse {
    recoverySessionToken: string;
    recoveryMethods: Array<{
        type: string;
        createdAt: string;
        credentialId?: string;
        shareVersion?: number;
    }>;
}

interface IdentityRecoveryMaterialResponse {
    authShare: { encryptedData: string; encryptedDek: string; iv: string };
    encryptedShare?: { encryptedData: string; iv: string; salt?: string };
    primaryDid: string;
    shareVersion: number;
    rebindSessionToken: string;
}

/**
 * Signals that an identity-recovery attempt failed after the one-shot server
 * session was submitted and must be restarted with a new verification code.
 */
export class IdentityRecoverySessionConsumedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IdentityRecoverySessionConsumedError';
    }
}

const postJson = async <T>(
    url: string,
    body: Record<string, unknown>,
    headers: Record<string, string>
): Promise<T> => {
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
            message?: string;
            error?: { message?: string };
        } | null;
        const message = data?.error?.message || data?.message || response.statusText;
        if (response.status >= 400 && response.status < 500 && response.status !== 408) {
            throw new ShareWriteRejectedError(message);
        }
        throw new Error(message);
    }

    return response.json();
};

const postRecoveryMethod = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    body: Record<string, unknown>,
    didAuthVp?: string,
    tenantId?: string
) => {
    const response = await fetch(`${serverUrl}/keys/recovery`, {
        method: 'POST',
        headers: buildHeaders(token, didAuthVp, tenantId),
        body: JSON.stringify({ authToken: token, providerType, ...body }),
    });

    if (!response.ok) {
        throw new Error(`Failed to add recovery method: ${response.statusText}`);
    }
};

const postRecoveryConfirmation = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    body: Record<string, unknown>,
    didAuthVp?: string,
    tenantId?: string
): Promise<void> => {
    const response = await fetch(`${serverUrl}/keys/recovery/confirm`, {
        method: 'POST',
        headers: buildHeaders(token, didAuthVp, tenantId),
        body: JSON.stringify({ authToken: token, providerType, ...body }),
    });

    if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
            message?: string;
            error?: { message?: string };
        } | null;
        const message =
            data?.error?.message || data?.message || `Failed to confirm recovery method`;

        throw new Error(message);
    }
};

const calculateShareChecksum = async (share: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(share));

    return bytesToHex(new Uint8Array(digest));
};

export const selectRecoveryPhraseChallengeIndices = (
    wordCount: number,
    challengeCount = 3
): number[] => {
    if (wordCount < challengeCount) {
        throw new Error('Recovery phrase does not contain enough words for confirmation');
    }

    const indices = new Set<number>();
    // Rejection sampling: discard values in the partial top bucket so every
    // index is equally likely (avoids modulo bias flagged by CodeQL).
    const limit = 0x1_0000_0000 - (0x1_0000_0000 % wordCount);

    while (indices.size < challengeCount) {
        const randomValue = crypto.getRandomValues(new Uint32Array(1))[0];

        if (randomValue === undefined) throw new Error('Failed to choose recovery phrase words');
        if (randomValue >= limit) continue;

        indices.add(randomValue % wordCount);
    }

    return [...indices].sort((a, b) => a - b);
};

/**
 * Format an email share with a 4-character hex version prefix.
 *
 * Example: version 12 + share "47dee4…" → "000c47dee4…"
 *
 * The 4-hex-digit prefix keeps the entire string as one contiguous
 * hex blob, so double-clicking in an email selects the whole thing
 * (no word-boundary characters like ":" to trip up selection).
 */
export const VERSION_PREFIX_LEN = 4;

export const formatVersionedEmailShare = (emailShare: string, shareVersion: number): string =>
    shareVersion.toString(16).padStart(VERSION_PREFIX_LEN, '0') + emailShare;

/**
 * Parse a versioned email share string back into its components.
 * Expects a 4-char hex version prefix followed by the hex share.
 * Returns the raw hex share and the version number (if present).
 */
export const parseVersionedEmailShare = (
    input: string
): { share: string; version: number | undefined } => {
    if (input.length > VERSION_PREFIX_LEN) {
        const prefix = input.slice(0, VERSION_PREFIX_LEN);
        const maybeVersion = parseInt(prefix, 16);

        if (!isNaN(maybeVersion) && maybeVersion > 0) {
            return { share: input.slice(VERSION_PREFIX_LEN), version: maybeVersion };
        }
    }

    // No valid prefix — treat the whole string as a raw share (no version)
    return { share: input, version: undefined };
};

const sendEmailBackupShare = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    emailShare: string,
    email: string,
    escrowRelayPublicKey: string,
    escrowRelayKeyId: string,
    emailBranding?: EmailRelayBranding,
    shareVersion?: number,
    didAuthVp?: string,
    tenantId?: string
): Promise<void> => {
    const recoveryKey =
        shareVersion != null ? formatVersionedEmailShare(emailShare, shareVersion) : emailShare;
    const confirmationCode = generateEmailRelayConfirmationCode();
    const relayPayload = await encryptEmailRelayPayload(
        {
            targetEmail: email,
            recoveryKey,
            confirmationCode,
            branding: emailBranding,
        },
        escrowRelayPublicKey,
        escrowRelayKeyId
    );
    const response = await fetch(`${serverUrl}/keys/email-backup`, {
        method: 'POST',
        headers: buildHeaders(token, didAuthVp, tenantId),
        body: JSON.stringify({
            authToken: token,
            providerType,
            relayPayload,
            confirmationCode,
            email,
            shareVersion,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send recovery share: ${response.statusText}`);
    }
};

interface PersistedShareUpdate {
    shares: SSSShares;
    shareVersion: number;
}

// Reuse the storage abstraction's encrypted, per-ID entries. No new methods are
// required of custom stores, and adaptive storage retains its session-only mode.
const pendingShareId = (storageId?: string): string =>
    `sss-pending-share:${storageId ?? 'sss-device-share'}`;

/** DID_CHALLENGE_TTL_SECS (5 minutes) plus a processing margin for auth-share PUTs. */
export const PENDING_WRITE_EXPIRY_MS = 10 * 60 * 1000;
const MAX_PENDING_SHARE_CANDIDATES = 8;

export interface PendingShareCandidate {
    share: string;
    createdAt: number;
}

/**
 * Read device-only candidates from independent splits; never persist an auth,
 * recovery, or email share here (two shares from one split reveal the key).
 * Legacy raw shares have unknown age, but must still be checked before expiry.
 * Mutating helpers must run under the account's share-update lock.
 */
export const readPendingShareCandidates = async (
    storage: SSSStorageFunctions,
    storageId?: string
): Promise<PendingShareCandidate[]> => {
    const raw = await storage.getDeviceShare(pendingShareId(storageId));
    if (!raw) return [];
    if (!raw.trimStart().startsWith('{')) return [{ share: raw, createdAt: 0 }];
    const data: unknown = JSON.parse(raw);
    if (
        !data ||
        typeof data !== 'object' ||
        !('v' in data) ||
        data.v !== 1 ||
        !('candidates' in data) ||
        !Array.isArray(data.candidates) ||
        !data.candidates.every(
            (candidate: unknown) =>
                candidate !== null &&
                typeof candidate === 'object' &&
                'share' in candidate &&
                typeof candidate.share === 'string' &&
                'createdAt' in candidate &&
                typeof candidate.createdAt === 'number' &&
                Number.isFinite(candidate.createdAt) &&
                candidate.createdAt >= 0
        )
    )
        throw new Error('Invalid pending share candidates');
    return data.candidates as PendingShareCandidate[];
};

/** Clear only an empty/resolved queue or when explicitly forgetting this device. */
export const clearPendingShareCandidates = async (
    storage: SSSStorageFunctions,
    storageId?: string
): Promise<void> => storage.clearAllShares(pendingShareId(storageId));

/** Persist the versioned device-only queue without storing another share of any split. */
export const writePendingShareCandidates = async (
    storage: SSSStorageFunctions,
    candidates: PendingShareCandidate[],
    storageId?: string
): Promise<void> => {
    if (!candidates.length) return clearPendingShareCandidates(storage, storageId);
    await storage.storeDeviceShare(JSON.stringify({ v: 1, candidates }), pendingShareId(storageId));
};

/** Append a candidate; never evict a live write to make room for another one. */
export const addPendingShareCandidate = async (
    storage: SSSStorageFunctions,
    candidate: PendingShareCandidate,
    storageId?: string
): Promise<void> => {
    const candidates = await readPendingShareCandidates(storage, storageId);
    if (candidates.length >= MAX_PENDING_SHARE_CANDIDATES) {
        throw new AtomicUpdateError(
            'Reconcile the pending share update before writing new shares',
            'store_device',
            false
        );
    }
    await writePendingShareCandidates(storage, [...candidates, candidate], storageId);
};

/** Roll back only the definitively rejected operation, preserving earlier in-flight writes. */
export const removePendingShareCandidate = async (
    storage: SSSStorageFunctions,
    share: string,
    storageId?: string
): Promise<void> => {
    const candidates = await readPendingShareCandidates(storage, storageId);
    await writePendingShareCandidates(
        storage,
        candidates.filter(candidate => candidate.share !== share),
        storageId
    );
};

interface CurrentShareSnapshot {
    currentVersion: number | null;
    authShare: string | null;
}

/**
 * Check current and retained history before expiry: an expired nonce does not
 * prove a write never committed. Keep unrelated live writes even after promotion,
 * since older servers may still commit them after this read.
 */
export const resolvePendingShareCandidates = async (
    storage: SSSStorageFunctions,
    storageId: string | undefined,
    fetchCurrent: () => Promise<CurrentShareSnapshot>,
    expectedDid: string,
    didFromPrivateKey: (key: string) => Promise<string>,
    assertActiveUser: () => void = () => {},
    onPromoted?: (snapshot: CurrentShareSnapshot) => void,
    fetchHistorical?: (version: number) => Promise<string | null>
): Promise<{ snapshot: CurrentShareSnapshot; privateKey: string | null }> => {
    const candidates = await readPendingShareCandidates(storage, storageId);
    const snapshot = await fetchCurrent();
    assertActiveUser();
    const { authShare, currentVersion } = snapshot;
    if (
        authShare &&
        (currentVersion === null || !Number.isInteger(currentVersion) || currentVersion < 1)
    ) {
        throw new Error('Current auth share is missing a valid share version');
    }
    if (authShare && currentVersion !== null) {
        for (const candidate of candidates) {
            const health = await verifyStoredShares(
                { getDevice: async () => candidate.share, getAuth: async () => authShare },
                expectedDid,
                didFromPrivateKey
            );
            assertActiveUser();
            if (!health.healthy) continue;
            const privateKey = await reconstructFromShares([candidate.share, authShare]);
            assertActiveUser();
            await storage.storeDeviceShare(candidate.share, storageId);
            await storage.storeShareVersion(currentVersion, storageId);
            await removePendingShareCandidate(storage, candidate.share, storageId);
            assertActiveUser();
            onPromoted?.(snapshot);
            return { snapshot, privateKey };
        }
    }
    const matched = new Set<string>();
    const history = new Map<number, string>();
    let historyComplete = true;
    if (candidates.length && currentVersion !== null) {
        for (
            let version = currentVersion - 1;
            version >= 1 && version >= currentVersion - MAX_RECONCILIATION_HISTORY;
            version--
        ) {
            if (!fetchHistorical) {
                historyComplete = false;
                break;
            }
            try {
                const share = await fetchHistorical(version);
                if (share) history.set(version, share);
            } catch {
                // An unavailable version cannot prove a candidate is dead.
                historyComplete = false;
            }
            assertActiveUser();
        }
    }
    const mainShare = await storage.getDeviceShare(storageId);
    let mainHealthy = false;
    const retainedShares = [...history.values(), ...(authShare ? [authShare] : [])];
    if (mainShare) {
        for (const share of retainedShares) {
            const health = await verifyStoredShares(
                { getDevice: async () => mainShare, getAuth: async () => share },
                expectedDid,
                didFromPrivateKey
            );
            assertActiveUser();
            if (health.healthy) {
                mainHealthy = true;
                break;
            }
        }
    }
    let promoted: string | undefined;
    for (const candidate of candidates) {
        for (const [version, share] of history) {
            const health = await verifyStoredShares(
                { getDevice: async () => candidate.share, getAuth: async () => share },
                expectedDid,
                didFromPrivateKey
            );
            assertActiveUser();
            if (!health.healthy) continue;
            matched.add(candidate.share);
            if (!mainHealthy && !promoted) {
                await storage.storeDeviceShare(candidate.share, storageId);
                await storage.storeShareVersion(version, storageId);
                assertActiveUser();
                onPromoted?.({ currentVersion: version, authShare: share });
                promoted = candidate.share;
            }
            break;
        }
    }
    const live = candidates.filter(
        candidate =>
            candidate.share !== promoted &&
            (matched.has(candidate.share) ||
                !historyComplete ||
                (candidate.createdAt !== 0 &&
                    Date.now() - candidate.createdAt <= PENDING_WRITE_EXPIRY_MS))
    );
    if (live.length !== candidates.length) {
        assertActiveUser();
        await writePendingShareCandidates(storage, live, storageId);
    }
    return { snapshot, privateKey: null };
};

const activeShareUpdates = new WeakMap<SSSStorageFunctions, Set<string>>();

/** Protect the pending slot from overlapping writers and reconciliation. */
const withShareUpdateLock = async <T>(
    storage: SSSStorageFunctions,
    storageId: string | undefined,
    operation: () => Promise<T>
): Promise<T> => {
    const id = pendingShareId(storageId);
    const active = activeShareUpdates.get(storage) ?? new Set<string>();
    activeShareUpdates.set(storage, active);
    const busy = (): AtomicUpdateError =>
        new AtomicUpdateError('A share update is already in progress', 'store_device', false);

    if (active.has(id)) throw busy();
    active.add(id);
    try {
        // Web Locks also serialize default IndexedDB storage across tabs. The
        // in-process guard supports runtimes/custom stores without that API.
        if (typeof navigator !== 'undefined' && navigator.locks) {
            return await navigator.locks.request(id, { ifAvailable: true }, async lock => {
                if (!lock) throw busy();
                return operation();
            });
        }
        return await operation();
    } finally {
        active.delete(id);
    }
};

const persistSharesWithoutLock = async (
    privateKey: string,
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    primaryDid: string,
    storage: SSSStorageFunctions,
    storageId?: string,
    didFromPrivateKey?: (pk: string) => Promise<string>,
    signDidAuthVp?: DidAuthVpSigner,
    tenantId?: string,
    onPromoted?: (snapshot: CurrentShareSnapshot) => void,
    assertActiveUser: () => void = () => {}
): Promise<PersistedShareUpdate> => {
    // Defensive DID check — refuse to rotate if the key is wrong
    if (primaryDid && didFromPrivateKey) {
        const derivedDid = await didFromPrivateKey(privateKey);

        if (derivedDid && derivedDid !== primaryDid) {
            throw new Error(
                'rotateShares: key does not match expected DID — refusing to overwrite server shares'
            );
        }
    }

    const { snapshot } = await resolvePendingShareCandidates(
        storage,
        storageId,
        async () => {
            const data = await fetchAuthShareRaw(
                serverUrl,
                token,
                providerType,
                undefined,
                tenantId
            );
            return {
                currentVersion: data?.shareVersion ?? null,
                authShare: authShareToString(data?.authShare),
            };
        },
        primaryDid,
        didFromPrivateKey ??
            (async key => (key === privateKey ? primaryDid : `${primaryDid}:mismatch`)),
        assertActiveUser,
        onPromoted,
        async version =>
            authShareToString(
                (await fetchAuthShareRaw(serverUrl, token, providerType, version, tenantId))
                    ?.authShare
            )
    );

    // Acquire authorization before staging: failures here cannot have committed
    // an auth-share write and must not leave an unresolved pending operation.
    const didAuthVp = signDidAuthVp
        ? await requestFreshDidAuthVp(serverUrl, privateKey, primaryDid, signDidAuthVp, tenantId)
        : undefined;
    assertActiveUser();
    let shareVersion: number | undefined;
    let stagedShare = '';

    const shares = await atomicShareUpdate(privateKey, {
        storeDevice: async share => {
            assertActiveUser();
            stagedShare = share;
            await addPendingShareCandidate(storage, { share, createdAt: Date.now() }, storageId);
        },
        clearDevice: () => removePendingShareCandidate(storage, stagedShare, storageId),
        storeAuth: async share => {
            assertActiveUser();
            const result = await putAuthShare(
                serverUrl,
                token,
                providerType,
                share,
                primaryDid,
                didAuthVp,
                tenantId,
                snapshot.currentVersion ?? 0
            );

            shareVersion = result.shareVersion;
        },
    });

    if (shareVersion === undefined) {
        throw new Error('Server did not return a share version');
    }

    await storage.storeDeviceShare(shares.deviceShare, storageId);
    await storage.storeShareVersion(shareVersion, storageId);
    await removePendingShareCandidate(storage, shares.deviceShare, storageId);
    assertActiveUser();

    return { shares, shareVersion };
};

const persistSharesAtomically = (
    ...args: Parameters<typeof persistSharesWithoutLock>
): Promise<PersistedShareUpdate> =>
    withShareUpdateLock(args[5], args[6], () => persistSharesWithoutLock(...args));

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an SSS key derivation strategy.
 *
 * @example
 * ```ts
 * const sssStrategy = createSSSStrategy({
 *     serverUrl: 'https://api.learncard.com',
 * });
 *
 * // Use with AuthCoordinator
 * const coordinator = createAuthCoordinator({
 *     authProvider,
 *     keyDerivation: sssStrategy,
 * });
 * ```
 */
export function createSSSStrategy(config: SSSStrategyConfig): SSSKeyDerivationStrategy {
    const {
        serverUrl,
        enableEmailBackupShare = false,
        escrowRelayPublicKey = '',
        escrowRelayKeyId = '',
        emailBranding,
        tenantId,
    } = config;
    const storage = config.storage || defaultStorage;

    /**
     * Per-user storage ID. When set, device shares are keyed as
     * `sss-device-share:<userId>` so multiple accounts can coexist
     * on the same device without overwriting each other.
     *
     * Set by `setActiveUser()` — called by the coordinator after auth.
     * When undefined, falls back to the global default key (backward compat).
     */
    let activeStorageId: string | undefined;

    /**
     * Cached email share from the most recent `splitKey()` call.
     * Used by `sendEmailBackupShare()` so the emailed share comes from
     * the same split as the device + auth shares — required for SSS
     * reconstruction to work.
     */
    let lastEmailShare: string | undefined;

    /**
     * Cached share version from the most recent `storeAuthShare()` or
     * `setupRecoveryMethod()` call. Used by `sendEmailBackupShare()` to
     * prepend the version to the emailed share so recovery can fetch the
     * matching auth share.
     */
    let lastShareVersion: number | undefined;

    let pendingPhraseConfirmation:
        | {
              phrase: string;
              challengeWordIndices: number[];
          }
        | undefined;
    let pendingBackupConfirmation:
        | {
              backupFile: BackupFile;
              recoveryShare: string;
          }
        | undefined;

    let pendingIdentityRecovery:
        | {
              privateKey: string;
              primaryDid: string;
              recoveryShare: string;
              authShare: string;
              rebindSessionToken: string;
          }
        | undefined;

    /** Last server response, including which version its auth share resolved. */
    let lastServerSnapshot: {
        currentVersion: number | null;
        resolvedVersion: number | null;
        authShare: string | null;
        primaryDid: string | null;
    } | null = null;

    const recordPromotion =
        (primaryDid: string) =>
        (snapshot: CurrentShareSnapshot): void => {
            // A device-only candidate cannot supply the email share of its split.
            lastEmailShare = undefined;
            lastShareVersion = snapshot.currentVersion ?? undefined;
            lastServerSnapshot = {
                ...snapshot,
                resolvedVersion: snapshot.currentVersion,
                primaryDid,
            };
        };

    const captureActiveUserGuard = (): (() => void) => {
        const storageId = activeStorageId;
        return () => {
            if (activeStorageId !== storageId) {
                throw new AtomicUpdateError(
                    'Active account changed during share update',
                    'verify_stored',
                    false
                );
            }
        };
    };

    return {
        name: 'sss',

        capabilities: {
            recovery: true,
            deviceLinking: true,
            localKeyPersistence: true,
            contactMethodUpgrade: true,
        },

        // --- User scoping ---

        setActiveUser(userId: string): void {
            activeStorageId = `sss-device-share:${userId}`;
            lastServerSnapshot = null;
            pendingPhraseConfirmation = undefined;
            pendingBackupConfirmation = undefined;
        },

        // --- Key lifecycle ---

        async hasLocalKey(): Promise<boolean> {
            if (await storage.hasDeviceShare(activeStorageId)) return true;
            if ((await readPendingShareCandidates(storage, activeStorageId)).length) return true;

            // Fallback: check legacy unscoped key for shares stored before per-user scoping
            if (activeStorageId) {
                return storage.hasDeviceShare();
            }

            return false;
        },

        async getLocalKey(): Promise<string | null> {
            const scoped = await storage.getDeviceShare(activeStorageId);

            if (scoped) return scoped;

            const pending = await readPendingShareCandidates(storage, activeStorageId);
            if (pending.length) return pending[pending.length - 1]!.share;

            // Fallback: try legacy unscoped key and auto-migrate if found
            if (activeStorageId) {
                const legacy = await storage.getDeviceShare();

                if (legacy) {
                    // Migrate: copy to scoped key (legacy entry left in place — harmless)
                    await storage.storeDeviceShare(legacy, activeStorageId);

                    return legacy;
                }
            }

            return null;
        },

        async storeLocalKey(key: string): Promise<void> {
            return storage.storeDeviceShare(key, activeStorageId);
        },

        async clearLocalKeys(): Promise<void> {
            const storageId = activeStorageId;
            await clearPendingShareCandidates(storage, storageId);
            return storage.clearAllShares(storageId);
        },

        async splitKey(privateKey: string): Promise<{ localKey: string; remoteKey: string }> {
            const { shares } = await splitAndVerify(privateKey);

            // Cache the email share for sendEmailBackupShare to reuse
            lastEmailShare = shares.emailShare;

            return {
                localKey: shares.deviceShare,
                remoteKey: shares.authShare,
            };
        },

        async reconstructKey(localKey: string, remoteKey: string): Promise<string> {
            return reconstructFromShares([localKey, remoteKey]);
        },

        async verifyKeys(
            localKey: string,
            remoteKey: string,
            expectedDid: string,
            didFromPrivateKey: (pk: string) => Promise<string>
        ): Promise<boolean> {
            const result = await verifyStoredShares(
                {
                    getDevice: async () => localKey,
                    getAuth: async () => remoteKey,
                },
                expectedDid,
                didFromPrivateKey
            );

            return result.healthy;
        },

        async getFreshDidAuthVp(
            privateKey: string,
            did: string,
            signDidAuthVp: DidAuthVpSigner
        ): Promise<string> {
            return requestFreshDidAuthVp(serverUrl, privateKey, did, signDidAuthVp, tenantId);
        },

        async atomicUpdateShares(params): Promise<void> {
            const result = await persistSharesAtomically(
                params.privateKey,
                serverUrl,
                params.token,
                params.providerType,
                params.did,
                storage,
                activeStorageId,
                undefined,
                params.signDidAuthVp,
                tenantId,
                recordPromotion(params.did),
                captureActiveUserGuard()
            );

            lastEmailShare = result.shares.emailShare;
            lastShareVersion = result.shareVersion;
            lastServerSnapshot = {
                currentVersion: result.shareVersion,
                resolvedVersion: result.shareVersion,
                authShare: result.shares.authShare,
                primaryDid: params.did,
            };
        },

        async reconcileShares(params): Promise<RecoveryResult | null> {
            const storageId = activeStorageId;
            const assertActiveUser = (): void => {
                if (activeStorageId !== storageId) {
                    throw new AtomicUpdateError(
                        'Active account changed during reconciliation',
                        'verify_stored',
                        false
                    );
                }
            };
            return withShareUpdateLock(storage, storageId, async () => {
                let deviceShare = await storage.getDeviceShare(storageId);
                const pending = await readPendingShareCandidates(storage, storageId);

                if (!deviceShare && !pending.length) return null;

                const resolution = await resolvePendingShareCandidates(
                    storage,
                    storageId,
                    async () => {
                        const data = await fetchAuthShareRaw(
                            serverUrl,
                            params.token,
                            params.providerType,
                            undefined,
                            tenantId
                        );
                        return {
                            currentVersion: data?.shareVersion ?? null,
                            authShare: authShareToString(data?.authShare),
                        };
                    },
                    params.expectedDid,
                    params.didFromPrivateKey,
                    assertActiveUser,
                    recordPromotion(params.expectedDid),
                    async version =>
                        authShareToString(
                            (
                                await fetchAuthShareRaw(
                                    serverUrl,
                                    params.token,
                                    params.providerType,
                                    version,
                                    tenantId
                                )
                            )?.authShare
                        )
                );
                assertActiveUser();
                if (resolution.privateKey) {
                    return { privateKey: resolution.privateKey, did: params.expectedDid };
                }
                const { currentVersion, authShare: currentAuthShare } = resolution.snapshot;
                if (currentVersion === null && !currentAuthShare) return null;

                // Resolution may have recovered a historical candidate without a main share.
                deviceShare = await storage.getDeviceShare(storageId);
                const localVersion = await storage.getShareVersion(storageId);
                if (!deviceShare) return null;
                const candidates = new Map<number, string>();

                const addCandidate = (version: number | null, authShare: string | null): void => {
                    if (version !== null && authShare && !candidates.has(version)) {
                        candidates.set(version, authShare);
                    }
                };

                addCandidate(
                    lastServerSnapshot?.resolvedVersion ?? null,
                    lastServerSnapshot?.authShare ?? null
                );
                addCandidate(currentVersion, currentAuthShare);

                const versionsToTry = new Set<number>();
                if (localVersion !== null) versionsToTry.add(localVersion);

                if (currentVersion !== null) {
                    for (
                        let version = currentVersion;
                        version >= 1 && version >= currentVersion - MAX_RECONCILIATION_HISTORY;
                        version--
                    ) {
                        versionsToTry.add(version);
                    }
                }

                for (const version of versionsToTry) {
                    if (candidates.has(version)) continue;

                    const data = await fetchAuthShareRaw(
                        serverUrl,
                        params.token,
                        params.providerType,
                        version,
                        tenantId
                    );

                    addCandidate(version, authShareToString(data?.authShare));
                }

                for (const [candidateVersion, authShare] of candidates) {
                    const health = await verifyStoredShares(
                        {
                            getDevice: async () => deviceShare,
                            getAuth: async () => authShare,
                        },
                        params.expectedDid,
                        params.didFromPrivateKey
                    );

                    if (!health.healthy) continue;

                    assertActiveUser();

                    const privateKey = await reconstructFromShares([deviceShare, authShare]);

                    if (candidateVersion === currentVersion) {
                        if (localVersion !== currentVersion) {
                            await storage.storeShareVersion(candidateVersion, storageId);
                        }

                        assertActiveUser();
                        lastServerSnapshot = {
                            currentVersion,
                            resolvedVersion: candidateVersion,
                            authShare,
                            primaryDid: params.expectedDid,
                        };

                        return localVersion === currentVersion
                            ? null
                            : { privateKey, did: params.expectedDid };
                    }

                    // The local device share only matches a historical server share.
                    // Re-split and atomically advance both stores to one fresh version.
                    const result = await persistSharesWithoutLock(
                        privateKey,
                        serverUrl,
                        params.token,
                        params.providerType,
                        params.expectedDid,
                        storage,
                        storageId,
                        params.didFromPrivateKey,
                        params.signDidAuthVp,
                        tenantId,
                        recordPromotion(params.expectedDid),
                        assertActiveUser
                    );

                    assertActiveUser();
                    lastEmailShare = result.shares.emailShare;
                    lastShareVersion = result.shareVersion;
                    lastServerSnapshot = {
                        currentVersion: result.shareVersion,
                        resolvedVersion: result.shareVersion,
                        authShare: result.shares.authShare,
                        primaryDid: params.expectedDid,
                    };

                    return { privateKey, did: params.expectedDid };
                }

                return null;
            });
        },

        // --- Server communication ---

        async fetchServerKeyStatus(
            token: string,
            providerType: AuthProviderType
        ): Promise<ServerKeyStatus> {
            // Pass the local device share's version so the server returns the matching auth share
            const localVersion = await storage.getShareVersion(activeStorageId);

            const data = await fetchAuthShareRaw(
                serverUrl,
                token,
                providerType,
                localVersion ?? undefined,
                tenantId
            );

            if (!data) {
                lastServerSnapshot = null;

                return {
                    exists: false,
                    needsMigration: false,
                    primaryDid: null,
                    recoveryMethods: [],
                    authShare: null,
                    shareVersion: null,
                    maskedRecoveryEmail: null,
                    sssActivationState: null,
                };
            }

            const rawAuthShare = data.authShare;
            const authShareString = authShareToString(rawAuthShare);

            const serverVersion = data.shareVersion ?? null;

            // Version repair: if the server knows the version but local storage
            // doesn't (e.g. account created before versioning was added), backfill
            // it so QR device-link transfers always include the version.
            if (
                // Version 0 means "no auth share yet" and must never be pinned locally.
                serverVersion != null &&
                serverVersion > 0 &&
                localVersion == null &&
                !(await readPendingShareCandidates(storage, activeStorageId)).length
            ) {
                storage
                    .storeShareVersion(serverVersion, activeStorageId)
                    .catch(e => console.warn('SSS: failed to backfill local shareVersion', e));
            }

            lastServerSnapshot = {
                currentVersion: serverVersion,
                resolvedVersion: authShareString ? (localVersion ?? serverVersion) : null,
                authShare: authShareString,
                primaryDid: data.primaryDid || null,
            };

            return {
                exists: !!rawAuthShare || !!data.keyProvider || !!data.primaryDid,
                needsMigration: data.keyProvider === 'web3auth',
                primaryDid: data.primaryDid || null,
                recoveryMethods: data.recoveryMethods || [],
                authShare: authShareString,
                shareVersion: serverVersion,
                maskedRecoveryEmail: data.maskedRecoveryEmail ?? null,
                sssActivationState: data.sssActivationState ?? 'active',
            };
        },

        async storeAuthShare(
            token: string,
            providerType: AuthProviderType,
            authShare: string,
            primaryDid: string,
            didAuthVp?: string
        ): Promise<void> {
            const { shareVersion } = await putAuthShare(
                serverUrl,
                token,
                providerType,
                authShare,
                primaryDid,
                didAuthVp,
                tenantId
            );

            // Persist the version alongside the device share so we can request
            // the matching auth share on next login.
            await storage.storeShareVersion(shareVersion, activeStorageId);

            // Cache for the upcoming sendEmailBackupShare call
            lastShareVersion = shareVersion;
        },

        async markMigrated(
            token: string,
            providerType: AuthProviderType,
            didAuthVp?: string
        ): Promise<void> {
            const response = await fetch(`${serverUrl}/keys/migrate`, {
                method: 'POST',
                headers: buildHeaders(token, didAuthVp, tenantId),
                body: JSON.stringify({ authToken: token, providerType }),
            });

            if (!response.ok) {
                throw new Error(`Failed to mark migrated: ${response.statusText}`);
            }
        },

        async activate(
            token: string,
            providerType: AuthProviderType,
            didAuthVp?: string
        ): Promise<void> {
            const response = await fetch(`${serverUrl}/keys/activate`, {
                method: 'POST',
                headers: buildHeaders(token, didAuthVp, tenantId),
                body: JSON.stringify({ authToken: token, providerType }),
            });

            if (!response.ok) {
                throw new Error(`Failed to activate SSS key: ${response.statusText}`);
            }
        },

        // --- Recovery execution ---

        async executeRecovery(params: {
            token: string;
            providerType: AuthProviderType;
            input: RecoveryInput;
            didFromPrivateKey?: (privateKey: string) => Promise<string>;
            signDidAuthVp?: DidAuthVpSigner;
        }): Promise<RecoveryResult> {
            const { token, providerType, input, didFromPrivateKey, signDidAuthVp } = params;

            let recoveryShare: string;
            let recoveryShareVersion: number | undefined;

            // Step 1: Decrypt the recovery share based on method
            switch (input.method) {
                case 'passkey': {
                    const result = await fetchRecoveryShare(
                        serverUrl,
                        token,
                        providerType,
                        'passkey',
                        input.credentialId,
                        tenantId
                    );

                    if (!result?.encryptedShare) {
                        throw new Error('No passkey recovery share found');
                    }

                    recoveryShare = await decryptShareWithPasskey({
                        encryptedData: result.encryptedShare.encryptedData,
                        iv: result.encryptedShare.iv,
                        credentialId: input.credentialId,
                    });

                    recoveryShareVersion = result.shareVersion;
                    break;
                }

                case 'phrase': {
                    const isValid = await validateRecoveryPhrase(input.phrase);

                    if (!isValid) {
                        throw new Error('Invalid recovery phrase');
                    }

                    recoveryShare = await recoveryPhraseToShare(input.phrase);

                    // Fetch the phrase method's shareVersion so we pair with
                    // the correct historical auth share.
                    try {
                        const phraseRecord = await fetchRecoveryShare(
                            serverUrl,
                            token,
                            providerType,
                            'phrase',
                            undefined,
                            tenantId
                        );

                        recoveryShareVersion = phraseRecord?.shareVersion;
                    } catch {
                        // Server may not have a phrase record (legacy setup).
                        // Fall through with undefined version → uses latest auth share.
                    }

                    break;
                }

                case 'backup': {
                    const backup: BackupFile = JSON.parse(input.fileContents);

                    if (backup.version !== 1) {
                        throw new Error('Unsupported backup file version');
                    }

                    recoveryShare = await decryptWithPassword(
                        backup.encryptedShare.ciphertext,
                        backup.encryptedShare.iv,
                        backup.encryptedShare.salt,
                        input.password,
                        backup.encryptedShare.kdfParams
                    );

                    recoveryShareVersion = backup.shareVersion;
                    break;
                }

                case 'email': {
                    // The email share may be versioned: "<version>:<hexShare>"
                    const parsed = parseVersionedEmailShare(input.emailShare.trim());
                    recoveryShare = parsed.share;
                    recoveryShareVersion = parsed.version;
                    break;
                }
            }

            // Step 2: Fetch auth share and reconstruct private key.
            // If the recovery method has a shareVersion, fetch that specific
            // auth share version from the server (it may be in previousAuthShares).
            const serverData = await fetchAuthShareRaw(
                serverUrl,
                token,
                providerType,
                recoveryShareVersion,
                tenantId
            );

            if (!serverData?.authShare) {
                throw new Error('No auth share found on server');
            }

            const authShareStr =
                typeof serverData.authShare === 'object'
                    ? serverData.authShare.encryptedData
                    : serverData.authShare;

            let privateKey: string;
            try {
                privateKey = await reconstructFromShares([recoveryShare, authShareStr]);
            } catch {
                throw new Error(
                    'Recovery produced an incorrect key. ' +
                        'The recovery key may be outdated. Please try a different recovery method.'
                );
            }

            const primaryDid = serverData.primaryDid || '';

            // Step 2b: Validate the reconstructed key BEFORE rotating.
            // A stale or wrong recovery share will reconstruct garbage.
            // Rotating garbage would overwrite the server's auth share, permanently
            // corrupting the user's recovery state.
            if (primaryDid && didFromPrivateKey) {
                const derivedDid = await didFromPrivateKey(privateKey);

                if (derivedDid && derivedDid !== primaryDid) {
                    throw new Error(
                        'Recovery produced an incorrect key. ' +
                            'The recovery key may be outdated. Please try a different recovery method.'
                    );
                }
            }

            // Step 3: Re-split and persist both sides atomically. The old auth
            // share remains in server history, so existing versioned recovery
            // methods continue to work while this device advances to a fresh pair.
            const { shares, shareVersion } = await persistSharesAtomically(
                privateKey,
                serverUrl,
                token,
                providerType,
                primaryDid,
                storage,
                activeStorageId,
                didFromPrivateKey,
                signDidAuthVp,
                tenantId,
                recordPromotion(primaryDid),
                captureActiveUserGuard()
            );

            lastEmailShare = shares.emailShare;
            lastShareVersion = shareVersion;
            lastServerSnapshot = {
                currentVersion: shareVersion,
                resolvedVersion: shareVersion,
                authShare: shares.authShare,
                primaryDid,
            };

            return { privateKey, did: primaryDid };
        },

        // --- Recovery setup ---

        async setupRecoveryMethod(params: {
            token: string;
            providerType: AuthProviderType;
            privateKey: string;
            input: RecoverySetupInput;
            authUser?: AuthUser;
            signDidAuthVp?: DidAuthVpSigner;
        }): Promise<RecoverySetupResult> {
            const { token, providerType, privateKey, input, authUser, signDidAuthVp } = params;

            // Passkey pre-flight: create the credential and verify PRF support
            // BEFORE any split/store/email work. If PRF isn't available, fail
            // cleanly without side effects (no version bump, no email re-send).
            let passkeyCredential: PasskeyCredential | undefined;

            if (input.method === 'passkey') {
                if (!isWebAuthnSupported()) {
                    throw new Error('WebAuthn is not supported in this browser');
                }

                const userId = authUser?.id || '';
                const userName = authUser?.email || authUser?.phone || authUser?.id || '';

                passkeyCredential = await createPasskeyCredential(userId, userName);
            }

            const serverData = await fetchAuthShareRaw(
                serverUrl,
                token,
                providerType,
                undefined,
                tenantId
            );
            const primaryDid = serverData?.primaryDid || '';

            if (!primaryDid) throw new Error('Cannot set up recovery without a primary DID');

            // Every recovery-method setup rotates device+auth shares through
            // the verified atomic path. A failed server write restores the
            // previous device share; an ack-loss skew is repaired on login.
            const { shares, shareVersion } = await persistSharesAtomically(
                privateKey,
                serverUrl,
                token,
                providerType,
                primaryDid,
                storage,
                activeStorageId,
                undefined,
                signDidAuthVp,
                tenantId,
                recordPromotion(primaryDid),
                captureActiveUserGuard()
            );

            lastEmailShare = shares.emailShare;
            lastShareVersion = shareVersion;
            lastServerSnapshot = {
                currentVersion: shareVersion,
                resolvedVersion: shareVersion,
                authShare: shares.authShare,
                primaryDid,
            };

            switch (input.method) {
                case 'passkey': {
                    // passkeyCredential was created in the pre-flight block above
                    // (before any split/store work) so PRF is already validated.
                    const credential = passkeyCredential!;

                    const encryptedShare = await encryptShareWithPasskey(
                        shares.recoveryShare,
                        credential.credentialId
                    );

                    await postRecoveryMethod(
                        serverUrl,
                        token,
                        providerType,
                        {
                            type: 'passkey',
                            encryptedShare: {
                                encryptedData: encryptedShare.encryptedData,
                                iv: encryptedShare.iv,
                            },
                            credentialId: credential.credentialId,
                            shareVersion,
                        },
                        signDidAuthVp
                            ? await requestFreshDidAuthVp(
                                  serverUrl,
                                  privateKey,
                                  primaryDid,
                                  signDidAuthVp,
                                  tenantId
                              )
                            : undefined,
                        tenantId
                    );

                    await postRecoveryConfirmation(
                        serverUrl,
                        token,
                        providerType,
                        { type: 'passkey', credentialId: credential.credentialId },
                        signDidAuthVp
                            ? await requestFreshDidAuthVp(
                                  serverUrl,
                                  privateKey,
                                  primaryDid,
                                  signDidAuthVp,
                                  tenantId
                              )
                            : undefined,
                        tenantId
                    );

                    return { method: 'passkey', credentialId: credential.credentialId };
                }

                case 'phrase': {
                    const phrase = await shareToRecoveryPhrase(shares.recoveryShare);

                    // Register phrase on the server so getAvailableRecoveryMethods
                    // includes it and we can look up the shareVersion during recovery.
                    // No encryptedShare — the user holds the phrase directly.
                    await postRecoveryMethod(
                        serverUrl,
                        token,
                        providerType,
                        {
                            type: 'phrase',
                            shareVersion,
                        },
                        signDidAuthVp
                            ? await requestFreshDidAuthVp(
                                  serverUrl,
                                  privateKey,
                                  primaryDid,
                                  signDidAuthVp,
                                  tenantId
                              )
                            : undefined,
                        tenantId
                    );

                    const challengeWordIndices = selectRecoveryPhraseChallengeIndices(
                        phrase.split(/\s+/).length
                    );
                    pendingPhraseConfirmation = { phrase, challengeWordIndices };

                    return { method: 'phrase', phrase, challengeWordIndices };
                }

                case 'backup': {
                    const encrypted = await encryptWithPassword(
                        shares.recoveryShare,
                        input.password
                    );

                    const backupFile: BackupFile = {
                        version: 1,
                        createdAt: new Date().toISOString(),
                        primaryDid: input.did,
                        shareVersion,
                        shareChecksum: await calculateShareChecksum(shares.recoveryShare),
                        encryptedShare: {
                            ciphertext: encrypted.ciphertext,
                            iv: encrypted.iv,
                            salt: encrypted.salt,
                            kdfParams: encrypted.kdfParams,
                        },
                    };

                    // Register backup on the server so getAvailableRecoveryMethods
                    // includes it. No encryptedShare — the file is self-contained.
                    await postRecoveryMethod(
                        serverUrl,
                        token,
                        providerType,
                        {
                            type: 'backup',
                            shareVersion,
                        },
                        signDidAuthVp
                            ? await requestFreshDidAuthVp(
                                  serverUrl,
                                  privateKey,
                                  primaryDid,
                                  signDidAuthVp,
                                  tenantId
                              )
                            : undefined,
                        tenantId
                    );

                    pendingBackupConfirmation = {
                        backupFile,
                        recoveryShare: shares.recoveryShare,
                    };

                    return { method: 'backup', backupFile };
                }

                case 'email': {
                    const didAuthVp = signDidAuthVp
                        ? await requestFreshDidAuthVp(
                              serverUrl,
                              privateKey,
                              primaryDid,
                              signDidAuthVp,
                              tenantId
                          )
                        : undefined;

                    await sendEmailBackupShare(
                        serverUrl,
                        token,
                        providerType,
                        shares.emailShare,
                        input.email,
                        escrowRelayPublicKey,
                        escrowRelayKeyId,
                        emailBranding,
                        shareVersion,
                        didAuthVp,
                        tenantId
                    );

                    return { method: 'email' };
                }
            }
        },

        async confirmRecoveryMethod(params: {
            token: string;
            providerType: AuthProviderType;
            privateKey: string;
            input: RecoveryConfirmationInput;
            signDidAuthVp?: DidAuthVpSigner;
        }): Promise<void> {
            const { token, providerType, privateKey, input, signDidAuthVp } = params;
            const primaryDid = lastServerSnapshot?.primaryDid;

            if (!primaryDid) throw new Error('Cannot confirm recovery without a primary DID');

            const confirmationBody: Record<string, unknown> = { type: input.method };

            if (input.method === 'phrase') {
                const pending = pendingPhraseConfirmation;

                if (!pending) throw new Error('Generate a new recovery phrase to continue');

                const phraseWords = pending.phrase.trim().toLowerCase().split(/\s+/);
                const matches =
                    input.challengeWords.length === pending.challengeWordIndices.length &&
                    pending.challengeWordIndices.every(
                        (wordIndex, answerIndex) =>
                            input.challengeWords[answerIndex]?.trim().toLowerCase() ===
                            phraseWords[wordIndex]
                    );

                if (!matches) {
                    throw new Error('Those words do not match. Check your phrase and try again.');
                }
            } else if (input.method === 'backup') {
                const pending = pendingBackupConfirmation;

                if (!pending) throw new Error('Generate a new backup file to continue');

                let suppliedBackup: BackupFile;
                let decryptedShare: string;

                try {
                    suppliedBackup = JSON.parse(input.fileContents) as BackupFile;
                    decryptedShare = await decryptWithPassword(
                        suppliedBackup.encryptedShare.ciphertext,
                        suppliedBackup.encryptedShare.iv,
                        suppliedBackup.encryptedShare.salt,
                        input.password,
                        suppliedBackup.encryptedShare.kdfParams
                    );
                } catch {
                    throw new Error('Incorrect password or corrupted data. Please try again.');
                }

                const checksum = await calculateShareChecksum(decryptedShare);

                if (
                    suppliedBackup.shareChecksum !== checksum ||
                    pending.backupFile.shareChecksum !== checksum ||
                    decryptedShare !== pending.recoveryShare
                ) {
                    throw new Error('This backup file could not be verified. Please try again.');
                }
            } else {
                confirmationBody.code = input.code;
            }

            const didAuthVp = signDidAuthVp
                ? await requestFreshDidAuthVp(
                      serverUrl,
                      privateKey,
                      primaryDid,
                      signDidAuthVp,
                      tenantId
                  )
                : undefined;

            await postRecoveryConfirmation(
                serverUrl,
                token,
                providerType,
                confirmationBody,
                didAuthVp,
                tenantId
            );

            if (input.method === 'phrase') pendingPhraseConfirmation = undefined;
            if (input.method === 'backup') pendingBackupConfirmation = undefined;
        },

        async getAvailableRecoveryMethods(
            token: string,
            providerType: AuthProviderType
        ): Promise<RecoveryMethodInfo[]> {
            try {
                const serverData = await fetchAuthShareRaw(
                    serverUrl,
                    token,
                    providerType,
                    undefined,
                    tenantId
                );
                const methods = (serverData?.recoveryMethods || []) as Array<
                    RecoveryMethodInfo & {
                        confirmedAt?: Date | string;
                        confirmationStatus?: 'pending' | 'confirmed';
                    }
                >;
                const activationState = serverData?.sssActivationState ?? 'active';

                return methods.filter(method => {
                    if (method.confirmedAt) return true;
                    if (method.confirmationStatus) return false;

                    return activationState === 'active';
                });
            } catch (e) {
                console.error('Error getting recovery methods:', e);
                return [];
            }
        },

        async startIdentityRecovery(email: string): Promise<void> {
            await postJson<{ success: true }>(
                `${serverUrl}/keys/recovery-session/start`,
                { email },
                buildHeaders('', undefined, tenantId)
            );
        },

        async verifyIdentityRecovery(
            email: string,
            code: string
        ): Promise<IdentityRecoverySession> {
            const result = await postJson<IdentityRecoverySessionResponse>(
                `${serverUrl}/keys/recovery-session/verify`,
                { email, code },
                buildHeaders('', undefined, tenantId)
            );

            return {
                ...result,
                recoveryMethods: result.recoveryMethods.map(method => ({
                    ...method,
                    createdAt: new Date(method.createdAt),
                })),
            };
        },

        async prepareIdentityRecovery(params): Promise<RecoveryResult> {
            const { input } = params;
            let recoveryShare: string | undefined;

            switch (input.method) {
                case 'passkey':
                    // Passkey decryption requires the encrypted server material.
                    break;
                case 'phrase':
                    if (!(await validateRecoveryPhrase(input.phrase))) {
                        throw new Error('Invalid recovery phrase');
                    }
                    recoveryShare = await recoveryPhraseToShare(input.phrase);
                    break;
                case 'backup': {
                    const backup = JSON.parse(input.fileContents) as BackupFile;
                    if (backup.version !== 1) throw new Error('Unsupported backup file version');
                    recoveryShare = await decryptWithPassword(
                        backup.encryptedShare.ciphertext,
                        backup.encryptedShare.iv,
                        backup.encryptedShare.salt,
                        input.password,
                        backup.encryptedShare.kdfParams
                    );
                    break;
                }
                case 'email':
                    recoveryShare = parseVersionedEmailShare(input.emailShare.trim()).share;
                    break;
            }

            try {
                const material = await postJson<IdentityRecoveryMaterialResponse>(
                    `${serverUrl}/keys/recovery-session/recover`,
                    {
                        recoverySessionToken: params.recoverySessionToken,
                        type: input.method,
                        ...(input.method === 'passkey' ? { credentialId: input.credentialId } : {}),
                    },
                    buildHeaders('', undefined, tenantId)
                );

                if (input.method === 'passkey') {
                    if (!material.encryptedShare) {
                        throw new Error('No passkey recovery data found');
                    }
                    recoveryShare = await decryptShareWithPasskey({
                        encryptedData: material.encryptedShare.encryptedData,
                        iv: material.encryptedShare.iv,
                        credentialId: input.credentialId,
                    });
                }

                if (!recoveryShare) throw new Error('Recovery data was empty');

                const authShare = material.authShare.encryptedData;
                let privateKey: string;

                try {
                    privateKey = await reconstructFromShares([recoveryShare, authShare]);
                } catch {
                    throw new Error(
                        'Recovery produced an incorrect key. Try another recovery method.'
                    );
                }

                const derivedDid = await params.didFromPrivateKey(privateKey);
                if (!derivedDid || derivedDid !== material.primaryDid) {
                    throw new Error(
                        'Recovery produced an incorrect key. Try another recovery method.'
                    );
                }

                pendingIdentityRecovery = {
                    privateKey,
                    primaryDid: material.primaryDid,
                    recoveryShare,
                    authShare,
                    rebindSessionToken: material.rebindSessionToken,
                };

                return { privateKey, did: material.primaryDid };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Identity recovery failed';

                throw new IdentityRecoverySessionConsumedError(message);
            }
        },

        hasPendingIdentityRecovery(): boolean {
            return Boolean(pendingIdentityRecovery);
        },

        cancelIdentityRecovery(): void {
            pendingIdentityRecovery = undefined;
        },

        async completeIdentityRecovery(params): Promise<RecoveryResult> {
            const pending = pendingIdentityRecovery;
            const signDidAuthVp = params.signDidAuthVp;

            if (!pending) throw new Error('No identity recovery is waiting for a new sign-in');
            if (!signDidAuthVp) {
                throw new Error('DID proof signing is required to bind a new sign-in');
            }

            const storageId = activeStorageId;
            const didAuthVp = await requestFreshDidAuthVp(
                serverUrl,
                pending.privateKey,
                pending.primaryDid,
                signDidAuthVp,
                tenantId
            );
            const previousDeviceShare = await storage.getDeviceShare(storageId);
            let shareVersion: number | undefined;
            const result = await atomicRecovery(
                pending.recoveryShare,
                pending.authShare,
                {
                    storeDevice: share => storage.storeDeviceShare(share, storageId),
                    clearDevice: () => storage.clearAllShares(storageId),
                    storeAuth: async share => {
                        const response = await postJson<{
                            shareVersion: number;
                            recoveryMethodsRequireConfirmation: string[];
                        }>(
                            `${serverUrl}/keys/recovery-session/rebind`,
                            {
                                recoverySessionToken: pending.rebindSessionToken,
                                providerType: params.providerType,
                                primaryDid: pending.primaryDid,
                                authShare: { encryptedData: share, encryptedDek: '', iv: '' },
                            },
                            {
                                ...buildHeaders('', didAuthVp, tenantId),
                                'X-Auth-Token': params.token,
                            }
                        );

                        shareVersion = response.shareVersion;
                    },
                },
                { previousDeviceShare: previousDeviceShare ?? undefined }
            );

            if (shareVersion === undefined) throw new Error('Server did not confirm the new share');

            await storage.storeShareVersion(shareVersion, storageId);
            lastEmailShare = result.newShares.emailShare;
            lastShareVersion = shareVersion;
            lastServerSnapshot = {
                currentVersion: shareVersion,
                resolvedVersion: shareVersion,
                authShare: result.newShares.authShare,
                primaryDid: pending.primaryDid,
            };
            pendingIdentityRecovery = undefined;

            return { privateKey: result.privateKey, did: pending.primaryDid };
        },

        // --- Contact method management ---

        async upgradeContactMethod(
            token: string,
            providerType: AuthProviderType,
            previousPhone: string,
            email: string,
            code: string
        ): Promise<{ customToken?: string }> {
            const res = await fetch(`${serverUrl}/keys/upgrade-contact-method`, {
                method: 'POST',
                headers: buildHeaders(token, undefined, tenantId),
                body: JSON.stringify({
                    authToken: token,
                    providerType,
                    previousPhone,
                    email,
                    code,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const message =
                    data?.error?.message || data?.message || 'Failed to upgrade contact method.';

                throw new Error(message);
            }

            const data = await res.json().catch(() => ({}));

            return { customToken: data?.customToken };
        },

        // --- Email backup ---

        async sendEmailBackupShare(
            token: string,
            providerType: AuthProviderType,
            _privateKey: string,
            email: string,
            didAuthVp?: string
        ): Promise<void> {
            if (!enableEmailBackupShare) return;

            if (!lastEmailShare) {
                console.warn(
                    'Cannot send email backup share: no cached email share from splitKey()'
                );
                return;
            }

            if (email) {
                await sendEmailBackupShare(
                    serverUrl,
                    token,
                    providerType,
                    lastEmailShare,
                    email,
                    escrowRelayPublicKey,
                    escrowRelayKeyId,
                    emailBranding,
                    lastShareVersion,
                    didAuthVp,
                    tenantId
                );
            } else {
                throw new Error('Enter a recovery email before sending a recovery key');
            }

            // Clear after use — one-shot to avoid stale data
            lastEmailShare = undefined;
            lastShareVersion = undefined;
        },

        // --- Share versioning ---

        async getLocalShareVersion(): Promise<number | null> {
            return storage.getShareVersion(activeStorageId);
        },

        async storeLocalShareVersion(version: number): Promise<void> {
            await storage.storeShareVersion(version, activeStorageId);
        },

        // --- Cleanup ---

        getPreservedStorageKeys(): string[] {
            return [SSS_DB_NAME];
        },

        async cleanup(): Promise<void> {
            // No additional cleanup beyond clearLocalKeys for SSS
        },
    };
}

export type { SSSKeyDerivationStrategy };
