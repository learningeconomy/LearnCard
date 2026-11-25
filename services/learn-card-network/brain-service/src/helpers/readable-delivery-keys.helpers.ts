import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms';
import type { DeliveryKeyBinding, DeliveryKeyCustody } from 'types/readable-delivery';

const purpose = 'learncard-readable-delivery-v1';
// Reuse only the AWS transport/connection pool. Agent keys never enter this cache.
const kmsClients = new Map<string, KMSClient>();
const getKmsClient = (region?: string): KMSClient => {
    const id = region ?? '';
    let client = kmsClients.get(id);
    if (!client) {
        client = new KMSClient({ region, maxAttempts: 2 });
        kmsClients.set(id, client);
    }
    return client;
};

/** Agent private keys are never cached, logged, or used as cache keys. */
export const createDeliveryKeyCustody = (
    config: { kmsKeyArn?: string; region?: string; localKey?: string; local: boolean },
    client?: Pick<KMSClient, 'send'>
): DeliveryKeyCustody => {
    if (!config.kmsKeyArn && !(config.local && /^[a-f0-9]{64}$/i.test(config.localKey ?? ''))) {
        throw new Error('Readable delivery key custody is not configured');
    }
    const kms = config.kmsKeyArn ? (client ?? getKmsClient(config.region)) : undefined;
    const context = (binding: DeliveryKeyBinding): Record<string, string> => ({
        purpose,
        profileId: binding.profileId,
        domain: binding.domain,
        version: String(binding.version),
    });

    return {
        encrypt: async (key, binding) => {
            const plaintext = Buffer.from(key);
            try {
                if (kms) {
                    const result = await kms.send(
                        new EncryptCommand({
                            KeyId: config.kmsKeyArn,
                            Plaintext: plaintext,
                            EncryptionContext: context(binding),
                        }),
                        { abortSignal: AbortSignal.timeout(10_000) }
                    );
                    if (!result.CiphertextBlob || result.KeyId !== config.kmsKeyArn)
                        throw new Error();
                    return {
                        provider: 'kms-v1',
                        ciphertext: Buffer.from(result.CiphertextBlob).toString('base64'),
                    };
                }
                const kek = Buffer.from(config.localKey!, 'hex');
                try {
                    const iv = randomBytes(12);
                    const cipher = createCipheriv('aes-256-gcm', kek, iv);
                    cipher.setAAD(Buffer.from(JSON.stringify(context(binding))));
                    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
                    return {
                        provider: 'local-v1',
                        ciphertext: Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
                            'base64'
                        ),
                    };
                } finally {
                    kek.fill(0);
                }
            } catch {
                throw new Error('Readable delivery key encryption failed');
            } finally {
                plaintext.fill(0);
            }
        },
        decrypt: async (envelope, binding) => {
            let plaintext: Uint8Array | undefined;
            try {
                if (envelope.provider === 'kms-v1') {
                    if (!kms) throw new Error();
                    const result = await kms.send(
                        new DecryptCommand({
                            KeyId: config.kmsKeyArn,
                            CiphertextBlob: Buffer.from(envelope.ciphertext, 'base64'),
                            EncryptionContext: context(binding),
                        }),
                        { abortSignal: AbortSignal.timeout(10_000) }
                    );
                    plaintext = result.Plaintext;
                    if (!plaintext || result.KeyId !== config.kmsKeyArn) throw new Error();
                } else {
                    if (
                        envelope.provider !== 'local-v1' ||
                        kms ||
                        !config.local ||
                        !config.localKey
                    )
                        throw new Error();
                    const bytes = Buffer.from(envelope.ciphertext, 'base64');
                    const kek = Buffer.from(config.localKey, 'hex');
                    try {
                        const decipher = createDecipheriv(
                            'aes-256-gcm',
                            kek,
                            bytes.subarray(0, 12)
                        );
                        decipher.setAAD(Buffer.from(JSON.stringify(context(binding))));
                        decipher.setAuthTag(bytes.subarray(12, 28));
                        plaintext = Buffer.concat([
                            decipher.update(bytes.subarray(28)),
                            decipher.final(),
                        ]);
                    } finally {
                        kek.fill(0);
                    }
                }
                return new TextDecoder().decode(plaintext);
            } catch {
                throw new Error('Readable delivery key decryption failed');
            } finally {
                plaintext?.fill(0);
            }
        },
    };
};
