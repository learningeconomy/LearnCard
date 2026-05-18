/**
 * Holder selector tests — `selectCredentialsForDcql` over a candidate
 * pool against parsed DCQL queries.
 *
 * Test design mirrors `vp/select.test.ts` for PEX: build a small
 * candidate pool of representative wire-shape credentials, hand it +
 * a parsed query to the selector, assert the per-query matches and
 * the overall `canSatisfy`. Cross-checks include:
 *
 *   - happy path: query asks for X, candidate has X, candidate appears
 *     in matches[query_id].candidates
 *   - filter on type: query asks for X, candidate has Y, no match
 *   - filter on claim values: query requires `degreeName === "BSc"`,
 *     candidates with other values rejected
 *   - multiple credentials: two queries, two candidates, both
 *     satisfied
 *   - credential_sets: verifier asks for "X OR Y"; one candidate
 *     suffices to mark the set satisfied
 */
import { parseDcqlQuery } from './parse';
import { selectCredentialsForDcql } from './select';

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
    return `${header}.${payload}.signature`;
};

const base64url = (s: string): string =>
    Buffer.from(s)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

const universityDegreeJwt = makeJwtVc({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: {
        id: 'did:jwk:holder',
        degreeName: 'BSc Comp Sci',
    },
});

const openBadgeJwt = makeJwtVc({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    credentialSubject: {
        id: 'did:jwk:holder',
        achievement: { name: 'Web Dev I' },
    },
});

const mastersDegreeLdp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: {
        id: 'did:jwk:holder',
        degreeName: 'MSc Comp Sci',
    },
    proof: { type: 'Ed25519Signature2020', proofValue: 'z...' },
};

describe('selectCredentialsForDcql — single credential query', () => {
    it('finds a JWT-VC matching by type', () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'UniversityDegree']],
                    },
                },
            ],
        });

        const result = selectCredentialsForDcql(
            [{ credential: universityDegreeJwt }, { credential: openBadgeJwt }],
            query
        );

        expect(result.canSatisfy).toBe(true);
        expect(result.matches.degree?.candidates).toHaveLength(1);
        expect(result.matches.degree?.candidates[0]?.credential).toBe(
            universityDegreeJwt
        );
    });

    it('returns canSatisfy=false when no candidate matches', () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'driver_license',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'DriverLicense']],
                    },
                },
            ],
        });

        const result = selectCredentialsForDcql(
            [{ credential: universityDegreeJwt }, { credential: openBadgeJwt }],
            query
        );

        expect(result.canSatisfy).toBe(false);
        expect(result.matches.driver_license?.candidates).toHaveLength(0);
        expect(result.matches.driver_license?.reason).toMatch(/no held credential/i);
        expect(result.reason).toBeDefined();
    });

    it('filters on a claim value', () => {
        // The query asks specifically for a BSc — the MSc candidate
        // must be excluded even though both share the type.
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'bsc',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'UniversityDegree']],
                    },
                    claims: [
                        {
                            path: ['credentialSubject', 'degreeName'],
                            values: ['BSc Comp Sci'],
                        },
                    ],
                },
            ],
        });

        const result = selectCredentialsForDcql(
            [
                { credential: universityDegreeJwt },
                {
                    credential: makeJwtVc({
                        type: ['VerifiableCredential', 'UniversityDegree'],
                        credentialSubject: { degreeName: 'MSc Different' },
                    }),
                },
            ],
            query
        );

        expect(result.canSatisfy).toBe(true);
        expect(result.matches.bsc?.candidates).toHaveLength(1);
    });
});

describe('selectCredentialsForDcql — format gating', () => {
    it("only matches credentials whose format matches the query's", () => {
        // Query asks for ldp_vc; the JWT-VC candidate must be
        // excluded even though its type matches.
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'ldp_only',
                    format: 'ldp_vc',
                    meta: {
                        type_values: [['VerifiableCredential', 'UniversityDegree']],
                    },
                },
            ],
        });

        const result = selectCredentialsForDcql(
            [
                { credential: universityDegreeJwt },
                { credential: mastersDegreeLdp },
            ],
            query
        );

        expect(result.canSatisfy).toBe(true);
        expect(result.matches.ldp_only?.candidates).toHaveLength(1);
        expect(result.matches.ldp_only?.candidates[0]?.credential).toBe(
            mastersDegreeLdp
        );
    });
});

describe('selectCredentialsForDcql — multiple credential queries', () => {
    it('satisfies an unconditional multi-query (implicit AND)', () => {
        // No `credential_sets` declared → DCQL semantics say all
        // listed credential queries must be satisfied.
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'UniversityDegree']],
                    },
                },
                {
                    id: 'badge',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'OpenBadgeCredential']],
                    },
                },
            ],
        });

        const result = selectCredentialsForDcql(
            [{ credential: universityDegreeJwt }, { credential: openBadgeJwt }],
            query
        );

        expect(result.canSatisfy).toBe(true);
        expect(result.matches.degree?.candidates).toHaveLength(1);
        expect(result.matches.badge?.candidates).toHaveLength(1);
    });

    it('returns canSatisfy=false when one of multiple queries is unsatisfied', () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'UniversityDegree']],
                    },
                },
                {
                    id: 'license',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'DriverLicense']],
                    },
                },
            ],
        });

        const result = selectCredentialsForDcql(
            [{ credential: universityDegreeJwt }],
            query
        );

        expect(result.canSatisfy).toBe(false);
        expect(result.matches.degree?.candidates).toHaveLength(1);
        expect(result.matches.license?.candidates).toHaveLength(0);
    });
});

describe('selectCredentialsForDcql — credential_sets', () => {
    it('satisfies an OR-of-options set when one option is met', () => {
        // Verifier asks for "degree OR license" — having only the
        // degree should still mark the set satisfied.
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'UniversityDegree']],
                    },
                },
                {
                    id: 'license',
                    format: 'jwt_vc_json',
                    meta: {
                        type_values: [['VerifiableCredential', 'DriverLicense']],
                    },
                },
            ],
            credential_sets: [
                {
                    options: [['degree'], ['license']],
                },
            ],
        });

        const result = selectCredentialsForDcql(
            [{ credential: universityDegreeJwt }],
            query
        );

        expect(result.canSatisfy).toBe(true);
        expect(result.matches.degree?.candidates).toHaveLength(1);
        // The "license" query has no match, but that doesn't fail the
        // set — having `degree` is sufficient per options[].
        expect(result.matches.license?.candidates).toHaveLength(0);
    });
});
