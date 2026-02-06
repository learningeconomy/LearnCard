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
} from './storage';

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

export type {
    SSSKeyManagerConfig,
    SSSKeyDerivationProvider,
    KeyDerivationProvider,
    AuthProvider,
    AuthUser,
    AuthProviderType,
    ContactMethod,
    ContactMethodType,
    RecoveryMethod,
    RecoveryMethodType,
    RecoveryMethodInfo,
    PasswordRecoveryMethod,
    PasskeyRecoveryMethod,
    BackupFileRecoveryMethod,
    SecurityLevel,
    BackupFile,
    EncryptedShare,
    ServerEncryptedShare,
    UserKeyRecord,
    AuthProviderMapping,
} from './types';
