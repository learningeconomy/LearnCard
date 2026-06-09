/**
 * Adapter unit tests — held credential → DcqlW3cVcCredential.
 *
 * These tests pin the contract the rest of the DCQL pipeline relies
 * on. Every change to the adapter that drops a previously-recognized
 * shape should cause a failure here, not a silent regression at
 * matcher time.
 */
import { adaptCredentialForDcql, adaptCredentialsForDcql } from './adapt';

/** Build a JWT-VC payload + encode as a fake compact JWS. */
const makeJwtVc = (vcBody: Record<string, unknown>): string => {
    const header = base64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64url(
        JSON.stringify({
            iss: 'did:jwk:abc',
            sub: 'did:jwk:holder',
            vc: vcBody,
        })
    );
    // Signature value doesn't matter to the adapter — it doesn't verify.
    return `${header}.${payload}.signature`;
};

const base64url = (s: string): string =>
    Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('adaptCredentialForDcql — jwt_vc_json', () => {
    it('decodes a compact JWT-VC into the canonical W3C DCQL shape', async () => {
        const jwt = makeJwtVc({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential', 'UniversityDegree'],
            credentialSubject: {
                id: 'did:jwk:holder',
                degreeName: 'BSc Comp Sci',
            },
        });

        const out = await adaptCredentialForDcql({ credential: jwt });

        expect(out).toEqual({
            credential_format: 'jwt_vc_json',
            type: ['VerifiableCredential', 'UniversityDegree'],
            claims: expect.objectContaining({
                type: ['VerifiableCredential', 'UniversityDegree'],
                credentialSubject: expect.objectContaining({
                    degreeName: 'BSc Comp Sci',
                }),
            }),
            cryptographic_holder_binding: true,
        });
    });

    it('honors an explicit format hint over the auto-inferred one', async () => {
        const jwt = makeJwtVc({
            type: ['VC'],
            credentialSubject: { id: 'did:jwk:holder' },
        });

        // The adapter shouldn't second-guess the caller's hint.
        const out = await adaptCredentialForDcql({ credential: jwt, format: 'jwt_vc_json' });
        expect(out?.credential_format).toBe('jwt_vc_json');
    });

    it('extracts type from a JWT-VC inside a proof.jwt envelope', async () => {
        // Some legacy issuers wrap the JWT-VC in an LDP-shaped envelope
        // with the actual JWS at `proof.jwt`. The adapter should peek
        // through.
        const inner = makeJwtVc({
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            credentialSubject: { id: 'did:jwk:holder' },
        });

        const ldpEnvelope = {
            proof: { type: 'JwtProof2020', jwt: inner },
        };

        const out = await adaptCredentialForDcql({ credential: ldpEnvelope });
        expect(out?.credential_format).toBe('jwt_vc_json');
        expect(out?.type).toEqual(['VerifiableCredential', 'OpenBadgeCredential']);
    });

    it('returns undefined for a non-JWS string', async () => {
        expect(await adaptCredentialForDcql({ credential: 'not.a.real.jwt' })).toBeUndefined();
    });

    it('returns undefined when JWT payload has no `vc` claim', async () => {
        const header = base64url(JSON.stringify({ alg: 'EdDSA' }));
        const payload = base64url(JSON.stringify({ iss: 'did:jwk:abc' /* no vc */ }));
        const jwt = `${header}.${payload}.sig`;

        expect(await adaptCredentialForDcql({ credential: jwt })).toBeUndefined();
    });

    it('returns undefined when the VC has no type array', async () => {
        const jwt = makeJwtVc({ credentialSubject: {} });
        expect(await adaptCredentialForDcql({ credential: jwt })).toBeUndefined();
    });

    it('coerces a string `type` into a single-element array', async () => {
        const jwt = makeJwtVc({
            type: 'VerifiableCredential',
            credentialSubject: {},
        });
        const out = await adaptCredentialForDcql({ credential: jwt });
        expect(out?.type).toEqual(['VerifiableCredential']);
    });
});

describe('adaptCredentialForDcql — ldp_vc', () => {
    it('passes a JSON-LD VC through with the right format tag', async () => {
        const ldVc = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential', 'UniversityDegree'],
            credentialSubject: { id: 'did:jwk:holder', name: 'Alice' },
            proof: { type: 'Ed25519Signature2020', proofValue: 'z...' },
        };

        const out = await adaptCredentialForDcql({ credential: ldVc });

        expect(out).toEqual({
            credential_format: 'ldp_vc',
            type: ['VerifiableCredential', 'UniversityDegree'],
            claims: expect.objectContaining({
                credentialSubject: expect.objectContaining({ name: 'Alice' }),
            }),
            cryptographic_holder_binding: true,
        });
    });

    it('returns undefined for a credential with no proof', async () => {
        // `inferDcqlFormat` only returns ldp_vc when proof is present;
        // a bare object with no proof falls through to "unknown format"
        // and the adapter returns undefined. This is the same behavior
        // PEX selector exhibits — keep them in lockstep.
        const out = await adaptCredentialForDcql({
            credential: {
                type: ['VerifiableCredential'],
                credentialSubject: {},
            },
        });
        expect(out).toBeUndefined();
    });

    it('returns undefined for a JSON-LD VC with no type', async () => {
        const out = await adaptCredentialForDcql({
            credential: {
                credentialSubject: {},
                proof: { type: 'Ed25519Signature2020' },
            },
        });
        expect(out).toBeUndefined();
    });
});

describe('adaptCredentialForDcql — unsupported', () => {
    it('returns undefined for null / number / undefined inputs', async () => {
        expect(await adaptCredentialForDcql({ credential: null })).toBeUndefined();
        expect(await adaptCredentialForDcql({ credential: 42 })).toBeUndefined();
        expect(await adaptCredentialForDcql({ credential: undefined })).toBeUndefined();
    });

    it('returns undefined for sd-jwt-vc compact serialization', async () => {
        // SD-JWT compact serialization uses tilde-delimited segments,
        // not three dot-separated. The adapter currently doesn't
        // support sd-jwt-vc and should drop the candidate cleanly
        // rather than mis-decoding it as jwt_vc_json.
        expect(
            await adaptCredentialForDcql({
                credential: 'eyJhbGc.eyJ2Yy.sig~disclosure1~disclosure2',
            })
        ).toBeUndefined();
    });

    it('honors a non-supported explicit format hint by dropping', async () => {
        // Caller explicitly says vc+sd-jwt — adapter doesn't yet
        // handle that branch and returns undefined.
        const jwt = makeJwtVc({ type: ['VC'], credentialSubject: {} });
        expect(
            await adaptCredentialForDcql({ credential: jwt, format: 'vc+sd-jwt' })
        ).toBeUndefined();
    });
});

describe('adaptCredentialForDcql — sd-jwt-vc with parser', () => {
    const VCT = 'https://example.com/credentials/sd-jwt-test';
    const compact = 'header.payload.signature~Wyx~';

    const parser = async (input: string) => {
        expect(input).toBe(compact);
        return {
            claims: {
                vct: VCT,
                iss: 'did:jwk:issuer',
                iat: 1700000000,
                given_name: 'Ada',
            },
            vct: VCT,
            issuer: 'did:jwk:issuer',
            holderPublicKey: { kty: 'OKP', crv: 'Ed25519', x: 'xxx' },
        };
    };

    it('emits a DcqlSdJwtVcCredential when given a compact string + parser', async () => {
        const out = await adaptCredentialForDcql(
            { credential: compact, format: 'dc+sd-jwt' },
            { sdJwtParser: parser }
        );
        expect(out?.credential_format).toBe('dc+sd-jwt');
        if (out?.credential_format === 'dc+sd-jwt' || out?.credential_format === 'vc+sd-jwt') {
            expect(out.vct).toBe(VCT);
            expect(out.cryptographic_holder_binding).toBe(true);
            expect(out.claims).toMatchObject({ given_name: 'Ada' });
        }
    });

    it('emits the right format when caller passes vc+sd-jwt', async () => {
        const out = await adaptCredentialForDcql(
            { credential: compact, format: 'vc+sd-jwt' },
            { sdJwtParser: parser }
        );
        expect(out?.credential_format).toBe('vc+sd-jwt');
    });

    it('extracts compact from a W3C-wrapped SD-JWT (proof.type=SdJwtCompactProof)', async () => {
        const wrapper = {
            type: ['VerifiableCredential', 'SdJwtVcCredential'],
            issuer: 'did:jwk:issuer',
            sdJwtVct: VCT,
            proof: { type: 'SdJwtCompactProof', jwt: compact },
        };
        const out = await adaptCredentialForDcql({ credential: wrapper }, { sdJwtParser: parser });
        expect(out?.credential_format).toBe('dc+sd-jwt');
    });

    it('returns undefined when sdJwtParser is missing', async () => {
        const out = await adaptCredentialForDcql({ credential: compact, format: 'dc+sd-jwt' });
        expect(out).toBeUndefined();
    });

    it('returns undefined when the parser throws', async () => {
        const out = await adaptCredentialForDcql(
            { credential: compact, format: 'dc+sd-jwt' },
            {
                sdJwtParser: async () => {
                    throw new Error('decode failed');
                },
            }
        );
        expect(out).toBeUndefined();
    });

    it('flags cryptographic_holder_binding=false when there is no cnf', async () => {
        const noBindingParser = async () => ({
            claims: { vct: VCT, iss: 'did:jwk:i' },
            vct: VCT,
            issuer: 'did:jwk:i',
        });
        const out = await adaptCredentialForDcql(
            { credential: compact, format: 'dc+sd-jwt' },
            { sdJwtParser: noBindingParser }
        );
        expect(out?.credential_format).toBe('dc+sd-jwt');
        if (out?.credential_format === 'dc+sd-jwt') {
            expect(out.cryptographic_holder_binding).toBe(false);
        }
    });
});

describe('adaptCredentialsForDcql — batch', () => {
    it('drops unsupported entries silently and pairs adapted with original', async () => {
        const jwt = makeJwtVc({
            type: ['VerifiableCredential', 'UniversityDegree'],
            credentialSubject: {},
        });
        const ldVc = {
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            credentialSubject: {},
            proof: { type: 'Ed25519Signature2020' },
        };
        const garbage = { foo: 'bar' };

        const result = await adaptCredentialsForDcql([
            { credential: jwt },
            { credential: ldVc },
            { credential: garbage },
        ]);

        expect(result).toHaveLength(2);
        expect(result[0]?.adapted.credential_format).toBe('jwt_vc_json');
        expect(result[0]?.original.credential).toBe(jwt);
        expect(result[1]?.adapted.credential_format).toBe('ldp_vc');
        expect(result[1]?.original.credential).toBe(ldVc);
    });
});
