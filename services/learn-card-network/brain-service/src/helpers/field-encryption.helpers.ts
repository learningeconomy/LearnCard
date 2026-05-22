import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const AES_256_GCM_ALGORITHM = 'aes-256-gcm';
const AES_256_GCM_IV_BYTES = 12;
const AES_256_GCM_KEY_BYTES = 32;

const getValidatedKeyBuffer = (key: string): Buffer => {
    const normalizedKey = key.trim();

    if (!/^[0-9a-fA-F]{64}$/.test(normalizedKey)) {
        throw new Error('BOOST_FIELD_ENCRYPTION_KEY must be a 64-character hex string');
    }

    const keyBuffer = Buffer.from(normalizedKey, 'hex');

    if (keyBuffer.length !== AES_256_GCM_KEY_BYTES) {
        throw new Error('BOOST_FIELD_ENCRYPTION_KEY must decode to 32 bytes');
    }

    return keyBuffer;
};

export const encryptField = (plaintext: string, key: string): string => {
    const iv = randomBytes(AES_256_GCM_IV_BYTES);
    // TODO: Replace with AWS KMS in Phase 5.2
    const cipher = createCipheriv(AES_256_GCM_ALGORITHM, getValidatedKeyBuffer(key), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${ciphertext.toString('base64')}:${authTag.toString('hex')}`;
};

export const decryptField = (ciphertext: string, key: string): string => {
    const [ivHex, encryptedBase64, authTagHex] = ciphertext.split(':');

    if (!ivHex || !encryptedBase64 || !authTagHex) {
        throw new Error('Invalid encrypted field payload');
    }

    const decipher = createDecipheriv(
        AES_256_GCM_ALGORITHM,
        getValidatedKeyBuffer(key),
        Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, 'base64')),
        decipher.final(),
    ]);

    return plaintext.toString('utf8');
};

export const getFieldEncryptionKey = (): string | undefined => {
    return process.env.BOOST_FIELD_ENCRYPTION_KEY;
};
