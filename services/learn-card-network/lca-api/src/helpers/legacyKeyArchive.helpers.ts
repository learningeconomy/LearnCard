import { createHash } from 'node:crypto';
import { DecryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetObjectCommand, PutObjectTaggingCommand, S3Client } from '@aws-sdk/client-s3';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { environment } from '@environment';
import { getEphemeralLearnCard } from '@helpers/learnCard.helpers';

const recordValidator = z.object({
    version: z.literal(2),
    uid: z.string(),
    did: z.string().startsWith('did:key:'),
    ciphertextB64: z.string().min(1),
});

let s3: S3Client | undefined;
let kms: KMSClient | undefined;

const getClients = (): { s3: S3Client; kms: KMSClient } => {
    const options = {
        region: environment.LEGACY_KEY_ARCHIVE_KMS_KEY_ARN?.split(':')[3],
        maxAttempts: 3,
        retryMode: 'standard' as const,
        requestHandler: {
            connectionTimeout: 2_000,
            requestTimeout: 5_000,
            throwOnRequestTimeout: true,
        },
    };
    s3 ??= new S3Client(options);
    kms ??= new KMSClient(options);
    return { s3, kms };
};

const warn = (uid: string, event: string): void => {
    console.warn({ event, uidHash: createHash('sha256').update(uid).digest('hex').slice(0, 16) });
};

const isMissing = (error: unknown): boolean => {
    const failure = error as { name?: string; $metadata?: { httpStatusCode?: number } } | null;
    return failure?.name === 'NoSuchKey' || failure?.$metadata?.httpStatusCode === 404;
};

export const isLegacyKeyArchiveEnabled = (): boolean =>
    environment.LEGACY_KEY_ARCHIVE_ENABLED === true;

const tagArchivedKey = async (uid: string, state: 'released' | 'exhausted'): Promise<void> => {
    try {
        await getClients().s3.send(
            new PutObjectTaggingCommand({
                Bucket: environment.LEGACY_KEY_ARCHIVE_BUCKET,
                Key: `uid/${uid}.json`,
                Tagging: {
                    TagSet: [
                        { Key: 'state', Value: state },
                        { Key: `${state}At`, Value: new Date().toISOString() },
                    ],
                },
            })
        );
    } catch (error) {
        if (state !== 'exhausted' || !isMissing(error)) warn(uid, 'archived_key_tag_failed');
    }
};

export const markArchivedKeyExhausted = async (uid: string): Promise<void> => {
    if (isLegacyKeyArchiveEnabled()) await tagArchivedKey(uid, 'exhausted');
};

export const markArchivedKeyReleased = async (uid: string): Promise<void> => {
    if (isLegacyKeyArchiveEnabled()) await tagArchivedKey(uid, 'released');
};

export const releaseArchivedKey = async (
    uid: string,
    expectedPrimaryDid?: string
): Promise<{ privateKey: string; did: string } | null> => {
    if (!isLegacyKeyArchiveEnabled()) return null;

    let objectBytes: Uint8Array | undefined;
    let ciphertext: Buffer | undefined;
    let plaintext: Uint8Array | undefined;
    try {
        const clients = getClients();
        let object;
        try {
            object = await clients.s3.send(
                new GetObjectCommand({
                    Bucket: environment.LEGACY_KEY_ARCHIVE_BUCKET,
                    Key: `uid/${uid}.json`,
                })
            );
        } catch (error) {
            if (isMissing(error)) return null;
            throw error;
        }
        objectBytes = await object.Body?.transformToByteArray();
        let parsed: unknown;
        try {
            parsed = JSON.parse(objectBytes ? new TextDecoder().decode(objectBytes) : 'null');
        } catch {
            warn(uid, 'archived_key_invalid_record');
            return null;
        }
        const result = recordValidator.safeParse(parsed);
        if (!result.success || result.data.uid !== uid) {
            warn(uid, 'archived_key_invalid_record');
            return null;
        }
        const record = result.data;
        ciphertext = Buffer.from(record.ciphertextB64, 'base64');
        if (!ciphertext.length || ciphertext.toString('base64') !== record.ciphertextB64) {
            warn(uid, 'archived_key_invalid_record');
            return null;
        }
        const decrypted = await clients.kms.send(
            new DecryptCommand({
                KeyId: environment.LEGACY_KEY_ARCHIVE_KMS_KEY_ARN,
                CiphertextBlob: ciphertext,
                EncryptionContext: { purpose: 'lc-w3a-key-backup', uid, did: record.did },
            })
        );
        plaintext = decrypted.Plaintext;
        if (decrypted.KeyId !== environment.LEGACY_KEY_ARCHIVE_KMS_KEY_ARN || !plaintext) {
            warn(uid, 'archived_key_invalid_plaintext');
            return null;
        }
        // Share the backing buffer so finally clears it; immutable strings cannot be zeroed.
        const privateKey = Buffer.from(
            plaintext.buffer,
            plaintext.byteOffset,
            plaintext.byteLength
        ).toString('utf8');
        if (!/^[0-9a-f]{64}$/i.test(privateKey)) {
            warn(uid, 'archived_key_invalid_plaintext');
            return null;
        }
        const did = (await getEphemeralLearnCard(privateKey)).id.did();
        if (
            did !== record.did ||
            (expectedPrimaryDid !== undefined && did !== expectedPrimaryDid)
        ) {
            warn(uid, 'archived_key_identity_mismatch');
            return null;
        }
        return { privateKey, did };
    } catch {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'The archived key is unavailable. Please try again.',
        });
    } finally {
        objectBytes?.fill(0);
        ciphertext?.fill(0);
        plaintext?.fill(0);
    }
};
