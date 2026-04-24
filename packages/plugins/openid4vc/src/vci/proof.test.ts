import { generateKeyPair, exportJWK, jwtVerify, importJWK } from 'jose';

import { buildProofJwt, createJoseEd25519Signer, OID4VCI_PROOF_TYP } from './proof';
import { ProofJwtSigner } from './types';

const fakeSigner = (opts: {
    alg?: string;
    kid?: string;
    sign?: ProofJwtSigner['sign'];
} = {}): ProofJwtSigner & {
    lastHeader?: Record<string, unknown>;
    lastPayload?: Record<string, unknown>;
} => {
    const signer = {
        alg: opts.alg ?? 'EdDSA',
        kid: opts.kid ?? 'did:key:z6Mk...#z6Mk...',
        sign: jest.fn().mockImplementation(async (header, payload) => {
            (signer as typeof signer & { lastHeader?: unknown; lastPayload?: unknown }).lastHeader = header;
            (signer as typeof signer & { lastHeader?: unknown; lastPayload?: unknown }).lastPayload = payload;
            return opts.sign ? opts.sign(header, payload) : 'fake.jwt.signature';
        }),
    } as ProofJwtSigner & { lastHeader?: Record<string, unknown>; lastPayload?: Record<string, unknown> };
    return signer;
};

describe('buildProofJwt', () => {
    it('constructs a header with alg / kid / openid4vci-proof+jwt typ', async () => {
        const signer = fakeSigner({ alg: 'EdDSA', kid: 'did:key:z6Mk#z6Mk' });

        await buildProofJwt({
            signer,
            audience: 'https://issuer.example.com',
            nonce: 'abc123',
        });

        expect(signer.lastHeader).toEqual({
            alg: 'EdDSA',
            kid: 'did:key:z6Mk#z6Mk',
            typ: OID4VCI_PROOF_TYP,
        });
    });

    it('sets aud + iat + nonce on the payload', async () => {
        const signer = fakeSigner();
        const fixedNow = 1_700_000_000;

        await buildProofJwt({
            signer,
            audience: 'https://issuer.example.com',
            nonce: 'abc123',
            now: () => fixedNow,
        });

        expect(signer.lastPayload).toEqual({
            aud: 'https://issuer.example.com',
            iat: fixedNow,
            nonce: 'abc123',
        });
    });

    it('omits nonce when none supplied (unauthenticated issuance)', async () => {
        const signer = fakeSigner();

        await buildProofJwt({ signer, audience: 'https://issuer.example.com' });

        expect(signer.lastPayload).not.toHaveProperty('nonce');
    });

    it('sets iss when clientId is supplied', async () => {
        const signer = fakeSigner();

        await buildProofJwt({
            signer,
            audience: 'https://issuer.example.com',
            clientId: 'my-wallet',
        });

        expect(signer.lastPayload?.iss).toBe('my-wallet');
    });

    it('rejects empty audience', async () => {
        const signer = fakeSigner();

        await expect(
            buildProofJwt({ signer, audience: '' })
        ).rejects.toMatchObject({ code: 'proof_signing_failed' });
    });

    it('wraps signer errors in a VciError', async () => {
        const signer = fakeSigner({
            sign: async () => {
                throw new Error('signer down');
            },
        });

        await expect(
            buildProofJwt({ signer, audience: 'https://issuer.example.com' })
        ).rejects.toMatchObject({
            code: 'proof_signing_failed',
            message: expect.stringContaining('signer down'),
        });
    });
});

describe('createJoseEd25519Signer', () => {
    it('rejects non-Ed25519 keys', async () => {
        await expect(
            createJoseEd25519Signer({
                keypair: {
                    kty: 'EC',
                    crv: 'P-256',
                    x: 'abc',
                    d: 'def',
                },
                kid: 'did:key:z6Mk#z6Mk',
            })
        ).rejects.toMatchObject({ code: 'proof_signing_failed' });
    });

    it('produces a JWT verifiable with the matching public key', async () => {
        // Generate an Ed25519 keypair via jose, export to JWK form.
        const keys = await generateKeyPair('EdDSA', { extractable: true });
        const privJwk = await exportJWK(keys.privateKey);
        const pubJwk = await exportJWK(keys.publicKey);

        const signer = await createJoseEd25519Signer({
            keypair: {
                kty: privJwk.kty!,
                crv: privJwk.crv!,
                x: privJwk.x!,
                d: privJwk.d!,
            },
            kid: 'did:key:z6Mk#z6Mk',
        });

        const jwt = await buildProofJwt({
            signer,
            audience: 'https://issuer.example.com',
            nonce: 'nonce-value',
        });

        // Verify the JWT with the matching public key.
        const pubKey = await importJWK(pubJwk, 'EdDSA');
        const { payload, protectedHeader } = await jwtVerify(jwt, pubKey);

        expect(protectedHeader.alg).toBe('EdDSA');
        expect(protectedHeader.typ).toBe(OID4VCI_PROOF_TYP);
        expect(protectedHeader.kid).toBe('did:key:z6Mk#z6Mk');
        expect(payload.aud).toBe('https://issuer.example.com');
        expect(payload.nonce).toBe('nonce-value');
        expect(typeof payload.iat).toBe('number');
    });
});
