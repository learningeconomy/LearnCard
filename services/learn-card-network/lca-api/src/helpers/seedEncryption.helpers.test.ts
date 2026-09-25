import { createDecipheriv, randomBytes } from 'node:crypto';
import { DecryptCommand, GenerateDataKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { MongoServerError } from 'mongodb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { environment } from '@environment';
import {
    createSeedEncryption,
    decryptSigningAuthoritySeed,
    logSeedEncryptionFailure,
    parseSeedEnvelope,
    SeedEncryptionError,
} from './seedEncryption.helpers';

const seed = 'a'.repeat(64);
const identity = {
    _id: 'authority-1',
    ownerDid: 'did:example:owner',
    name: 'main',
    did: 'did:key:example',
};
const local = { allowLocal: true, localKek: 'f'.repeat(64) };
const arn = 'arn:aws:kms:us-east-1:123456789012:key/11111111-1111-1111-1111-111111111111';
const originalLegacyRead = environment.SA_SEED_ALLOW_LEGACY_READ;

afterEach(() => {
    environment.SA_SEED_ALLOW_LEGACY_READ = originalLegacyRead;
    vi.restoreAllMocks();
});

describe('SA seed envelopes', () => {
    it('logs Mongo error codes without messages, key values, or document contents', () => {
        const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const error = new MongoServerError({ message: seed, code: 11000, keyValue: { seed } });
        logSeedEncryptionFailure(error, 'create', identity);
        expect(logger).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: 'create',
                errorName: 'MongoServerError',
                mongoCode: 11000,
            })
        );
        expect(JSON.stringify(logger.mock.calls)).not.toContain(seed);
        // Arbitrary exceptions cannot smuggle document contents through name/code.
        logSeedEncryptionFailure({ name: seed, code: seed, message: seed }, 'create', identity);
        expect(JSON.stringify(logger.mock.calls)).not.toContain(seed);
    });
    it('round trips locally with fresh DEKs, IVs, and ciphertext for each authority', async () => {
        const encryption = createSeedEncryption(local);
        const first = await encryption.encrypt(seed, identity);
        const second = await encryption.encrypt(seed, identity);
        expect(first).not.toEqual(second);
        expect(first.encryptedSeed).not.toBe(second.encryptedSeed);
        expect(first.encryptedDek).not.toBe(second.encryptedDek);
        expect(Buffer.from(first.encryptedSeed, 'base64').length).toBe(12 + 64 + 16);
        expect(await encryption.decrypt(first, identity)).toBe(seed);
        expect(await encryption.decrypt(second, identity)).toBe(seed);
        expect(JSON.stringify(first)).not.toContain(seed);
        expect(parseSeedEnvelope({ ...identity, seed, ...first })).toEqual(first);
    });

    it.each(['success', 'encryptedDek', 'encryptedSeed'] as const)(
        'clears intermediate plaintext buffers after decryption: %s',
        async outcome => {
            const encryption = createSeedEncryption(local);
            const envelope = await encryption.encrypt(seed, identity);
            if (outcome !== 'success') {
                const bytes = Buffer.from(envelope[outcome], 'base64');
                bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 1;
                envelope[outcome] = bytes.toString('base64');
            }

            // Call through to real AES-GCM and retain references to its original output buffers.
            const decipherPrototype: ReturnType<typeof createDecipheriv> = Object.getPrototypeOf(
                createDecipheriv('aes-256-gcm', Buffer.alloc(32), Buffer.alloc(12))
            );
            const update = vi.spyOn(decipherPrototype, 'update');
            const final = vi.spyOn(decipherPrototype, 'final');
            if (outcome === 'success') {
                await expect(encryption.decrypt(envelope, identity)).resolves.toBe(seed);
            } else {
                await expect(encryption.decrypt(envelope, identity)).rejects.toMatchObject({
                    category: 'authentication_failed',
                });
            }

            expect(update).toHaveBeenCalledTimes(outcome === 'encryptedDek' ? 1 : 2);
            for (const result of [...update.mock.results, ...final.mock.results]) {
                if (result.type !== 'return') continue;
                const chunk = result.value;
                expect(Buffer.isBuffer(chunk)).toBe(true);
                expect(chunk).toEqual(Buffer.alloc(chunk.length));
            }
        }
    );

    it('binds ciphertext to the record ID, owner, name, and DID', async () => {
        const encryption = createSeedEncryption(local);
        const envelope = await encryption.encrypt(seed, identity);
        for (const field of ['_id', 'ownerDid', 'name', 'did'] as const) {
            await expect(
                encryption.decrypt(envelope, { ...identity, [field]: 'other' })
            ).rejects.toMatchObject({ category: 'authentication_failed' });
        }
        await expect(
            createSeedEncryption({ ...local, localKek: 'e'.repeat(64) }).decrypt(envelope, identity)
        ).rejects.toMatchObject({ category: 'authentication_failed' });
    });

    it('rejects damaged IVs, ciphertext, authentication tags, and wrapped DEKs', async () => {
        const encryption = createSeedEncryption(local);
        const envelope = await encryption.encrypt(seed, identity);
        for (const field of ['encryptedSeed', 'encryptedDek'] as const) {
            for (const position of [0, 15, Buffer.from(envelope[field], 'base64').length - 1]) {
                const bytes = Buffer.from(envelope[field], 'base64');
                bytes[position] = bytes[position]! ^ 1;
                await expect(
                    encryption.decrypt({ ...envelope, [field]: bytes.toString('base64') }, identity)
                ).rejects.toBeInstanceOf(SeedEncryptionError);
            }
        }
    });

    it('rejects partial/unknown envelopes and noncanonical base64 instead of downgrading', async () => {
        environment.SA_SEED_ALLOW_LEGACY_READ = true;
        for (const fields of [
            { keyVersion: 'kms-v2' },
            { keyVersion: null },
            { encryptedSeed: 'abc' },
            { encryptedDek: 'abc' },
            { keyVersion: 'local-v1', encryptedSeed: '!', encryptedDek: '!' },
        ]) {
            await expect(
                decryptSigningAuthoritySeed({ ...identity, seed, ...fields })
            ).rejects.toMatchObject({ category: 'invalid_envelope' });
        }
        expect(parseSeedEnvelope({ seed })).toBeUndefined();
        await expect(decryptSigningAuthoritySeed({ ...identity, seed })).resolves.toBe(seed);
        environment.SA_SEED_ALLOW_LEGACY_READ = false;
        await expect(decryptSigningAuthoritySeed({ ...identity, seed })).rejects.toMatchObject({
            category: 'legacy_disabled',
        });
    });

    it('never reads a retained plaintext seed after an envelope fails authentication', async () => {
        environment.SA_SEED_ALLOW_LEGACY_READ = true;
        const envelope = await createSeedEncryption(local).encrypt(seed, identity);
        const bytes = Buffer.from(envelope.encryptedSeed, 'base64');
        bytes[20] = bytes[20]! ^ 1;
        await expect(
            decryptSigningAuthoritySeed({
                ...identity,
                seed,
                ...envelope,
                encryptedSeed: bytes.toString('base64'),
            })
        ).rejects.toMatchObject({ category: 'authentication_failed' });
    });

    it('requires an explicit KEK and permitted local environment', async () => {
        for (const config of [
            { allowLocal: false, localKek: local.localKek },
            { allowLocal: true },
            { allowLocal: true, localKek: 'short' },
        ]) {
            await expect(
                createSeedEncryption(config).encrypt(seed, identity)
            ).rejects.toMatchObject({ category: 'configuration' });
        }
        await expect(
            createSeedEncryption(local).encrypt('invalid seed', identity)
        ).rejects.toMatchObject({ category: 'invalid_record' });
    });

    it('uses exactly one GenerateDataKey and one Decrypt, pins KeyId/context, and zeros KMS plaintext', async () => {
        const kms = new KMSClient({ region: 'us-east-1' });
        const key = randomBytes(32);
        const generated = Uint8Array.from(key);
        const decrypted = Uint8Array.from(key);
        const send = vi
            .spyOn(kms, 'send')
            .mockImplementationOnce(async () => ({
                Plaintext: generated,
                CiphertextBlob: Buffer.from('wrapped'),
                KeyId: arn,
            }))
            .mockImplementationOnce(async () => ({ Plaintext: decrypted, KeyId: arn }));
        const encryption = createSeedEncryption({ ...local, kmsKeyArn: arn }, kms);
        const envelope = await encryption.encrypt(seed, identity);
        expect(envelope.keyVersion).toBe('kms-v1');
        expect(generated.every(byte => byte === 0)).toBe(true);
        expect(await encryption.decrypt(envelope, identity)).toBe(seed);
        expect(decrypted.every(byte => byte === 0)).toBe(true);
        expect(send).toHaveBeenCalledTimes(2);
        const generate = send.mock.calls[0]![0] as GenerateDataKeyCommand;
        const decrypt = send.mock.calls[1]![0] as DecryptCommand;
        expect(generate).toBeInstanceOf(GenerateDataKeyCommand);
        expect(decrypt).toBeInstanceOf(DecryptCommand);
        expect(generate.input).toMatchObject({ KeyId: arn, KeySpec: 'AES_256' });
        expect(decrypt.input.KeyId).toBe(arn);
        expect(decrypt.input.EncryptionContext).toEqual(generate.input.EncryptionContext);
        expect(JSON.stringify(generate.input.EncryptionContext)).not.toContain(seed);
        expect(JSON.stringify(generate.input.EncryptionContext)).not.toContain(identity.ownerDid);
    });

    it.each(['AccessDeniedException', 'TimeoutError', 'InvalidCiphertextException'])(
        'fails closed on %s and logs no SDK payload',
        async name => {
            const kms = new KMSClient({ region: 'us-east-1' });
            const send = vi.spyOn(kms, 'send').mockRejectedValue({
                name,
                message: seed,
                Plaintext: seed,
                $metadata: { requestId: 'request-1' },
            });
            const encryption = createSeedEncryption({ ...local, kmsKeyArn: arn }, kms);
            const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            const error = await encryption.encrypt(seed, identity).catch(value => value);
            expect(error).toBeInstanceOf(SeedEncryptionError);
            logSeedEncryptionFailure(error, 'create', identity);
            expect(JSON.stringify(logger.mock.calls)).not.toContain(seed);
            expect(logger).toHaveBeenCalledWith(
                expect.objectContaining({ awsRequestId: 'request-1' })
            );
            await expect(
                encryption.decrypt(
                    {
                        encryptedSeed: Buffer.alloc(92).toString('base64'),
                        encryptedDek: Buffer.from('wrapped').toString('base64'),
                        keyVersion: 'kms-v1',
                    },
                    identity
                )
            ).rejects.toBeInstanceOf(SeedEncryptionError);
            expect(send).toHaveBeenCalledTimes(2);
        }
    );

    it('rejects malformed KMS responses and wipes even invalid key lengths', async () => {
        const kms = new KMSClient({ region: 'us-east-1' });
        const badPlaintext = Uint8Array.from([1, 2, 3]);
        vi.spyOn(kms, 'send').mockImplementation(async () => ({
            Plaintext: badPlaintext,
            KeyId: arn,
        }));
        const encryption = createSeedEncryption({ kmsKeyArn: arn, allowLocal: false }, kms);
        await expect(encryption.encrypt(seed, identity)).rejects.toMatchObject({
            category: 'kms_failed',
        });
        expect([...badPlaintext]).toEqual([0, 0, 0]);
        await expect(
            encryption.decrypt(
                {
                    encryptedSeed: Buffer.alloc(92).toString('base64'),
                    encryptedDek: Buffer.from('wrapped').toString('base64'),
                    keyVersion: 'kms-v1',
                },
                identity
            )
        ).rejects.toMatchObject({ category: 'kms_failed' });
    });
});
