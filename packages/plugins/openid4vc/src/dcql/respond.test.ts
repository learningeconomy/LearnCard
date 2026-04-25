/**
 * Sign + assemble unit tests for the DCQL response pipeline.
 *
 * Uses the same `makeJwtSigner` shape as `vp/sign.test.ts` so the
 * signer interface stays in lockstep across PEX and DCQL flows.
 */
import { buildDcqlPresentations } from './build';
import { parseDcqlQuery } from './parse';
import {
    assembleDcqlVpToken,
    buildDcqlResponse,
    signDcqlPresentations,
} from './respond';
import type { ProofJwtSigner } from '../vci/types';

const HOLDER = 'did:jwk:holder';
const AUDIENCE = 'https://verifier.example/openid4vc/verify';
const NONCE = 'nonce-for-respond-tests';

const makeJwtSigner = (overrides: Partial<ProofJwtSigner> = {}): ProofJwtSigner & {
    signCalls: Array<{ header: Record<string, unknown>; payload: Record<string, unknown> }>;
} => {
    const signer = {
        alg: 'EdDSA' as const,
        kid: 'did:jwk:holder#0',
        signCalls: [] as Array<{
            header: Record<string, unknown>;
            payload: Record<string, unknown>;
        }>,
        sign: jest.fn(
            async (
                header: Record<string, unknown>,
                payload: Record<string, unknown>
            ): Promise<string> => {
                signer.signCalls.push({ header, payload });
                // Encode the credential_query_id from the VP into the
                // fake signature so each test assertion can prove the
                // JWT actually came from the right per-query path.
                const tag = ((payload.vp as { id?: string } | undefined)?.id ?? 'vp').slice(-12);
                return `header.payload.${tag}`;
            }
        ),
        ...overrides,
    };
    return signer;
};

const universityDegreeJwt = makeJwtVc({
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: {},
});
const openBadgeJwt = makeJwtVc({
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    credentialSubject: {},
});

describe('signDcqlPresentations', () => {
    it('signs each unsigned VP and preserves the credential_query_id key', async () => {
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
            holder: HOLDER,
        });

        const signer = makeJwtSigner();
        const signed = await signDcqlPresentations(
            { built, audience: AUDIENCE, nonce: NONCE, holder: HOLDER },
            { jwtSigner: signer }
        );

        expect(signed).toHaveLength(2);
        expect(signed[0]?.credentialQueryId).toBe('degree');
        expect(signed[0]?.vpFormat).toBe('jwt_vp_json');
        expect(typeof signed[0]?.vpToken).toBe('string');
        expect(signed[1]?.credentialQueryId).toBe('badge');

        // The signer must have been called with audience/nonce/holder
        // populated identically for every per-query VP.
        expect(signer.signCalls).toHaveLength(2);
        for (const call of signer.signCalls) {
            expect(call.payload.aud).toBe(AUDIENCE);
            expect(call.payload.nonce).toBe(NONCE);
            expect(call.payload.iss).toBe(HOLDER);
        }
    });
});

describe('assembleDcqlVpToken', () => {
    it('produces an object keyed by credentialQueryId', () => {
        const out = assembleDcqlVpToken([
            { credentialQueryId: 'a', vpToken: 'jwt.a.sig', vpFormat: 'jwt_vp_json' },
            { credentialQueryId: 'b', vpToken: 'jwt.b.sig', vpFormat: 'jwt_vp_json' },
        ]);

        expect(out).toEqual({
            a: 'jwt.a.sig',
            b: 'jwt.b.sig',
        });
    });

    it('preserves the input array order in object key insertion order', () => {
        // Object.keys reflects insertion order in modern JS — this
        // pins the contract so a future refactor that switches to
        // sort-by-id silently breaks it.
        const out = assembleDcqlVpToken([
            { credentialQueryId: 'zebra', vpToken: 'z', vpFormat: 'jwt_vp_json' },
            { credentialQueryId: 'apple', vpToken: 'a', vpFormat: 'jwt_vp_json' },
        ]);

        expect(Object.keys(out)).toEqual(['zebra', 'apple']);
    });
});

describe('buildDcqlResponse — end-to-end orchestration', () => {
    it('returns both vpToken object and detailed presentations array', async () => {
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
            chosen: [
                { credentialQueryId: 'degree', candidate: { credential: universityDegreeJwt } },
            ],
            holder: HOLDER,
        });

        const result = await buildDcqlResponse(
            { built, audience: AUDIENCE, nonce: NONCE, holder: HOLDER },
            { jwtSigner: makeJwtSigner() }
        );

        expect(result.presentations).toHaveLength(1);
        expect(result.presentations[0]?.credentialQueryId).toBe('degree');
        expect(result.vpToken).toEqual({
            degree: result.presentations[0]?.vpToken,
        });
    });
});

/* ----------------------------- helpers --------------------------------- */

function makeJwtVc(vcBody: Record<string, unknown>): string {
    const header = base64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64url(
        JSON.stringify({ iss: 'did:jwk:abc', sub: HOLDER, vc: vcBody })
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
