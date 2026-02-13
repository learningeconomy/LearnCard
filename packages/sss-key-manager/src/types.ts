/**
 * SSS Key Manager Types
 *
 * Re-exports provider-agnostic interfaces from @learncard/auth-types
 * and defines SSS-specific types (recovery shapes, backup files, etc.).
 */

// ---------------------------------------------------------------------------
// Re-export provider-agnostic interfaces from @learncard/auth-types
// ---------------------------------------------------------------------------

export {
    AuthSessionError,
    type AuthProviderType,
    type AuthUser,
    type AuthProvider,
    type RecoveryMethodInfo,
    type RecoveryResult,
    type ServerKeyStatus,
    type KeyDerivationStrategy,
} from '@learncard/auth-types';

import type { AuthProvider, AuthProviderType, KeyDerivationStrategy, RecoveryMethodInfo } from '@learncard/auth-types';

// ---------------------------------------------------------------------------
// SSS-specific: Contact & auth provider mapping
// ---------------------------------------------------------------------------

export type ContactMethodType = 'email' | 'phone';

export interface ContactMethod {
    type: ContactMethodType;
    value: string;
}

export interface AuthProviderMapping {
    type: AuthProviderType;
    id: string;
}

// ---------------------------------------------------------------------------
// SSS-specific: Security levels
// ---------------------------------------------------------------------------

export type SecurityLevel = 'basic' | 'enhanced' | 'advanced';

export const SecurityLevels: readonly SecurityLevel[] = ['basic', 'enhanced', 'advanced'] as const;

// ---------------------------------------------------------------------------
// SSS-specific: Recovery method types
// ---------------------------------------------------------------------------

/**
 * SSS recovery method type identifiers.
 * These are the specific recovery methods supported by the SSS strategy.
 */
export type RecoveryMethodType = 'passkey' | 'backup' | 'phrase' | 'email';

export interface PasskeyRecoveryMethod {
    type: 'passkey';
    credentialId?: string;
}

export interface BackupFileRecoveryMethod {
    type: 'backup';
    fileContents: string;
    password: string;
}

export interface RecoveryPhraseRecoveryMethod {
    type: 'phrase';
    phrase: string;
}

/** @deprecated Use RecoveryInput instead. Kept for legacy SSSKeyManager class. */
export type RecoveryMethod = PasskeyRecoveryMethod | BackupFileRecoveryMethod | RecoveryPhraseRecoveryMethod;

/**
 * SSS-specific recovery input — what the user provides to recover their key.
 */
export type RecoveryInput =
    | { method: 'passkey'; credentialId: string }
    | { method: 'phrase'; phrase: string }
    | { method: 'backup'; fileContents: string; password: string }
    | { method: 'email'; emailShare: string };

/**
 * SSS-specific recovery setup input — what the user provides to set up a method.
 */
export type RecoverySetupInput =
    | { method: 'passkey' }
    | { method: 'phrase' }
    | { method: 'backup'; password: string; did: string };

/**
 * SSS-specific recovery setup result.
 */
export type RecoverySetupResult =
    | { method: 'passkey'; credentialId: string }
    | { method: 'phrase'; phrase: string }
    | { method: 'backup'; backupFile: BackupFile };

// ---------------------------------------------------------------------------
// SSS-specific: Share & encryption types
// ---------------------------------------------------------------------------

export interface EncryptedShare {
    encryptedData: string;
    iv: string;
    salt?: string;
}

export interface ServerEncryptedShare {
    encryptedData: string;
    encryptedDek: string;
    iv: string;
}

// ---------------------------------------------------------------------------
// SSS-specific: User key record & backup
// ---------------------------------------------------------------------------

export interface UserKeyRecord {
    contactMethod: ContactMethod;
    authProviders: AuthProviderMapping[];
    primaryDid: string;
    linkedDids: string[];
    keyProvider: 'web3auth' | 'sss';
    authShare?: ServerEncryptedShare;
    securityLevel: SecurityLevel;
    recoveryMethods: RecoveryMethodInfo[];
    migratedFromWeb3Auth: boolean;
    migratedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface BackupFile {
    version: 1;
    createdAt: string;
    primaryDid: string;
    shareVersion?: number;
    encryptedShare: {
        ciphertext: string;
        iv: string;
        salt: string;
        kdfParams: {
            algorithm: 'argon2id';
            timeCost: number;
            memoryCost: number;
            parallelism: number;
        };
    };
}

// ---------------------------------------------------------------------------
// SSS-specific: Key manager config
// ---------------------------------------------------------------------------

export interface SSSKeyManagerConfig {
    serverUrl: string;
    authProvider: AuthProvider;
    deviceStorageKey?: string;
}

// ---------------------------------------------------------------------------
// SSS-specific: Narrowed strategy type
// ---------------------------------------------------------------------------

/**
 * The SSS key derivation strategy — a KeyDerivationStrategy narrowed
 * with SSS-specific recovery input/output types.
 */
export type SSSKeyDerivationStrategy = KeyDerivationStrategy<RecoveryInput, RecoverySetupInput, RecoverySetupResult>;

// ---------------------------------------------------------------------------
// Legacy types (deprecated)
// ---------------------------------------------------------------------------

/** @deprecated Use KeyDerivationStrategy instead. Kept for legacy SSSKeyManager class. */
export interface KeyDerivationProvider {
    readonly name: string;
    connect(): Promise<string>;
    disconnect(): Promise<void>;
    isInitialized(): boolean;
    hasLocalKey(): Promise<boolean>;
    canMigrate?(): Promise<boolean>;
    migrate?(privateKey: string): Promise<void>;
}

/** @deprecated Use KeyDerivationStrategy instead. Kept for legacy SSSKeyManager class. */
export interface SSSKeyDerivationProvider extends KeyDerivationProvider {
    addRecoveryMethod(method: RecoveryMethod): Promise<void>;
    getRecoveryMethods(): Promise<RecoveryMethodInfo[]>;
    recover(method: RecoveryMethod): Promise<string>;
    getSecurityLevel(): Promise<SecurityLevel>;
    exportBackup(password: string): Promise<BackupFile>;
}
