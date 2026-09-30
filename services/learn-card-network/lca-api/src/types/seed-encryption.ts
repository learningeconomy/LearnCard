export interface SigningAuthoritySeedIdentity {
    _id: string;
    ownerDid: string;
    name: string;
    did?: string;
}

export interface EncryptedSigningAuthoritySeed {
    encryptedSeed: string;
    encryptedDek: string;
    keyVersion: 'kms-v1' | 'local-v1';
}

/** Untrusted persisted fields are validated before use, including on cache hits. */
export interface SigningAuthoritySeedRecord {
    _id?: unknown;
    ownerDid: string;
    name: string;
    did?: string;
    seed?: string;
    encryptedSeed?: unknown;
    encryptedDek?: unknown;
    keyVersion?: unknown;
}

export interface SeedEncryptionConfig {
    kmsKeyArn?: string;
    localKek?: string;
    allowLocal: boolean;
}

export interface SeedEncryption {
    encrypt: (
        seed: string,
        identity: SigningAuthoritySeedIdentity
    ) => Promise<EncryptedSigningAuthoritySeed>;
    decrypt: (
        envelope: EncryptedSigningAuthoritySeed,
        identity: SigningAuthoritySeedIdentity
    ) => Promise<string>;
}

export type SeedEncryptionFailure =
    | 'invalid_record'
    | 'invalid_envelope'
    | 'configuration'
    | 'legacy_disabled'
    | 'authentication_failed'
    | 'kms_access_denied'
    | 'kms_unavailable'
    | 'kms_failed';
