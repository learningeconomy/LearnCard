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
    DcqlSignError,
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

describe('signDcqlPresentations — SD-JWT-VC passthrough', () => {
    const sdJwtCompact =
        'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.eyJpc3MiOiJkaWQ6d2ViOmlzc3VlciJ9.signature~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkFkYSJd~';
    const presentedCompact = `${sdJwtCompact}eyJraGVhZGVyIjoia2Ira2J0In0.eyJzZF9oYXNoIjoiYWJjIn0.kbsig`;

    it('routes kind="sd-jwt-vc" entries through the sdJwtPresenter and skips VP signing', async () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'pid',
                    format: 'dc+sd-jwt',
                    meta: { vct_values: ['urn:test:pid'] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [{ credentialQueryId: 'pid', candidate: { credential: sdJwtCompact } }],
            holder: HOLDER,
        });

        const presenter = jest.fn(async (_c: string, _o) => ({ compact: presentedCompact }));
        const jwtSigner = makeJwtSigner();

        const result = await signDcqlPresentations(
            { built, audience: AUDIENCE, nonce: NONCE, holder: HOLDER },
            { sdJwtPresenter: presenter, jwtSigner }
        );

        expect(result).toHaveLength(1);
        expect(result[0]?.credentialQueryId).toBe('pid');
        expect(result[0]?.vpToken).toBe(presentedCompact);
        expect(result[0]?.vpFormat).toBe('dc+sd-jwt');
        expect(presenter).toHaveBeenCalledWith(sdJwtCompact, {
            audience: AUDIENCE,
            nonce: NONCE,
        });
        expect(jwtSigner.signCalls).toHaveLength(0);
    });

    it('throws DcqlSignError(missing_sd_jwt_presenter) when SD-JWT entry has no presenter', async () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'pid',
                    format: 'dc+sd-jwt',
                    meta: { vct_values: ['urn:test:pid'] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [{ credentialQueryId: 'pid', candidate: { credential: sdJwtCompact } }],
            holder: HOLDER,
        });

        await expect(
            signDcqlPresentations(
                { built, audience: AUDIENCE, nonce: NONCE, holder: HOLDER },
                {}
            )
        ).rejects.toMatchObject({
            name: 'DcqlSignError',
            code: 'missing_sd_jwt_presenter',
        });
    });

    it('wraps presenter errors in DcqlSignError(sd_jwt_present_failed)', async () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'pid',
                    format: 'dc+sd-jwt',
                    meta: { vct_values: ['urn:test:pid'] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [{ credentialQueryId: 'pid', candidate: { credential: sdJwtCompact } }],
            holder: HOLDER,
        });

        const presenter = jest.fn(async () => {
            throw new Error('verifier rejected nonce');
        });

        const err = (await signDcqlPresentations(
            { built, audience: AUDIENCE, nonce: NONCE, holder: HOLDER },
            { sdJwtPresenter: presenter }
        ).catch(e => e)) as DcqlSignError;

        expect(err).toBeInstanceOf(DcqlSignError);
        expect(err.code).toBe('sd_jwt_present_failed');
        expect(err.message).toContain('verifier rejected nonce');
    });

    it('mixes VP and SD-JWT entries in a single buildDcqlResponse call', async () => {
        const query = parseDcqlQuery({
            credentials: [
                {
                    id: 'degree',
                    format: 'jwt_vc_json',
                    meta: { type_values: [['VerifiableCredential', 'UniversityDegree']] },
                },
                {
                    id: 'pid',
                    format: 'dc+sd-jwt',
                    meta: { vct_values: ['urn:test:pid'] },
                },
            ],
        });

        const built = buildDcqlPresentations({
            query,
            chosen: [
                { credentialQueryId: 'degree', candidate: { credential: universityDegreeJwt } },
                { credentialQueryId: 'pid', candidate: { credential: sdJwtCompact } },
            ],
            holder: HOLDER,
        });

        const presenter = jest.fn(async () => ({ compact: presentedCompact }));
        const jwtSigner = makeJwtSigner();

        const response = await buildDcqlResponse(
            { built, audience: AUDIENCE, nonce: NONCE, holder: HOLDER },
            { sdJwtPresenter: presenter, jwtSigner }
        );

        expect(Object.keys(response.vpToken).sort()).toEqual(['degree', 'pid']);
        expect(response.vpToken.pid).toBe(presentedCompact);
        expect(typeof response.vpToken.degree).toBe('string');
        expect(jwtSigner.signCalls).toHaveLength(1);
        expect(presenter).toHaveBeenCalledTimes(1);
    });
});
