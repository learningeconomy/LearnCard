import { sha256Hasher, isSupportedHashAlg } from './hasher';
import { SdJwtVcError } from './types';

const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

describe('sha256Hasher', () => {
    it('hashes an empty string to the SHA-256 zero-length digest', async () => {
        const digest = await sha256Hasher('', 'sha-256');
        expect(toHex(digest)).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        );
    });

    it('hashes "abc" to the SHA-256 known digest', async () => {
        const digest = await sha256Hasher('abc', 'sha-256');
        expect(toHex(digest)).toBe(
            'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
        );
    });

    it('accepts both "sha-256" and "SHA-256" alg labels', async () => {
        const lower = await sha256Hasher('abc', 'sha-256');
        const upper = await sha256Hasher('abc', 'SHA-256');
        expect(toHex(lower)).toBe(toHex(upper));
    });

    it('throws SdJwtVcError with unsupported_alg for non-SHA-256 algorithms', async () => {
        await expect(sha256Hasher('abc', 'sha-512')).rejects.toBeInstanceOf(SdJwtVcError);
        await expect(sha256Hasher('abc', 'md5')).rejects.toMatchObject({
            code: 'unsupported_alg',
        });
    });

    it('returns a 32-byte Uint8Array', async () => {
        const digest = await sha256Hasher('any input', 'sha-256');
        expect(digest).toBeInstanceOf(Uint8Array);
        expect(digest.length).toBe(32);
    });
});

describe('isSupportedHashAlg', () => {
    it('returns true for sha-256 variants', () => {
        expect(isSupportedHashAlg('sha-256')).toBe(true);
        expect(isSupportedHashAlg('SHA-256')).toBe(true);
        expect(isSupportedHashAlg('sha256')).toBe(true);
    });

    it('returns false for other algorithms', () => {
        expect(isSupportedHashAlg('sha-512')).toBe(false);
        expect(isSupportedHashAlg('md5')).toBe(false);
        expect(isSupportedHashAlg('')).toBe(false);
    });
});
