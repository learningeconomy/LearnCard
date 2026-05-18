import { randomSalt, SD_JWT_SALT_LENGTH_BYTES } from './salt';
import { SdJwtVcError } from './types';

const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

describe('randomSalt', () => {
    it('produces base64url-encoded output (no padding, no + / =)', () => {
        for (let i = 0; i < 50; i++) {
            const salt = randomSalt();
            expect(salt).toMatch(BASE64URL_REGEX);
        }
    });

    it('returns at least 22 base64url chars (16 raw bytes encoded)', () => {
        const salt = randomSalt();
        expect(salt.length).toBeGreaterThanOrEqual(22);
    });

    it('respects custom length when >= 16 bytes', () => {
        const salt = randomSalt(32);
        expect(salt.length).toBeGreaterThanOrEqual(43);
    });

    it('throws SdJwtVcError when length is below the 16-byte RFC 9901 §4.2.1 minimum', () => {
        expect(() => randomSalt(4)).toThrow(SdJwtVcError);
        expect(() => randomSalt(0)).toThrow(/internal_error|>= 16/);
        expect(() => randomSalt(15)).toThrow(SdJwtVcError);
    });

    it('throws on non-integer lengths', () => {
        expect(() => randomSalt(16.5)).toThrow(SdJwtVcError);
    });

    it('produces unique values across many samples', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 1000; i++) seen.add(randomSalt());
        expect(seen.size).toBe(1000);
    });

    it('defaults to SD_JWT_SALT_LENGTH_BYTES (16)', () => {
        expect(SD_JWT_SALT_LENGTH_BYTES).toBe(16);
    });
});
