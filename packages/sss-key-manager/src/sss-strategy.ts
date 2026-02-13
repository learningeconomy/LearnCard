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
    RecoveryMethodInfo,
    BackupFile,
} from './types';

import { splitAndVerify, verifyStoredShares } from './atomic-operations';
import { reconstructFromShares } from './sss';
import {
    storeDeviceShare as defaultStoreDeviceShare,
    getDeviceShare as defaultGetDeviceShare,
    hasDeviceShare as defaultHasDeviceShare,
    clearAllShares as defaultClearAllShares,
    storeShareVersion as defaultStoreShareVersion,
    getShareVersion as defaultGetShareVersion,
} from './storage';
import { encryptWithPassword, decryptWithPassword } from './crypto';
import { createPasskeyCredential, encryptShareWithPasskey, decryptShareWithPasskey, isWebAuthnSupported, type PasskeyCredential } from './passkey';
import { shareToRecoveryPhrase, recoveryPhraseToShare, validateRecoveryPhrase } from './recovery-phrase';

const SSS_DB_NAME = 'lcb-sss-keys';

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
     * Whether to automatically send a backup share to the user's email
     * during key setup and recovery. The share is relayed through the server
     * but never persisted — fire-and-forget.
     *
     * Defaults to false. Controlled by VITE_ENABLE_EMAIL_BACKUP_SHARE env var.
     */
    enableEmailBackupShare?: boolean;
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

const buildHeaders = (token: string, didAuthVp?: string) => ({
    'Content-Type': 'application/json',
    ...(didAuthVp ? { Authorization: `Bearer ${didAuthVp}` } : {}),
});

const fetchAuthShareRaw = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    shareVersion?: number
) => {
    const response = await fetch(`${serverUrl}/keys/auth-share`, {
        method: 'POST',
        headers: buildHeaders(token),
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
    didAuthVp?: string
): Promise<{ shareVersion: number }> => {
    const response = await fetch(`${serverUrl}/keys/auth-share`, {
        method: 'PUT',
        headers: buildHeaders(token, didAuthVp),
        body: JSON.stringify({
            authToken: token,
            providerType,
            authShare: { encryptedData: authShare, encryptedDek: '', iv: '' },
            primaryDid,
            securityLevel: 'basic',
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to store auth share: ${response.statusText}`);
    }

    const data = await response.json();

    return { shareVersion: data.shareVersion ?? 1 };
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
    credentialId?: string
): Promise<RecoveryShareResponse> => {
    const params = new URLSearchParams({ type, providerType, authToken: token });

    if (credentialId) {
        params.set('credentialId', credentialId);
    }

    const response = await fetch(`${serverUrl}/keys/recovery?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`No ${type} recovery share found`);
    }

    return response.json();
};

const postRecoveryMethod = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    body: Record<string, unknown>,
    didAuthVp?: string
) => {
    const response = await fetch(`${serverUrl}/keys/recovery`, {
        method: 'POST',
        headers: buildHeaders(token, didAuthVp),
        body: JSON.stringify({ authToken: token, providerType, ...body }),
    });

    if (!response.ok) {
        throw new Error(`Failed to add recovery method: ${response.statusText}`);
    }
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
export const parseVersionedEmailShare = (input: string): { share: string; version: number | undefined } => {
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
    shareVersion?: number
): Promise<void> => {
    try {
        // Prepend the share version so the recovery flow can request the matching auth share
        const payload = shareVersion != null
            ? formatVersionedEmailShare(emailShare, shareVersion)
            : emailShare;

        const response = await fetch(`${serverUrl}/keys/email-backup`, {
            method: 'POST',
            headers: buildHeaders(token),
            body: JSON.stringify({ authToken: token, providerType, emailShare: payload, email }),
        });

        if (!response.ok) {
            console.warn(`Email backup share delivery failed: ${response.statusText}`);
        }
    } catch (e) {
        console.warn('Email backup share delivery failed:', e);
    }
};

/**
 * Send the email share to the user's verified recovery email (stored server-side).
 * The raw recovery email never leaves the server.
 */
const sendEmailShareToRecoveryEmail = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    emailShare: string,
    shareVersion?: number
): Promise<void> => {
    const payload = shareVersion != null
        ? formatVersionedEmailShare(emailShare, shareVersion)
        : emailShare;

    const response = await fetch(`${serverUrl}/keys/email-backup`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({
            authToken: token,
            providerType,
            emailShare: payload,
            useRecoveryEmail: true,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send recovery share to recovery email: ${response.statusText}`);
    }
};

/**
 * After recovery, re-split the private key and store fresh shares.
 *
 * SAFETY: When `didFromPrivateKey` is provided, the key is validated against
 * `primaryDid` BEFORE any writes. This prevents a wrong key from overwriting
 * the server's auth share and permanently corrupting recovery state.
 */
const rotateShares = async (
    privateKey: string,
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    primaryDid: string,
    storage: SSSStorageFunctions,
    storageId?: string,
    didFromPrivateKey?: (pk: string) => Promise<string>,
    didAuthVp?: string
) => {
    // Defensive DID check — refuse to rotate if the key is wrong
    if (primaryDid && didFromPrivateKey) {
        const derivedDid = await didFromPrivateKey(privateKey);

        if (derivedDid && derivedDid !== primaryDid) {
            throw new Error(
                'rotateShares: key does not match expected DID — refusing to overwrite server shares'
            );
        }
    }

    const { shares } = await splitAndVerify(privateKey);

    await storage.storeDeviceShare(shares.deviceShare, storageId);

    await putAuthShare(serverUrl, token, providerType, shares.authShare, primaryDid, didAuthVp);
};

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
    const { serverUrl, enableEmailBackupShare = false } = config;
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

    /**
     * Whether the user has a verified recovery email. Set during
     * `fetchServerKeyStatus()`. When true, `sendEmailBackupShare()`
     * routes the share to the recovery email instead of the primary.
     */
    let hasRecoveryEmail = false;

    return {
        name: 'sss',

        // --- User scoping ---

        setActiveUser(userId: string): void {
            activeStorageId = `sss-device-share:${userId}`;
        },

        // --- Key lifecycle ---

        async hasLocalKey(): Promise<boolean> {
            if (await storage.hasDeviceShare(activeStorageId)) return true;

            // Fallback: check legacy unscoped key for shares stored before per-user scoping
            if (activeStorageId) {
                return storage.hasDeviceShare();
            }

            return false;
        },

        async getLocalKey(): Promise<string | null> {
            const scoped = await storage.getDeviceShare(activeStorageId);

            if (scoped) return scoped;

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
            return storage.clearAllShares(activeStorageId);
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

        // --- Server communication ---

        async fetchServerKeyStatus(token: string, providerType: AuthProviderType): Promise<ServerKeyStatus> {
            // Pass the local device share's version so the server returns the matching auth share
            const localVersion = await storage.getShareVersion(activeStorageId);

            const data = await fetchAuthShareRaw(
                serverUrl, token, providerType,
                localVersion ?? undefined
            );

            if (!data) {
                // Reset — no server record means no recovery email either.
                // Prevents stale state from a previous user session.
                hasRecoveryEmail = false;

                return {
                    exists: false,
                    needsMigration: false,
                    primaryDid: null,
                    recoveryMethods: [],
                    authShare: null,
                    shareVersion: null,
                    maskedRecoveryEmail: null,
                };
            }

            const rawAuthShare = data.authShare;

            const authShareString = typeof rawAuthShare === 'object' && rawAuthShare !== null
                ? rawAuthShare.encryptedData ?? null
                : typeof rawAuthShare === 'string'
                    ? rawAuthShare
                    : null;

            const serverVersion = data.shareVersion ?? null;

            // Version repair: if the server knows the version but local storage
            // doesn't (e.g. account created before versioning was added), backfill
            // it so QR device-link transfers always include the version.
            if (serverVersion != null && localVersion == null) {
                storage.storeShareVersion(serverVersion, activeStorageId)
                    .catch(e => console.warn('SSS: failed to backfill local shareVersion', e));
            }

            // Cache whether a recovery email is set so sendEmailBackupShare
            // can route future shares to the recovery email instead of primary.
            hasRecoveryEmail = !!data.maskedRecoveryEmail;

            return {
                exists: !!rawAuthShare || !!data.keyProvider || !!data.primaryDid,
                needsMigration: data.keyProvider === 'web3auth',
                primaryDid: data.primaryDid || null,
                recoveryMethods: data.recoveryMethods || [],
                authShare: authShareString,
                shareVersion: serverVersion,
                maskedRecoveryEmail: data.maskedRecoveryEmail ?? null,
            };
        },

        async storeAuthShare(
            token: string,
            providerType: AuthProviderType,
            authShare: string,
            primaryDid: string,
            didAuthVp?: string
        ): Promise<void> {
            const { shareVersion } = await putAuthShare(serverUrl, token, providerType, authShare, primaryDid, didAuthVp);

            // Persist the version alongside the device share so we can request
            // the matching auth share on next login.
            await storage.storeShareVersion(shareVersion, activeStorageId);

            // Cache for the upcoming sendEmailBackupShare call
            lastShareVersion = shareVersion;
        },

        async markMigrated(token: string, providerType: AuthProviderType, didAuthVp?: string): Promise<void> {
            const response = await fetch(`${serverUrl}/keys/migrate`, {
                method: 'POST',
                headers: buildHeaders(token, didAuthVp),
                body: JSON.stringify({ authToken: token, providerType }),
            });

            if (!response.ok) {
                throw new Error(`Failed to mark migrated: ${response.statusText}`);
            }
        },

        // --- Recovery execution ---

        async executeRecovery(params: {
            token: string;
            providerType: AuthProviderType;
            input: RecoveryInput;
            didFromPrivateKey?: (privateKey: string) => Promise<string>;
        }): Promise<RecoveryResult> {
            const { token, providerType, input, didFromPrivateKey } = params;

            let recoveryShare: string;
            let recoveryShareVersion: number | undefined;

            // Step 1: Decrypt the recovery share based on method
            switch (input.method) {
                case 'passkey': {
                    const result = await fetchRecoveryShare(
                        serverUrl, token, providerType, 'passkey', input.credentialId
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
                            serverUrl, token, providerType, 'phrase'
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
                serverUrl, token, providerType,
                recoveryShareVersion
            );

            if (!serverData?.authShare) {
                throw new Error('No auth share found on server');
            }

            const authShareStr = typeof serverData.authShare === 'object'
                ? serverData.authShare.encryptedData
                : serverData.authShare;

            const privateKey = await reconstructFromShares([recoveryShare, authShareStr]);

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

            // Step 3: Store the recovery share as the new device share.
            // Since recoveryShare + authShare = privateKey (just proven above),
            // we can reuse the recovery share as a valid device share.
            // This avoids re-splitting, which would overwrite the server's auth
            // share and invalidate ALL other recovery methods.
            await storage.storeDeviceShare(recoveryShare, activeStorageId);

            // Persist the share version so future logins fetch the matching auth share.
            // Use the recovery method's version if available, otherwise the server's current version.
            const versionToStore = recoveryShareVersion ?? serverData.shareVersion ?? 1;
            await storage.storeShareVersion(versionToStore, activeStorageId);

            return { privateKey, did: primaryDid };
        },

        // --- Recovery setup ---

        async setupRecoveryMethod(params: {
            token: string;
            providerType: AuthProviderType;
            privateKey: string;
            input: RecoverySetupInput;
            authUser?: AuthUser;
            signDidAuthVp?: (privateKey: string) => Promise<string>;
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

            // Sign DID-Auth VP once for all write operations in this method
            console.debug('[setupRecoveryMethod] step 1: signing VP, signDidAuthVp available:', !!signDidAuthVp);
            const vpJwt = signDidAuthVp ? await signDidAuthVp(privateKey) : undefined;
            console.debug('[setupRecoveryMethod] step 1 done, vpJwt:', vpJwt ? `${vpJwt.slice(0, 20)}...` : 'undefined');

            // All setup methods start by re-splitting the key to get a fresh recovery share
            console.debug('[setupRecoveryMethod] step 2: splitAndVerify');
            const { shares } = await splitAndVerify(privateKey);
            console.debug('[setupRecoveryMethod] step 2 done');

            // Cache the email share so sendEmailBackupShare can use it
            lastEmailShare = shares.emailShare;

            // Store new device + auth shares
            console.debug('[setupRecoveryMethod] step 3: storeDeviceShare');
            await storage.storeDeviceShare(shares.deviceShare, activeStorageId);
            console.debug('[setupRecoveryMethod] step 3 done');

            console.debug('[setupRecoveryMethod] step 4: fetchAuthShareRaw');
            const serverData = await fetchAuthShareRaw(serverUrl, token, providerType);
            const primaryDid = serverData?.primaryDid || '';
            console.debug('[setupRecoveryMethod] step 4 done, primaryDid:', primaryDid ? `${primaryDid.slice(0, 30)}...` : '(empty)');

            console.debug('[setupRecoveryMethod] step 5: putAuthShare');
            const { shareVersion } = await putAuthShare(serverUrl, token, providerType, shares.authShare, primaryDid, vpJwt);
            console.debug('[setupRecoveryMethod] step 5 done, shareVersion:', shareVersion);

            // Persist the new version alongside the device share
            await storage.storeShareVersion(shareVersion, activeStorageId);

            // Fire-and-forget: re-send email backup share so it stays in sync
            // with the new auth share. Skip for the 'email' method — that case
            // handles its own send to the recovery email exclusively.
            if (enableEmailBackupShare && input.method !== 'email' && lastEmailShare) {
                const resend = hasRecoveryEmail
                    ? sendEmailShareToRecoveryEmail(serverUrl, token, providerType, lastEmailShare, shareVersion)
                    : authUser?.email
                        ? sendEmailBackupShare(serverUrl, token, providerType, lastEmailShare, authUser.email, shareVersion)
                        : Promise.resolve();

                resend.catch(e => console.warn('Email backup share re-send failed (non-fatal):', e));

                lastEmailShare = undefined;
            }

            switch (input.method) {
                case 'passkey': {
                    // passkeyCredential was created in the pre-flight block above
                    // (before any split/store work) so PRF is already validated.
                    const credential = passkeyCredential!;

                    const encryptedShare = await encryptShareWithPasskey(
                        shares.recoveryShare,
                        credential.credentialId
                    );

                    await postRecoveryMethod(serverUrl, token, providerType, {
                        type: 'passkey',
                        encryptedShare: {
                            encryptedData: encryptedShare.encryptedData,
                            iv: encryptedShare.iv,
                        },
                        credentialId: credential.credentialId,
                        shareVersion,
                    }, vpJwt);

                    return { method: 'passkey', credentialId: credential.credentialId };
                }

                case 'phrase': {
                    const phrase = await shareToRecoveryPhrase(shares.recoveryShare);

                    // Register phrase on the server so getAvailableRecoveryMethods
                    // includes it and we can look up the shareVersion during recovery.
                    // No encryptedShare — the user holds the phrase directly.
                    await postRecoveryMethod(serverUrl, token, providerType, {
                        type: 'phrase',
                        shareVersion,
                    }, vpJwt);

                    return { method: 'phrase', phrase };
                }

                case 'backup': {
                    const encrypted = await encryptWithPassword(shares.recoveryShare, input.password);

                    const backupFile: BackupFile = {
                        version: 1,
                        createdAt: new Date().toISOString(),
                        primaryDid: input.did,
                        shareVersion,
                        encryptedShare: {
                            ciphertext: encrypted.ciphertext,
                            iv: encrypted.iv,
                            salt: encrypted.salt,
                            kdfParams: encrypted.kdfParams,
                        },
                    };

                    // Register backup on the server so getAvailableRecoveryMethods
                    // includes it. No encryptedShare — the file is self-contained.
                    await postRecoveryMethod(serverUrl, token, providerType, {
                        type: 'backup',
                        shareVersion,
                    }, vpJwt);

                    return { method: 'backup', backupFile };
                }

                case 'email': {
                    // Send the recovery share to the user's verified recovery email.
                    // The raw email address never leaves the server — we pass
                    // useRecoveryEmail: true so the server reads it from UserKey.
                    await sendEmailShareToRecoveryEmail(
                        serverUrl, token, providerType,
                        shares.emailShare, shareVersion
                    );

                    // Register email recovery on the server so
                    // getAvailableRecoveryMethods includes it.
                    await postRecoveryMethod(serverUrl, token, providerType, {
                        type: 'email',
                        shareVersion,
                    }, vpJwt);

                    // Future sendEmailBackupShare calls should route to
                    // the recovery email, not the primary.
                    hasRecoveryEmail = true;

                    return { method: 'email' };
                }
            }
        },

        async getAvailableRecoveryMethods(
            token: string,
            providerType: AuthProviderType
        ): Promise<RecoveryMethodInfo[]> {
            try {
                const serverData = await fetchAuthShareRaw(serverUrl, token, providerType);
                const methods = serverData?.recoveryMethods || [];

                // When email backup share is enabled (primary email), inject
                // an email recovery option so the user can recover from their
                // primary inbox. Skip if the server already has a registered
                // 'email' method (from a secondary recovery email setup).
                if (enableEmailBackupShare && !methods.some((m: RecoveryMethodInfo) => m.type === 'email')) {
                    methods.push({ type: 'email', createdAt: new Date() });
                }

                return methods;
            } catch (e) {
                console.error('Error getting recovery methods:', e);
                return [];
            }
        },

        // --- Email backup ---

        async sendEmailBackupShare(
            token: string,
            providerType: AuthProviderType,
            _privateKey: string,
            email: string
        ): Promise<void> {
            if (!enableEmailBackupShare) return;

            if (!lastEmailShare) {
                console.warn('Cannot send email backup share: no cached email share from splitKey()');
                return;
            }

            // When a recovery email is configured, send ONLY to the recovery
            // email — eliminates the primary-email single point of failure.
            if (hasRecoveryEmail) {
                await sendEmailShareToRecoveryEmail(
                    serverUrl, token, providerType, lastEmailShare, lastShareVersion
                );
            } else {
                if (!email) {
                    console.warn('Cannot send email backup share: no email address');
                    return;
                }

                await sendEmailBackupShare(serverUrl, token, providerType, lastEmailShare, email, lastShareVersion);
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
