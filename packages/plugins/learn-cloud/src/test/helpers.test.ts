// `pbkdf2-hmac` ships ESM-only with dynamic `import()` calls that Jest's
// default vm cannot evaluate without `--experimental-vm-modules`. Mock
// it with a deterministic stand-in so these tests can run in CI on the
// stock Jest config. We're testing the HMAC-SHA256 layer, not the KDF.
jest.mock('pbkdf2-hmac', () => ({
    __esModule: true,
    default: jest
        .fn()
        .mockImplementation(async (pk: string) => {
            const seed = new TextEncoder().encode(`mock-pbkdf2:${pk}`);
            const out = new Uint8Array(32);
            for (let i = 0; i < 32; i++) out[i] = seed[i % seed.length] ?? 0;
            return out.buffer;
        }),
}));

import { hash } from '../helpers';
import pbkdf2Hmac from 'pbkdf2-hmac';

const buildFakeLearnCard = (overrides: {
    hash?: (message: string, alg: string) => Promise<string>;
} = {}): any => {
    return {
        id: {
            keypair: (_curve: 'secp256k1') => ({
                d: 'fixed-private-scalar-for-deterministic-tests',
                kty: 'EC',
                crv: 'secp256k1',
                x: 'unused',
                y: 'unused',
            }),
        },
        invoke: {
            hash: overrides.hash,
            crypto: () =>
                (globalThis as { crypto?: Crypto }).crypto as Crypto,
        },
    };
};

describe('hash (LearnCloud searchable-field token)', () => {
    it('returns a 64-character hex string (32-byte SHA-256 HMAC output)', async () => {
        const learnCard = buildFakeLearnCard();
        const result = await hash(learnCard, 'category:Achievement');

        expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic for the same (key, message) pair', async () => {
        const learnCard = buildFakeLearnCard();

        const a = await hash(learnCard, 'category:Achievement');
        const b = await hash(learnCard, 'category:Achievement');

        expect(a).toBe(b);
    });

    it('produces different output for different messages', async () => {
        const learnCard = buildFakeLearnCard();

        const a = await hash(learnCard, 'category:Achievement');
        const b = await hash(learnCard, 'category:ID');

        expect(a).not.toBe(b);
    });

    it('honors the host-supplied invoke.hash escape hatch when present', async () => {
        const customHash = jest.fn().mockResolvedValue('host-supplied-hash');
        const learnCard = buildFakeLearnCard({ hash: customHash });

        const result = await hash(learnCard, 'category:Achievement');

        expect(result).toBe('host-supplied-hash');
        expect(customHash).toHaveBeenCalledWith(
            'category:Achievement',
            'PBKDF2-HMAC-SHA256'
        );
    });

    it('falls through to pure-JS HMAC when invoke.hash returns falsy', async () => {
        const customHash = jest.fn().mockResolvedValue(undefined);
        const learnCard = buildFakeLearnCard({ hash: customHash });

        const result = await hash(learnCard, 'category:Achievement');

        expect(result).toMatch(/^[0-9a-f]{64}$/);
        expect(customHash).toHaveBeenCalled();
    });

    it('produces output byte-for-byte identical to crypto.subtle HMAC-SHA256 (backward compat)', async () => {
        // Regression guard: existing user indexes were built with the
        // crypto.subtle path. The pure-JS replacement MUST emit the same
        // hex token for the same (key, message), otherwise upgrading the
        // plugin silently bricks every searchable index already in the
        // wild. We compute both side-by-side here and require equality.
        const learnCard = buildFakeLearnCard();
        const message = 'category:Achievement';

        const ourResult = await hash(learnCard, message);

        const pk = learnCard.id.keypair('secp256k1').d;
        const hmacKey = await pbkdf2Hmac(pk, 'salt', 1000, 32);
        const subtleKey = await (globalThis as { crypto: Crypto }).crypto.subtle.importKey(
            'raw',
            hmacKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const sig = await (globalThis as { crypto: Crypto }).crypto.subtle.sign(
            'HMAC',
            subtleKey,
            new TextEncoder().encode(message)
        );
        const expected = Array.from(new Uint8Array(sig))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        expect(ourResult).toBe(expected);
    });
});
