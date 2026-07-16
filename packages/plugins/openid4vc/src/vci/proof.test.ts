import { generateKeyPair, exportJWK, jwtVerify, importJWK } from 'jose';

import { buildProofJwt, createJoseEd25519Signer, OID4VCI_PROOF_TYP } from './proof';
import { ProofJwtSigner } from './types';

const fakeSigner = (
    opts: {
        alg?: string;
        kid?: string;
        sign?: ProofJwtSigner['sign'];
    } = {}
): ProofJwtSigner & {
    lastHeader?: Record<string, unknown>;
    lastPayload?: Record<string, unknown>;
} => {
    const signer = {
        alg: opts.alg ?? 'EdDSA',
        kid: opts.kid ?? 'did:key:z6Mk...#z6Mk...',
        sign: jest.fn().mockImplementation(async (header, payload) => {
            (signer as typeof signer & { lastHeader?: unknown; lastPayload?: unknown }).lastHeader =
                header;
            (
                signer as typeof signer & { lastHeader?: unknown; lastPayload?: unknown }
            ).lastPayload = payload;
            return opts.sign ? opts.sign(header, payload) : 'fake.jwt.signature';
        }),
    } as ProofJwtSigner & {
        lastHeader?: Record<string, unknown>;
        lastPayload?: Record<string, unknown>;
    };
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

        await expect(buildProofJwt({ signer, audience: '' })).rejects.toMatchObject({
            code: 'proof_signing_failed',
        });
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

describe('selectKeyProofType', () => {
    const { selectKeyProofType } = require('./proof');

    it('defaults to jwt when the config has no proof_types_supported', () => {
        expect(selectKeyProofType(undefined)).toEqual({ proofType: 'jwt' });
        expect(selectKeyProofType({ format: 'jwt_vc_json' })).toEqual({ proofType: 'jwt' });
    });

    it('prefers jwt when the issuer advertises both jwt and di_vp', () => {
        expect(
            selectKeyProofType({
                proof_types_supported: {
                    jwt: { proof_signing_alg_values_supported: ['EdDSA'] },
                    di_vp: { proof_signing_alg_values_supported: ['eddsa-rdfc-2022'] },
                },
            })
        ).toEqual({ proofType: 'jwt' });
    });

    it('selects di_vp with a supported cryptosuite when jwt is not advertised', () => {
        expect(
            selectKeyProofType({
                proof_types_supported: {
                    di_vp: {
                        proof_signing_alg_values_supported: ['ecdsa-rdfc-2019', 'eddsa-rdfc-2022'],
                    },
                },
            })
        ).toEqual({ proofType: 'di_vp', cryptosuite: 'eddsa-rdfc-2022' });
    });

    it('selects di_vp with no cryptosuite when the issuer lists none', () => {
        expect(selectKeyProofType({ proof_types_supported: { di_vp: {} } })).toEqual({
            proofType: 'di_vp',
        });
    });

    it('throws when di_vp is required but no cryptosuite is mutually supported', () => {
        expect(() =>
            selectKeyProofType({
                proof_types_supported: {
                    di_vp: { proof_signing_alg_values_supported: ['ecdsa-rdfc-2019'] },
                },
            })
        ).toThrow(/none of its cryptosuites are supported/);
    });

    it('throws when no advertised proof type is supported by the wallet', () => {
        expect(() => selectKeyProofType({ proof_types_supported: { attestation: {} } })).toThrow(
            /none of the wallet's key proof types/
        );
    });
});

describe('buildDiVpProof', () => {
    const { buildDiVpProof } = require('./proof');

    const signer = {
        holder: 'did:key:z6Mkholder',
        signPresentation: jest.fn(async (vp: Record<string, unknown>, opts: unknown) => ({
            ...vp,
            proof: { type: 'DataIntegrityProof', ...(opts as Record<string, unknown>) },
        })),
    };

    beforeEach(() => signer.signPresentation.mockClear());

    it('builds an unsigned VP with the holder and binds domain/challenge/cryptosuite', async () => {
        const vp = await buildDiVpProof({
            signer,
            audience: 'https://issuer.example.com',
            nonce: 'nonce-1',
            cryptosuite: 'eddsa-rdfc-2022',
        });

        expect(signer.signPresentation).toHaveBeenCalledWith(
            {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiablePresentation'],
                holder: 'did:key:z6Mkholder',
            },
            {
                domain: 'https://issuer.example.com',
                challenge: 'nonce-1',
                cryptosuite: 'eddsa-rdfc-2022',
            }
        );
        expect(vp.proof).toBeDefined();
    });

    it('rejects an empty audience', async () => {
        await expect(buildDiVpProof({ signer, audience: '' })).rejects.toThrow(
            /audience.*non-empty/
        );
    });

    it('wraps signer errors in a VciError', async () => {
        signer.signPresentation.mockRejectedValueOnce(new Error('boom'));

        await expect(
            buildDiVpProof({ signer, audience: 'https://issuer.example.com' })
        ).rejects.toMatchObject({ code: 'proof_signing_failed' });
    });
});
