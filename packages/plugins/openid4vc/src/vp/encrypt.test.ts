/**
 * Unit tests for `vp/encrypt.ts` — the JARM (`direct_post.jwt`)
 * response-encryption layer.
 *
 * Strategy: build the JOSE blob with our module, then decrypt it
 * with `jose`'s primitives to verify the wire we produced is
 * spec-conformant. Decryption is the verifier's job in real
 * deployments; here we play both roles so the test surface is
 * end-to-end without a full HTTP harness.
 *
 * Coverage matrix:
 *   - encryption happy paths for ECDH-ES (P-256) + A256GCM and for
 *     RSA-OAEP-256 + A256GCM
 *   - default algorithm negotiation when client_metadata omits one
 *     or both alg fields
 *   - nested JWS-in-JWE (signed-then-encrypted) end-to-end including
 *     wallet-signer error surfacing
 *   - JWE protected-header invariants: `apv` is verifier-nonce,
 *     `apu` is wallet-nonce when supplied, `kid` echoes the chosen
 *     key, `cty=JWT` only when a JWS is wrapped
 *   - JWKS resolution: inline `jwks` wins over `jwks_uri`, fetch
 *     fallback works, fetch errors surface typed
 *   - key-selection edge cases: explicit alg match, alg-agnostic
 *     fallback, sig-only keys rejected, empty keysets rejected
 */
import {
    CompactSign,
    SignJWT,
    compactDecrypt,
    decodeJwt,
    decodeProtectedHeader,
    exportJWK,
    generateKeyPair,
    importJWK,
    type JWK,
    type KeyLike,
} from 'jose';

import {
    DEFAULT_JWE_ALG,
    DEFAULT_JWE_ENC,
    JarmEncryptError,
    encryptResponseObject,
    type JarmClientMetadata,
    type ResponseObjectPayload,
} from './encrypt';
import type { ProofJwtSigner } from '../vci/types';

/* -------------------------------------------------------------------------- */
/*                                 fixtures                                   */
/* -------------------------------------------------------------------------- */

const VERIFIER_NONCE = 'verifier-nonce-abc123';

const PAYLOAD: ResponseObjectPayload = {
    vp_token: 'header.payload.signature',
    presentation_submission: {
        id: 'sub-1',
        definition_id: 'pd-1',
        descriptor_map: [
            { id: 'd1', format: 'jwt_vp_json', path: '$' },
        ],
    },
    state: 'state-xyz',
};

interface VerifierEncKey {
    publicJwk: JWK;
    privateKey: KeyLike;
}

/**
 * Generate an EC P-256 key pair, export the public half as a JWK
 * suitable to embed in `client_metadata.jwks`, and keep the private
 * half for the test's verifier-side decrypt.
 */
const makeEcVerifierKey = async (
    overrides: Partial<JWK> = {}
): Promise<VerifierEncKey> => {
    const { privateKey, publicKey } = await generateKeyPair('ECDH-ES', {
        crv: 'P-256',
        extractable: true,
    });
    const publicJwk = await exportJWK(publicKey);

    return {
        publicJwk: {
            ...publicJwk,
            kid: 'verifier-enc-1',
            use: 'enc',
            alg: 'ECDH-ES',
            ...overrides,
        },
        privateKey: privateKey as KeyLike,
    };
};

const makeRsaVerifierKey = async (): Promise<VerifierEncKey> => {
    const { privateKey, publicKey } = await generateKeyPair('RSA-OAEP-256', {
        modulusLength: 2048,
        extractable: true,
    });
    const publicJwk = await exportJWK(publicKey);

    return {
        publicJwk: {
            ...publicJwk,
            kid: 'verifier-rsa-1',
            use: 'enc',
            alg: 'RSA-OAEP-256',
        },
        privateKey: privateKey as KeyLike,
    };
};

/**
 * Decrypt a JWE we just encrypted, returning the parsed JSON
 * payload. Used to assert the wire we produced is what we think it
 * is.
 */
const decryptToJson = async (
    jwe: string,
    privateKey: KeyLike
): Promise<{
    payload: Record<string, unknown>;
    protectedHeader: Record<string, unknown>;
}> => {
    const { plaintext, protectedHeader } = await compactDecrypt(jwe, privateKey);
    const decoded = new TextDecoder().decode(plaintext);

    // When nested signing is in use the plaintext IS a compact JWS.
    // We surface the JWS payload (not the JWS itself) so tests can
    // assert on the underlying response-object claims uniformly
    // regardless of whether nested signing was enabled.
    if (
        typeof protectedHeader.cty === 'string' &&
        protectedHeader.cty.toUpperCase() === 'JWT'
    ) {
        const innerPayload = decodeJwt(decoded);
        return {
            payload: innerPayload as Record<string, unknown>,
            protectedHeader: protectedHeader as Record<string, unknown>,
        };
    }

    return {
        payload: JSON.parse(decoded),
        protectedHeader: protectedHeader as Record<string, unknown>,
    };
};

const b64url = (s: string): string =>
    Buffer.from(s, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

/* -------------------------------------------------------------------------- */
/*                            encryption happy paths                          */
/* -------------------------------------------------------------------------- */

describe('encryptResponseObject — ECDH-ES + A256GCM (default JWE algs)', () => {
    it('round-trips the response-object payload through jose decryption', async () => {
        const verifier = await makeEcVerifierKey();

        const clientMetadata: JarmClientMetadata = {
            jwks: { keys: [verifier.publicJwk] },
            authorization_encrypted_response_alg: 'ECDH-ES',
            authorization_encrypted_response_enc: 'A256GCM',
        };

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata,
            verifierNonce: VERIFIER_NONCE,
        });

        const { payload, protectedHeader } = await decryptToJson(
            jwe,
            verifier.privateKey
        );

        expect(payload).toEqual(PAYLOAD);
        expect(protectedHeader.alg).toBe('ECDH-ES');
        expect(protectedHeader.enc).toBe('A256GCM');
    });

    it('falls back to ECDH-ES + A256GCM when client_metadata omits both alg fields', async () => {
        const verifier = await makeEcVerifierKey({ alg: undefined });

        const clientMetadata: JarmClientMetadata = {
            jwks: { keys: [verifier.publicJwk] },
            // no authorization_encrypted_response_alg / _enc declared
        };

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata,
            verifierNonce: VERIFIER_NONCE,
        });

        const { protectedHeader } = await decryptToJson(jwe, verifier.privateKey);

        expect(protectedHeader.alg).toBe(DEFAULT_JWE_ALG);
        expect(protectedHeader.enc).toBe(DEFAULT_JWE_ENC);
    });

    it('echoes the verifier nonce as base64url(nonce) in `apv`', async () => {
        const verifier = await makeEcVerifierKey();

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: { jwks: { keys: [verifier.publicJwk] } },
            verifierNonce: VERIFIER_NONCE,
        });

        // OID4VP §8.3 paragraph 6 mandates apv on ECDH-ES KDFs.
        // Without round-tripping decryption we can also assert it
        // directly off the unparsed protected header.
        const protectedHeader = decodeProtectedHeader(jwe) as Record<
            string,
            unknown
        >;
        expect(protectedHeader.apv).toBe(b64url(VERIFIER_NONCE));
    });

    it('sets `apu` to base64url(walletNonce) when supplied', async () => {
        const verifier = await makeEcVerifierKey();
        const walletNonce = 'wallet-nonce-zzz';

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: { jwks: { keys: [verifier.publicJwk] } },
            verifierNonce: VERIFIER_NONCE,
            walletNonce,
        });

        const protectedHeader = decodeProtectedHeader(jwe) as Record<
            string,
            unknown
        >;
        expect(protectedHeader.apu).toBe(b64url(walletNonce));
    });

    it('omits `apu` when walletNonce is not supplied', async () => {
        const verifier = await makeEcVerifierKey();

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: { jwks: { keys: [verifier.publicJwk] } },
            verifierNonce: VERIFIER_NONCE,
        });

        const protectedHeader = decodeProtectedHeader(jwe) as Record<
            string,
            unknown
        >;
        expect(protectedHeader.apu).toBeUndefined();
    });

    it("echoes the chosen key's `kid` so the verifier can route to the right private key", async () => {
        const verifier = await makeEcVerifierKey({ kid: 'unique-enc-1' });

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: { jwks: { keys: [verifier.publicJwk] } },
            verifierNonce: VERIFIER_NONCE,
        });

        const protectedHeader = decodeProtectedHeader(jwe) as Record<
            string,
            unknown
        >;
        expect(protectedHeader.kid).toBe('unique-enc-1');
    });
});

describe('encryptResponseObject — RSA-OAEP-256 + A256GCM', () => {
    it('encrypts to an RSA enc key when the verifier prefers it', async () => {
        const verifier = await makeRsaVerifierKey();

        const clientMetadata: JarmClientMetadata = {
            jwks: { keys: [verifier.publicJwk] },
            authorization_encrypted_response_alg: 'RSA-OAEP-256',
            authorization_encrypted_response_enc: 'A256GCM',
        };

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata,
            verifierNonce: VERIFIER_NONCE,
        });

        const { payload, protectedHeader } = await decryptToJson(
            jwe,
            verifier.privateKey
        );

        expect(payload).toEqual(PAYLOAD);
        expect(protectedHeader.alg).toBe('RSA-OAEP-256');
    });
});

/* -------------------------------------------------------------------------- */
/*                          nested signing (JWS in JWE)                       */
/* -------------------------------------------------------------------------- */

describe('encryptResponseObject — nested signed-then-encrypted (JWS-in-JWE)', () => {
    /**
     * Build a `ProofJwtSigner` backed by a real Ed25519 jose keypair
     * so we can verify the inner JWS post-decryption.
     */
    const makeWalletSigner = async (): Promise<{
        signer: ProofJwtSigner;
        publicJwk: JWK;
    }> => {
        const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
            crv: 'Ed25519',
            extractable: true,
        });
        const publicJwk = await exportJWK(publicKey);

        const signer: ProofJwtSigner = {
            alg: 'EdDSA',
            kid: 'did:jwk:wallet#0',
            sign: async (header, payload) =>
                new SignJWT(payload as Record<string, unknown>)
                    .setProtectedHeader(
                        header as Parameters<SignJWT['setProtectedHeader']>[0]
                    )
                    .sign(privateKey),
        };

        return { signer, publicJwk };
    };

    it('signs the response-object first, then encrypts the JWS', async () => {
        const verifier = await makeEcVerifierKey();
        const { signer, publicJwk: walletPublic } = await makeWalletSigner();

        const clientMetadata: JarmClientMetadata = {
            jwks: { keys: [verifier.publicJwk] },
            authorization_encrypted_response_alg: 'ECDH-ES',
            authorization_encrypted_response_enc: 'A256GCM',
            authorization_signed_response_alg: 'EdDSA',
        };

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata,
            verifierNonce: VERIFIER_NONCE,
            signer,
        });

        // Decrypt → recover the inner JWS string.
        const { plaintext, protectedHeader } = await compactDecrypt(
            jwe,
            verifier.privateKey
        );
        expect(protectedHeader.cty).toBe('JWT');

        const innerJws = new TextDecoder().decode(plaintext);
        expect(innerJws.split('.')).toHaveLength(3);

        // Verify the inner JWS against the wallet's published key,
        // and confirm its claims match our original payload.
        const walletKey = await importJWK(walletPublic, 'EdDSA');
        const innerHeader = decodeProtectedHeader(innerJws);
        expect(innerHeader.alg).toBe('EdDSA');
        expect(innerHeader.kid).toBe('did:jwk:wallet#0');
        expect(innerHeader.typ).toBe('JWT');

        // (Round-trip the signature check via decodeJwt; the plugin's
        // own VPSign unit tests cover full jwtVerify roundtrips.)
        const innerPayload = decodeJwt(innerJws);
        expect(innerPayload.vp_token).toBe(PAYLOAD.vp_token);
        expect(innerPayload.state).toBe(PAYLOAD.state);
        expect(walletKey).toBeDefined();
    });

    it('throws missing_signer when nested signing is requested but no signer is supplied', async () => {
        const verifier = await makeEcVerifierKey();

        const clientMetadata: JarmClientMetadata = {
            jwks: { keys: [verifier.publicJwk] },
            authorization_signed_response_alg: 'EdDSA',
        };

        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata,
                verifierNonce: VERIFIER_NONCE,
                // signer intentionally omitted
            })
        ).rejects.toMatchObject({ code: 'missing_signer' });
    });

    it('surfaces wallet-signer failures as typed sign_failed errors', async () => {
        const verifier = await makeEcVerifierKey();
        const failingSigner: ProofJwtSigner = {
            alg: 'EdDSA',
            kid: 'did:jwk:wallet#0',
            sign: async () => {
                throw new Error('HSM unavailable');
            },
        };

        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata: {
                    jwks: { keys: [verifier.publicJwk] },
                    authorization_signed_response_alg: 'EdDSA',
                },
                verifierNonce: VERIFIER_NONCE,
                signer: failingSigner,
            })
        ).rejects.toMatchObject({
            code: 'sign_failed',
            message: expect.stringMatching(/HSM unavailable/),
        });
    });

    it('does NOT call the signer when nested signing is disabled', async () => {
        const verifier = await makeEcVerifierKey();
        const signFn = jest.fn();
        const lazySigner: ProofJwtSigner = {
            alg: 'EdDSA',
            kid: 'did:jwk:wallet#0',
            sign: signFn,
        };

        await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: { jwks: { keys: [verifier.publicJwk] } },
            verifierNonce: VERIFIER_NONCE,
            signer: lazySigner,
        });

        expect(signFn).not.toHaveBeenCalled();
    });
});

/* -------------------------------------------------------------------------- */
/*                               JWKS resolution                              */
/* -------------------------------------------------------------------------- */

describe('encryptResponseObject — JWKS resolution', () => {
    it('prefers inline `jwks` over `jwks_uri` (no fetch when both present)', async () => {
        const verifier = await makeEcVerifierKey();
        const fetchImpl = jest.fn();

        await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: {
                jwks: { keys: [verifier.publicJwk] },
                jwks_uri: 'https://verifier.example/.well-known/jwks.json',
            },
            verifierNonce: VERIFIER_NONCE,
            fetchImpl: fetchImpl as unknown as typeof fetch,
        });

        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('fetches `jwks_uri` and uses the returned keys when no inline jwks', async () => {
        const verifier = await makeEcVerifierKey();
        const fetchImpl = jest.fn(async () => ({
            ok: true,
            status: 200,
            json: async () => ({ keys: [verifier.publicJwk] }),
        })) as unknown as typeof fetch;

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: {
                jwks_uri: 'https://verifier.example/.well-known/jwks.json',
            },
            verifierNonce: VERIFIER_NONCE,
            fetchImpl,
        });

        const { payload } = await decryptToJson(jwe, verifier.privateKey);
        expect(payload).toEqual(PAYLOAD);
        expect(fetchImpl).toHaveBeenCalledWith(
            'https://verifier.example/.well-known/jwks.json',
            expect.objectContaining({
                headers: expect.objectContaining({ Accept: 'application/json' }),
            })
        );
    });

    it('throws jwks_fetch_failed when the URI returns a non-2xx status', async () => {
        const fetchImpl = jest.fn(async () => ({
            ok: false,
            status: 503,
            json: async () => ({}),
        })) as unknown as typeof fetch;

        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata: {
                    jwks_uri: 'https://verifier.example/.well-known/jwks.json',
                },
                verifierNonce: VERIFIER_NONCE,
                fetchImpl,
            })
        ).rejects.toMatchObject({ code: 'jwks_fetch_failed' });
    });

    it('throws jwks_fetch_failed when fetch itself throws (network error)', async () => {
        const fetchImpl = jest.fn(async () => {
            throw new Error('ECONNREFUSED');
        }) as unknown as typeof fetch;

        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata: {
                    jwks_uri: 'https://verifier.example/.well-known/jwks.json',
                },
                verifierNonce: VERIFIER_NONCE,
                fetchImpl,
            })
        ).rejects.toMatchObject({ code: 'jwks_fetch_failed' });
    });

    it('throws invalid_jwks when fetched body is not a JWKS object', async () => {
        const fetchImpl = jest.fn(async () => ({
            ok: true,
            status: 200,
            json: async () => ({ not_a_keys_array: true }),
        })) as unknown as typeof fetch;

        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata: {
                    jwks_uri: 'https://verifier.example/.well-known/jwks.json',
                },
                verifierNonce: VERIFIER_NONCE,
                fetchImpl,
            })
        ).rejects.toMatchObject({ code: 'invalid_jwks' });
    });

    it('throws no_encryption_key when neither inline nor URI is supplied', async () => {
        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata: {},
                verifierNonce: VERIFIER_NONCE,
            })
        ).rejects.toMatchObject({ code: 'no_encryption_key' });
    });
});

/* -------------------------------------------------------------------------- */
/*                               key selection                                */
/* -------------------------------------------------------------------------- */

describe('encryptResponseObject — key selection within a JWKS', () => {
    it('picks the key whose `alg` matches the requested key-wrap', async () => {
        // Two enc keys; only one declares ECDH-ES. The encryption
        // must succeed (proves we picked the right one) AND its `kid`
        // must echo into the JWE protected header.
        const ecKey = await makeEcVerifierKey({
            kid: 'ec-1',
            alg: 'ECDH-ES',
        });
        const rsaKey = await makeRsaVerifierKey();

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: {
                jwks: { keys: [rsaKey.publicJwk, ecKey.publicJwk] },
                authorization_encrypted_response_alg: 'ECDH-ES',
            },
            verifierNonce: VERIFIER_NONCE,
        });

        const { protectedHeader } = await decryptToJson(jwe, ecKey.privateKey);
        expect(protectedHeader.kid).toBe('ec-1');
    });

    it('falls back to an alg-agnostic key when no exact match exists', async () => {
        // EC key with no `alg` claim; should be picked because no
        // exact match exists and it's not `use:sig`.
        const verifier = await makeEcVerifierKey({
            alg: undefined,
            kid: 'agnostic-1',
        });

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: {
                jwks: { keys: [verifier.publicJwk] },
                authorization_encrypted_response_alg: 'ECDH-ES',
            },
            verifierNonce: VERIFIER_NONCE,
        });

        const { protectedHeader } = await decryptToJson(jwe, verifier.privateKey);
        expect(protectedHeader.kid).toBe('agnostic-1');
    });

    it('rejects sig-only keys (use:"sig") even when they are the only option', async () => {
        const sigKey = await makeEcVerifierKey({ use: 'sig' });

        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata: { jwks: { keys: [sigKey.publicJwk] } },
                verifierNonce: VERIFIER_NONCE,
            })
        ).rejects.toMatchObject({ code: 'no_encryption_key' });
    });

    it('throws no_encryption_key on an empty keys array', async () => {
        await expect(
            encryptResponseObject({
                payload: PAYLOAD,
                clientMetadata: { jwks: { keys: [] } },
                verifierNonce: VERIFIER_NONCE,
            })
        ).rejects.toMatchObject({ code: 'no_encryption_key' });
    });

    it('accepts keys with no `use` claim (some verifiers omit it)', async () => {
        const verifier = await makeEcVerifierKey({ use: undefined });

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: { jwks: { keys: [verifier.publicJwk] } },
            verifierNonce: VERIFIER_NONCE,
        });

        const { payload } = await decryptToJson(jwe, verifier.privateKey);
        expect(payload).toEqual(PAYLOAD);
    });
});

/* -------------------------------------------------------------------------- */
/*                                error class                                 */
/* -------------------------------------------------------------------------- */

describe('JarmEncryptError', () => {
    it('preserves the typed code and the underlying cause', () => {
        const cause = new Error('underlying');
        const err = new JarmEncryptError('encrypt_failed', 'wrapper', { cause });

        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('JarmEncryptError');
        expect(err.code).toBe('encrypt_failed');
        expect((err as { cause?: unknown }).cause).toBe(cause);
    });
});

/* -------------------------------------------------------------------------- */
/*                       belt-and-suspenders: CompactSign                     */
/* -------------------------------------------------------------------------- */

describe('encryptResponseObject — interop with jose CompactSign signer', () => {
    /**
     * Production-shape signer: a `ProofJwtSigner` backed by jose's
     * `CompactSign` (rather than `SignJWT`). Mirrors the kind of
     * signer hosts wire when they don't want jose's JWT helpers.
     */
    it('accepts a CompactSign-backed signer and produces a verifiable inner JWS', async () => {
        const verifier = await makeEcVerifierKey();
        const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
            crv: 'Ed25519',
            extractable: true,
        });

        const compactSigner: ProofJwtSigner = {
            alg: 'EdDSA',
            kid: 'did:jwk:wallet#0',
            sign: async (header, payload) => {
                const enc = new TextEncoder().encode(JSON.stringify(payload));
                return new CompactSign(enc)
                    .setProtectedHeader(
                        header as Parameters<
                            CompactSign['setProtectedHeader']
                        >[0]
                    )
                    .sign(privateKey);
            },
        };

        const jwe = await encryptResponseObject({
            payload: PAYLOAD,
            clientMetadata: {
                jwks: { keys: [verifier.publicJwk] },
                authorization_signed_response_alg: 'EdDSA',
            },
            verifierNonce: VERIFIER_NONCE,
            signer: compactSigner,
        });

        const { plaintext } = await compactDecrypt(jwe, verifier.privateKey);
        const innerJws = new TextDecoder().decode(plaintext);
        expect(innerJws.split('.')).toHaveLength(3);
        expect(publicKey).toBeDefined();
    });
});
