/**
 * Tests for the signed Request Object verification layer (Slice 7.5).
 *
 * We generate real Ed25519 / EC signatures via `jose` and drive the
 * verifier with in-memory DID resolvers / fetch stubs so the
 * verification math is exercised end-to-end. No network, no fixtures
 * on disk.
 */
import { exportJWK, generateKeyPair, JWK, SignJWT } from 'jose';

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
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
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
        input_descriptors: [{ id: 'd1', constraints: { fields: [{ path: ['$.type'] }] } }],
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
        const body = typeof route.body === 'string' ? route.body : JSON.stringify(route.body);

        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'OK',
            headers: new Headers({
                'content-type':
                    typeof route.body === 'string' ? 'application/jwt' : 'application/json',
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

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
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

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'invalid_request_object',
        });
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

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'did_resolution_failed',
        });
    });

    it('rejects a kid that does not exist on the DID document', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, baseClaims(key), {
            kid: `${key.did}#does-not-exist`,
        });

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'request_signer_untrusted',
        });
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
        const didDocument: DidDocument = {
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

        const fetchImpl = mockFetch({
            'https://verifier.test/tenants/acme/did.json': {
                body: didDocument,
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
        const jws = await signRequestObject(key, {
            ...baseClaims(key),
            client_id_scheme: 'redirect_uri',
        });

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'unsupported_client_id_scheme',
        });
    });

    it('refuses client_id_scheme=pre-registered until wiring exists', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, {
            ...baseClaims(key),
            client_id_scheme: 'pre-registered',
        });

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'unsupported_client_id_scheme',
        });
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

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'unsupported_client_id_scheme',
        });
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

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'invalid_request_object',
        });
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

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            // Either invalid_request_object (cert parse failed first) or
            // request_signer_untrusted (trust policy empty). Both indicate
            // the verifier correctly refused.
            name: 'RequestObjectError',
        });
    });

    it('throws invalid_request_object when x5c header is missing', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, {
            ...baseClaims(key),
            client_id: 'verifier.test',
            client_id_scheme: 'x509_san_dns',
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
/*                       request_uri_method=post (§5.10)                       */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — request_uri_method=post (§5.10)', () => {
    const jwsResponse = (jws: string) =>
        ({ ok: true, status: 200, statusText: 'OK', text: async () => jws } as unknown as Response);

    it('POSTs wallet_nonce and accepts a request object that echoes it', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, baseClaims(key, { wallet_nonce: 'wn-abc' }));
        const fetchMock = jest.fn().mockResolvedValue(jwsResponse(jws));

        const request = await verifyAndDecodeRequestObject({
            requestUri: 'https://verifier.test/req',
            requestUriMethod: 'post',
            walletNonce: 'wn-abc',
            fetchImpl: fetchMock as unknown as typeof fetch,
        });

        expect(request.wallet_nonce).toBe('wn-abc');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://verifier.test/req');
        expect(init.method).toBe('POST');
        expect(init.headers.Accept).toBe('application/oauth-authz-req+jwt');
        expect(String(init.body)).toContain('wallet_nonce=wn-abc');
    });

    it('rejects when the request object does not echo the sent wallet_nonce', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(key, baseClaims(key, { wallet_nonce: 'different' }));
        const fetchMock = jest.fn().mockResolvedValue(jwsResponse(jws));

        await expect(
            verifyAndDecodeRequestObject({
                requestUri: 'https://verifier.test/req',
                requestUriMethod: 'post',
                walletNonce: 'wn-abc',
                fetchImpl: fetchMock as unknown as typeof fetch,
            })
        ).rejects.toMatchObject({ code: 'invalid_request_object' });
    });
});

/* -------------------------------------------------------------------------- */
/*                              x509_hash (smoke)                             */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — client_id_scheme=x509_hash (§5.9.3)', () => {
    it('routes x509_hash to the x509 verifier (not rejected as unsupported)', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            {
                ...baseClaims(key),
                client_id: 'x509_hash:Uvo3HtuIxuhC92rShpgqcT3YXwrqRxWEviRiA0OZszk',
                client_id_scheme: 'x509_hash',
            },
            { x5c: ['MIIBkjCCATg=' /* bogus DER; never parsed */] }
        );

        // With a bogus cert the flow fails during chain parse / trust check —
        // the point is it's ROUTED to x509 verification and does NOT throw
        // unsupported_client_id_scheme.
        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws, unsafeAllowSelfSigned: true })
        ).rejects.toMatchObject({ name: 'RequestObjectError' });

        await expect(
            verifyAndDecodeRequestObject({ inlineJwt: jws, unsafeAllowSelfSigned: true })
        ).rejects.not.toMatchObject({ code: 'unsupported_client_id_scheme' });
    });
});

describe('verifyAndDecodeRequestObject — unsigned JSON Request Objects', () => {
    const responseUri = 'https://verifier.example.com/exchanges/abc/response';
    const requestUri = 'https://verifier.example.com/exchanges/abc/request';

    const unsignedRequest = {
        response_type: 'vp_token',
        response_mode: 'direct_post',
        client_id: `redirect_uri:${responseUri}`,
        response_uri: responseUri,
        nonce: 'nonce-123',
        state: 'state-456',
        dcql_query: {
            credentials: [
                {
                    id: 'credential',
                    format: 'ldp_vc',
                    meta: {
                        type_values: [['https://www.w3.org/2018/credentials#VerifiableCredential']],
                    },
                },
            ],
        },
    };

    it('accepts a plain-JSON request object when the client-id prefix is redirect_uri', async () => {
        const fetchImpl = mockFetch({ [requestUri]: { body: unsignedRequest } });

        const request = await verifyAndDecodeRequestObject({ requestUri, fetchImpl });

        expect(request.client_id).toBe(`redirect_uri:${responseUri}`);
        expect(request.client_id_scheme).toBe('redirect_uri');
        expect(request.nonce).toBe('nonce-123');
        expect(request.response_uri).toBe(responseUri);
        expect(request.dcql_query).toBeDefined();
    });

    it('cross-checks the outer URL client_id against the unsigned request', async () => {
        const fetchImpl = mockFetch({ [requestUri]: { body: unsignedRequest } });

        await expect(
            verifyAndDecodeRequestObject({
                requestUri,
                urlClientId: 'redirect_uri:https://attacker.example.com/response',
                fetchImpl,
            })
        ).rejects.toMatchObject({ code: 'client_id_mismatch' });
    });

    it('rejects unsigned request objects for prefixes that require signatures', async () => {
        const fetchImpl = mockFetch({
            [requestUri]: {
                body: { ...unsignedRequest, client_id: 'did:web:verifier.example.com' },
            },
        });

        await expect(verifyAndDecodeRequestObject({ requestUri, fetchImpl })).rejects.toMatchObject(
            {
                code: 'invalid_request_object',
                message: expect.stringMatching(/requires a signed JWS/),
            }
        );
    });

    it('rejects bodies that are neither JWS nor JSON', async () => {
        const fetchImpl = mockFetch({ [requestUri]: { body: 'not-a-jws-or-json' } });

        await expect(verifyAndDecodeRequestObject({ requestUri, fetchImpl })).rejects.toMatchObject(
            {
                code: 'invalid_request_object',
                message: expect.stringMatching(/neither a compact JWS nor a JSON/),
            }
        );
    });

    it('rejects unsigned request objects missing a nonce', async () => {
        const { nonce: _omitted, ...withoutNonce } = unsignedRequest;
        const fetchImpl = mockFetch({ [requestUri]: { body: withoutNonce } });

        await expect(verifyAndDecodeRequestObject({ requestUri, fetchImpl })).rejects.toMatchObject(
            { code: 'invalid_request_object' }
        );
    });
});

/* -------------------------------------------------------------------------- */
/*                       transaction_data claim validation                    */
/* -------------------------------------------------------------------------- */

describe('verifyAndDecodeRequestObject — transaction_data claim', () => {
    it('preserves a valid non-empty string array', async () => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            baseClaims(key, { transaction_data: ['eyJmYWtlIjoidGQifQ'] })
        );

        const request = await verifyAndDecodeRequestObject({ inlineJwt: jws });

        expect(request.transaction_data).toEqual(['eyJmYWtlIjoidGQifQ']);
    });

    it.each([
        ['empty array', []],
        ['array with non-string entries', [42]],
        ['non-array object', {}],
        ['bare string', 'eyJmYWtlIjoidGQifQ'],
    ])('rejects a malformed transaction_data claim (%s)', async (_label, transactionData) => {
        const key = await makeVerifierKey();
        const jws = await signRequestObject(
            key,
            baseClaims(key, { transaction_data: transactionData })
        );

        await expect(verifyAndDecodeRequestObject({ inlineJwt: jws })).rejects.toMatchObject({
            code: 'invalid_transaction_data',
        });
    });
});

describe('verifyAndDecodeRequestObject — unsigned redirect_uri equality (OID4VP 1.0 §5.9.1)', () => {
    const requestUri = 'https://verifier.example.com/exchanges/eq/request';

    const unsignedBase = {
        response_type: 'vp_token',
        response_mode: 'direct_post',
        nonce: 'nonce-eq',
        dcql_query: {
            credentials: [
                {
                    id: 'credential',
                    format: 'ldp_vc',
                    meta: {
                        type_values: [['https://www.w3.org/2018/credentials#VerifiableCredential']],
                    },
                },
            ],
        },
    };

    it('rejects a canonical redirect_uri: client-id that differs from the response target', async () => {
        const fetchImpl = mockFetch({
            [requestUri]: {
                body: {
                    ...unsignedBase,
                    client_id: 'redirect_uri:https://trusted.example/callback',
                    response_uri: 'https://attacker.example/collect',
                },
            },
        });

        await expect(verifyAndDecodeRequestObject({ requestUri, fetchImpl })).rejects.toMatchObject(
            { code: 'client_id_mismatch' }
        );
    });

    it('rejects a legacy client_id_scheme=redirect_uri client-id that is cross-origin with the response target', async () => {
        const fetchImpl = mockFetch({
            [requestUri]: {
                body: {
                    ...unsignedBase,
                    client_id: 'https://trusted.example/verify',
                    client_id_scheme: 'redirect_uri',
                    response_uri: 'https://attacker.example/collect',
                },
            },
        });

        await expect(verifyAndDecodeRequestObject({ requestUri, fetchImpl })).rejects.toMatchObject(
            { code: 'client_id_mismatch' }
        );
    });

    it('accepts a legacy client_id_scheme=redirect_uri client-id that is same-origin with the response target', async () => {
        const fetchImpl = mockFetch({
            [requestUri]: {
                body: {
                    ...unsignedBase,
                    client_id: 'https://verifier.example.com/verify',
                    client_id_scheme: 'redirect_uri',
                    response_uri: 'https://verifier.example.com/exchanges/eq/response',
                },
            },
        });

        const request = await verifyAndDecodeRequestObject({ requestUri, fetchImpl });

        expect(request.client_id_scheme).toBe('redirect_uri');
    });
});
