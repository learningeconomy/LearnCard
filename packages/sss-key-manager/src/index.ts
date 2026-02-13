/**
 * @learncard/sss-key-manager
 *
 * Shamir Secret Sharing key manager for LearnCard - replaces Web3Auth SFA
 */

export { SSSKeyManager, createSSSKeyManager } from './key-manager';
export { SSSApiClient } from './api-client';

export {
    splitPrivateKey,
    reconstructPrivateKey,
    reconstructFromShares,
    SSS_TOTAL_SHARES,
    SSS_THRESHOLD,
} from './sss';

export {
    storeDeviceShare,
    getDeviceShare,
    hasDeviceShare,
    deleteDeviceShare,
    clearAllShares,
    listAllDeviceShares,
    storeShareVersion,
    getShareVersion,
    isPublicComputerMode,
    setPublicComputerMode,
    createAdaptiveStorage,
} from './storage';

export type { DeviceShareEntry } from './storage';

export {
    encryptWithPassword,
    decryptWithPassword,
    deriveKeyFromPassword,
    generateEd25519PrivateKey,
    hexToBytes,
    bytesToHex,
    bufferToBase64,
    base64ToBuffer,
    DEFAULT_KDF_PARAMS,
} from './crypto';

export {
    createPasskeyCredential,
    deriveKeyFromPasskey,
    encryptShareWithPasskey,
    decryptShareWithPasskey,
    isWebAuthnSupported,
    isPRFSupported,
} from './passkey';

export type { PasskeyCredential, PasskeyEncryptedShare } from './passkey';

export {
    shareToRecoveryPhrase,
    recoveryPhraseToShare,
    generateRecoveryPhrase,
    validateRecoveryPhrase,
    countWords,
} from './recovery-phrase';

export type { RecoveryPhraseData } from './recovery-phrase';

export {
    splitAndVerify,
    atomicShareUpdate,
    verifyStoredShares,
    atomicRecovery,
    ShareVerificationError,
    AtomicUpdateError,
} from './atomic-operations';

export type {
    AtomicSplitResult,
    AtomicUpdateOptions,
    StorageOperations,
} from './atomic-operations';

export { createSSSStrategy } from './sss-strategy';

export type { SSSStorageFunctions, SSSStrategyConfig } from './sss-strategy';

export {
    generateEphemeralKeypair,
    encryptShareForTransfer,
    decryptShareFromTransfer,
} from './qr-crypto';

export type { EphemeralKeypair, EncryptedSharePayload } from './qr-crypto';

export {
    createQrLoginSession,
    pollQrLoginSession,
    pollUntilApproved,
    getQrLoginSessionInfo,
    approveQrLoginSession,
    notifyDevicesForQrSession,
} from './qr-login';

export type {
    QrLoginSession,
    QrLoginSessionInfo,
    QrLoginClientConfig,
    QrPayload,
    PollResult,
    NotifyDevicesResult,
} from './qr-login';

// Provider-agnostic interfaces are re-exported from @learncard/auth-types.
// Import from '@learncard/auth-types' or 'learn-card-base' for generic types.
// Import from this package for SSS-specific types.

export { AuthSessionError } from './types';

export type {
    SSSKeyManagerConfig,
    SSSKeyDerivationProvider,
    KeyDerivationProvider,
    KeyDerivationStrategy,
    SSSKeyDerivationStrategy,
    ServerKeyStatus,
    AuthProvider,
    AuthUser,
    AuthProviderType,
    ContactMethod,
    ContactMethodType,
    RecoveryMethod,
    RecoveryMethodType,
    RecoveryMethodInfo,
    RecoveryInput,
    RecoveryResult,
    RecoverySetupInput,
    RecoverySetupResult,
    PasskeyRecoveryMethod,
    BackupFileRecoveryMethod,
    RecoveryPhraseRecoveryMethod,
    SecurityLevel,
    BackupFile,
    EncryptedShare,
    ServerEncryptedShare,
    UserKeyRecord,
    AuthProviderMapping,
} from './types';
