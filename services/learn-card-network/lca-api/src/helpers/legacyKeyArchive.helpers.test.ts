import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    environment: {
        LEGACY_KEY_ARCHIVE_ENABLED: true,
        LEGACY_KEY_ARCHIVE_BUCKET: 'archive-fixture',
        LEGACY_KEY_ARCHIVE_KMS_KEY_ARN: `arn:aws:kms:us-east-1:${'0'.repeat(12)}:key/fixture`,
    },
    s3: vi.fn(),
    kms: vi.fn(),
    card: vi.fn(),
}));
vi.mock('@environment', () => ({ environment: mocks.environment }));
vi.mock('@helpers/learnCard.helpers', () => ({ getEphemeralLearnCard: mocks.card }));
vi.mock('@aws-sdk/client-s3', async importOriginal => ({
    ...(await importOriginal<typeof import('@aws-sdk/client-s3')>()),
    S3Client: class {
        send = mocks.s3;
    },
}));
vi.mock('@aws-sdk/client-kms', async importOriginal => ({
    ...(await importOriginal<typeof import('@aws-sdk/client-kms')>()),
    KMSClient: class {
        send = mocks.kms;
    },
}));

import { GetObjectCommand, PutObjectTaggingCommand } from '@aws-sdk/client-s3';
import {
    markArchivedKeyExhausted,
    markArchivedKeyReleased,
    releaseArchivedKey,
} from './legacyKeyArchive.helpers';

const uid = 'verified-user';
const did = 'did:key:zFixture';
const privateKey = 'a'.repeat(64);
let record: Record<string, unknown>;
let plaintext: Buffer;

beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mocks.environment.LEGACY_KEY_ARCHIVE_ENABLED = true;
    record = { version: 2, uid, did, ciphertextB64: Buffer.from('encrypted').toString('base64') };
    plaintext = Buffer.from(privateKey);
    mocks.card.mockResolvedValue({ id: { did: () => did } });
    mocks.s3.mockImplementation(async command =>
        command instanceof GetObjectCommand
            ? { Body: { transformToByteArray: async () => Buffer.from(JSON.stringify(record)) } }
            : {}
    );
    mocks.kms.mockResolvedValue({
        KeyId: mocks.environment.LEGACY_KEY_ARCHIVE_KMS_KEY_ARN,
        Plaintext: plaintext,
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('archived legacy key release', () => {
    it('does not access AWS when disabled', async () => {
        mocks.environment.LEGACY_KEY_ARCHIVE_ENABLED = false;
        expect(await releaseArchivedKey(uid)).toBeNull();
        expect(mocks.s3).not.toHaveBeenCalled();
    });
    it('binds decryption to the verified identity, checks the seed and clears buffers', async () => {
        expect(await releaseArchivedKey(uid, did)).toEqual({ privateKey, did });
        expect(mocks.card).toHaveBeenCalledWith(privateKey);
        expect(mocks.kms.mock.calls[0]?.[0].input).toMatchObject({
            KeyId: mocks.environment.LEGACY_KEY_ARCHIVE_KMS_KEY_ARN,
            EncryptionContext: { purpose: 'lc-w3a-key-backup', uid, did },
        });
        expect(mocks.s3.mock.calls[0]?.[0].input).toEqual({
            Bucket: mocks.environment.LEGACY_KEY_ARCHIVE_BUCKET,
            Key: `uid/${uid}.json`,
        });
        expect(mocks.s3).toHaveBeenCalledTimes(1);
        expect(plaintext.every(byte => byte === 0)).toBe(true);
        expect(
            mocks.kms.mock.calls[0]?.[0].input.CiphertextBlob.every((byte: number) => byte === 0)
        ).toBe(true);
    });
    it.each([{ name: 'NoSuchKey' }, { $metadata: { httpStatusCode: 404 } }])(
        'returns unavailable for missing objects',
        async error => {
            mocks.s3.mockRejectedValueOnce(error);
            expect(await releaseArchivedKey(uid)).toBeNull();
            expect(mocks.kms).not.toHaveBeenCalled();
        }
    );
    it.each([{ uid: 'different-user' }, { version: 1 }, { ciphertextB64: '!' }])(
        'rejects invalid records %j',
        async patch => {
            Object.assign(record, patch);
            expect(await releaseArchivedKey(uid)).toBeNull();
            expect(mocks.kms).not.toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalledWith({
                event: 'archived_key_invalid_record',
                uidHash: expect.stringMatching(/^[a-f0-9]{16}$/),
            });
        }
    );
    it('rejects a DID that does not match the derived DID', async () => {
        record.did = 'did:key:zOther';
        expect(await releaseArchivedKey(uid)).toBeNull();
        expect(plaintext.every(byte => byte === 0)).toBe(true);
    });
    it('rejects a primary DID mismatch', async () => {
        expect(await releaseArchivedKey(uid, 'did:key:zOther')).toBeNull();
    });
    it('rejects a different KMS key', async () => {
        mocks.kms.mockResolvedValueOnce({ KeyId: 'wrong', Plaintext: plaintext });
        expect(await releaseArchivedKey(uid)).toBeNull();
        expect(plaintext.every(byte => byte === 0)).toBe(true);
    });
    it('rejects a malformed private key', async () => {
        plaintext.fill(120);
        expect(await releaseArchivedKey(uid)).toBeNull();
        expect(mocks.card).not.toHaveBeenCalled();
    });
    it('tags a released key best-effort', async () => {
        await markArchivedKeyReleased(uid);
        expect(mocks.s3.mock.calls[0]?.[0]).toBeInstanceOf(PutObjectTaggingCommand);
        expect(mocks.s3.mock.calls[0]?.[0].input.Tagging.TagSet).toEqual([
            { Key: 'state', Value: 'released' },
            { Key: 'releasedAt', Value: expect.any(String) },
        ]);
        mocks.s3.mockRejectedValueOnce(new Error('sensitive failure'));
        await expect(markArchivedKeyReleased(uid)).resolves.toBeUndefined();
    });
    it.each(['s3', 'kms'] as const)('sanitizes unexpected %s failures', async service => {
        mocks[service].mockRejectedValueOnce(new Error('sensitive failure'));
        await expect(releaseArchivedKey(uid)).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
            cause: undefined,
        });
    });
    it('tags exhaustion best-effort and silently ignores missing objects', async () => {
        await markArchivedKeyExhausted(uid);
        expect(mocks.s3.mock.calls[0]?.[0].input.Tagging.TagSet).toEqual([
            { Key: 'state', Value: 'exhausted' },
            { Key: 'exhaustedAt', Value: expect.any(String) },
        ]);
        mocks.s3.mockRejectedValueOnce({ name: 'NoSuchKey' });
        await expect(markArchivedKeyExhausted(uid)).resolves.toBeUndefined();
        expect(console.warn).not.toHaveBeenCalled();
        mocks.s3.mockRejectedValueOnce(new Error('sensitive failure'));
        await expect(markArchivedKeyExhausted(uid)).resolves.toBeUndefined();
        expect(console.warn).toHaveBeenCalledOnce();
    });
});
