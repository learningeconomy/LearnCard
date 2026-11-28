import { createHash } from 'node:crypto';
import { DecryptCommand, KMSClient } from '@aws-sdk/client-kms';
import {
    GetObjectCommand,
    GetObjectTaggingCommand,
    PutObjectTaggingCommand,
    S3Client,
} from '@aws-sdk/client-s3';
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

const errorName = (error: unknown): string =>
    (error as { name?: unknown } | null)?.name?.toString() ?? 'unknown';

const warn = (uid: string, event: string, error?: unknown): void => {
    console.warn({
        event,
        uidHash: createHash('sha256').update(uid).digest('hex').slice(0, 16),
        ...(error === undefined ? {} : { errorName: errorName(error) }),
    });
};

// Only a missing object means "no archive"; NoSuchBucket and other 404s are misconfiguration.
const isMissing = (error: unknown): boolean => errorName(error) === 'NoSuchKey';

export const isLegacyKeyArchiveEnabled = (): boolean =>
    environment.LEGACY_KEY_ARCHIVE_ENABLED === true;

const TAG_BUDGET_MS = 1_500;

const tagArchivedKey = async (uid: string, state: 'released' | 'exhausted'): Promise<void> => {
    const object = { Bucket: environment.LEGACY_KEY_ARCHIVE_BUCKET, Key: `uid/${uid}.json` };
    const abortSignal = AbortSignal.timeout(TAG_BUDGET_MS);
    try {
        const { s3: client } = getClients();
        // PutObjectTagging replaces the whole set, so merge to keep earlier lifecycle timestamps.
        const { TagSet = [] } = await client.send(new GetObjectTaggingCommand(object), {
            abortSignal,
        });
        const updates = { state, [`${state}At`]: new Date().toISOString() };
        await client.send(
            new PutObjectTaggingCommand({
                ...object,
                Tagging: {
                    TagSet: [
                        ...TagSet.filter(tag => !tag.Key || !(tag.Key in updates)),
                        ...Object.entries(updates).map(([Key, Value]) => ({ Key, Value })),
                    ],
                },
            }),
            { abortSignal }
        );
    } catch (error) {
        if (state !== 'exhausted' || !isMissing(error)) warn(uid, 'archived_key_tag_failed', error);
    }
};

export const markArchivedKeyExhausted = async (uid: string): Promise<void> => {
    if (isLegacyKeyArchiveEnabled()) await tagArchivedKey(uid, 'exhausted');
};

export const markArchivedKeyReleased = async (uid: string): Promise<void> => {
    if (isLegacyKeyArchiveEnabled()) await tagArchivedKey(uid, 'released');
};

/**
 * `missing` is returned only when S3 reports no object for this login. A record that exists
 * but cannot be released is `unusable`; storage and KMS failures throw.
 */
export type ArchivedKeyRelease =
    | { status: 'released'; privateKey: string; did: string }
    | { status: 'missing' }
    | { status: 'unusable' };

export const releaseArchivedKey = async (
    uid: string,
    expectedPrimaryDid?: string
): Promise<ArchivedKeyRelease> => {
    if (!isLegacyKeyArchiveEnabled()) return { status: 'unusable' };

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
            if (isMissing(error)) return { status: 'missing' };
            throw error;
        }
        objectBytes = await object.Body?.transformToByteArray();
        let parsed: unknown;
        try {
            parsed = JSON.parse(objectBytes ? new TextDecoder().decode(objectBytes) : 'null');
        } catch {
            warn(uid, 'archived_key_invalid_record');
            return { status: 'unusable' };
        }
        const result = recordValidator.safeParse(parsed);
        if (!result.success || result.data.uid !== uid) {
            warn(uid, 'archived_key_invalid_record');
            return { status: 'unusable' };
        }
        const record = result.data;
        ciphertext = Buffer.from(record.ciphertextB64, 'base64');
        if (!ciphertext.length || ciphertext.toString('base64') !== record.ciphertextB64) {
            warn(uid, 'archived_key_invalid_record');
            return { status: 'unusable' };
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
            return { status: 'unusable' };
        }
        // Share the backing buffer so finally clears it; immutable strings cannot be zeroed.
        const privateKey = Buffer.from(
            plaintext.buffer,
            plaintext.byteOffset,
            plaintext.byteLength
        ).toString('utf8');
        if (!/^[0-9a-f]{64}$/i.test(privateKey)) {
            warn(uid, 'archived_key_invalid_plaintext');
            return { status: 'unusable' };
        }
        const did = (await getEphemeralLearnCard(privateKey)).id.did();
        if (did !== record.did || (expectedPrimaryDid && did !== expectedPrimaryDid)) {
            warn(uid, 'archived_key_identity_mismatch');
            return { status: 'unusable' };
        }
        return { status: 'released', privateKey, did };
    } catch (error) {
        warn(uid, 'archived_key_release_failed', error);
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
