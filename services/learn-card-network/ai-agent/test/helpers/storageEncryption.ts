import {
    isEncryptedEnvelope,
    type EncryptedJsonEnvelopeV1,
    type EncryptionService,
} from '../../src/security/encryption';

/** Synthetic, in-process ciphertext handles; never uses keys or external services. */
export const createStorageTestEncryption = (): EncryptionService => {
    const values = new Map<string, { aad: string; value: unknown }>();
    let nextId = 0;
    const decryptJson = async <T>(envelope: EncryptedJsonEnvelopeV1, aad: string): Promise<T> => {
        const stored = values.get(envelope.jwe.ciphertext);
        if (!stored || stored.aad !== aad) throw new Error('Invalid test ciphertext or AAD.');

        return structuredClone(stored.value) as T;
    };

    return {
        encryptJson: async (value, aad) => {
            const id = `synthetic-${++nextId}`;
            values.set(id, { aad, value: structuredClone(value) });

            return {
                __learnCardAiAgentEncrypted: true,
                version: 1,
                format: 'dag-jwe',
                kid: 'synthetic-test-key',
                recipientDid: 'did:key:synthetic-agent',
                jwe: { protected: '', iv: '', ciphertext: id, tag: '' },
            };
        },
        decryptJson,
        decryptLegacyOrEnvelope: async <T>(value: T | EncryptedJsonEnvelopeV1, aad: string) =>
            isEncryptedEnvelope(value)
                ? { value: await decryptJson<T>(value, aad), legacyPlaintext: false }
                : { value: value as T, legacyPlaintext: true },
    };
};
