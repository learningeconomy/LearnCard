/**
 * Tests for the signed Request Object verification layer (Slice 7.5).
 *
 * We generate real Ed25519 / EC signatures via `jose` and drive the
 * verifier with in-memory DID resolvers / fetch stubs so the
 * verification math is exercised end-to-end. No network, no fixtures
 * on disk.
 */
import {
    exportJWK,
    generateKeyPair,
    JWK,
    SignJWT,
} from 'jose';

import {
    verifyAndDecodeRequestObject,
    RequestObjectError,
    DidDocument,
    DidResolver,
} from './request-object';

/* -------------------------------------------------------------------------- */
/*                                 helpers                                    */
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

const didJwkFrom = (pub: JWK): { did: string; kid: string } => {
    const id = toB64url(JSON.stringify(pub));
    return { did: `did:jwk:${id}`, kid: `did:jwk:${id}#0` };
};

interface VerifierKey {
    privateKey: CryptoKey;
    publicJwk: JWK;
    did: string;
    kid: string;
}

const makeVerifierKey = async (): Promise<VerifierKey> => {
    const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
        extractable: true,
    })) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const publicJwk = await exportJWK(publicKey);
    const { did, kid } = didJwkFrom(publicJwk);

    return { privateKey, publicJwk, did, kid };
};

const signRequestObject = async (
    key: VerifierKey,
    claims: Record<string, unknown>,
    headerOverrides: Record<string, unknown> = {}
): Promise<string> =>
    new SignJWT(claims)
        .setProtectedHeader({
            alg: 'EdDSA',
            kid: key.kid,
            typ: 'oauth-authz-req+jwt',
            ...headerOverrides,
        })
        .sign(key.privateKey);

const baseClaims = (
    key: VerifierKey,
    overrides: Record<string, unknown> = {}
): Record<string, unknown> => ({
    response_type: 'vp_token',
    client_id: key.did,
    client_id_scheme: 'did',
    response_mode: 'direct_post',
    response_uri: 'https://verifier.test/verify/session-1',
    nonce: 'nonce-abc',
    state: 'state-1',
    presentation_definition: {
        id: 'pd-1',
        input_descriptors: [
            { id: 'd1', constraints: { fields: [{ path: ['$.type'] }] } },
        ],
    },
    ...overrides,
});

const mockFetch = (
    routes: Record<string, { status?: number; body: string | object }>
): typeof fetch =>
    jest.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const url = String(input);
        const route = routes[url];
        if (!route) throw new Error(`mockFetch: unexpected URL ${url}`);

        const status = route.status ?? 200;
        const body =
            typeof route.body === 'string' ? route.body : JSON.stringify(route.body);

        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'OK',
            headers: new Headers({
                'content-type':
                    typeof route.body === 'string'
                        ? 'application/jwt'
                        : 'application/json',
            }),
            text: async () => body,
            json: async () => JSON.parse(body),
        } as Response;
    }) as unknown as typeof fetch;

/* -------------------------------------------------------------------------- */
/*                              client_id_scheme=did                          */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — client_id_scheme=did (did:jwk)', () => {
    it('verifies + decodes an inline JWS signed by the did:jwk holder', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, baseClaims(key));

        const request = await verifyAndDecodeRequestObject({ inlineJwt: jws });

        expect(request.client_id).toBe(key.did);
        expect(request.client_id_scheme).toBe('did');
        expect(request.nonce).toBe('nonce-abc');
        expect(request.response_uri).toBe('https://verifier.test/verify/session-1');
        expect(request.presentation_definition?.id).toBe('pd-1');
    });

    it('fetches the Request Object from request_uri', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, baseClaims(key));

        const fetchImpl = mockFetch({
            'https://verifier.test/req/1': { body: jws },
        });

        const request = await verifyAndDecodeRequestObject({
            requestUri: 'https://verifier.test/req/1',
            fetchImpl,
        });

        expect(request.client_id).toBe(key.did);
    });

    it('rejects a JWS whose signature does not match the DID document key', async () => {
        const keyA = await makeVerifierKey();
        const keyB = await makeVerifierKey();

        // Sign with A, but claim to be B (client_id = B's DID). The
        // resolver returns B's doc, verify fails.
        const tamperedClaims = baseClaims(keyA, { client_id: keyB.did });
        const jws = await signRequestObject(keyA, tamperedClaims, { kid: keyB.kid });

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({
            name: 'RequestObjectError',
            code: 'request_signature_invalid',
        });
    });

    it('rejects when urlClientId disagrees with the signed client_id', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, baseClaims(key));

        await expect(
            verifyAndDecodeRequestObject({
                inlineJwt: jws,
                urlClientId: 'did:jwk:something-else',
            })
        ).rejects.toMatchObject({ code: 'client_id_mismatch' });
    });

    it('rejects when kid header is missing', async () => {
        const key = await makeVerifierKey();

        // Build a JWS by hand without kid in the protected header.
        const header = toB64url(JSON.stringify({ alg: 'EdDSA' }));
        const payload = toB64url(JSON.stringify(baseClaims(key)));
        // Signature value is irrelevant — we should fail before verify.
        const jws = `${header}.${payload}.${toB64url('sig')}`;

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({ code: 'invalid_request_object' });
    });

    it('delegates to a custom didResolver for unsupported DID methods', async () => {
        const key = await makeVerifierKey();

        // Build a "did:example" client_id whose resolver returns the
        // did:jwk's public key — proves the resolver plug-in point works.
        const fakeDid = 'did:example:verifier-1';
        const fakeKid = `${fakeDid}#k1`;

        const jws = await signRequestObject(
            key,
            { ...baseClaims(key), client_id: fakeDid },
            { kid: fakeKid }
        );

        const customResolver: DidResolver = async (did: string) => {
            expect(did).toBe(fakeDid);
            return {
                id: fakeDid,
                verificationMethod: [
                    {
                        id: fakeKid,
                        type: 'JsonWebKey2020',
                        controller: fakeDid,
                        publicKeyJwk: key.publicJwk,
                    },
                ],
            };
        };

        const request = await verifyAndDecodeRequestObject({
            inlineJwt: jws,
            didResolver: customResolver,
        });

        expect(request.client_id).toBe(fakeDid);
    });

    it('bubbles a did_resolution_failed code when the resolver rejects', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            { ...baseClaims(key), client_id: 'did:totally:unsupported' },
            { kid: 'did:totally:unsupported#k' }
        );

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({ code: 'did_resolution_failed' });
    });

    it('rejects a kid that does not exist on the DID document', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            baseClaims(key),
            { kid: `${key.did}#does-not-exist` }
        );

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({ code: 'request_signer_untrusted' });
    });
});

/* -------------------------------------------------------------------------- */
/*                              did:web resolver                              */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — did:web', () => {
    it('fetches the DID document from /.well-known and verifies the signature', async () => {
        const key = await makeVerifierKey();

        const didWeb = 'did:web:verifier.test';
        const vmId = `${didWeb}#key-1`;

        const didDoc: DidDocument = {
            id: didWeb,
            verificationMethod: [
                {
                    id: vmId,
                    type: 'JsonWebKey2020',
                    controller: didWeb,
                    publicKeyJwk: key.publicJwk,
                },
            ],
        };

        const jws = await signRequestObject(
            key,
            { ...baseClaims(key), client_id: didWeb },
            { kid: vmId }
        );

        const fetchImpl = mockFetch({
            'https://verifier.test/.well-known/did.json': { body: didDoc },
        });

        const request = await verifyAndDecodeRequestObject({
            inlineJwt: jws,
            fetchImpl,
        });

        expect(request.client_id).toBe(didWeb);
    });

    it('maps path-style did:web to /<path>/did.json (Sphereon / EUDI convention)', async () => {
        const key = await makeVerifierKey();
        const didWeb = 'did:web:verifier.test:tenants:acme';
        const vmId = `${didWeb}#k1`;

        const jws = await signRequestObject(
            key,
            { ...baseClaims(key), client_id: didWeb },
            { kid: vmId }
        );

        const fetchImpl = mockFetch({
            'https://verifier.test/tenants/acme/did.json': {
                body: {
                    id: didWeb,
                    verificationMethod: [
                        {
                            id: vmId,
                            type: 'JsonWebKey2020',
                            controller: didWeb,
                            publicKeyJwk: key.publicJwk,
                        },
                    ],
                } satisfies DidDocument,
            },
        });

        const request = await verifyAndDecodeRequestObject({
            inlineJwt: jws,
            fetchImpl,
        });

        expect(request.client_id).toBe(didWeb);
    });
});

/* -------------------------------------------------------------------------- */
/*                              unsupported schemes                           */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — unsupported / forbidden schemes', () => {
    it('refuses signed requests with client_id_scheme=redirect_uri', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            { ...baseClaims(key), client_id_scheme: 'redirect_uri' }
        );

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({ code: 'unsupported_client_id_scheme' });
    });

    it('refuses client_id_scheme=pre-registered until wiring exists', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            { ...baseClaims(key), client_id_scheme: 'pre-registered' }
        );

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({ code: 'unsupported_client_id_scheme' });
    });

    it('infers prefix=did from a bare did:jwk client_id (OID4VP 1.0 implicit form)', async () => {
        // Removed in this release: the legacy `missing_client_id_scheme`
        // error code path. OID4VP 1.0 §5.10 lets the prefix be encoded
        // implicitly in `client_id` (a DID URI here), so a verifier
        // shipping NO `client_id_scheme` claim and a `did:jwk:...`
        // client_id is now spec-conformant. The verifier should
        // succeed end-to-end; the resulting AuthorizationRequest
        // surfaces `client_id_scheme: 'did'` derived from the prefix.
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, {
            ...baseClaims(key),
            client_id_scheme: undefined,
        });

        const request = await verifyAndDecodeRequestObject({ inlineJwt: jws });

        expect(request.client_id).toBe(key.did);
        expect(request.client_id_scheme).toBe('did');
    });

    it('rejects bare client_id (no prefix, no scheme) without unsafeAllowSelfSigned', async () => {
        // OID4VP 1.0 maps a bare `client_id` (no prefix encoded
        // inline) to `pre-registered`. Pre-registered mode requires
        // an out-of-band trust binding the wallet doesn't have, so
        // signed Request Objects are refused unless the host opts
        // into `unsafeAllowSelfSigned` for an interop / dev context.
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, {
            ...baseClaims(key),
            client_id: 'Verifier',
            client_id_scheme: undefined,
        });

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({ code: 'unsupported_client_id_scheme' });
    });

    // NOTE: positive-flow coverage for the
    // `pre-registered + x5c + unsafeAllowSelfSigned` branch lives in
    // the interop suite (`tests/eudi-parsing.spec.ts`), which exercises
    // it against a real EUDI verifier's self-signed cert chain rather
    // than minting a synthetic X.509 leaf in-process. Synthesizing a
    // valid X.509 cert here would require either pulling in
    // `node-forge` / `selfsigned` as a test dep or implementing ASN.1
    // DER encoding by hand — both are heavier than this unit test
    // file's domain. The unit tests in this section cover the
    // rejection invariants; interop covers the green path.

    it('rejects bare client_id under unsafeAllowSelfSigned when x5c is missing', async () => {
        // Even with the unsafe escape hatch enabled, we MUST have some
        // key material in the JWS header to verify the signature
        // against. A bare `client_id` with neither x5c nor any other
        // embedded key is unverifiable.
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, {
            ...baseClaims(key),
            client_id: 'Verifier',
            client_id_scheme: undefined,
        });

        await expect(
            verifyAndDecodeRequestObject({
                inlineJwt: jws,
                unsafeAllowSelfSigned: true,
            })
        ).rejects.toMatchObject({ code: 'invalid_request_object' });
    });
});

/* -------------------------------------------------------------------------- */
/*                               malformed input                              */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — input validation', () => {
    it('throws invalid_request_object for non-JWS input', async () => {
        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: 'not-a-jws' })
        ).rejects.toMatchObject({ code: 'invalid_request_object' });
    });

    it('throws when neither inlineJwt nor requestUri is provided', async () => {
        await expect(verifyAndDecodeRequestObject({})).rejects.toMatchObject({
            code: 'invalid_request_object',
        });
    });

    it('throws request_fetch_failed when request_uri is unreachable', async () => {
        const fetchImpl = jest.fn(async () => {
            throw new Error('ECONNRESET');
        }) as unknown as typeof fetch;

        await expect(
            verifyAndDecodeRequestObject({
                requestUri: 'https://verifier.test/req/404',
                fetchImpl,
            })
        ).rejects.toMatchObject({ code: 'request_fetch_failed' });
    });

    it('throws request_fetch_failed when request_uri returns a non-200', async () => {
        const fetchImpl = mockFetch({
            'https://verifier.test/req/404': { status: 404, body: 'missing' },
        });

        await expect(
            verifyAndDecodeRequestObject({
                requestUri: 'https://verifier.test/req/404',
                fetchImpl,
            })
        ).rejects.toMatchObject({ code: 'request_fetch_failed' });
    });

    it('throws invalid_request_object when the claims fail JSON parsing', async () => {
        // Build a JWS-looking string whose payload is not base64url JSON.
        const header = toB64url(JSON.stringify({ alg: 'EdDSA' }));
        const jws = `${header}.not-base64url-json.${toB64url('sig')}`;

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({ code: 'invalid_request_object' });
    });
});

/* -------------------------------------------------------------------------- */
/*                              x509_san_dns (smoke)                          */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — client_id_scheme=x509_san_dns', () => {
    it('refuses x509 verification when neither trustedX509Roots nor unsafeAllowSelfSigned is set', async () => {
        // Build a JWS with an `x5c` header but no valid roots configured.
        // We don't need a real cert — verification must reject long
        // before parsing the chain because the trust policy is empty.
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            { ...baseClaims(key), client_id: 'verifier.test', client_id_scheme: 'x509_san_dns' },
            { x5c: ['MIIBkjCCATg=' /* bogus DER; never parsed */] }
        );

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws })
        ).rejects.toMatchObject({
            // Either invalid_request_object (cert parse failed first) or
            // request_signer_untrusted (trust policy empty). Both indicate
            // the verifier correctly refused.
            name: 'RequestObjectError',
        });
    });

    it('throws invalid_request_object when x5c header is missing', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            {
                ...baseClaims(key),
                client_id: 'verifier.test',
                client_id_scheme: 'x509_san_dns',
            }
        );

        await expect(
            verifyAndDecodeRequestObject({
                inlineJwt: jws,
                unsafeAllowSelfSigned: true,
            })
        ).rejects.toMatchObject({ code: 'invalid_request_object' });
    });
});
