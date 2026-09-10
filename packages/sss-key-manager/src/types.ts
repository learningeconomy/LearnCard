/**
 * SSS Key Manager Types
 *
 * Re-exports provider-agnostic interfaces from @learncard/types
 * and defines SSS-specific types (recovery shapes, backup files, etc.).
 */

// ---------------------------------------------------------------------------
// Re-export provider-agnostic interfaces from @learncard/types
// ---------------------------------------------------------------------------

export {
    AuthSessionError,
    type AuthProviderType,
    type AuthUser,
    type AuthProvider,
    type RecoveryMethodInfo,
    type RecoveryResult,
    type IdentityRecoverySession,
    type ServerKeyStatus,
    type SssActivationState,
    type KeyDerivationStrategy,
    type DidAuthVpSigner,
    type EscrowEnrollmentOptions,
    type EscrowEnrollmentState,
    type EscrowPinStatus,
} from '@learncard/types';

import type {
    AuthProvider,
    AuthProviderType,
    KeyDerivationStrategy,
    RecoveryMethodInfo,
    SssActivationState,
} from '@learncard/types';

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
export type RecoveryMethodType = 'passkey' | 'backup' | 'phrase' | 'email' | 'escrow';

/** Trust policy for the enclave that receives recovery material. */
export type EscrowAttestationPolicy =
    | { mode: 'software'; pinnedPublicKeys: string[] }
    | { mode: 'nitro'; pinnedMeasurements: { imageSha384: string }[]; rootCertificatePem?: string };

/** Public status of an escrow recovery waiting period. */
export interface EscrowHoldStatus {
    holdId: string;
    releasePolicy: 'hold' | 'pin';
    status: 'pending' | 'cancelled' | 'completed' | 'expired';
    requestedAt: string;
    releaseAfter: string;
    cancelledAt?: string;
    completedAt?: string;
}

/** Persist these secrets securely until completion; a null token means an existing hold. */
export type EscrowRecoveryStart = EscrowHoldStatus & {
    resumeToken: string | null;
    clientEphemeralPrivateKey: string;
    pinSalt?: string;
};

/** A failed PIN attempt consumes its hold; another attempt must start a fresh hold. */
export class EscrowPinMismatchError extends Error {
    constructor(public readonly attemptsRemaining: number) {
        super('Incorrect PIN.');
        this.name = 'EscrowPinMismatchError';
    }
}

/** Temporary throttle: retry after cooldown with a fresh hold, never retry /complete. */
export class EscrowPinThrottledError extends Error {
    constructor() {
        super('Too many tries right now. Wait a minute and try again.');
        this.name = 'EscrowPinThrottledError';
    }
}

/** PIN recovery is exhausted; delayed escrow recovery remains available. */
export class EscrowPinLockedError extends Error {
    constructor() {
        super('Too many incorrect PIN attempts. You can still recover by waiting.');
        this.name = 'EscrowPinLockedError';
    }
}

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
export type RecoveryMethod =
    PasskeyRecoveryMethod | BackupFileRecoveryMethod | RecoveryPhraseRecoveryMethod;

/**
 * SSS-specific recovery input — what the user provides to recover their key.
 */
export type RecoveryInput =
    | { method: 'escrow-pin'; pin: string }
    | { method: 'escrow'; holdId: string; resumeToken: string; clientEphemeralPrivateKey: string }
    | { method: 'passkey'; credentialId: string }
    | { method: 'phrase'; phrase: string }
    | { method: 'backup'; fileContents: string; password: string }
    | { method: 'email'; emailShare: string };

/**
 * SSS-specific recovery setup input — what the user provides to set up a method.
 */
export type RecoverySetupInput =
    | { method: 'escrow'; pin?: string }
    | { method: 'passkey' }
    | { method: 'phrase' }
    | { method: 'backup'; password: string; did: string }
    | { method: 'email'; email: string };

/**
 * SSS-specific recovery setup result.
 */
export type RecoverySetupResult =
    | { method: 'escrow'; shareVersion: number }
    | { method: 'passkey'; credentialId: string }
    | { method: 'phrase'; phrase: string; challengeWordIndices: number[] }
    | { method: 'backup'; backupFile: BackupFile }
    | { method: 'email' };

/** Proof supplied after a pending recovery method has been created. */
export type RecoveryConfirmationInput =
    | { method: 'phrase'; challengeWords: string[] }
    | { method: 'backup'; fileContents: string; password: string }
    | { method: 'email'; code: string };

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
    sssActivationState?: SssActivationState;
    provisionalCreatedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface BackupFile {
    version: 1;
    createdAt: string;
    primaryDid: string;
    shareVersion?: number;
    /** SHA-256 checksum of the decrypted share, used to verify a just-written file. */
    shareChecksum?: string;
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
export type SSSKeyDerivationStrategy = KeyDerivationStrategy<
    RecoveryInput,
    RecoverySetupInput,
    RecoverySetupResult,
    RecoveryConfirmationInput
>;

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
