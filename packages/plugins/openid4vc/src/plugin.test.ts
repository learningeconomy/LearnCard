/**
 * Plugin-level integration tests for the OpenID4VC holder.
 *
 * These exercise the public plugin surface end-to-end — not just the
 * individual Slice 7 modules — so we catch regressions in the wiring
 * layer (signer construction, holder defaulting, envelope inference,
 * transport). The "network" is an in-process fetch stub that also plays
 * the role of a DIF PEX verifier: it returns the Presentation Definition
 * when asked and, on `direct_post`, actually verifies the inbound JWT-VP
 * signature using the holder's `did:jwk` public key before answering.
 *
 * We intentionally avoid spinning up a real LearnCard. Instead we
 * satisfy the `OpenID4VCDependentLearnCard` contract with the thinnest
 * possible mock — real Ed25519 crypto via `jose`, everything else stubs.
 * That keeps the test focused on plugin orchestration.
 */
import { exportJWK, generateKeyPair, importJWK, jwtVerify, JWK } from 'jose';
import { UnsignedVP, VP, JWKWithPrivateKey } from '@learncard/types';

import { getOpenID4VCPlugin } from './plugin';
import type {
    OpenID4VCDependentLearnCard,
    OpenID4VCPluginMethods,
} from './types';
import type {
    AuthorizationRequest,
    PresentationDefinition,
} from './vp/types';
import { BuildPresentationError } from './vp/present';
import { VpSignError } from './vp/sign';
import { VpSubmitError } from './vp/submit';

/* -------------------------------------------------------------------------- */
/*                              test scaffolding                              */
/* -------------------------------------------------------------------------- */

const toB64url = (input: string | Uint8Array): string => {
    const bytes =
        typeof input === 'string' ? new TextEncoder().encode(input) : input;
    return Buffer.from(bytes)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

/**
 * Build a did:jwk DID and matching kid from a public JWK. did:jwk is
 * the canonical "keys without DNS" method and what walt.id / EUDI use
 * for wallet-side holder bindings.
 */
const didJwkFromPublicJwk = (pub: JWK): {
    did: string;
    kid: string;
} => {
    const id = toB64url(JSON.stringify(pub));
    const did = `did:jwk:${id}`;
    return { did, kid: `${did}#0` };
};

/**
 * Reverse: extract the public JWK a did:jwk encodes. The fake verifier
 * uses this to actually verify the inbound VP JWT.
 */
const publicJwkFromDidJwk = (did: string): JWK => {
    const id = did.replace(/^did:jwk:/, '').split('#')[0]!;
    const pad = '='.repeat((4 - (id.length % 4)) % 4);
    const b64 = id.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as JWK;
};

interface MockLearnCardHandle {
    learnCard: OpenID4VCDependentLearnCard;
    did: string;
    kid: string;
    publicJwk: JWK;
    privateJwk: JWKWithPrivateKey;
    ldpIssueCalls: Array<{
        vp: UnsignedVP;
        options?: { domain?: string; challenge?: string };
    }>;
}

/**
 * Build a minimal host LearnCard mock satisfying the OpenID4VC plugin's
 * dependent-method contract. Uses a real Ed25519 keypair so JWT-VPs it
 * signs can be verified end-to-end inside the test.
 */
const buildMockLearnCard = async (): Promise<MockLearnCardHandle> => {
    const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
        extractable: true,
    })) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const privateJwk = (await exportJWK(privateKey)) as JWKWithPrivateKey;
    const publicJwk = await exportJWK(publicKey);

    const { did, kid } = didJwkFromPublicJwk(publicJwk);

    const ldpIssueCalls: MockLearnCardHandle['ldpIssueCalls'] = [];

    const learnCard: OpenID4VCDependentLearnCard = {
        id: {
            did: () => did,
            keypair: (_type?: string) => ({
                ...privateJwk,
                kty: 'OKP',
                crv: 'Ed25519',
            }),
        },
        invoke: {
            didToVerificationMethod: async (d: string) => `${d}#0`,
            // Minimal LDP VP signer — stamps a deterministic proof that
            // carries the OID4VP replay-binding inputs verbatim so tests
            // can assert domain/challenge wiring.
            issuePresentation: async (
                vp: UnsignedVP,
                options?: { domain?: string; challenge?: string }
            ): Promise<VP> => {
                ldpIssueCalls.push({ vp, options });
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
            issueCredential: async (c: unknown) => c as ReturnType<
                NonNullable<OpenID4VCDependentLearnCard['invoke']>['issueCredential']
            >,
        },
    } as unknown as OpenID4VCDependentLearnCard;

    return { learnCard, did, kid, publicJwk, privateJwk, ldpIssueCalls };
};

/* ------------------------- in-process fake verifier ----------------------- */

interface VerifierSession {
    pdUri: string;
    responseUri: string;
    authRequestUri: string;
    nonce: string;
    state: string;
    clientId: string;
    pd: PresentationDefinition;
}

interface VerifierRecord {
    form: Record<string, string>;
    decodedVp?: { header: unknown; payload: unknown };
}

interface FakeVerifier {
    fetchImpl: typeof fetch;
    session: VerifierSession;
    /** Every `direct_post` the verifier saw (for assertions). */
    submissions: VerifierRecord[];
    /** Override the verifier's response to a submission. */
    setResponse: (
        response:
            | { status: number; body?: unknown }
            | ((record: VerifierRecord) => { status: number; body?: unknown })
    ) => void;
    /** Decode (and optionally verify) the last inbound JWT-VP. */
    getLastRecord: () => VerifierRecord | undefined;
}

const DEFAULT_PD: PresentationDefinition = {
    id: 'pd-integration-test',
    input_descriptors: [
        {
            id: 'UniversityDegree',
            name: 'University Degree',
            constraints: {
                fields: [
                    {
                        path: [
                            '$.type',
                            '$.vc.type',
                            '$.verifiableCredential.type',
                        ],
                        filter: {
                            type: 'array',
                            contains: { const: 'UniversityDegree' },
                        },
                    },
                ],
            },
        },
    ],
};

/**
 * Spin up an in-process verifier that:
 *  - Hosts a `presentation_definition_uri`.
 *  - Accepts `direct_post` POSTs at a `response_uri`.
 *  - Verifies inbound JWT-VPs (`jwt_vp_json`) using the holder's
 *    `did:jwk`-encoded public key.
 *  - Responds 200 with `{ redirect_uri }` by default; overridable via
 *    `setResponse` to simulate verifier rejection.
 */
const buildFakeVerifier = (opts: {
    pd?: PresentationDefinition;
    nonce?: string;
    state?: string;
    verifierOrigin?: string;
} = {}): FakeVerifier => {
    const verifierOrigin = opts.verifierOrigin ?? 'https://verifier.test';
    const nonce = opts.nonce ?? 'nonce-abcdef';
    const state = opts.state ?? 'state-xyz';
    const pd = opts.pd ?? DEFAULT_PD;
    const clientId = `${verifierOrigin}/openid4vc/verify`;
    const pdUri = `${verifierOrigin}/pd/${state}`;
    const responseUri = `${verifierOrigin}/verify/${state}`;

    const params = new URLSearchParams();
    params.set('response_type', 'vp_token');
    params.set('client_id', clientId);
    params.set('client_id_scheme', 'redirect_uri');
    params.set('response_mode', 'direct_post');
    params.set('response_uri', responseUri);
    params.set('nonce', nonce);
    params.set('state', state);
    params.set('presentation_definition_uri', pdUri);

    const authRequestUri = `openid4vp://authorize?${params.toString()}`;

    const submissions: VerifierRecord[] = [];

    let responder:
        | { status: number; body?: unknown }
        | ((record: VerifierRecord) => { status: number; body?: unknown }) = {
        status: 200,
        body: { redirect_uri: `${verifierOrigin}/success/${state}` },
    };

    const setResponse: FakeVerifier['setResponse'] = next => {
        responder = next;
    };

    const fetchImpl = jest.fn(
        async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = String(input);

            if (url === pdUri) {
                return makeResponse(200, JSON.stringify(pd), 'application/json');
            }

            if (url === responseUri) {
                if ((init?.method ?? 'GET').toUpperCase() !== 'POST') {
                    return makeResponse(405, 'method not allowed', 'text/plain');
                }

                const body = String(init?.body ?? '');
                const form = Object.fromEntries(
                    new URLSearchParams(body).entries()
                );

                const record: VerifierRecord = { form };

                if (form.vp_token && looksLikeJws(form.vp_token)) {
                    record.decodedVp = await verifyInboundVpJwt(
                        form.vp_token,
                        { expectedAudience: clientId, expectedNonce: nonce }
                    );
                }

                submissions.push(record);

                const resolved =
                    typeof responder === 'function' ? responder(record) : responder;

                const bodyOut =
                    resolved.body === undefined
                        ? ''
                        : typeof resolved.body === 'string'
                        ? resolved.body
                        : JSON.stringify(resolved.body);

                return makeResponse(
                    resolved.status,
                    bodyOut,
                    typeof resolved.body === 'string'
                        ? 'text/plain'
                        : 'application/json'
                );
            }

            throw new Error(`FakeVerifier: unexpected fetch to ${url}`);
        }
    ) as unknown as typeof fetch;

    return {
        fetchImpl,
        session: {
            pdUri,
            responseUri,
            authRequestUri,
            nonce,
            state,
            clientId,
            pd,
        },
        submissions,
        setResponse,
        getLastRecord: () => submissions[submissions.length - 1],
    };
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

const looksLikeJws = (s: string): boolean =>
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s);

const verifyInboundVpJwt = async (
    jwt: string,
    ctx: { expectedAudience: string; expectedNonce: string }
): Promise<{ header: unknown; payload: unknown }> => {
    // The iss claim holds the holder DID. did:jwk encodes the public
    // key in the DID itself — we just decode it, import, verify.
    const [, payloadB64] = jwt.split('.');
    const payloadJson = JSON.parse(
        Buffer.from(payloadB64!, 'base64').toString('utf8')
    );

    if (typeof payloadJson.iss !== 'string') {
        throw new Error('FakeVerifier: VP JWT has no iss claim');
    }

    const publicJwk = publicJwkFromDidJwk(payloadJson.iss);
    const key = await importJWK(publicJwk, 'EdDSA');

    const { payload, protectedHeader } = await jwtVerify(jwt, key, {
        audience: ctx.expectedAudience,
    });

    if (payload.nonce !== ctx.expectedNonce) {
        throw new Error(
            `FakeVerifier: VP JWT nonce ${String(payload.nonce)} !== expected ${ctx.expectedNonce}`
        );
    }

    return { header: protectedHeader, payload };
};

/* ---------------------------- credential fixture -------------------------- */

/**
 * A minimal W3C VC object for the UniversityDegree descriptor. Good
 * enough to drive both ldp_vp and jwt_vp_json envelopes — the inner
 * content is format-agnostic at this layer.
 */
const degreeVc = (holderDid: string): Record<string, unknown> => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:00000000-0000-4000-8000-000000000001',
    type: ['VerifiableCredential', 'UniversityDegree'],
    issuer: { id: 'did:web:issuer.example' },
    issuanceDate: '2024-01-01T00:00:00Z',
    credentialSubject: {
        id: holderDid,
        degree: { type: 'BachelorDegree', name: 'Bachelor of Science' },
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2024-01-01T00:00:00Z',
        verificationMethod: 'did:web:issuer.example#key-1',
        proofPurpose: 'assertionMethod',
        proofValue: 'z-fake-issuer-proof',
    },
});

const getPlugin = (
    mock: MockLearnCardHandle,
    fetchImpl: typeof fetch
): OpenID4VCPluginMethods => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, { fetch: fetchImpl });

    // Every method of OpenID4VCPluginMethods is exposed as
    // plugin.methods[name](learnCard, ...args). Bind the host learnCard
    // once so tests can call them directly.
    const bound = {} as OpenID4VCPluginMethods;
    for (const [name, fn] of Object.entries(plugin.methods)) {
        (bound as Record<string, unknown>)[name] = (...args: unknown[]) =>
            (fn as (...a: unknown[]) => unknown)(mock.learnCard, ...args);
    }
    return bound;
};

/* -------------------------------------------------------------------------- */
/*                                   tests                                    */
/* -------------------------------------------------------------------------- */

describe('OpenID4VC plugin — presentCredentials end-to-end', () => {
    it('jwt_vp_json: builds, signs, and submits a VP the fake verifier accepts', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        const result = await plugin.presentCredentials(
            verifier.session.authRequestUri,
            [
                {
                    descriptorId: 'UniversityDegree',
                    candidate: {
                        credential: degreeVc(mock.did),
                        format: 'ldp_vc',
                    },
                },
            ],
            { envelopeFormat: 'jwt_vp_json' }
        );

        // Envelope / signing was driven by the JWT path.
        expect(result.prepared.vpFormat).toBe('jwt_vp_json');
        expect(typeof result.signed.vpToken).toBe('string');

        // Verifier accepted it (our fake responds 200 + redirect_uri).
        expect(result.submitted.status).toBe(200);
        expect(result.submitted.redirectUri).toBe(
            'https://verifier.test/success/state-xyz'
        );

        // The verifier verified the JWS signature (it would have thrown
        // otherwise) and successfully decoded the VP envelope.
        const record = verifier.getLastRecord();
        expect(record?.decodedVp).toBeDefined();
        const payload = record!.decodedVp!.payload as Record<string, unknown>;
        expect(payload.iss).toBe(mock.did);
        expect(payload.sub).toBe(mock.did);
        expect(payload.aud).toBe(verifier.session.clientId);
        expect(payload.nonce).toBe(verifier.session.nonce);

        // Presentation submission echoed back intact + paths targeted
        // the JWT envelope.
        const submission = JSON.parse(record!.form.presentation_submission);
        expect(submission.definition_id).toBe(verifier.session.pd.id);
        expect(submission.descriptor_map).toEqual([
            {
                id: 'UniversityDegree',
                format: 'ldp_vc',
                path: '$.vp.verifiableCredential[0]',
            },
        ]);

        // State round-tripped.
        expect(record!.form.state).toBe(verifier.session.state);
    });

    it('ldp_vp: delegates to learnCard.invoke.issuePresentation with domain+challenge', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        const result = await plugin.presentCredentials(
            verifier.session.authRequestUri,
            [
                {
                    descriptorId: 'UniversityDegree',
                    candidate: {
                        credential: degreeVc(mock.did),
                        format: 'ldp_vc',
                    },
                },
            ],
            { envelopeFormat: 'ldp_vp' }
        );

        expect(result.prepared.vpFormat).toBe('ldp_vp');
        expect(result.submitted.status).toBe(200);

        // The host's issuePresentation was called exactly once with
        // OID4VP replay binding mapped through (audience→domain, nonce→challenge).
        expect(mock.ldpIssueCalls).toHaveLength(1);
        expect(mock.ldpIssueCalls[0].options).toEqual({
            domain: verifier.session.clientId,
            challenge: verifier.session.nonce,
        });

        // vp_token surfaced as an object containing the LD proof fields.
        const record = verifier.getLastRecord()!;
        const vpToken = JSON.parse(record.form.vp_token);
        expect(vpToken.proof.domain).toBe(verifier.session.clientId);
        expect(vpToken.proof.challenge).toBe(verifier.session.nonce);

        // Descriptor_map paths point at the ldp envelope shape.
        const submission = JSON.parse(record.form.presentation_submission);
        expect(submission.descriptor_map[0].path).toBe('$.verifiableCredential[0]');
    });

    it('bubbles verifier rejection as VpSubmitError with status + body', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        verifier.setResponse({
            status: 400,
            body: {
                error: 'invalid_presentation',
                error_description: 'nonce mismatch',
            },
        });

        let thrown: unknown;
        try {
            await plugin.presentCredentials(
                verifier.session.authRequestUri,
                [
                    {
                        descriptorId: 'UniversityDegree',
                        candidate: {
                            credential: degreeVc(mock.did),
                            format: 'ldp_vc',
                        },
                    },
                ],
                { envelopeFormat: 'jwt_vp_json' }
            );
        } catch (e) {
            thrown = e;
        }

        expect(thrown).toBeInstanceOf(VpSubmitError);
        const err = thrown as VpSubmitError;
        expect(err.code).toBe('server_error');
        expect(err.status).toBe(400);
        expect(err.body).toEqual({
            error: 'invalid_presentation',
            error_description: 'nonce mismatch',
        });
    });

    it('throws BuildPresentationError when a pick references an unknown descriptor', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        await expect(
            plugin.presentCredentials(
                verifier.session.authRequestUri,
                [
                    {
                        descriptorId: 'DoesNotExistInPD',
                        candidate: {
                            credential: degreeVc(mock.did),
                            format: 'ldp_vc',
                        },
                    },
                ],
                { envelopeFormat: 'jwt_vp_json' }
            )
        ).rejects.toBeInstanceOf(BuildPresentationError);

        // No submission should reach the verifier when the build step fails.
        expect(verifier.submissions).toHaveLength(0);
    });
});

/* -------------------------------------------------------------------------- */

describe('OpenID4VC plugin — signPresentation holder binding', () => {
    it('throws VpSignError(holder_mismatch) when options.holder diverges from unsignedVp.holder', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        // Build a prepared presentation bound to the real holder...
        const { request, prepared } = await plugin.buildPresentation(
            verifier.session.authRequestUri,
            [
                {
                    descriptorId: 'UniversityDegree',
                    candidate: {
                        credential: degreeVc(mock.did),
                        format: 'ldp_vc',
                    },
                },
            ],
            { envelopeFormat: 'jwt_vp_json' }
        );

        expect(prepared.unsignedVp.holder).toBe(mock.did);

        // ...then try to sign it as someone else. The sign-layer guard
        // MUST refuse so a tampered holder doesn't silently get signed.
        await expect(
            plugin.signPresentation(request, prepared, {
                holder: 'did:jwk:attacker-controlled',
            })
        ).rejects.toMatchObject({
            name: 'VpSignError',
            code: 'holder_mismatch',
        });
    });
});

/* -------------------------------------------------------------------------- */

describe('OpenID4VC plugin — presentCredentials surface guarantees', () => {
    it('defaults the holder to learnCard.id.did() when the caller omits it', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        await plugin.presentCredentials(
            verifier.session.authRequestUri,
            [
                {
                    descriptorId: 'UniversityDegree',
                    candidate: {
                        credential: degreeVc(mock.did),
                        format: 'ldp_vc',
                    },
                },
            ],
            { envelopeFormat: 'jwt_vp_json' }
        );

        const record = verifier.getLastRecord()!;
        const payload = record.decodedVp!.payload as Record<string, unknown>;
        expect(payload.iss).toBe(mock.did);
    });

    it('resolves presentation_definition_uri transparently from the Authorization Request', async () => {
        const mock = await buildMockLearnCard();
        const verifier = buildFakeVerifier();
        const plugin = getPlugin(mock, verifier.fetchImpl);

        // prepareVerifiablePresentation is the read-only preview path
        // that wallets call to render selection UI. If the PD was
        // inline-required, this would blow up; it must transparently
        // fetch `presentation_definition_uri`.
        const preview = await plugin.prepareVerifiablePresentation(
            verifier.session.authRequestUri,
            [
                {
                    credential: degreeVc(mock.did),
                    format: 'ldp_vc',
                },
            ]
        );

        expect(preview.request.presentation_definition?.id).toBe(
            verifier.session.pd.id
        );
        expect(preview.selection.canSatisfy).toBe(true);
        expect(preview.selection.descriptors).toHaveLength(1);
        expect(preview.selection.descriptors[0].candidates).toHaveLength(1);
    });
});
