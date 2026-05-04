import {
    exportJWK,
    generateKeyPair,
    importJWK,
    jwtVerify,
    SignJWT,
} from 'jose';
import type { JWK } from 'jose';

import {
    signIdToken,
    SiopSignError,
    responseTypeSet,
    requiresIdToken,
} from './sign';
import { ProofJwtSigner } from '../vci/types';

/* ---------------------------------- fixtures --------------------------------- */

const HOLDER = 'did:jwk:holder';
const AUDIENCE = 'https://verifier.example/openid4vc/verify';
const NONCE = 'nonce-0xDEADBEEF';

const makeJwtSigner = (
    overrides: Partial<ProofJwtSigner> = {}
): ProofJwtSigner & {
    lastHeader?: Record<string, unknown>;
    lastPayload?: Record<string, unknown>;
    signCount: number;
} => {
    const signer = {
        alg: 'EdDSA',
        kid: 'did:jwk:holder#0',
        signCount: 0,
        lastHeader: undefined as Record<string, unknown> | undefined,
        lastPayload: undefined as Record<string, unknown> | undefined,
        sign: jest.fn(
            async (
                header: Record<string, unknown>,
                payload: Record<string, unknown>
            ): Promise<string> => {
                signer.lastHeader = header;
                signer.lastPayload = payload;
                signer.signCount += 1;
                return 'header.payload.signature';
            }
        ),
        ...overrides,
    };
    return signer;
};

/* ---------------------------------- tests ---------------------------------- */

describe('signIdToken — happy paths', () => {
    it('builds a SIOPv2-shaped payload with iss=sub=holder by default', async () => {
        const signer = makeJwtSigner();

        await signIdToken(
            {
                holder: HOLDER,
                audience: AUDIENCE,
                nonce: NONCE,
                iat: 1_700_000_000,
            },
            { signer }
        );

        expect(signer.lastPayload).toEqual({
            iss: HOLDER,
            sub: HOLDER,
            aud: AUDIENCE,
            nonce: NONCE,
            iat: 1_700_000_000,
            exp: 1_700_000_000 + 300,
        });
    });

    it('honors issuerMode=self-issued.me per SIOPv2 §9', async () => {
        const signer = makeJwtSigner();

        await signIdToken(
            {
                holder: HOLDER,
                audience: AUDIENCE,
                nonce: NONCE,
                iat: 1_700_000_000,
                issuerMode: 'self-issued.me',
            },
            { signer }
        );

        expect(signer.lastPayload).toMatchObject({
            iss: 'https://self-issued.me/v2',
            sub: HOLDER,
        });
    });

    it('respects a custom lifetimeSeconds', async () => {
        const signer = makeJwtSigner();

        await signIdToken(
            {
                holder: HOLDER,
                audience: AUDIENCE,
                nonce: NONCE,
                iat: 1_700_000_000,
                lifetimeSeconds: 60,
            },
            { signer }
        );

        expect(signer.lastPayload?.exp).toBe(1_700_000_000 + 60);
    });

    it('attaches _vp_token binding when vpTokenHash is supplied', async () => {
        const signer = makeJwtSigner();

        await signIdToken(
            {
                holder: HOLDER,
                audience: AUDIENCE,
                nonce: NONCE,
                iat: 1_700_000_000,
                vpTokenHash: 'sha256:abc123',
            },
            { signer }
        );

        expect(signer.lastPayload?._vp_token).toEqual({
            vp_token_hash: 'sha256:abc123',
        });
    });

    it('sets alg/kid/typ in the protected header', async () => {
        const signer = makeJwtSigner({ alg: 'ES256', kid: 'did:web:holder#k1' });

        await signIdToken(
            { holder: HOLDER, audience: AUDIENCE, nonce: NONCE },
            { signer }
        );

        expect(signer.lastHeader).toEqual({
            alg: 'ES256',
            kid: 'did:web:holder#k1',
            typ: 'JWT',
        });
    });

    it('returns the compact JWS from the signer', async () => {
        const signer = makeJwtSigner();
        const result = await signIdToken(
            { holder: HOLDER, audience: AUDIENCE, nonce: NONCE },
            { signer }
        );
        expect(result.idToken).toBe('header.payload.signature');
    });

    it('defaults iat to Math.floor(Date.now()/1000) when omitted', async () => {
        const signer = makeJwtSigner();
        const before = Math.floor(Date.now() / 1000);

        await signIdToken(
            { holder: HOLDER, audience: AUDIENCE, nonce: NONCE },
            { signer }
        );

        const after = Math.floor(Date.now() / 1000);
        const iat = signer.lastPayload?.iat as number;
        expect(iat).toBeGreaterThanOrEqual(before);
        expect(iat).toBeLessThanOrEqual(after);
    });
});

describe('signIdToken — input validation', () => {
    it('rejects an empty holder', async () => {
        await expect(
            signIdToken(
                { holder: '', audience: AUDIENCE, nonce: NONCE },
                { signer: makeJwtSigner() }
            )
        ).rejects.toMatchObject({ name: 'SiopSignError', code: 'invalid_input' });
    });

    it('rejects an empty audience', async () => {
        await expect(
            signIdToken(
                { holder: HOLDER, audience: '', nonce: NONCE },
                { signer: makeJwtSigner() }
            )
        ).rejects.toMatchObject({ code: 'invalid_input' });
    });

    it('rejects an empty nonce', async () => {
        await expect(
            signIdToken(
                { holder: HOLDER, audience: AUDIENCE, nonce: '' },
                { signer: makeJwtSigner() }
            )
        ).rejects.toMatchObject({ code: 'invalid_input' });
    });

    it('rejects a missing signer', async () => {
        await expect(
            signIdToken(
                { holder: HOLDER, audience: AUDIENCE, nonce: NONCE },
                {} as unknown as { signer: ProofJwtSigner }
            )
        ).rejects.toMatchObject({ code: 'missing_signer' });
    });
});

describe('signIdToken — error wrapping', () => {
    it('wraps signer exceptions as id_token_sign_failed', async () => {
        const signer = makeJwtSigner({
            sign: jest.fn().mockRejectedValue(new Error('HSM unavailable')),
        });

        await expect(
            signIdToken(
                { holder: HOLDER, audience: AUDIENCE, nonce: NONCE },
                { signer }
            )
        ).rejects.toBeInstanceOf(SiopSignError);

        try {
            await signIdToken(
                { holder: HOLDER, audience: AUDIENCE, nonce: NONCE },
                { signer }
            );
        } catch (e) {
            const err = e as SiopSignError;
            expect(err.code).toBe('id_token_sign_failed');
            expect(err.message).toMatch(/HSM unavailable/);
        }
    });
});

describe('responseTypeSet / requiresIdToken', () => {
    it('parses space-separated response_type values', () => {
        expect(responseTypeSet('vp_token id_token')).toEqual(
            new Set(['vp_token', 'id_token'])
        );
        expect(responseTypeSet('vp_token')).toEqual(new Set(['vp_token']));
        expect(responseTypeSet(undefined)).toEqual(new Set());
        expect(responseTypeSet('')).toEqual(new Set());
    });

    it('requiresIdToken returns true only when id_token is present', () => {
        expect(requiresIdToken('vp_token id_token')).toBe(true);
        expect(requiresIdToken('id_token')).toBe(true);
        expect(requiresIdToken('vp_token')).toBe(false);
        expect(requiresIdToken(undefined)).toBe(false);
    });
});

/* -------------- real-crypto happy path (round-trip verify) ----------------- */

describe('signIdToken — real Ed25519 round trip', () => {
    it('produces a JWS a verifier can verify end-to-end', async () => {
        const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
            crv: 'Ed25519',
            extractable: true,
        })) as { privateKey: CryptoKey; publicKey: CryptoKey };

        const publicJwk = await exportJWK(publicKey);

        const realSigner: ProofJwtSigner = {
            alg: 'EdDSA',
            kid: 'did:jwk:real#0',
            sign: async (header, payload) =>
                new SignJWT(payload as Record<string, unknown>)
                    .setProtectedHeader({
                        ...(header as Record<string, unknown>),
                        alg: 'EdDSA',
                    } as any)
                    .sign(privateKey),
        };

        // Use a live `iat` so the 5-min exp window is still open when
        // jwtVerify runs the claim-set checks a few ms later.
        const iat = Math.floor(Date.now() / 1000);

        const { idToken } = await signIdToken(
            {
                holder: 'did:jwk:real',
                audience: AUDIENCE,
                nonce: NONCE,
                iat,
            },
            { signer: realSigner }
        );

        // Verify with the public half — audience + nonce binding.
        const key = await importJWK(publicJwk as JWK, 'EdDSA');
        const { payload } = await jwtVerify(idToken, key, {
            audience: AUDIENCE,
        });

        expect(payload).toMatchObject({
            iss: 'did:jwk:real',
            sub: 'did:jwk:real',
            aud: AUDIENCE,
            nonce: NONCE,
        });
    });
});
