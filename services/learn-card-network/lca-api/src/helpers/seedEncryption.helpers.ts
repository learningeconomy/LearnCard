import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { DecryptCommand, GenerateDataKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { MongoServerError } from 'mongodb';

import { environment } from '@environment';
import type {
    EncryptedSigningAuthoritySeed,
    SeedEncryptionConfig,
    SeedEncryption,
    SeedEncryptionFailure,
    SigningAuthoritySeedIdentity,
    SigningAuthoritySeedRecord,
} from 'types/seed-encryption';

export const SA_SEED_ENCRYPTION_PURPOSE = 'lca-signing-authority-seed';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SEED_PATTERN = /^[a-fA-F0-9]{64}$/;

/** Deliberately contains no original exception/cause: SDK and Mongo errors can carry secrets. */
export class SeedEncryptionError extends Error {
    constructor(
        public readonly category: SeedEncryptionFailure,
        public readonly awsRequestId?: string
    ) {
        super('Signing authority key is unavailable.');
        this.name = 'SeedEncryptionError';
    }
}

const getKmsFailureCategory = (name?: string): SeedEncryptionFailure => {
    switch (name) {
        case 'AccessDeniedException':
            return 'kms_access_denied';
        case 'InvalidCiphertextException':
            return 'authentication_failed';
        case 'TimeoutError':
        case 'DependencyTimeoutException':
        case 'ThrottlingException':
        case 'KMSInternalException':
        case 'KeyUnavailableException':
        case 'DisabledException':
            return 'kms_unavailable';
        default:
            return 'kms_failed';
    }
};

const kmsFailure = (error: unknown): SeedEncryptionError => {
    const failure = error as { name?: string; $metadata?: { requestId?: string } } | undefined;
    const requestId = failure?.$metadata?.requestId;
    const safeRequestId = requestId && /^[\w-]{1,128}$/.test(requestId) ? requestId : undefined;
    const category = getKmsFailureCategory(failure?.name);
    return new SeedEncryptionError(category, safeRequestId);
};

/** Log only an allowlist of metadata; never pass the original error or document to a logger. */
export const logSeedEncryptionFailure = (
    error: unknown,
    operation: string,
    record?: { _id?: unknown; keyVersion?: unknown }
): void => {
    console.error({
        event: 'signing_authority_seed_failure',
        operation,
        recordId: record?._id?.toString(),
        keyVersion: ['kms-v1', 'local-v1'].includes(String(record?.keyVersion))
            ? record?.keyVersion
            : 'unknown',
        category: error instanceof SeedEncryptionError ? error.category : 'operation_failed',
        awsRequestId: error instanceof SeedEncryptionError ? error.awsRequestId : undefined,
        // Mongo messages/keyValue can contain the duplicate document or seed. Only log
        // the known error class and numeric server code (e.g. 11000 for duplicate keys).
        ...(error instanceof MongoServerError
            ? {
                  errorName: 'MongoServerError',
                  mongoCode: Number.isInteger(error.code) ? error.code : undefined,
              }
            : {}),
    });
};

export const getSeedIdentity = (record: {
    _id?: unknown;
    ownerDid: string;
    name: string;
    did?: string;
}): SigningAuthoritySeedIdentity => {
    if (
        !record._id ||
        typeof record.ownerDid !== 'string' ||
        typeof record.name !== 'string' ||
        (record.did !== undefined && typeof record.did !== 'string')
    ) {
        throw new SeedEncryptionError('invalid_record');
    }
    return {
        _id: String(record._id),
        ownerDid: record.ownerDid,
        name: record.name,
        did: record.did,
    };
};

const getContext = (
    identity: SigningAuthoritySeedIdentity,
    keyVersion: string
): Record<string, string> => ({
    purpose: SA_SEED_ENCRYPTION_PURPOSE,
    recordId: identity._id,
    identity: createHash('sha256')
        .update(JSON.stringify([identity.ownerDid, identity.name, identity.did ?? null]))
        .digest('hex'),
    keyVersion,
});

const decodeBase64 = (encoded: string, minimum: number): Buffer => {
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length < minimum || bytes.toString('base64') !== encoded) {
        throw new SeedEncryptionError('invalid_envelope');
    }
    return bytes;
};

const seal = (plaintext: Buffer, key: Buffer, aad: Buffer): string => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_LENGTH });
    cipher.setAAD(aad);
    return Buffer.concat([
        iv,
        cipher.update(plaintext),
        cipher.final(),
        cipher.getAuthTag(),
    ]).toString('base64');
};

const open = (encoded: string, key: Buffer, aad: Buffer): Buffer => {
    const bytes = decodeBase64(encoded, IV_LENGTH + TAG_LENGTH + 1);
    let plaintextChunk: Buffer | undefined;
    let finalChunk: Buffer | undefined;
    try {
        const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, IV_LENGTH), {
            authTagLength: TAG_LENGTH,
        });
        decipher.setAAD(aad);
        decipher.setAuthTag(bytes.subarray(-TAG_LENGTH));
        plaintextChunk = decipher.update(bytes.subarray(IV_LENGTH, -TAG_LENGTH));
        finalChunk = decipher.final();
        return Buffer.concat([plaintextChunk, finalChunk]);
    } catch {
        throw new SeedEncryptionError('authentication_failed');
    } finally {
        // The caller clears the returned copy; clear the originals even when final() rejects the tag.
        plaintextChunk?.fill(0);
        finalChunk?.fill(0);
    }
};

/** Absence means legacy only when ALL envelope fields are absent. Never downgrade corrupt envelopes. */
export const parseSeedEnvelope = (record: object): EncryptedSigningAuthoritySeed | undefined => {
    const value = record as Partial<EncryptedSigningAuthoritySeed>;
    if (!('keyVersion' in record) && !('encryptedSeed' in record) && !('encryptedDek' in record)) {
        return undefined;
    }
    if (
        (value.keyVersion !== 'kms-v1' && value.keyVersion !== 'local-v1') ||
        typeof value.encryptedSeed !== 'string' ||
        typeof value.encryptedDek !== 'string'
    ) {
        throw new SeedEncryptionError('invalid_envelope');
    }
    decodeBase64(value.encryptedSeed, IV_LENGTH + TAG_LENGTH + 1);
    decodeBase64(value.encryptedDek, 1);
    // Never return the source document: migration rows may still contain the plaintext seed.
    return {
        encryptedSeed: value.encryptedSeed,
        encryptedDek: value.encryptedDek,
        keyVersion: value.keyVersion,
    };
};

/** Create an envelope provider. A configured KMS key always wins; failures never select local mode. */
export const createSeedEncryption = (
    config: SeedEncryptionConfig,
    kms?: KMSClient
): SeedEncryption => {
    const keyVersion = config.kmsKeyArn ? 'kms-v1' : 'local-v1';
    let client = kms;
    const getClient = (): KMSClient => {
        // No SDK retry adds another KMS round-trip to an issuance request. Callers may retry 5xx.
        client ??= new KMSClient({
            maxAttempts: 1,
            requestHandler: {
                connectionTimeout: 2_000,
                requestTimeout: 5_000,
                throwOnRequestTimeout: true,
            },
        });
        return client;
    };
    const getLocalKek = (): Buffer => {
        if (!config.allowLocal || !config.localKek || !SEED_PATTERN.test(config.localKek)) {
            throw new SeedEncryptionError('configuration');
        }
        return Buffer.from(config.localKek, 'hex');
    };

    const encrypt = async (
        seed: string,
        identity: SigningAuthoritySeedIdentity
    ): Promise<EncryptedSigningAuthoritySeed> => {
        if (!SEED_PATTERN.test(seed)) throw new SeedEncryptionError('invalid_record');
        const context = getContext(identity, keyVersion);
        const aad = Buffer.from(JSON.stringify(context));
        const plaintext = Buffer.from(seed, 'utf8');
        let dek: Buffer | undefined;
        let kmsPlaintext: Uint8Array | undefined;
        let kek: Buffer | undefined;
        try {
            let encryptedDek: string;
            if (config.kmsKeyArn) {
                const result = await getClient()
                    .send(
                        new GenerateDataKeyCommand({
                            KeyId: config.kmsKeyArn,
                            KeySpec: 'AES_256',
                            EncryptionContext: context,
                        })
                    )
                    .catch(error => {
                        throw kmsFailure(error);
                    });
                kmsPlaintext = result.Plaintext;
                if (
                    kmsPlaintext?.length !== KEY_LENGTH ||
                    !result.CiphertextBlob?.length ||
                    result.KeyId !== config.kmsKeyArn
                ) {
                    throw new SeedEncryptionError('kms_failed');
                }
                dek = Buffer.from(kmsPlaintext);
                encryptedDek = Buffer.from(result.CiphertextBlob).toString('base64');
            } else {
                kek = getLocalKek();
                dek = randomBytes(KEY_LENGTH);
                encryptedDek = seal(dek, kek, Buffer.concat([aad, Buffer.from('/dek')]));
            }
            return { encryptedSeed: seal(plaintext, dek, aad), encryptedDek, keyVersion };
        } finally {
            plaintext.fill(0);
            dek?.fill(0);
            kmsPlaintext?.fill(0);
            kek?.fill(0);
        }
    };

    const decrypt = async (
        envelope: EncryptedSigningAuthoritySeed,
        identity: SigningAuthoritySeedIdentity
    ): Promise<string> => {
        parseSeedEnvelope(envelope);
        if (envelope.keyVersion !== keyVersion) throw new SeedEncryptionError('configuration');
        const context = getContext(identity, envelope.keyVersion);
        const aad = Buffer.from(JSON.stringify(context));
        let dek: Buffer | undefined;
        let kmsPlaintext: Uint8Array | undefined;
        let plaintext: Buffer | undefined;
        let kek: Buffer | undefined;
        try {
            if (config.kmsKeyArn) {
                const result = await getClient()
                    .send(
                        new DecryptCommand({
                            KeyId: config.kmsKeyArn,
                            CiphertextBlob: decodeBase64(envelope.encryptedDek, 1),
                            EncryptionContext: context,
                            EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
                        })
                    )
                    .catch(error => {
                        throw kmsFailure(error);
                    });
                kmsPlaintext = result.Plaintext;
                if (kmsPlaintext?.length !== KEY_LENGTH || result.KeyId !== config.kmsKeyArn) {
                    throw new SeedEncryptionError('kms_failed');
                }
                dek = Buffer.from(kmsPlaintext);
            } else {
                kek = getLocalKek();
                dek = open(envelope.encryptedDek, kek, Buffer.concat([aad, Buffer.from('/dek')]));
                if (dek.length !== KEY_LENGTH) throw new SeedEncryptionError('invalid_envelope');
            }
            plaintext = open(envelope.encryptedSeed, dek, aad);
            const seed = plaintext.toString('utf8');
            if (!SEED_PATTERN.test(seed)) throw new SeedEncryptionError('invalid_record');
            return seed;
        } finally {
            dek?.fill(0);
            kmsPlaintext?.fill(0);
            plaintext?.fill(0);
            kek?.fill(0);
        }
    };
    return { encrypt, decrypt };
};

export const seedEncryption = createSeedEncryption({
    kmsKeyArn: environment.SA_SEED_KMS_KEY_ARN,
    localKek: environment.SA_SEED_LOCAL_KEK,
    allowLocal: environment.IS_OFFLINE || environment.NODE_ENV === 'test',
});

/** Temporary dual reader; remove the legacy branch after the verified production migration. */
export const decryptSigningAuthoritySeed = async (
    record: SigningAuthoritySeedRecord
): Promise<string> => {
    const envelope = parseSeedEnvelope(record);
    if (envelope) return seedEncryption.decrypt(envelope, getSeedIdentity(record));
    if (!environment.SA_SEED_ALLOW_LEGACY_READ) throw new SeedEncryptionError('legacy_disabled');
    if (!record.seed || !SEED_PATTERN.test(record.seed))
        throw new SeedEncryptionError('invalid_record');
    return record.seed;
};

/** Non-secret cache fingerprint. Hash legacy seeds only during the compatibility window. */
export const getSeedCacheFingerprint = (record: SigningAuthoritySeedRecord): string => {
    const envelope = parseSeedEnvelope(record);
    if (!envelope && !environment.SA_SEED_ALLOW_LEGACY_READ) {
        throw new SeedEncryptionError('legacy_disabled');
    }
    return createHash('sha256')
        .update(
            JSON.stringify([
                String(record._id),
                record.ownerDid,
                record.name,
                record.did,
                envelope ?? record.seed,
            ])
        )
        .digest('hex');
};
