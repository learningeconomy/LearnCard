import { describe, expect, it } from 'vitest';
import SHA256 from 'crypto-js/sha256';

import { sha256Hex } from './sha256Hex';

describe('sha256Hex', () => {
    it('matches the FIPS 180-2 vectors', () => {
        expect(sha256Hex('')).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        );
        expect(sha256Hex('abc')).toBe(
            'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
        );
        expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
            '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
        );
    });

    it('matches crypto-js for every padding boundary and non-ASCII text (existing receipt keys stay valid)', () => {
        const samples = [
            ...Array.from({ length: 200 }, (_, n) => 'x'.repeat(n)),
            JSON.stringify(['did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK', 'req-123']),
            'naïve — 日本語 😀 émoji',
        ];
        for (const s of samples) expect(sha256Hex(s)).toBe(SHA256(s).toString());
    });
});
