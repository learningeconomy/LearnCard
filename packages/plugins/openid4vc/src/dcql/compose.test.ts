/**
 * Verifier composer unit tests.
 *
 * Mirrors `parse.ts`'s "round-trip through validate" assurance —
 * every output of these helpers MUST pass `DcqlQuery.parse` +
 * `validate` (which is what `buildDcqlQuery` does), so the
 * structural contract between composer + holder pipeline is locked
 * by construction.
 */
import { selectCredentialsForDcql } from './select';
import { buildDcqlQuery, requestW3cVc } from './compose';

const universityDegreeJwt = makeJwtVc({
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: { degreeName: 'BSc Comp Sci' },
});

describe('buildDcqlQuery', () => {
    it('returns a parsed query for a hand-rolled valid input', () => {
        const query = buildDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
            ],
        });

        expect(query.credentials).toHaveLength(1);
        expect(query.credentials[0]?.id).toBe('degree');
    });

    it('throws VpError for malformed input', () => {
        // No `credentials` field at all → both parse and validate
        // would reject. Caller gets the plugin's stable error code.
        expect(() => buildDcqlQuery({ wrong: 'shape' })).toThrow();
    });
});

describe('requestW3cVc — single-credential builder', () => {
    it('produces a query the holder selector accepts', () => {
        const query = requestW3cVc({
            id: 'degree',
            types: ['VerifiableCredential', 'UniversityDegree'],
        });

        // Round-trip: hand the composed query to the holder selector
        // alongside a matching candidate; canSatisfy must be true.
        const result = selectCredentialsForDcql(
            [{ credential: universityDegreeJwt }],
            query
        );

        expect(result.canSatisfy).toBe(true);
        expect(result.matches.degree?.candidates).toHaveLength(1);
    });

    it('defaults format to jwt_vc_json', () => {
        const query = requestW3cVc({
            id: 'any',
            types: ['VerifiableCredential', 'UniversityDegree'],
        });

        expect(query.credentials[0]?.format).toBe('jwt_vc_json');
    });

    it('honors an explicit ldp_vc format', () => {
        const query = requestW3cVc({
            id: 'any',
            format: 'ldp_vc',
            types: ['VerifiableCredential', 'UniversityDegree'],
        });

        expect(query.credentials[0]?.format).toBe('ldp_vc');
    });

    it('threads claim filters through to the holder side', () => {
        const restrictiveQuery = requestW3cVc({
            id: 'bsc_only',
            types: ['VerifiableCredential', 'UniversityDegree'],
            claims: [
                {
                    path: ['credentialSubject', 'degreeName'],
                    values: ['BSc Comp Sci'],
                },
            ],
        });

        const otherDegree = makeJwtVc({
            type: ['VerifiableCredential', 'UniversityDegree'],
            credentialSubject: { degreeName: 'MSc Linguistics' },
        });

        const result = selectCredentialsForDcql(
            [{ credential: universityDegreeJwt }, { credential: otherDegree }],
            restrictiveQuery
        );

        // Only the BSc must match — the MSc is dropped by the values filter.
        expect(result.matches.bsc_only?.candidates).toHaveLength(1);
        expect(result.matches.bsc_only?.candidates[0]?.credential).toBe(
            universityDegreeJwt
        );
    });

    it('rejects an empty types array up front', () => {
        // Better than letting the dcql library's valibot stack
        // trace surface to UI code.
        expect(() => requestW3cVc({ id: 'x', types: [] })).toThrow(/types/);
    });
});

/* ----------------------------- helpers --------------------------------- */

function makeJwtVc(vcBody: Record<string, unknown>): string {
    const header = base64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64url(
        JSON.stringify({ iss: 'did:jwk:abc', sub: 'did:jwk:holder', vc: vcBody })
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
