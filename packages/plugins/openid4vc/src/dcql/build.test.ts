/**
 * Build-step unit tests — chosen credentials → per-query unsigned VPs.
 *
 * Covers both happy paths (single, multi-query) and every typed
 * failure mode (empty, unknown id, unsupported format, malformed
 * inner credential).
 */
import { buildDcqlPresentations, BuildDcqlPresentationError } from './build';
import { parseDcqlQuery } from './parse';

const universityDegreeJwt = makeJwtVc({
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: { id: 'did:jwk:holder' },
});

const openBadgeJwt = makeJwtVc({
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    credentialSubject: { id: 'did:jwk:holder' },
});

const ldpDegree = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: { id: 'did:jwk:holder' },
    proof: { type: 'Ed25519Signature2020', proofValue: 'z...' },
};

describe('buildDcqlPresentations — happy paths', () => {
    it('produces one unsigned VP per credential_query_id', () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
                {
                    id: 'badge',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'OpenBadgeCredential']] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [
                { credentialQueryId: 'degree', candidate: { credential: universityDegreeJwt } },
                { credentialQueryId: 'badge', candidate: { credential: openBadgeJwt } },
            ],
            holder: 'did:jwk:holder',
        });

        expect(built).toHaveLength(2);
        expect(built[0]?.credentialQueryId).toBe('degree');
        expect(built[0]?.vpFormat).toBe('jwt_vp_json');
        expect(built[0]?.unsignedVp.holder).toBe('did:jwk:holder');
        expect(built[0]?.unsignedVp.verifiableCredential).toEqual([universityDegreeJwt]);
        expect(built[1]?.credentialQueryId).toBe('badge');
        expect(built[1]?.unsignedVp.verifiableCredential).toEqual([openBadgeJwt]);
    });

    it('preserves the verifier-declared credentials[] order in the output', () => {
        // Order chosen[] BACKWARDS from query order — the result must
        // still come out in query order so the eventual vp_token
        // object's iteration matches what the verifier expects.
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'first',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
                {
                    id: 'second',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'OpenBadgeCredential']] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [
                { credentialQueryId: 'second', candidate: { credential: openBadgeJwt } },
                { credentialQueryId: 'first', candidate: { credential: universityDegreeJwt } },
            ],
            holder: 'did:jwk:holder',
        });

        expect(built.map(b => b.credentialQueryId)).toEqual(['first', 'second']);
    });

    it('packs multiple chosen candidates into a single VP for one query id', () => {
        // DCQL `multiple: true` semantics — the wallet returns one VP
        // for that query id, but the VP can wrap multiple matching
        // credentials.
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'any_degree',
                    format: 'jwt_vc_json',
                    multiple: true,
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
            ],
        });

        const second = makeJwtVc({
            type: ['VerifiableCredential', 'UniversityDegree'],
            credentialSubject: { id: 'did:jwk:holder', name: 'Bob' },
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [
                { credentialQueryId: 'any_degree', candidate: { credential: universityDegreeJwt } },
                { credentialQueryId: 'any_degree', candidate: { credential: second } },
            ],
            holder: 'did:jwk:holder',
        });

        expect(built).toHaveLength(1);
        expect(built[0]?.unsignedVp.verifiableCredential).toEqual([
            universityDegreeJwt,
            second,
        ]);
        expect(built[0]?.candidates).toHaveLength(2);
    });

    it('chooses ldp_vp envelope for an ldp_vc query', () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'ld_degree',
                    format: 'ldp_vc',
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [{ credentialQueryId: 'ld_degree', candidate: { credential: ldpDegree } }],
            holder: 'did:jwk:holder',
        });

        expect(built[0]?.vpFormat).toBe('ldp_vp');
        expect(built[0]?.unsignedVp.verifiableCredential).toEqual([ldpDegree]);
    });

    it('unwraps a JWT-VC inside a proof.jwt LDP envelope', () => {
        const inner = makeJwtVc({
            type: ['VerifiableCredential', 'UniversityDegree'],
            credentialSubject: {},
        });
        const ldpEnvelope = {
            proof: { type: 'JwtProof2020', jwt: inner },
        };

        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [{ credentialQueryId: 'degree', candidate: { credential: ldpEnvelope } }],
            holder: 'did:jwk:holder',
        });

        // The compact JWS, not the LDP envelope, must end up in the VP.
        expect(built[0]?.unsignedVp.verifiableCredential).toEqual([inner]);
    });

    it('skips queries with no matching chosen entry without erroring', () => {
        // The verifier asked for two; the holder only had/picked one.
        // The builder shouldn't fabricate a VP for the unfulfilled
        // query — caller's selector is responsible for that decision.
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
                {
                    id: 'license',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'DriverLicense']] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [
                { credentialQueryId: 'degree', candidate: { credential: universityDegreeJwt } },
            ],
            holder: 'did:jwk:holder',
        });

        expect(built).toHaveLength(1);
        expect(built[0]?.credentialQueryId).toBe('degree');
    });
});

describe('buildDcqlPresentations — typed errors', () => {
    const baseQuery = parseDcqlQuery({
        credentials: [
            {
                id: 'degree',
                format: 'jwt_vc_json',
                meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
            },
        ],
    });

    it('throws no_selections for an empty chosen[] array', () => {
        expect(() =>
            buildDcqlPresentations({ query: baseQuery, chosen: [], holder: 'did:jwk:h' })
        ).toThrow(BuildDcqlPresentationError);
    });

    it('throws unknown_credential_query when a chosen entry references a missing id', () => {
        try {
            buildDcqlPresentations({
                query: baseQuery,
                chosen: [
                    {
                        credentialQueryId: 'totally_not_in_the_query',
                        candidate: { credential: universityDegreeJwt },
                    },
                ],
                holder: 'did:jwk:h',
            });
            fail('expected throw');
        } catch (e) {
            expect(e).toBeInstanceOf(BuildDcqlPresentationError);
            expect((e as BuildDcqlPresentationError).code).toBe('unknown_credential_query');
        }
    });

    it('throws unsupported_format for a sd-jwt-vc / mso_mdoc query', () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'sd',
                    format: 'vc+sd-jwt',
                    meta: { vct_values: ['urn:test:credential'] },
                },
            ],
        });

        try {
            buildDcqlPresentations({
                query,
                chosen: [
                    {
                        credentialQueryId: 'sd',
                        candidate: { credential: 'doesnt-matter~for~now' },
                    },
                ],
                holder: 'did:jwk:h',
            });
            fail('expected throw');
        } catch (e) {
            expect(e).toBeInstanceOf(BuildDcqlPresentationError);
            expect((e as BuildDcqlPresentationError).code).toBe('unsupported_format');
        }
    });

    it('throws invalid_jwt_vc when a jwt_vc_json candidate has no compact JWS', () => {
        try {
            buildDcqlPresentations({
                query: baseQuery,
                chosen: [
                    { credentialQueryId: 'degree', candidate: { credential: 'not-a-jwt' } },
                ],
                holder: 'did:jwk:h',
            });
            fail('expected throw');
        } catch (e) {
            expect(e).toBeInstanceOf(BuildDcqlPresentationError);
            expect((e as BuildDcqlPresentationError).code).toBe('invalid_jwt_vc');
        }
    });
});

/* ----------------------------- helpers --------------------------------- */

function makeJwtVc(vcBody: Record<string, unknown>): string {
    const header = base64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64url(
        JSON.stringify({
            iss: 'did:jwk:abc',
            sub: 'did:jwk:holder',
            vc: vcBody,
        })
    );
    return `${header}.${payload}.signature`;
}

function base64url(s: string): string {
    return Buffer.from(s)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
