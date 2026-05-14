import { UnsignedVP, VP } from '@learncard/types';

import {
    signPresentation,
    VpSignError,
    LdpVpSigner,
} from './sign';
import { ProofJwtSigner } from '../vci/types';

/* ---------------------------------- fixtures --------------------------------- */

const HOLDER = 'did:jwk:holder';
const AUDIENCE = 'https://verifier.example/openid4vc/verify';
const NONCE = 'f714ce4d-26f7-4337-a968-bb9047069422';

const unsignedVp: UnsignedVP = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:11111111-2222-4333-8444-555555555555',
    type: ['VerifiablePresentation'],
    holder: HOLDER,
    verifiableCredential: [],
};

const makeJwtSigner = (
    overrides: Partial<ProofJwtSigner> = {}
): ProofJwtSigner & {
    lastHeader?: Record<string, unknown>;
    lastPayload?: Record<string, unknown>;
    signCount: number;
} => {
    const signer = {
        alg: 'EdDSA',
        kid: 'did:jwk:holder#keys-1',
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

const makeLdpSigner = (): LdpVpSigner & {
    lastInput?: UnsignedVP;
    lastOptions?: { domain: string; challenge: string };
    signCount: number;
} => {
    const signer = {
        lastInput: undefined as UnsignedVP | undefined,
        lastOptions: undefined as { domain: string; challenge: string } | undefined,
        signCount: 0,
        sign: jest.fn(
            async (
                vp: UnsignedVP,
                opts: { domain: string; challenge: string }
            ): Promise<VP> => {
                signer.lastInput = vp;
                signer.lastOptions = opts;
                signer.signCount += 1;
                return {
                    ...vp,
                    proof: {
                        type: 'Ed25519Signature2020',
                        created: '2024-01-01T00:00:00Z',
                        verificationMethod: 'did:jwk:holder#keys-1',
                        proofPurpose: 'authentication',
                        domain: opts.domain,
                        challenge: opts.challenge,
                        proofValue: 'z-proof-placeholder',
                    },
                } as VP;
            }
        ),
    };
    return signer;
};

/* ------------------------------------ tests --------------------------------- */

describe('signPresentation — jwt_vp_json', () => {
    it('produces a compact JWS via the injected jwtSigner', async () => {
        const signer = makeJwtSigner();

        const result = await signPresentation(
            {
                unsignedVp,
                vpFormat: 'jwt_vp_json',
                audience: AUDIENCE,
                nonce: NONCE,
                holder: HOLDER,
                iat: 1_700_000_000,
            },
            { jwtSigner: signer }
        );

        expect(result.vpFormat).toBe('jwt_vp_json');
        expect(result.vpToken).toBe('header.payload.signature');
        expect(signer.signCount).toBe(1);
    });

    it('builds a VCDM §6.3.1-compliant JWT payload', async () => {
        const signer = makeJwtSigner();

        await signPresentation(
            {
                unsignedVp,
                vpFormat: 'jwt_vp_json',
                audience: AUDIENCE,
                nonce: NONCE,
                holder: HOLDER,
                iat: 1_700_000_000,
            },
            { jwtSigner: signer }
        );

        expect(signer.lastPayload).toEqual({
            iss: HOLDER,
            sub: HOLDER,
            aud: AUDIENCE,
            nonce: NONCE,
            iat: 1_700_000_000,
            jti: unsignedVp.id,
            vp: unsignedVp,
        });
    });

    it('sets the protected header with alg, kid, and typ:JWT', async () => {
        const signer = makeJwtSigner({ alg: 'ES256', kid: 'did:web:holder#k1' });

        await signPresentation(
            {
                unsignedVp,
                vpFormat: 'jwt_vp_json',
                audience: AUDIENCE,
                nonce: NONCE,
                holder: HOLDER,
            },
            { jwtSigner: signer }
        );

        expect(signer.lastHeader).toEqual({
            alg: 'ES256',
            kid: 'did:web:holder#k1',
            typ: 'JWT',
        });
    });

    it('omits jti when the unsigned VP has no id and none is supplied', async () => {
        const signer = makeJwtSigner();
        const { id: _id, ...vpNoId } = unsignedVp;

        await signPresentation(
            {
                unsignedVp: vpNoId as UnsignedVP,
                vpFormat: 'jwt_vp_json',
                audience: AUDIENCE,
                nonce: NONCE,
                holder: HOLDER,
                iat: 1_700_000_000,
            },
            { jwtSigner: signer }
        );

        expect(signer.lastPayload).not.toHaveProperty('jti');
    });

    it('respects an explicit jti override', async () => {
        const signer = makeJwtSigner();

        await signPresentation(
            {
                unsignedVp,
                vpFormat: 'jwt_vp_json',
                audience: AUDIENCE,
                nonce: NONCE,
                holder: HOLDER,
                jti: 'custom-jti',
            },
            { jwtSigner: signer }
        );

        expect(signer.lastPayload?.jti).toBe('custom-jti');
    });

    it('defaults iat to now when not overridden', async () => {
        const signer = makeJwtSigner();
        const before = Math.floor(Date.now() / 1000);

        await signPresentation(
            {
                unsignedVp,
                vpFormat: 'jwt_vp_json',
                audience: AUDIENCE,
                nonce: NONCE,
                holder: HOLDER,
            },
            { jwtSigner: signer }
        );

        const after = Math.floor(Date.now() / 1000);
        const iat = signer.lastPayload?.iat as number;
        expect(typeof iat).toBe('number');
        expect(iat).toBeGreaterThanOrEqual(before);
        expect(iat).toBeLessThanOrEqual(after);
    });

    it('wraps signer errors in VpSignError with code jwt_sign_failed', async () => {
        const signer = makeJwtSigner({
            sign: jest.fn().mockRejectedValue(new Error('kid not found')),
        });

        await expect(
            signPresentation(
                {
                    unsignedVp,
                    vpFormat: 'jwt_vp_json',
                    audience: AUDIENCE,
                    nonce: NONCE,
                    holder: HOLDER,
                },
                { jwtSigner: signer }
            )
        ).rejects.toThrow(VpSignError);

        try {
            await signPresentation(
                {
                    unsignedVp,
                    vpFormat: 'jwt_vp_json',
                    audience: AUDIENCE,
                    nonce: NONCE,
                    holder: HOLDER,
                },
                { jwtSigner: signer }
            );
        } catch (e) {
            expect((e as VpSignError).code).toBe('jwt_sign_failed');
            expect((e as VpSignError).message).toMatch(/kid not found/);
        }
    });
});

describe('signPresentation — ldp_vp', () => {
    it('delegates to ldpVpSigner, mapping audience→domain + nonce→challenge', async () => {
        const signer = makeLdpSigner();

        const result = await signPresentation(
            {
                unsignedVp,
                vpFormat: 'ldp_vp',
                audience: AUDIENCE,
                nonce: NONCE,
                holder: HOLDER,
            },
            { ldpVpSigner: signer }
        );

        expect(result.vpFormat).toBe('ldp_vp');
        expect(signer.signCount).toBe(1);
        expect(signer.lastInput).toEqual(unsignedVp);
        expect(signer.lastOptions).toEqual({ domain: AUDIENCE, challenge: NONCE });

        // Returned vpToken is the signed VP with an LD proof carrying
        // our replay-binding fields.
        const vp = result.vpToken as VP;
        expect(vp.proof).toBeDefined();
        const proof = Array.isArray(vp.proof) ? vp.proof[0] : vp.proof;
        expect(proof.domain).toBe(AUDIENCE);
        expect(proof.challenge).toBe(NONCE);
    });

    it('wraps signer errors in VpSignError with code ldp_sign_failed', async () => {
        const signer: LdpVpSigner = {
            sign: jest.fn().mockRejectedValue(new Error('no didkit')),
        };

        await expect(
            signPresentation(
                {
                    unsignedVp,
                    vpFormat: 'ldp_vp',
                    audience: AUDIENCE,
                    nonce: NONCE,
                    holder: HOLDER,
                },
                { ldpVpSigner: signer }
            )
        ).rejects.toThrow(VpSignError);
    });
});

describe('signPresentation — missing dependencies', () => {
    it('throws missing_jwt_signer when vpFormat=jwt_vp_json with no jwtSigner', async () => {
        await expect(
            signPresentation(
                {
                    unsignedVp,
                    vpFormat: 'jwt_vp_json',
                    audience: AUDIENCE,
                    nonce: NONCE,
                    holder: HOLDER,
                },
                {}
            )
        ).rejects.toMatchObject({
            name: 'VpSignError',
            code: 'missing_jwt_signer',
        });
    });

    it('throws missing_ldp_signer when vpFormat=ldp_vp with no ldpVpSigner', async () => {
        await expect(
            signPresentation(
                {
                    unsignedVp,
                    vpFormat: 'ldp_vp',
                    audience: AUDIENCE,
                    nonce: NONCE,
                    holder: HOLDER,
                },
                {}
            )
        ).rejects.toMatchObject({
            name: 'VpSignError',
            code: 'missing_ldp_signer',
        });
    });
});

describe('signPresentation — input validation', () => {
    const base = {
        unsignedVp,
        vpFormat: 'jwt_vp_json' as const,
        audience: AUDIENCE,
        nonce: NONCE,
        holder: HOLDER,
    };

    it('rejects a holder that mismatches unsignedVp.holder', async () => {
        await expect(
            signPresentation(
                { ...base, holder: 'did:web:someone-else' },
                { jwtSigner: makeJwtSigner() }
            )
        ).rejects.toMatchObject({ code: 'holder_mismatch' });
    });

    it('rejects empty audience', async () => {
        await expect(
            signPresentation({ ...base, audience: '' }, { jwtSigner: makeJwtSigner() })
        ).rejects.toMatchObject({ code: 'invalid_input' });
    });

    it('rejects empty nonce', async () => {
        await expect(
            signPresentation({ ...base, nonce: '' }, { jwtSigner: makeJwtSigner() })
        ).rejects.toMatchObject({ code: 'invalid_input' });
    });

    it('rejects empty holder', async () => {
        await expect(
            signPresentation({ ...base, holder: '' }, { jwtSigner: makeJwtSigner() })
        ).rejects.toMatchObject({ code: 'invalid_input' });
    });

    it('accepts an unsignedVp with no holder field (caller-only binding)', async () => {
        const { holder: _holder, ...vpNoHolder } = unsignedVp;
        const signer = makeJwtSigner();

        const result = await signPresentation(
            {
                ...base,
                unsignedVp: vpNoHolder as UnsignedVP,
            },
            { jwtSigner: signer }
        );

        expect(result.vpToken).toBeDefined();
        expect(signer.lastPayload?.iss).toBe(HOLDER);
    });
});
