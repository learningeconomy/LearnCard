import { describe, it, expect } from 'vitest';

import { encryptAuthShare, decryptAuthShare } from './shareEncryption.helpers';

import type { ServerEncryptedShare } from '../models/UserKey';

const TEST_SEED = 'test-seed-for-unit-tests-only-do-not-use-in-prod';

const makeShare = (data: string): ServerEncryptedShare => ({
    encryptedData: data,
    encryptedDek: '',
    iv: '',
});

describe('shareEncryption helpers', () => {
    describe('encryptAuthShare / decryptAuthShare round-trip', () => {
        it('encrypts and decrypts back to the original share data', () => {
            const original = makeShare('deadbeef1234567890abcdef');

            const encrypted = encryptAuthShare(original, TEST_SEED);

            expect(encrypted.encryptedData).not.toBe(original.encryptedData);
            expect(encrypted.iv).not.toBe('');
            expect(encrypted.encryptedDek).toBe('server-v1');

            const decrypted = decryptAuthShare(encrypted, TEST_SEED);

            expect(decrypted.encryptedData).toBe(original.encryptedData);
            expect(decrypted.encryptedDek).toBe('');
            expect(decrypted.iv).toBe('');
        });

        it('produces different ciphertext each time (random IV)', () => {
            const original = makeShare('same-data-every-time');

            const encrypted1 = encryptAuthShare(original, TEST_SEED);
            const encrypted2 = encryptAuthShare(original, TEST_SEED);

            expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
            expect(encrypted1.iv).not.toBe(encrypted2.iv);
        });

        it('fails to decrypt with a different seed', () => {
            const original = makeShare('secret-share-data');
            const encrypted = encryptAuthShare(original, TEST_SEED);

            expect(() => decryptAuthShare(encrypted, 'wrong-seed')).toThrow();
        });

        it('handles long share data', () => {
            const longData = 'a'.repeat(10_000);
            const original = makeShare(longData);

            const encrypted = encryptAuthShare(original, TEST_SEED);
            const decrypted = decryptAuthShare(encrypted, TEST_SEED);

            expect(decrypted.encryptedData).toBe(longData);
        });
    });
});
