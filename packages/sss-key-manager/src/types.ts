/**
 * SSS Key Manager Types
 */

export type ContactMethodType = 'email' | 'phone';

export interface ContactMethod {
    type: ContactMethodType;
    value: string;
}

export type AuthProviderType = 'firebase' | 'supertokens' | 'keycloak' | 'oidc';

export interface AuthProviderMapping {
    type: AuthProviderType;
    id: string;
}

export interface AuthUser {
    id: string;
    email?: string;
    phone?: string;
    providerType: AuthProviderType;
}

export interface AuthProvider {
    getIdToken(): Promise<string>;
    getCurrentUser(): Promise<AuthUser | null>;
    getProviderType(): AuthProviderType;
    signOut(): Promise<void>;
}

export type SecurityLevel = 'basic' | 'enhanced' | 'advanced';

export const SecurityLevels: readonly SecurityLevel[] = ['basic', 'enhanced', 'advanced'] as const;

export type RecoveryMethodType = 'password' | 'passkey' | 'backup' | 'phrase';

export interface RecoveryMethodInfo {
    type: RecoveryMethodType;
    createdAt: Date;
    credentialId?: string;
}

export interface PasswordRecoveryMethod {
    type: 'password';
    password: string;
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

export type RecoveryMethod = PasswordRecoveryMethod | PasskeyRecoveryMethod | BackupFileRecoveryMethod | RecoveryPhraseRecoveryMethod;

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

export interface SSSKeyManagerConfig {
    serverUrl: string;
    authProvider: AuthProvider;
    deviceStorageKey?: string;
}

export interface KeyDerivationProvider {
    readonly name: string;
    connect(): Promise<string>;
    disconnect(): Promise<void>;
    isInitialized(): boolean;
    hasLocalKey(): Promise<boolean>;
    canMigrate?(): Promise<boolean>;
    migrate?(privateKey: string): Promise<void>;
}

export interface SSSKeyDerivationProvider extends KeyDerivationProvider {
    addRecoveryMethod(method: RecoveryMethod): Promise<void>;
    getRecoveryMethods(): Promise<RecoveryMethodInfo[]>;
    recover(method: RecoveryMethod): Promise<string>;
    getSecurityLevel(): Promise<SecurityLevel>;
    exportBackup(password: string): Promise<BackupFile>;
}
