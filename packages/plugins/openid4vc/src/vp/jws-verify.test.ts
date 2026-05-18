import { exportJWK, generateKeyPair, SignJWT } from 'jose';

import {
    JwsVerifyError,
    isSupportedAlg,
    jwkFromX509SubjectPublicKey,
    verifyCompactJws,
} from './jws-verify';

const subtle = (globalThis as { crypto: { subtle: SubtleCrypto } }).crypto.subtle;

/**
 * Build a minimal mock that matches the shape `jwkFromX509SubjectPublicKey`
 * consumes from `@peculiar/x509.X509Certificate`. We don't need a real
 * certificate — we just need an SPKI-encoded public key and the
 * algorithm metadata the extractor reads. WebCrypto's
 * `subtle.exportKey('spki', ...)` produces a byte-identical SPKI to the
 * one a real certificate would carry.
 */
const buildMockCert = async (args: {
    publicKey: CryptoKey;
    algorithmName: 'Ed25519' | 'ECDSA';
    namedCurve?: string;
}): Promise<{
    publicKey: {
        algorithm: { name: string; namedCurve?: string };
        rawData: ArrayBuffer;
    };
}> => {
    const spki = await subtle.exportKey('spki', args.publicKey);
    return {
        publicKey: {
            algorithm: {
                name: args.algorithmName,
                namedCurve: args.namedCurve,
            },
            rawData: spki,
        },
    };
};

const signJws = async (
    alg: 'EdDSA' | 'ES256',
    payload: Record<string, unknown> = { hello: 'world' }
): Promise<{ jws: string; publicJwk: ReturnType<typeof exportJWK> extends Promise<infer U> ? U : never }> => {
    const { privateKey, publicKey } = await generateKeyPair(alg, {
        extractable: true,
    });
    const jws = await new SignJWT(payload)
        .setProtectedHeader({ alg })
        .sign(privateKey);
    const publicJwk = await exportJWK(publicKey);
    return { jws, publicJwk };
};

describe('isSupportedAlg', () => {
    it('accepts EdDSA / ES256 / ES256K / ES384 / ES512', () => {
        expect(isSupportedAlg('EdDSA')).toBe(true);
        expect(isSupportedAlg('ES256')).toBe(true);
        expect(isSupportedAlg('ES256K')).toBe(true);
        expect(isSupportedAlg('ES384')).toBe(true);
        expect(isSupportedAlg('ES512')).toBe(true);
    });

    it('rejects RSA / unknown algorithms', () => {
        expect(isSupportedAlg('RS256')).toBe(false);
        expect(isSupportedAlg('PS256')).toBe(false);
        expect(isSupportedAlg('none')).toBe(false);
        expect(isSupportedAlg('')).toBe(false);
    });
});

describe('verifyCompactJws — EdDSA', () => {
    it('verifies a jose-generated Ed25519 JWS', async () => {
        const { jws, publicJwk } = await signJws('EdDSA');

        await expect(
            verifyCompactJws({ jws, publicKeyJwk: publicJwk, alg: 'EdDSA' })
        ).resolves.toBeUndefined();
    });

    it('rejects when the signature is tampered', async () => {
        const { jws, publicJwk } = await signJws('EdDSA');
        const [h, p, s] = jws.split('.');
        const flippedSig = s!.slice(0, -2) + (s!.slice(-2) === 'AA' ? 'BB' : 'AA');
        const tampered = `${h}.${p}.${flippedSig}`;

        await expect(
            verifyCompactJws({ jws: tampered, publicKeyJwk: publicJwk, alg: 'EdDSA' })
        ).rejects.toMatchObject({ code: 'signature_invalid' });
    });

    it('rejects when the payload was modified after signing', async () => {
        const { jws, publicJwk } = await signJws('EdDSA');
        const [h, , s] = jws.split('.');
        const evilPayload = Buffer.from(
            JSON.stringify({ hello: 'evil' })
        ).toString('base64url');
        const tampered = `${h}.${evilPayload}.${s}`;

        await expect(
            verifyCompactJws({ jws: tampered, publicKeyJwk: publicJwk, alg: 'EdDSA' })
        ).rejects.toMatchObject({ code: 'signature_invalid' });
    });

    it('rejects an EC JWK supplied with alg=EdDSA', async () => {
        const { publicJwk: ecJwk } = await signJws('ES256');
        const { jws } = await signJws('EdDSA');

        await expect(
            verifyCompactJws({ jws, publicKeyJwk: ecJwk, alg: 'EdDSA' })
        ).rejects.toMatchObject({ code: 'invalid_jwk' });
    });
});

describe('verifyCompactJws — ES256', () => {
    it('verifies a jose-generated P-256 JWS', async () => {
        const { jws, publicJwk } = await signJws('ES256');

        await expect(
            verifyCompactJws({ jws, publicKeyJwk: publicJwk, alg: 'ES256' })
        ).resolves.toBeUndefined();
    });

    it('rejects when the signature is tampered', async () => {
        const { jws, publicJwk } = await signJws('ES256');
        const [h, p, s] = jws.split('.');
        const flippedSig = s!.slice(0, -2) + (s!.slice(-2) === 'AA' ? 'BB' : 'AA');
        const tampered = `${h}.${p}.${flippedSig}`;

        await expect(
            verifyCompactJws({ jws: tampered, publicKeyJwk: publicJwk, alg: 'ES256' })
        ).rejects.toMatchObject({ code: 'signature_invalid' });
    });

    it('rejects an Ed25519 JWK supplied with alg=ES256', async () => {
        const { publicJwk: edJwk } = await signJws('EdDSA');
        const { jws } = await signJws('ES256');

        await expect(
            verifyCompactJws({ jws, publicKeyJwk: edJwk, alg: 'ES256' })
        ).rejects.toMatchObject({ code: 'invalid_jwk' });
    });
});

describe('verifyCompactJws — unsupported algorithms', () => {
    it('throws unsupported_alg for RS256', async () => {
        const fakeJws = 'aaaa.bbbb.cccc';
        await expect(
            verifyCompactJws({
                jws: fakeJws,
                publicKeyJwk: { kty: 'RSA', n: 'abc', e: 'AQAB' },
                alg: 'RS256',
            })
        ).rejects.toMatchObject({ code: 'unsupported_alg' });
    });

    it('includes an actionable hint about supported algorithms', async () => {
        try {
            await verifyCompactJws({
                jws: 'a.b.c',
                publicKeyJwk: { kty: 'RSA' },
                alg: 'PS256',
            });
            throw new Error('expected throw');
        } catch (e) {
            expect(e).toBeInstanceOf(JwsVerifyError);
            expect((e as Error).message).toMatch(/EdDSA, ES256/);
        }
    });
});

describe('verifyCompactJws — malformed input', () => {
    it('rejects a non-compact JWS', async () => {
        const { publicJwk } = await signJws('EdDSA');
        await expect(
            verifyCompactJws({
                jws: 'only-one-part',
                publicKeyJwk: publicJwk,
                alg: 'EdDSA',
            })
        ).rejects.toMatchObject({ code: 'invalid_jws' });
    });

    it('rejects a JWS with wrong-length Ed25519 signature', async () => {
        const { publicJwk } = await signJws('EdDSA');
        const tooShort = 'aaaa.bbbb.cccc';

        await expect(
            verifyCompactJws({ jws: tooShort, publicKeyJwk: publicJwk, alg: 'EdDSA' })
        ).rejects.toMatchObject({ code: 'signature_invalid' });
    });
});

describe('jwkFromX509SubjectPublicKey', () => {
    it('extracts an Ed25519 public key from an SPKI-backed cert mock', async () => {
        const { publicKey } = await subtle.generateKey(
            { name: 'Ed25519' },
            true,
            ['sign', 'verify']
        ) as CryptoKeyPair;

        const cert = await buildMockCert({
            publicKey,
            algorithmName: 'Ed25519',
        });

        const jwk = jwkFromX509SubjectPublicKey(cert);

        expect(jwk).toMatchObject({
            kty: 'OKP',
            crv: 'Ed25519',
        });
        expect(typeof jwk.x).toBe('string');
        expect((jwk.x as string).length).toBeGreaterThan(40);
    });

    it('extracts a P-256 public key from an SPKI-backed cert mock', async () => {
        const { publicKey } = await subtle.generateKey(
            { name: 'ECDSA', namedCurve: 'P-256' },
            true,
            ['sign', 'verify']
        ) as CryptoKeyPair;

        const cert = await buildMockCert({
            publicKey,
            algorithmName: 'ECDSA',
            namedCurve: 'P-256',
        });

        const jwk = jwkFromX509SubjectPublicKey(cert);

        expect(jwk).toMatchObject({
            kty: 'EC',
            crv: 'P-256',
        });
        expect(typeof jwk.x).toBe('string');
        expect(typeof jwk.y).toBe('string');
    });

    it('round-trips: extracted JWK verifies a JWS signed by the same key', async () => {
        const { privateKey, publicKey } = await subtle.generateKey(
            { name: 'Ed25519' },
            true,
            ['sign', 'verify']
        ) as CryptoKeyPair;

        const jws = await new SignJWT({ aud: 'verifier.test' })
            .setProtectedHeader({ alg: 'EdDSA' })
            .sign(privateKey);

        const cert = await buildMockCert({
            publicKey,
            algorithmName: 'Ed25519',
        });
        const extractedJwk = jwkFromX509SubjectPublicKey(cert);

        await expect(
            verifyCompactJws({
                jws,
                publicKeyJwk: extractedJwk,
                alg: 'EdDSA',
            })
        ).resolves.toBeUndefined();
    });

    it('throws invalid_jwk for unsupported algorithms (e.g. RSA)', async () => {
        const { publicKey } = await subtle.generateKey(
            {
                name: 'RSASSA-PKCS1-v1_5',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            },
            true,
            ['sign', 'verify']
        ) as CryptoKeyPair;

        const cert = await buildMockCert({
            publicKey,
            algorithmName: 'RSASSA-PKCS1-v1_5' as 'Ed25519',
        });

        expect(() => jwkFromX509SubjectPublicKey(cert)).toThrow(JwsVerifyError);
    });
});
