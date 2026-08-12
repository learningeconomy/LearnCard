import { describe, it, expect } from 'vitest';
import {
    encryptWithPassword,
    decryptWithPassword,
    deriveKeyFromPassword,
    generateEd25519PrivateKey,
    DEFAULT_KDF_PARAMS,
    hexToBytes,
    bytesToHex,
} from './crypto';

describe('Password-based encryption', () => {
    const testPassword = 'testPassword123!@#';
    const testData = 'sensitive-recovery-share-data-hex-string-1234567890abcdef';

    describe('encryptWithPassword', () => {
        it('should encrypt data and return ciphertext, iv, salt, and kdfParams', async () => {
            const result = await encryptWithPassword(testData, testPassword);

            expect(result.ciphertext).toBeDefined();
            expect(result.iv).toBeDefined();
            expect(result.salt).toBeDefined();
            expect(result.kdfParams).toBeDefined();

            expect(result.ciphertext.length).toBeGreaterThan(0);
            expect(result.iv.length).toBeGreaterThan(0);
            expect(result.salt.length).toBeGreaterThan(0);
        });

        it('should produce different ciphertexts for same data with same password (due to random salt/iv)', async () => {
            const result1 = await encryptWithPassword(testData, testPassword);
            const result2 = await encryptWithPassword(testData, testPassword);

            expect(result1.ciphertext).not.toBe(result2.ciphertext);
            expect(result1.salt).not.toBe(result2.salt);
            expect(result1.iv).not.toBe(result2.iv);
        });

        it('should use Argon2id algorithm by default', async () => {
            const result = await encryptWithPassword(testData, testPassword);

            expect(result.kdfParams.algorithm).toBe('argon2id');
        });
    });

    describe('decryptWithPassword', () => {
        it('should decrypt data encrypted with encryptWithPassword', async () => {
            const encrypted = await encryptWithPassword(testData, testPassword);

            const decrypted = await decryptWithPassword(
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.salt,
                testPassword,
                encrypted.kdfParams
            );

            expect(decrypted).toBe(testData);
        });

        it('should fail with wrong password', async () => {
            const encrypted = await encryptWithPassword(testData, testPassword);

            await expect(
                decryptWithPassword(
                    encrypted.ciphertext,
                    encrypted.iv,
                    encrypted.salt,
                    'wrongPassword',
                    encrypted.kdfParams
                )
            ).rejects.toThrow();
        });

        it('should fail with corrupted ciphertext', async () => {
            const encrypted = await encryptWithPassword(testData, testPassword);

            const corruptedCiphertext = 'corrupted' + encrypted.ciphertext.slice(9);

            await expect(
                decryptWithPassword(
                    corruptedCiphertext,
                    encrypted.iv,
                    encrypted.salt,
                    testPassword,
                    encrypted.kdfParams
                )
            ).rejects.toThrow();
        });

        it('should handle empty string data', async () => {
            const emptyData = '';
            const encrypted = await encryptWithPassword(emptyData, testPassword);

            const decrypted = await decryptWithPassword(
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.salt,
                testPassword,
                encrypted.kdfParams
            );

            expect(decrypted).toBe(emptyData);
        });

        it('should handle long data strings', async () => {
            const longData = 'x'.repeat(10000);
            const encrypted = await encryptWithPassword(longData, testPassword);

            const decrypted = await decryptWithPassword(
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.salt,
                testPassword,
                encrypted.kdfParams
            );

            expect(decrypted).toBe(longData);
        });

        it('should handle unicode data', async () => {
            const unicodeData = '🔐 Recovery Share 密码 مفتاح';
            const encrypted = await encryptWithPassword(unicodeData, testPassword);

            const decrypted = await decryptWithPassword(
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.salt,
                testPassword,
                encrypted.kdfParams
            );

            expect(decrypted).toBe(unicodeData);
        });

        it('should handle unicode passwords', async () => {
            const unicodePassword = 'パスワード123🔑';
            const encrypted = await encryptWithPassword(testData, unicodePassword);

            const decrypted = await decryptWithPassword(
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.salt,
                unicodePassword,
                encrypted.kdfParams
            );

            expect(decrypted).toBe(testData);
        });
    });

    describe('deriveKeyFromPassword', () => {
        it('should derive consistent key from same password and salt', async () => {
            const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

            const key1 = await deriveKeyFromPassword(testPassword, salt, DEFAULT_KDF_PARAMS);
            const key2 = await deriveKeyFromPassword(testPassword, salt, DEFAULT_KDF_PARAMS);

            expect(bytesToHex(key1)).toBe(bytesToHex(key2));
        });

        it('should derive different keys for different passwords', async () => {
            const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

            const key1 = await deriveKeyFromPassword('password1', salt, DEFAULT_KDF_PARAMS);
            const key2 = await deriveKeyFromPassword('password2', salt, DEFAULT_KDF_PARAMS);

            expect(bytesToHex(key1)).not.toBe(bytesToHex(key2));
        });

        it('should derive different keys for different salts', async () => {
            const salt1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
            const salt2 = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

            const key1 = await deriveKeyFromPassword(testPassword, salt1, DEFAULT_KDF_PARAMS);
            const key2 = await deriveKeyFromPassword(testPassword, salt2, DEFAULT_KDF_PARAMS);

            expect(bytesToHex(key1)).not.toBe(bytesToHex(key2));
        });
    });

    describe('generateEd25519PrivateKey', () => {
        it('should generate a 64-character hex string (32 bytes)', async () => {
            const key = await generateEd25519PrivateKey();

            expect(key.length).toBe(64);
            expect(/^[0-9a-f]+$/.test(key)).toBe(true);
        });

        it('should generate different keys each time', async () => {
            const key1 = await generateEd25519PrivateKey();
            const key2 = await generateEd25519PrivateKey();

            expect(key1).not.toBe(key2);
        });

        it('should generate valid hex that converts to 32 bytes', async () => {
            const key = await generateEd25519PrivateKey();
            const bytes = hexToBytes(key);

            expect(bytes.length).toBe(32);
            expect(bytesToHex(bytes)).toBe(key);
        });
    });
});

describe('DEFAULT_KDF_PARAMS', () => {
    it('should have secure Argon2id parameters', () => {
        expect(DEFAULT_KDF_PARAMS.algorithm).toBe('argon2id');
        expect(DEFAULT_KDF_PARAMS.timeCost).toBeGreaterThanOrEqual(3);
        expect(DEFAULT_KDF_PARAMS.memoryCost).toBeGreaterThanOrEqual(65536);
        expect(DEFAULT_KDF_PARAMS.parallelism).toBeGreaterThanOrEqual(1);
    });
});
