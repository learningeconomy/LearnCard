import { describe, expect, it } from 'vitest';

import { decryptField, encryptField } from '../../src/helpers/field-encryption.helpers';

describe('field encryption helpers', () => {
    const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    it('round-trips plaintext through encryptField and decryptField', () => {
        const plaintext = 'super secret boost field';
        const ciphertext = encryptField(plaintext, key);

        expect(decryptField(ciphertext, key)).toBe(plaintext);
    });

    it('produces different ciphertext for the same plaintext due to random IVs', () => {
        const plaintext = 'repeatable plaintext';
        const firstCiphertext = encryptField(plaintext, key);
        const secondCiphertext = encryptField(plaintext, key);

        expect(firstCiphertext).not.toBe(secondCiphertext);
    });

    it('throws when decrypting with the wrong key', () => {
        const plaintext = 'wrong-key check';
        const ciphertext = encryptField(plaintext, key);
        const wrongKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

        expect(() => decryptField(ciphertext, wrongKey)).toThrow();
    });
});
