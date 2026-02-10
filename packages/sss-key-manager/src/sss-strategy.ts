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
} from './storage';
import { encryptWithPassword, decryptWithPassword, DEFAULT_KDF_PARAMS } from './crypto';
import { createPasskeyCredential, encryptShareWithPasskey, decryptShareWithPasskey, isWebAuthnSupported } from './passkey';
import { shareToRecoveryPhrase, recoveryPhraseToShare, validateRecoveryPhrase } from './recovery-phrase';

const SSS_DB_NAME = 'lcb-sss-keys';

export interface SSSStorageFunctions {
    storeDeviceShare: (share: string, id?: string) => Promise<void>;
    getDeviceShare: (id?: string) => Promise<string | null>;
    hasDeviceShare: (id?: string) => Promise<boolean>;
    clearAllShares: (id?: string) => Promise<void>;
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
};

// ---------------------------------------------------------------------------
// Server helpers (internal)
// ---------------------------------------------------------------------------

const buildHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
});

const fetchAuthShareRaw = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType
) => {
    const response = await fetch(`${serverUrl}/keys/auth-share`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ authToken: token, providerType }),
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
    primaryDid: string
) => {
    const response = await fetch(`${serverUrl}/keys/auth-share`, {
        method: 'PUT',
        headers: buildHeaders(token),
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
};

const fetchRecoveryShare = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    type: string,
    credentialId?: string
) => {
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
    body: Record<string, unknown>
) => {
    const response = await fetch(`${serverUrl}/keys/recovery`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ authToken: token, providerType, ...body }),
    });

    if (!response.ok) {
        throw new Error(`Failed to add recovery method: ${response.statusText}`);
    }
};

/**
 * Fire-and-forget: relay the email backup share through the server.
 * Non-fatal — logs a warning on failure but never throws.
 */
const sendEmailBackupShare = async (
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    emailShare: string,
    email: string
): Promise<void> => {
    try {
        const response = await fetch(`${serverUrl}/keys/email-backup`, {
            method: 'POST',
            headers: buildHeaders(token),
            body: JSON.stringify({ authToken: token, providerType, emailShare, email }),
        });

        if (!response.ok) {
            console.warn(`Email backup share delivery failed: ${response.statusText}`);
        }
    } catch (e) {
        console.warn('Email backup share delivery failed:', e);
    }
};

/**
 * After recovery, re-split the private key and store fresh shares.
 */
const rotateShares = async (
    privateKey: string,
    serverUrl: string,
    token: string,
    providerType: AuthProviderType,
    primaryDid: string,
    storage: SSSStorageFunctions,
    storageId?: string
) => {
    const { shares } = await splitAndVerify(privateKey);

    await storage.storeDeviceShare(shares.deviceShare, storageId);

    await putAuthShare(serverUrl, token, providerType, shares.authShare, primaryDid);
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
            const data = await fetchAuthShareRaw(serverUrl, token, providerType);

            if (!data) {
                return {
                    exists: false,
                    needsMigration: false,
                    primaryDid: null,
                    recoveryMethods: [],
                    authShare: null,
                };
            }

            const rawAuthShare = data.authShare;

            const authShareString = typeof rawAuthShare === 'object' && rawAuthShare !== null
                ? rawAuthShare.encryptedData ?? null
                : typeof rawAuthShare === 'string'
                    ? rawAuthShare
                    : null;

            return {
                exists: !!rawAuthShare || !!data.keyProvider || !!data.primaryDid,
                needsMigration: data.keyProvider === 'web3auth',
                primaryDid: data.primaryDid || null,
                recoveryMethods: data.recoveryMethods || [],
                authShare: authShareString,
            };
        },

        async storeAuthShare(
            token: string,
            providerType: AuthProviderType,
            authShare: string,
            primaryDid: string
        ): Promise<void> {
            await putAuthShare(serverUrl, token, providerType, authShare, primaryDid);
        },

        async markMigrated(token: string, providerType: AuthProviderType): Promise<void> {
            const response = await fetch(`${serverUrl}/keys/migrate`, {
                method: 'POST',
                headers: buildHeaders(token),
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
        }): Promise<RecoveryResult> {
            const { token, providerType, input } = params;

            let recoveryShare: string;

            // Step 1: Decrypt the recovery share based on method
            switch (input.method) {
                case 'password': {
                    const encryptedShare = await fetchRecoveryShare(serverUrl, token, providerType, 'password');

                    if (!encryptedShare?.salt) {
                        throw new Error('Invalid recovery share data');
                    }

                    recoveryShare = await decryptWithPassword(
                        encryptedShare.encryptedData,
                        encryptedShare.iv,
                        encryptedShare.salt,
                        input.password,
                        DEFAULT_KDF_PARAMS
                    );
                    break;
                }

                case 'passkey': {
                    const encryptedShare = await fetchRecoveryShare(
                        serverUrl, token, providerType, 'passkey', input.credentialId
                    );

                    recoveryShare = await decryptShareWithPasskey({
                        encryptedData: encryptedShare.encryptedData,
                        iv: encryptedShare.iv,
                        credentialId: input.credentialId,
                    });
                    break;
                }

                case 'phrase': {
                    const isValid = await validateRecoveryPhrase(input.phrase);

                    if (!isValid) {
                        throw new Error('Invalid recovery phrase');
                    }

                    recoveryShare = await recoveryPhraseToShare(input.phrase);
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
                    break;
                }
            }

            // Step 2: Fetch auth share and reconstruct private key
            const serverData = await fetchAuthShareRaw(serverUrl, token, providerType);

            if (!serverData?.authShare) {
                throw new Error('No auth share found on server');
            }

            const authShareStr = typeof serverData.authShare === 'object'
                ? serverData.authShare.encryptedData
                : serverData.authShare;

            const privateKey = await reconstructFromShares([recoveryShare, authShareStr]);

            const primaryDid = serverData.primaryDid || '';

            // Step 3: Rotate shares (re-split and store fresh device + auth shares)
            await rotateShares(privateKey, serverUrl, token, providerType, primaryDid, storage, activeStorageId);

            return { privateKey, did: primaryDid };
        },

        // --- Recovery setup ---

        async setupRecoveryMethod(params: {
            token: string;
            providerType: AuthProviderType;
            privateKey: string;
            input: RecoverySetupInput;
            authUser?: AuthUser;
        }): Promise<RecoverySetupResult> {
            const { token, providerType, privateKey, input, authUser } = params;

            // All setup methods start by re-splitting the key to get a fresh recovery share
            const { shares } = await splitAndVerify(privateKey);

            // Store new device + auth shares
            await storage.storeDeviceShare(shares.deviceShare, activeStorageId);

            const serverData = await fetchAuthShareRaw(serverUrl, token, providerType);
            const primaryDid = serverData?.primaryDid || '';

            await putAuthShare(serverUrl, token, providerType, shares.authShare, primaryDid);

            switch (input.method) {
                case 'password': {
                    const encrypted = await encryptWithPassword(shares.recoveryShare, input.password);

                    await postRecoveryMethod(serverUrl, token, providerType, {
                        type: 'password',
                        encryptedShare: {
                            encryptedData: encrypted.ciphertext,
                            iv: encrypted.iv,
                            salt: encrypted.salt,
                        },
                    });

                    return { method: 'password' };
                }

                case 'passkey': {
                    if (!isWebAuthnSupported()) {
                        throw new Error('WebAuthn is not supported in this browser');
                    }

                    const userId = authUser?.id || '';
                    const userName = authUser?.email || authUser?.phone || authUser?.id || '';

                    const credential = await createPasskeyCredential(userId, userName);

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
                    });

                    return { method: 'passkey', credentialId: credential.credentialId };
                }

                case 'phrase': {
                    const phrase = await shareToRecoveryPhrase(shares.recoveryShare);

                    return { method: 'phrase', phrase };
                }

                case 'backup': {
                    const encrypted = await encryptWithPassword(shares.recoveryShare, input.password);

                    const backupFile: BackupFile = {
                        version: 1,
                        createdAt: new Date().toISOString(),
                        primaryDid: input.did,
                        encryptedShare: {
                            ciphertext: encrypted.ciphertext,
                            iv: encrypted.iv,
                            salt: encrypted.salt,
                            kdfParams: encrypted.kdfParams,
                        },
                    };

                    return { method: 'backup', backupFile };
                }
            }
        },

        async getAvailableRecoveryMethods(
            token: string,
            providerType: AuthProviderType
        ): Promise<RecoveryMethodInfo[]> {
            try {
                const serverData = await fetchAuthShareRaw(serverUrl, token, providerType);
                return serverData?.recoveryMethods || [];
            } catch (e) {
                console.error('Error getting recovery methods:', e);
                return [];
            }
        },

        // --- Email backup ---

        async sendEmailBackupShare(
            token: string,
            providerType: AuthProviderType,
            privateKey: string,
            email: string
        ): Promise<void> {
            if (!enableEmailBackupShare) return;

            if (!email) {
                console.warn('Cannot send email backup share: no email address');
                return;
            }

            const { shares } = await splitAndVerify(privateKey);

            await sendEmailBackupShare(serverUrl, token, providerType, shares.emailShare, email);
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
