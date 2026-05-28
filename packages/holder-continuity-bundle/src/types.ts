import type { CredentialRecord } from '@learncard/types';

export type BundleContentType =
    | 'key-recovery-phrase'
    | 'key-private-seed'
    | 'key-jwks'
    | 'did-document'
    | 'credential'
    | 'presentation'
    | 'consent-record'
    | 'status-cache'
    | 'unknown-json'
    | 'index-record';

export type BundleEncryptionMode = 'argon2id-aes-256-gcm' | 'none';

export type JsonValue =
    | null
    | boolean
    | number
    | string
    | JsonValue[]
    | { [key: string]: JsonValue };

export type LearnCardBundleEntryMetadata = {
    id: string;
    type: BundleContentType;
    path: string;
    mediaType: string;
    sha256: string;
    encrypted: boolean;
    sourceUri?: string;
    credentialId?: string;
    indexRecordRef?: string;
    warnings?: string[];
};

export type LearnCardBundleManifest = {
    specVersion: '1.0.0';
    createdAt: string;
    primaryDid: string;
    walletName: 'LearnCard';
    encryption: {
        mode: BundleEncryptionMode;
        encryptedPayloads: boolean;
        envelope?: 'sss-key-manager-encryptWithPassword-v1';
        kdf?: 'argon2id';
        cipher?: 'AES-256-GCM';
    };
    contents: LearnCardBundleEntryMetadata[];
    warnings: string[];
    payloadSha256: string;
};

export type LearnCardBundleOptions = {
    password?: string;
    encrypt?: boolean;
    createdAt?: string;
    fetchStatusLists?: boolean;
};

export type ExportLearnCardBundleOptions = LearnCardBundleOptions & {
    out: string;
};

export type ReadLearnCardBundleOptions = {
    password?: string;
    decrypt?: boolean;
};

export type ImportLearnCardBundleOptions = ReadLearnCardBundleOptions & {
    wallet: LearnCardBundleWallet;
};

export type LearnCardBundleResult = {
    data: Buffer;
    manifest: LearnCardBundleManifest;
    warnings: string[];
};

export type ReadLearnCardBundleResult = {
    manifest: LearnCardBundleManifest;
    entries: Array<LearnCardBundleEntryMetadata & { content: string }>;
    warnings: string[];
};

export type ImportLearnCardBundleReport = {
    importedCredentials: number;
    importedPresentations: number;
    skipped: number;
    errors: Array<{ path: string; message: string }>;
    warnings: string[];
};

export type LearnCardBundleWallet = {
    id: {
        did: (method?: string) => string;
        keypair?: (algorithm?: 'ed25519' | 'secp256k1') => JsonValue;
    };
    invoke: {
        getKey?: () => string;
        resolveDid?: (did: string) => Promise<JsonValue>;
        getHolderExportMetadata?: () => Promise<JsonValue>;
        getConsentedContracts?: () => Promise<JsonValue>;
    };
    index: {
        LearnCloud: {
            get: (query?: Record<string, unknown>) => Promise<CredentialRecord[]>;
            add: (record: CredentialRecord) => Promise<unknown>;
        };
    };
    read: {
        get: (uri: string) => Promise<JsonValue | undefined>;
    };
    store: {
        LearnCloud: {
            upload?: (content: JsonValue) => Promise<string>;
            uploadEncrypted?: (content: JsonValue) => Promise<string>;
        };
    };
};

export type EncryptedPayloadEnvelope = {
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
