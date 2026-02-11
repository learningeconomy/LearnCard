/**
 * SSS Key Manager - Main class
 */

import type {
    SSSKeyManagerConfig,
    SSSKeyDerivationProvider,
    RecoveryMethod,
    RecoveryMethodInfo,
    SecurityLevel,
    BackupFile,
    AuthProvider,
    RecoveryPhraseRecoveryMethod,
} from './types';

import { SSSApiClient } from './api-client';
import { splitPrivateKey, reconstructPrivateKey } from './sss';
import {
    storeDeviceShare,
    getDeviceShare,
    hasDeviceShare,
    deleteDeviceShare,
    clearAllShares,
} from './storage';
import {
    encryptWithPassword,
    decryptWithPassword,
    generateEd25519PrivateKey,
    DEFAULT_KDF_PARAMS,
} from './crypto';

import {
    createPasskeyCredential,
    encryptShareWithPasskey,
    decryptShareWithPasskey,
} from './passkey';

import {
    shareToRecoveryPhrase,
    recoveryPhraseToShare,
} from './recovery-phrase';

export class SSSKeyManager implements SSSKeyDerivationProvider {
    readonly name = 'sss';

    private config: SSSKeyManagerConfig;
    private apiClient: SSSApiClient;
    private initialized = false;
    private currentPrivateKey: string | null = null;

    constructor(config: SSSKeyManagerConfig) {
        this.config = config;
        this.apiClient = new SSSApiClient({
            serverUrl: config.serverUrl,
            authProvider: config.authProvider,
        });
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    async hasLocalKey(): Promise<boolean> {
        return hasDeviceShare(this.config.deviceStorageKey);
    }

    async connect(): Promise<string> {
        const deviceShare = await getDeviceShare(this.config.deviceStorageKey);

        if (!deviceShare) {
            throw new Error('No device share found. User needs to set up SSS or recover.');
        }

        const serverResponse = await this.apiClient.getAuthShare();

        if (!serverResponse || !serverResponse.authShare) {
            throw new Error('No auth share found on server. User may need to recover.');
        }

        if (serverResponse.keyProvider !== 'sss') {
            throw new Error('User has not migrated to SSS yet.');
        }

        const privateKey = await reconstructPrivateKey(
            deviceShare,
            serverResponse.authShare.encryptedData
        );

        this.currentPrivateKey = privateKey;
        this.initialized = true;

        return privateKey;
    }

    async disconnect(): Promise<void> {
        this.currentPrivateKey = null;
        this.initialized = false;
    }

    async setupNewKey(): Promise<string> {
        const privateKey = await generateEd25519PrivateKey();
        await this.setupWithKey(privateKey);
        return privateKey;
    }

    async setupWithKey(privateKey: string, primaryDid?: string): Promise<void> {
        const shares = await splitPrivateKey(privateKey);

        await storeDeviceShare(shares.deviceShare, this.config.deviceStorageKey);

        const did = primaryDid || `did:key:placeholder-${Date.now()}`;

        await this.apiClient.storeAuthShare({
            authShare: {
                encryptedData: shares.authShare,
                encryptedDek: '',
                iv: '',
            },
            primaryDid: did,
            securityLevel: 'basic',
        });

        this.currentPrivateKey = privateKey;
        this.initialized = true;
    }

    async migrate(privateKey: string): Promise<void> {
        await this.setupWithKey(privateKey);
        await this.apiClient.markMigrated();
    }

    async canMigrate(): Promise<boolean> {
        const serverResponse = await this.apiClient.getAuthShare();
        return serverResponse?.keyProvider === 'web3auth';
    }

    async addRecoveryMethod(method: RecoveryMethod): Promise<void> {
        if (!this.currentPrivateKey) {
            throw new Error('No active key. Connect first.');
        }

        const shares = await splitPrivateKey(this.currentPrivateKey);
        const recoveryShare = shares.recoveryShare;

        if (method.type === 'password') {
            const encrypted = await encryptWithPassword(recoveryShare, method.password);

            await this.apiClient.addRecoveryMethod({
                type: 'password',
                encryptedShare: {
                    encryptedData: encrypted.ciphertext,
                    iv: encrypted.iv,
                    salt: encrypted.salt,
                },
            });
        } else if (method.type === 'passkey') {
            const user = await this.config.authProvider.getCurrentUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const credential = await createPasskeyCredential(
                user.id,
                user.email || user.phone || user.id
            );

            const encryptedShare = await encryptShareWithPasskey(
                recoveryShare,
                credential.credentialId
            );

            await this.apiClient.addRecoveryMethod({
                type: 'passkey',
                encryptedShare: {
                    encryptedData: encryptedShare.encryptedData,
                    iv: encryptedShare.iv,
                },
                credentialId: credential.credentialId,
            });
        } else if (method.type === 'backup') {
            throw new Error('Use exportBackup() instead');
        }
    }

    async generateRecoveryPhrase(): Promise<string> {
        if (!this.currentPrivateKey) {
            throw new Error('No active key. Connect first.');
        }

        const shares = await splitPrivateKey(this.currentPrivateKey);
        const phrase = await shareToRecoveryPhrase(shares.recoveryShare);

        return phrase;
    }

    async getRecoveryMethods(): Promise<RecoveryMethodInfo[]> {
        const serverResponse = await this.apiClient.getAuthShare();
        return serverResponse?.recoveryMethods || [];
    }

    async recover(method: RecoveryMethod): Promise<string> {
        if (method.type === 'password') {
            const result = await this.apiClient.getRecoveryShare('password');

            if (!result?.encryptedShare?.salt) {
                throw new Error('No password recovery share found');
            }

            const recoveryShare = await decryptWithPassword(
                result.encryptedShare.encryptedData,
                result.encryptedShare.iv,
                result.encryptedShare.salt,
                method.password,
                DEFAULT_KDF_PARAMS
            );

            const serverResponse = await this.apiClient.getAuthShare();

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructPrivateKey(
                recoveryShare,
                serverResponse.authShare.encryptedData
            );

            const newShares = await splitPrivateKey(privateKey);
            await storeDeviceShare(newShares.deviceShare, this.config.deviceStorageKey);

            this.currentPrivateKey = privateKey;
            this.initialized = true;

            return privateKey;
        } else if (method.type === 'backup') {
            const backup: BackupFile = JSON.parse(method.fileContents);

            if (backup.version !== 1) {
                throw new Error('Unsupported backup file version');
            }

            const recoveryShare = await decryptWithPassword(
                backup.encryptedShare.ciphertext,
                backup.encryptedShare.iv,
                backup.encryptedShare.salt,
                method.password,
                backup.encryptedShare.kdfParams
            );

            const serverResponse = await this.apiClient.getAuthShare();

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructPrivateKey(
                recoveryShare,
                serverResponse.authShare.encryptedData
            );

            const newShares = await splitPrivateKey(privateKey);
            await storeDeviceShare(newShares.deviceShare, this.config.deviceStorageKey);

            this.currentPrivateKey = privateKey;
            this.initialized = true;

            return privateKey;
        } else if (method.type === 'passkey') {
            const result = await this.apiClient.getRecoveryShare('passkey', method.credentialId);

            if (!result?.encryptedShare) {
                throw new Error('No passkey recovery share found');
            }

            const recoveryShare = await decryptShareWithPasskey({
                encryptedData: result.encryptedShare.encryptedData,
                iv: result.encryptedShare.iv,
                credentialId: method.credentialId || '',
            });

            const serverResponse = await this.apiClient.getAuthShare();

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructPrivateKey(
                recoveryShare,
                serverResponse.authShare.encryptedData
            );

            const newShares = await splitPrivateKey(privateKey);
            await storeDeviceShare(newShares.deviceShare, this.config.deviceStorageKey);

            this.currentPrivateKey = privateKey;
            this.initialized = true;

            return privateKey;
        } else if (method.type === 'phrase') {
            const recoveryShare = await recoveryPhraseToShare(method.phrase);

            const serverResponse = await this.apiClient.getAuthShare();

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructPrivateKey(
                recoveryShare,
                serverResponse.authShare.encryptedData
            );

            const newShares = await splitPrivateKey(privateKey);
            await storeDeviceShare(newShares.deviceShare, this.config.deviceStorageKey);

            this.currentPrivateKey = privateKey;
            this.initialized = true;

            return privateKey;
        }

        throw new Error('Unknown recovery method');
    }

    async getSecurityLevel(): Promise<SecurityLevel> {
        const serverResponse = await this.apiClient.getAuthShare();
        return serverResponse?.securityLevel || 'basic';
    }

    async exportBackup(password: string): Promise<BackupFile> {
        if (!this.currentPrivateKey) {
            throw new Error('No active key. Connect first.');
        }

        const shares = await splitPrivateKey(this.currentPrivateKey);
        const encrypted = await encryptWithPassword(shares.recoveryShare, password);

        const serverResponse = await this.apiClient.getAuthShare();

        return {
            version: 1,
            createdAt: new Date().toISOString(),
            primaryDid: serverResponse?.primaryDid || 'unknown',
            encryptedShare: {
                ciphertext: encrypted.ciphertext,
                iv: encrypted.iv,
                salt: encrypted.salt,
                kdfParams: encrypted.kdfParams,
            },
        };
    }

    async clearLocalData(): Promise<void> {
        await deleteDeviceShare(this.config.deviceStorageKey);
        this.currentPrivateKey = null;
        this.initialized = false;
    }

    async deleteAccount(): Promise<void> {
        await this.apiClient.deleteUserKey();
        await clearAllShares();
        this.currentPrivateKey = null;
        this.initialized = false;
    }
}

export function createSSSKeyManager(config: SSSKeyManagerConfig): SSSKeyManager {
    return new SSSKeyManager(config);
}
