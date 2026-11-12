import { describe, expect, it, vi } from 'vitest';
import { KMSClient } from '@aws-sdk/client-kms';
import { createDeliveryKeyCustody } from './readable-delivery-keys.helpers';

const binding = { profileId: 'recipient', domain: 'test.example', version: 1 };
const local = { local: true, localKey: 'a'.repeat(64) };
const arn = 'arn:aws:kms:us-east-1:123456789012:key/11111111-1111-1111-1111-111111111111';

describe('readable-delivery key custody', () => {
    it('encrypts at rest and binds ciphertext to recipient, environment and version', async () => {
        const custody = createDeliveryKeyCustody(local);
        const encrypted = await custody.encrypt('synthetic-private-jwk', binding);
        expect(encrypted.ciphertext).not.toContain('synthetic-private-jwk');
        expect(await custody.decrypt(encrypted, binding)).toBe('synthetic-private-jwk');
        for (const changed of [
            { ...binding, profileId: 'other' },
            { ...binding, domain: 'prod.example' },
            { ...binding, version: 2 },
        ]) {
            await expect(custody.decrypt(encrypted, changed)).rejects.toThrow('decryption failed');
        }
        await expect(
            createDeliveryKeyCustody({ ...local, localKey: 'b'.repeat(64) }).decrypt(
                encrypted,
                binding
            )
        ).rejects.toThrow('decryption failed');
    });

    it('refuses local keys in a deployed runtime and refuses missing configuration', () => {
        expect(() => createDeliveryKeyCustody({ ...local, local: false })).toThrow(
            'not configured'
        );
        expect(() => createDeliveryKeyCustody({ local: true })).toThrow('not configured');
    });

    it('uses KMS with exact context and never falls back on KMS failure', async () => {
        const send = vi.fn().mockRejectedValue(new Error('private KMS detail'));
        const custody = createDeliveryKeyCustody({ ...local, kmsKeyArn: arn }, {
            send,
        } as unknown as KMSClient);
        await expect(custody.encrypt('private', binding)).rejects.toThrow(
            'Readable delivery key encryption failed'
        );
        expect(send.mock.calls[0]?.[0].input).toMatchObject({
            KeyId: arn,
            EncryptionContext: {
                purpose: 'learncard-readable-delivery-v1',
                profileId: 'recipient',
                domain: 'test.example',
                version: '1',
            },
        });
        const envelope = await createDeliveryKeyCustody(local).encrypt('private', binding);
        await expect(custody.decrypt(envelope, binding)).rejects.toThrow('decryption failed');
        expect(send).toHaveBeenCalledTimes(1);
    });

    it('verifies the KMS key ID and clears returned plaintext buffers', async () => {
        const plaintext = Buffer.from('private');
        const send = vi.fn().mockResolvedValue({ KeyId: arn, Plaintext: plaintext });
        const custody = createDeliveryKeyCustody({ local: false, kmsKeyArn: arn }, {
            send,
        } as unknown as KMSClient);
        expect(await custody.decrypt({ provider: 'kms-v1', ciphertext: 'YQ==' }, binding)).toBe(
            'private'
        );
        expect(plaintext.every(value => value === 0)).toBe(true);
        send.mockResolvedValue({ KeyId: 'wrong-key', Plaintext: Buffer.from('private') });
        await expect(
            custody.decrypt({ provider: 'kms-v1', ciphertext: 'YQ==' }, binding)
        ).rejects.toThrow('decryption failed');
    });
});
