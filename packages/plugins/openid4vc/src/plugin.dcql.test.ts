/**
 * Plugin-level e2e tests for the **DCQL routing path**.
 *
 * Sibling of `plugin.test.ts` — same shape (in-process fake verifier
 * driven by `getOpenID4VCPlugin`), but the verifier emits
 * `dcql_query` instead of `presentation_definition_uri`. The plugin's
 * routing layer (Slice 6) must auto-detect DCQL, build per-query
 * VPs, sign them, and POST an object-form `vp_token` with no
 * `presentation_submission`.
 *
 * The PEX e2e tests in `plugin.test.ts` continue to assert the
 * legacy path; together they prove **coexistence**: a single plugin
 * instance handles both query languages depending on what the
 * verifier sends.
 */
import { exportJWK, generateKeyPair, importJWK, jwtVerify, type JWK } from 'jose';
import type { UnsignedVP, VP } from '@learncard/types';

import { getOpenID4VCPlugin } from './plugin';
import { requestW3cVc } from './dcql';
import type {
    OpenID4VCDependentLearnCard,
    OpenID4VCPluginMethods,
} from './types';

/* ---------------------------- mock LearnCard ------------------------------ */

interface MockLearnCardHandle {
    learnCard: OpenID4VCDependentLearnCard;
    did: string;
}

const didJwkFromPublicJwk = (publicJwk: JWK): { did: string; kid: string } => {
    const did =
        'did:jwk:' +
        Buffer.from(JSON.stringify(publicJwk))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    return { did, kid: `${did}#0` };
};

const publicJwkFromDidJwk = (did: string): JWK => {
    const id = did.replace(/^did:jwk:/, '').split('#')[0]!;
    const pad = '='.repeat((4 - (id.length % 4)) % 4);
    const b64 = id.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as JWK;
};

const buildMockLearnCard = async (): Promise<MockLearnCardHandle> => {
    const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
        extractable: true,
    })) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const privateJwk = await exportJWK(privateKey);
    const publicJwk = await exportJWK(publicKey);
    const { did, kid } = didJwkFromPublicJwk(publicJwk);

    const learnCard: OpenID4VCDependentLearnCard = {
        id: {
            did: () => did,
            keypair: () => privateJwk,
        },
        invoke: {
            didToVerificationMethod: async () => kid,
            issuePresentation: async (vp: UnsignedVP, options?: any): Promise<VP> => {
                return {
                    ...vp,
                    proof: {
                        type: 'Ed25519Signature2020',
                        created: '2024-01-01T00:00:00Z',
                        verificationMethod: kid,
                        proofPurpose: 'authentication',
                        domain: options?.domain,
                        challenge: options?.challenge,
                        proofValue: 'z-mock-proof',
                    },
                } as unknown as VP;
            },
            issueCredential: async (c: unknown) => c as any,
        },
    } as unknown as OpenID4VCDependentLearnCard;

    return { learnCard, did };
};

/* ----------------------------- fake verifier ----------------------------- */

interface DcqlVerifierRecord {
    form: Record<string, string>;
    /** Decoded vp_token object (parsed from the form-encoded JSON). */
    vpTokenObject?: Record<string, unknown>;
    /** Per-query-id verified VP payloads (signature + nonce + aud checked). */
    verifiedPerQuery?: Record<string, { payload: Record<string, unknown>; header: unknown }>;
}

interface FakeDcqlVerifier {
    fetchImpl: typeof fetch;
    authRequestUri: string;
    submissions: DcqlVerifierRecord[];
    nonce: string;
    state: string;
    clientId: string;
}

const buildFakeDcqlVerifier = (opts: {
    nonce?: string;
    state?: string;
    queryId?: string;
} = {}): FakeDcqlVerifier => {
    const nonce = opts.nonce ?? 'dcql-nonce-1234';
    const state = opts.state ?? 'dcql-state-5678';
    const queryId = opts.queryId ?? 'degree';
    const clientId = 'https://verifier.test/openid4vc/verify';
    const responseUri = 'https://verifier.test/dcql/direct_post';

    const dcqlQuery = requestW3cVc({
        id: queryId,
        types: ['VerifiableCredential', 'UniversityDegree'],
    });

    const params = new URLSearchParams();
    params.set('response_type', 'vp_token');
    params.set('client_id', clientId);
    params.set('client_id_scheme', 'redirect_uri');
    params.set('response_mode', 'direct_post');
    params.set('response_uri', responseUri);
    params.set('nonce', nonce);
    params.set('state', state);
    params.set('dcql_query', JSON.stringify(dcqlQuery));

    const authRequestUri = `openid4vp://authorize?${params.toString()}`;
    const submissions: DcqlVerifierRecord[] = [];

    const fetchImpl = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url !== responseUri) {
            throw new Error(`FakeDcqlVerifier: unexpected fetch ${url}`);
        }
        if ((init?.method ?? 'GET').toUpperCase() !== 'POST') {
            return makeResponse(405, 'method not allowed', 'text/plain');
        }

        const body = String(init?.body ?? '');
        const form = Object.fromEntries(new URLSearchParams(body).entries());
        const record: DcqlVerifierRecord = { form };

        // DCQL: vp_token is JSON-encoded object.
        if (form.vp_token) {
            try {
                record.vpTokenObject = JSON.parse(form.vp_token);
            } catch {
                /* leave undefined; assertion will catch */
            }
        }

        // Verify each per-query-id presentation against the
        // request's nonce + audience. This is the verifier's job and
        // mirrors what Sphereon/EUDI do in production.
        if (record.vpTokenObject) {
            const verified: NonNullable<DcqlVerifierRecord['verifiedPerQuery']> = {};
            for (const [id, presentation] of Object.entries(record.vpTokenObject)) {
                if (typeof presentation !== 'string') continue;
                if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(presentation)) {
                    continue;
                }
                const [, payloadB64] = presentation.split('.');
                const payloadJson = JSON.parse(
                    Buffer.from(payloadB64!, 'base64').toString('utf8')
                ) as Record<string, unknown>;

                const iss = payloadJson.iss;
                if (typeof iss !== 'string') continue;

                const publicJwk = publicJwkFromDidJwk(iss);
                const key = await importJWK(publicJwk, 'EdDSA');

                const { payload, protectedHeader } = await jwtVerify(presentation, key, {
                    audience: clientId,
                });

                if (payload.nonce !== nonce) {
                    throw new Error(
                        `FakeDcqlVerifier: nonce mismatch for query ${id} (got ${String(payload.nonce)})`
                    );
                }

                verified[id] = {
                    payload: payload as Record<string, unknown>,
                    header: protectedHeader,
                };
            }
            record.verifiedPerQuery = verified;
        }

        submissions.push(record);
        return makeResponse(200, JSON.stringify({ ok: true }), 'application/json');
    }) as unknown as typeof fetch;

    return { fetchImpl, authRequestUri, submissions, nonce, state, clientId };
};

const makeResponse = (status: number, body: string, contentType: string): Response =>
    ({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'ERR',
        headers: new Headers({ 'content-type': contentType }),
        text: async () => body,
        json: async () => JSON.parse(body),
    } as Response);

/* ----------------------------- credential fixture ------------------------- */

const universityDegreeJwt = (() => {
    const header = base64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64url(
        JSON.stringify({
            iss: 'did:jwk:any-issuer',
            sub: 'did:jwk:holder',
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential', 'UniversityDegree'],
                credentialSubject: { degreeName: 'BSc Comp Sci' },
            },
        })
    );
    return `${header}.${payload}.signature`;
})();

function base64url(s: string): string {
    return Buffer.from(s)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

const getPlugin = (
    mock: MockLearnCardHandle,
    fetchImpl: typeof fetch
): OpenID4VCPluginMethods => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, { fetch: fetchImpl });
    const bound = {} as OpenID4VCPluginMethods;
    for (const [name, fn] of Object.entries(plugin.methods)) {
        (bound as Record<string, unknown>)[name] = (...args: unknown[]) =>
            (fn as (...a: unknown[]) => unknown)(mock.learnCard, ...args);
    }
    return bound;
};

/* --------------------------------- tests --------------------------------- */

describe('OpenID4VC plugin — DCQL e2e', () => {
    it('routes a dcql_query auth request through the DCQL pipeline end-to-end', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeDcqlVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        const result = await plugin.presentCredentials(verifier.authRequestUri, [
            {
                credentialQueryId: 'degree',
                candidate: { credential: universityDegreeJwt, format: 'jwt_vc_json' },
            },
        ]);

        // DCQL fields populated; PEX fields absent.
        expect(result.dcqlBuilt).toBeDefined();
        expect(result.dcqlSigned).toBeDefined();
        expect(result.dcqlVpToken).toBeDefined();
        expect(result.prepared).toBeUndefined();
        expect(result.signed).toBeUndefined();

        // The verifier saw a DCQL submission.
        expect(verifier.submissions).toHaveLength(1);
        const record = verifier.submissions[0]!;

        // Critical: DCQL submissions MUST NOT carry presentation_submission.
        expect(record.form.presentation_submission).toBeUndefined();

        // vp_token decoded as the object-shape DCQL response.
        expect(record.vpTokenObject).toEqual(
            expect.objectContaining({
                degree: expect.any(String), // jwt_vp_json compact JWS
            })
        );

        // The verifier's strict checks (signature + nonce + audience)
        // accepted the per-query VP.
        expect(record.verifiedPerQuery?.degree).toBeDefined();
        expect(record.verifiedPerQuery?.degree?.payload.aud).toBe(verifier.clientId);
        expect(record.verifiedPerQuery?.degree?.payload.nonce).toBe(verifier.nonce);
    });

    it('prepareVerifiablePresentation populates dcqlSelection on a DCQL request', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeDcqlVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        const { request, selection, dcqlSelection } =
            await plugin.prepareVerifiablePresentation(verifier.authRequestUri, [
                { credential: universityDegreeJwt },
            ]);

        expect(request.dcql_query).toBeDefined();
        expect(dcqlSelection).toBeDefined();
        expect(dcqlSelection?.canSatisfy).toBe(true);
        expect(dcqlSelection?.matches.degree?.candidates).toHaveLength(1);

        // PEX selection field stays undefined when the request used DCQL.
        expect(selection).toBeUndefined();
    });

    it('throws when chosen[] uses descriptorId on a DCQL request', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeDcqlVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        await expect(
            plugin.presentCredentials(verifier.authRequestUri, [
                {
                    descriptorId: 'wrong_shape',
                    candidate: { credential: universityDegreeJwt, format: 'jwt_vc_json' },
                } as any,
            ])
        ).rejects.toThrow(/credentialQueryId/i);
    });
});
