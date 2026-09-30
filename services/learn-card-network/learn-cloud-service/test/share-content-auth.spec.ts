import { readFileSync } from 'node:fs';

import {
    DEFAULT_MAX_TOKEN_BYTES,
    DISABLED_SHARE_CONTENT_TRUST_CONFIG,
    SHARE_CONTENT_AUTH_PURPOSE,
    ShareContentCanonicalizationError,
    canonicalizeShareContentRequestBody,
    computeShareContentRequestHash,
    createShareContentAuthorizationVerifier,
    createSetIfAbsentReplayStore,
    isCanonicalBase64Url,
    isShareContentTrustConfigActive,
    resolveShareContentTrustConfig,
    type PresentationVerificationResult,
    type PresentationVerifier,
    type ReplayStore,
    type ShareContentAuthorizationRequest,
    type ShareContentAuthorizationVerifier,
    type ShareContentTrustConfig,
} from '@helpers/share-content-auth';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000;
const AUDIENCE = 'did:web:cloud.learncard.com';
const SIGNER = 'did:web:brain.learncard.com';
const KID = `${SIGNER}#key-1`;
const SHARE_ID = Buffer.from(new Uint8Array(16).fill(7)).toString('base64url');
const OWNER = 'owner-profile-1';
const OBJECT_ID = 'object-0001';
const OPERATION_ID = 'operation-0001';
const NAMESPACE = 'learncard';

const ENVELOPE = { v: 1, alg: 'A256GCM', iv: 'AAAAAAAAAAAAAAAA', ct: 'AAAAAAAAAAAAAAAAAAAAAAAA' };
const RECOVERY = { protected: 'aaa', iv: 'bbb', ciphertext: 'ccc', tag: 'ddd' };

const BINDING = {
    namespace: NAMESPACE,
    op: 'put' as const,
    shareId: SHARE_ID,
    contentVersion: 1,
    ownerProfileId: OWNER,
    objectId: OBJECT_ID,
    operationId: OPERATION_ID,
};

const FULL_BODY = { ...BINDING, ciphertext: ENVELOPE, ownerEncryptedRecovery: RECOVERY };
const REQUEST_HASH = computeShareContentRequestHash(FULL_BODY);

const baseRequest = (): ShareContentAuthorizationRequest => ({
    ...BINDING,
    requestHash: REQUEST_HASH,
});

const baseClaims = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    iss: SIGNER,
    aud: AUDIENCE,
    purpose: SHARE_CONTENT_AUTH_PURPOSE,
    namespace: NAMESPACE,
    op: 'put',
    shareId: SHARE_ID,
    contentVersion: 1,
    ownerProfileId: OWNER,
    objectId: OBJECT_ID,
    operationId: OPERATION_ID,
    requestHash: REQUEST_HASH,
    iat: NOW,
    exp: NOW + 30,
    jti: 'jti-abcdefghijklmnop1234',
    ...overrides,
});

const okVerification = (): PresentationVerificationResult => ({
    checks: ['JWS'],
    warnings: [],
    errors: [],
});

const activeConfig = (overrides: Record<string, unknown> = {}): ShareContentTrustConfig =>
    resolveShareContentTrustConfig({
        enabled: true,
        audience: AUDIENCE,
        serviceDids: [SIGNER],
        verificationMethods: [KID],
        ...overrides,
    });

const encodePart = (value: unknown): string =>
    Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const DUMMY_SIGNATURE = Buffer.from(new Uint8Array(64).fill(1)).toString('base64url');

const buildTokenFromPayload = (payload: unknown, header: Record<string, unknown> = {}): string =>
    `${encodePart({ alg: 'EdDSA', kid: KID, ...header })}.${encodePart(payload)}.${DUMMY_SIGNATURE}`;

const buildToken = (claims: unknown, header: Record<string, unknown> = {}): string =>
    buildTokenFromPayload(
        {
            iss: SIGNER,
            vp: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: SIGNER,
                verifiableCredential: [],
            },
            nonce: typeof claims === 'string' ? claims : JSON.stringify(claims),
        },
        header
    );

const makeAtomicStore = (): { store: ReplayStore; keys: Map<string, number> } => {
    const keys = new Map<string, number>();

    return {
        keys,
        store: {
            consumeOnce: async (key, ttlSeconds) => {
                if (keys.has(key)) return false;

                // Written synchronously before any await → atomic in the event loop,
                // the same contract Redis SET NX EX provides.
                keys.set(key, ttlSeconds);

                return true;
            },
        },
    };
};

const makeVerifier = (
    options: {
        config?: ShareContentTrustConfig;
        verifyResult?: PresentationVerificationResult;
        verifyImpl?: PresentationVerifier;
        store?: ReplayStore;
        now?: () => number;
    } = {}
): {
    verifier: ShareContentAuthorizationVerifier;
    calls: string[];
    config: ShareContentTrustConfig;
} => {
    const calls: string[] = [];
    const verifyPresentation: PresentationVerifier =
        options.verifyImpl ??
        (async token => {
            calls.push(token);

            return options.verifyResult ?? okVerification();
        });

    const config = options.config ?? activeConfig();

    return {
        config,
        calls,
        verifier: createShareContentAuthorizationVerifier({
            config,
            verifyPresentation,
            replayStore: options.store ?? makeAtomicStore().store,
            now: options.now ?? (() => NOW),
        }),
    };
};

const expectReject = async (
    result: Promise<{ ok: boolean; reason?: string }>,
    reason: string
): Promise<void> => {
    const settled = await result;

    expect(settled.ok).toBe(false);
    expect(settled.reason).toBe(reason);
};

// ---------------------------------------------------------------------------
// Trust configuration
// ---------------------------------------------------------------------------

describe('share-content-auth trust configuration', () => {
    it('treats an empty configuration as disabled', () => {
        expect(isShareContentTrustConfigActive(resolveShareContentTrustConfig({}))).toBe(false);
        expect(isShareContentTrustConfigActive(DISABLED_SHARE_CONTENT_TRUST_CONFIG)).toBe(false);
    });

    it('stays disabled when explicitly disabled even with full values', () => {
        const config = resolveShareContentTrustConfig({
            enabled: false,
            audience: AUDIENCE,
            serviceDids: [SIGNER],
            verificationMethods: [KID],
        });

        expect(config.enabled).toBe(false);
        expect(isShareContentTrustConfigActive(config)).toBe(false);
    });

    it('disables access when a DID allowlist is present but the key-method allowlist is missing', () => {
        expect(
            resolveShareContentTrustConfig({
                enabled: true,
                audience: AUDIENCE,
                serviceDids: [SIGNER],
            }).enabled
        ).toBe(false);
    });

    it('parses comma-separated allowlists and bounds the numbers', () => {
        const config = resolveShareContentTrustConfig({
            enabled: true,
            audience: AUDIENCE,
            serviceDids: `${SIGNER}, did:web:brain2.learncard.com`,
            verificationMethods: `${KID},${SIGNER}#key-2`,
            clockSkewSeconds: 10,
            maxTokenTtlSeconds: 30,
        });

        expect(isShareContentTrustConfigActive(config)).toBe(true);
        expect(config.allowedServiceDids).toEqual([SIGNER, 'did:web:brain2.learncard.com']);
        expect(config.clockSkewSeconds).toBe(10);
        expect(config.maxTokenTtlSeconds).toBe(30);
    });

    it('rejects out-of-range bounds by disabling access', () => {
        expect(
            resolveShareContentTrustConfig({
                enabled: true,
                audience: AUDIENCE,
                serviceDids: [SIGNER],
                verificationMethods: [KID],
                maxTokenTtlSeconds: 600,
            }).enabled
        ).toBe(false);
    });

    it('uses default-disabled config so the verifier denies access with no trusted identities', async () => {
        const verify = vi.fn<PresentationVerifier>(async () => okVerification());
        const verifier = createShareContentAuthorizationVerifier({
            config: DISABLED_SHARE_CONTENT_TRUST_CONFIG,
            verifyPresentation: verify,
            replayStore: makeAtomicStore().store,
            now: () => NOW,
        });

        await expectReject(verifier.authorize(baseRequest(), buildToken(baseClaims())), 'DISABLED');
        expect(verify).not.toHaveBeenCalled();
    });

    it('does not honor an offline/unknown config flag as an access bypass', async () => {
        const config = resolveShareContentTrustConfig({
            enabled: true,
            audience: AUDIENCE,
            serviceDids: [SIGNER],
            verificationMethods: [KID],
            allowOffline: true,
            offline: true,
            SHARE_CONTENT_ALLOW_OFFLINE: true,
        });
        const { verifier } = makeVerifier({ config });

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims(), { kid: 'did:web:localhost%3A3000#key-1' })
            ),
            'UNKNOWN_SIGNER'
        );
    });
});

// ---------------------------------------------------------------------------
// Allowlist filtering BEFORE the signature verifier
// ---------------------------------------------------------------------------

describe('share-content-auth pre-verification allowlist filtering', () => {
    it('rejects an ordinary user DID without invoking the verifier', async () => {
        const userDid = 'did:key:z6MkUserNotAService';
        const { verifier, calls } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims(), { kid: `${userDid}#key-1` })
            ),
            'UNKNOWN_SIGNER'
        );
        expect(calls).toHaveLength(0);
    });

    it('rejects an unknown verification method on an allowlisted DID without invoking the verifier', async () => {
        const { verifier, calls } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims(), { kid: `${SIGNER}#rotated-unknown` })
            ),
            'UNKNOWN_VERIFICATION_METHOD'
        );
        expect(calls).toHaveLength(0);
    });

    it('rejects remote key headers and unsupported algorithms without invoking the verifier', async () => {
        const { verifier, calls } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims(), { jku: 'https://evil.example/jwks' })
            ),
            'UNSUPPORTED_HEADER'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims(), { jwk: { kty: 'OKP' } })),
            'UNSUPPORTED_HEADER'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims(), { alg: 'none' })),
            'UNSUPPORTED_ALGORITHM'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims(), { alg: 'HS256' })),
            'UNSUPPORTED_ALGORITHM'
        );
        expect(calls).toHaveLength(0);
    });

    it('rejects a missing kid without invoking the verifier', async () => {
        const { verifier, calls } = makeVerifier();

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims(), { kid: undefined })),
            'MISSING_KID'
        );
        expect(calls).toHaveLength(0);
    });

    it('rejects a non-DID / URL-shaped kid', async () => {
        const { verifier, calls } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims(), { kid: 'https://evil.example#key' })
            ),
            'UNSUPPORTED_HEADER'
        );
        expect(calls).toHaveLength(0);
    });

    it('rejects an oversized token before any parsing or verification', async () => {
        const { verifier, calls } = makeVerifier({
            config: activeConfig({ maxTokenBytes: 512 }),
        });
        const hugeClaims = baseClaims({ padding: 'x'.repeat(4000) });

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(hugeClaims)),
            'TOKEN_TOO_LARGE'
        );
        expect(calls).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Cryptographic verification and identity binding
// ---------------------------------------------------------------------------

describe('share-content-auth signature and identity binding', () => {
    it('accepts a valid token and returns only minimal authenticated context', async () => {
        const { verifier } = makeVerifier();
        const token = buildToken(baseClaims());

        const result = await verifier.authorize(baseRequest(), token);

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.context.signerDid).toBe(SIGNER);
        expect(result.context.verificationMethod).toBe(KID);
        expect(result.context.claims.shareId).toBe(SHARE_ID);
        expect(JSON.stringify(result.context)).not.toContain(token);
    });

    it('accepts claims supplied through vp.proof.challenge', async () => {
        const { verifier } = makeVerifier();
        const token = buildTokenFromPayload({
            iss: SIGNER,
            vp: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: SIGNER,
                proof: { challenge: JSON.stringify(baseClaims()) },
            },
        });

        const result = await verifier.authorize(baseRequest(), token);
        expect(result.ok).toBe(true);
    });

    it('rejects a bad signature', async () => {
        const { verifier, calls } = makeVerifier({
            verifyResult: { checks: ['JWS'], warnings: [], errors: ['Invalid signature'] },
        });

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims())),
            'SIGNATURE_INVALID'
        );
        expect(calls).toHaveLength(1);
    });

    it('rejects a verification result without the JWS check', async () => {
        const { verifier } = makeVerifier({
            verifyResult: { checks: [], warnings: [], errors: [] },
        });

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims())),
            'SIGNATURE_INVALID'
        );
    });

    it('fails closed when the injected verifier throws', async () => {
        const { verifier } = makeVerifier({
            verifyImpl: async () => {
                throw new Error('resolver unavailable');
            },
        });

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims())),
            'SIGNATURE_INVALID'
        );
    });

    it('rejects a token whose payload iss does not match the signing kid', async () => {
        const { verifier, calls } = makeVerifier();
        const token = buildTokenFromPayload({
            iss: 'did:web:attacker.example',
            vp: { holder: SIGNER },
            nonce: JSON.stringify(baseClaims()),
        });

        await expectReject(verifier.authorize(baseRequest(), token), 'SIGNER_MISMATCH');
        expect(calls).toHaveLength(1);
    });

    it('rejects a token whose holder does not match the signing kid', async () => {
        const { verifier } = makeVerifier();
        const token = buildTokenFromPayload({
            iss: SIGNER,
            vp: { holder: 'did:web:attacker.example' },
            nonce: JSON.stringify(baseClaims()),
        });

        await expectReject(verifier.authorize(baseRequest(), token), 'SIGNER_MISMATCH');
    });

    it('rejects claims whose iss does not match the signing kid', async () => {
        const { verifier } = makeVerifier();
        const token = buildToken(baseClaims({ iss: 'did:web:attacker.example' }));

        await expectReject(verifier.authorize(baseRequest(), token), 'SIGNER_MISMATCH');
    });

    it('rejects malformed JSON claims and a non-JSON nonce', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(baseRequest(), buildToken('{not json')),
            'MALFORMED_CLAIMS'
        );
    });
});

// ---------------------------------------------------------------------------
// Claim schema, purpose and audience
// ---------------------------------------------------------------------------

describe('share-content-auth claims', () => {
    it('rejects a wrong audience', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims({ aud: 'did:web:evil.example' }))
            ),
            'AUDIENCE_MISMATCH'
        );
    });

    it('rejects a wrong purpose', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ purpose: 'user-auth' }))),
            'PURPOSE_MISMATCH'
        );
    });

    it('rejects wildcard and unknown operations', async () => {
        const { verifier } = makeVerifier();

        for (const op of ['list', 'deleteOwner', 'deleteAll']) {
            await expectReject(
                verifier.authorize({ ...baseRequest(), op: 'put' }, buildToken(baseClaims({ op }))),
                'OPERATION_NOT_ALLOWED'
            );
        }
    });

    it('accepts the exact-object operations and the owner-recovery intent', async () => {
        for (const op of ['get', 'stat', 'delete', 'readRecovery'] as const) {
            const hash = computeShareContentRequestHash({ ...BINDING, op });
            const claims = baseClaims({ op, requestHash: hash });
            const { verifier } = makeVerifier();

            const result = await verifier.authorize(
                { ...BINDING, op, requestHash: hash },
                buildToken(claims)
            );
            expect(result.ok).toBe(true);
        }
    });

    it('rejects unknown claim fields', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ admin: true }))),
            'UNKNOWN_CLAIM_FIELD'
        );
    });

    it('rejects non-canonical / URL-shaped share ids in claims', async () => {
        const { verifier } = makeVerifier();
        const request = { ...baseRequest() };

        await expectReject(
            verifier.authorize(
                request,
                buildToken(baseClaims({ shareId: 'https://evil.example/blob' }))
            ),
            'INVALID_SHARE_ID'
        );

        // Non-canonical spelling of the same 16 bytes (unused padding bits set).
        const nonCanonical = `${SHARE_ID.slice(0, 21)}B`;
        await expectReject(
            verifier.authorize(request, buildToken(baseClaims({ shareId: nonCanonical }))),
            'INVALID_SHARE_ID'
        );
    });

    it('rejects non-opaque owner/object/operation/namespace identifiers', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims({ ownerProfileId: 'has space' }))
            ),
            'INVALID_IDENTIFIER'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ objectId: '' }))),
            'INVALID_IDENTIFIER'
        );
        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims({ operationId: 'a'.repeat(129) }))
            ),
            'INVALID_IDENTIFIER'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ namespace: 'bad\nvalue' }))),
            'INVALID_IDENTIFIER'
        );
    });

    it('rejects non-canonical request hashes', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ requestHash: 'deadbeef' }))),
            'INVALID_CLAIMS'
        );
    });
});

// ---------------------------------------------------------------------------
// Time and nonce
// ---------------------------------------------------------------------------

describe('share-content-auth time and nonce bounds', () => {
    it('rejects non-positive, zero and too-long signed lifetimes', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ iat: NOW, exp: NOW }))),
            'INVALID_TTL'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ iat: NOW + 10, exp: NOW }))),
            'INVALID_TTL'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ iat: NOW, exp: NOW + 61 }))),
            'INVALID_TTL'
        );
    });

    it('rejects non-integer and unsafe times', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims({ iat: NOW + 0.5, exp: NOW + 30 }))
            ),
            'INVALID_CLAIMS'
        );
        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims({ iat: NOW, exp: Number.MAX_SAFE_INTEGER + 1 }))
            ),
            'INVALID_CLAIMS'
        );
    });

    it('rejects an expired token but tolerates bounded skew', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims({ iat: NOW - 120, exp: NOW - 60 }))
            ),
            'TOKEN_EXPIRED'
        );

        const withinSkew = makeVerifier();
        const expiredWithinSkew = buildToken(baseClaims({ iat: NOW - 40, exp: NOW - 10 }));
        // exp + skew (5) is still in the past → rejected
        await expectReject(
            withinSkew.verifier.authorize(baseRequest(), expiredWithinSkew),
            'TOKEN_EXPIRED'
        );

        const config = activeConfig({ clockSkewSeconds: 30 });
        const skewed = makeVerifier({ config });
        const result = await skewed.verifier.authorize(
            baseRequest(),
            buildToken(baseClaims({ iat: NOW - 40, exp: NOW - 10 }))
        );
        expect(result.ok).toBe(true);
    });

    it('rejects a token issued in the future beyond skew', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(
                baseRequest(),
                buildToken(baseClaims({ iat: NOW + 60, exp: NOW + 90 }))
            ),
            'TOKEN_NOT_YET_VALID'
        );
    });

    it('accepts an iat at the future-skew boundary and reserves the full expiry+skew window', async () => {
        const store = makeAtomicStore();
        const { verifier } = makeVerifier({ store: store.store });

        const result = await verifier.authorize(
            baseRequest(),
            buildToken(baseClaims({ iat: NOW + 5, exp: NOW + 65 }))
        );

        expect(result.ok).toBe(true);
        // exp + skew - now = 70 = maxTokenTtl (60) + 2 * skew (5).
        expect([...store.keys.values()]).toEqual([70]);
    });

    it('rejects missing, short, long and non-string nonces', async () => {
        const { verifier } = makeVerifier();

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ jti: undefined }))),
            'INVALID_JTI'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ jti: 'short' }))),
            'INVALID_JTI'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ jti: 'a'.repeat(200) }))),
            'INVALID_JTI'
        );
        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims({ jti: 12345 }))),
            'INVALID_JTI'
        );
    });
});

// ---------------------------------------------------------------------------
// Exact request binding and body hash
// ---------------------------------------------------------------------------

describe('share-content-auth request binding', () => {
    it.each([
        ['namespace', { namespace: 'other-namespace' }],
        ['op', { op: 'delete' as const }],
        ['shareId', { shareId: Buffer.from(new Uint8Array(16).fill(9)).toString('base64url') }],
        ['contentVersion', { contentVersion: 2 }],
        ['ownerProfileId', { ownerProfileId: 'other-owner' }],
        ['objectId', { objectId: 'other-object' }],
        ['operationId', { operationId: 'other-operation' }],
    ])('rejects a substituted %s', async (_label, override) => {
        const { verifier } = makeVerifier();
        const token = buildToken(baseClaims());
        const request = { ...baseRequest(), ...override } as ShareContentAuthorizationRequest;

        await expectReject(verifier.authorize(request, token), 'REQUEST_BINDING_MISMATCH');
    });

    it('rejects a mismatched full-body / recovery hash', async () => {
        const { verifier } = makeVerifier();
        const token = buildToken(baseClaims());

        const tamperedBody = {
            ...FULL_BODY,
            ownerEncryptedRecovery: { ...RECOVERY, ciphertext: 'tampered' },
        };
        const tamperedRequest = {
            ...baseRequest(),
            requestHash: computeShareContentRequestHash(tamperedBody),
        };

        await expectReject(verifier.authorize(tamperedRequest, token), 'REQUEST_HASH_MISMATCH');

        const tamperedCiphertext = {
            ...FULL_BODY,
            ciphertext: { ...ENVELOPE, ct: 'tampered' },
        };
        await expectReject(
            verifier.authorize(
                {
                    ...baseRequest(),
                    requestHash: computeShareContentRequestHash(tamperedCiphertext),
                },
                token
            ),
            'REQUEST_HASH_MISMATCH'
        );
    });

    it('rejects a malformed expected request before touching the verifier', async () => {
        const { verifier, calls } = makeVerifier();
        const badRequest = { ...baseRequest(), shareId: 'https://evil.example/blob' };

        await expectReject(
            verifier.authorize(badRequest, buildToken(baseClaims())),
            'INVALID_REQUEST'
        );
        expect(calls).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Atomic replay protection
// ---------------------------------------------------------------------------

describe('share-content-auth replay protection', () => {
    it('consumes a nonce once and rejects a replay of the same token', async () => {
        const store = makeAtomicStore();
        const { verifier } = makeVerifier({ store: store.store });
        const token = buildToken(baseClaims());

        const first = await verifier.authorize(baseRequest(), token);
        expect(first.ok).toBe(true);

        await expectReject(verifier.authorize(baseRequest(), token), 'REPLAY_DETECTED');
        expect(store.keys.size).toBe(1);
    });

    it('allows a fresh signed token (new nonce) to retry the same idempotent operation', async () => {
        const store = makeAtomicStore();
        const { verifier } = makeVerifier({ store: store.store });

        const first = await verifier.authorize(
            baseRequest(),
            buildToken(baseClaims({ jti: 'jti-first-token-000001' }))
        );
        const retry = await verifier.authorize(
            baseRequest(),
            buildToken(baseClaims({ jti: 'jti-second-token-00002' }))
        );

        expect(first.ok).toBe(true);
        expect(retry.ok).toBe(true);
        expect(store.keys.size).toBe(2);
    });

    it('consumes a nonce exactly once under concurrent requests', async () => {
        const store = makeAtomicStore();
        const { verifier } = makeVerifier({ store: store.store });
        const token = buildToken(baseClaims());

        const settled = await Promise.all([
            verifier.authorize(baseRequest(), token),
            verifier.authorize(baseRequest(), token),
            verifier.authorize(baseRequest(), token),
        ]);

        const accepted = settled.filter(result => result.ok).length;
        const replayed = settled.filter(
            result => !result.ok && result.reason === 'REPLAY_DETECTED'
        ).length;

        expect(accepted).toBe(1);
        expect(replayed).toBe(2);
    });

    it('does not consume a nonce when the expected request does not match', async () => {
        const store = makeAtomicStore();
        const { verifier } = makeVerifier({ store: store.store });
        const token = buildToken(baseClaims());

        await expectReject(
            verifier.authorize({ ...baseRequest(), contentVersion: 2 }, token),
            'REQUEST_BINDING_MISMATCH'
        );
        expect(store.keys.size).toBe(0);

        const retry = await verifier.authorize(baseRequest(), token);
        expect(retry.ok).toBe(true);
    });

    it('fails closed when the replay store is unavailable', async () => {
        const failingStore: ReplayStore = {
            consumeOnce: async () => {
                throw new Error('redis unavailable');
            },
        };
        const { verifier } = makeVerifier({ store: failingStore });

        await expectReject(
            verifier.authorize(baseRequest(), buildToken(baseClaims())),
            'REPLAY_STORE_UNAVAILABLE'
        );
    });

    it('adapts an atomic set-if-absent primitive into the replay store contract', async () => {
        const keys = new Set<string>();
        const store = createSetIfAbsentReplayStore(async (key, ttlSeconds) => {
            expect(ttlSeconds).toBeGreaterThan(0);
            if (keys.has(key)) return false;
            keys.add(key);

            return true;
        });

        expect(await store.consumeOnce('k', 10)).toBe(true);
        expect(await store.consumeOnce('k', 10)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Canonical body hash
// ---------------------------------------------------------------------------

describe('share-content-auth canonical request hash', () => {
    it('is deterministic across object key order', () => {
        const first = computeShareContentRequestHash({
            b: 2,
            a: 1,
            nested: { z: true, y: null },
        });
        const second = computeShareContentRequestHash({
            nested: { y: null, z: true },
            a: 1,
            b: 2,
        });

        expect(first).toBe(second);
        expect(first).toMatch(/^[0-9a-f]{64}$/);
        expect(canonicalizeShareContentRequestBody({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    });

    it('changes when the opaque recovery or ciphertext changes', () => {
        const base = computeShareContentRequestHash(FULL_BODY);
        const recoveryChanged = computeShareContentRequestHash({
            ...FULL_BODY,
            ownerEncryptedRecovery: { ...RECOVERY, ciphertext: 'different' },
        });
        const ciphertextChanged = computeShareContentRequestHash({
            ...FULL_BODY,
            ciphertext: { ...ENVELOPE, ct: 'different' },
        });

        expect(recoveryChanged).not.toBe(base);
        expect(ciphertextChanged).not.toBe(base);
    });

    it('rejects unsupported values instead of coercing them', () => {
        const cyclic: Record<string, unknown> = { a: 1 };
        cyclic.self = cyclic;

        class Custom {
            value = 1;
        }

        const sparse: unknown[] = [];
        sparse[2] = 'x';

        for (const value of [
            { n: 1.5 },
            { n: Number.NaN },
            { n: Number.POSITIVE_INFINITY },
            { n: -0 },
            { n: 2 ** 53 },
            { n: undefined },
            { n: () => 1 },
            { n: 1n },
            { n: new Date() },
            { n: new Custom() },
            { n: new Map() },
            { n: '\uD800' },
        ]) {
            expect(() => computeShareContentRequestHash(value)).toThrow(
                ShareContentCanonicalizationError
            );
        }

        expect(() => computeShareContentRequestHash(cyclic)).toThrow(
            ShareContentCanonicalizationError
        );
        expect(() => computeShareContentRequestHash(sparse)).toThrow(
            ShareContentCanonicalizationError
        );
    });

    it('rejects values nested beyond the depth bound', () => {
        let deep: unknown = 'leaf';

        for (let index = 0; index < 40; index += 1) deep = { nested: deep };

        expect(() => computeShareContentRequestHash(deep)).toThrow(
            ShareContentCanonicalizationError
        );
        expect(() => computeShareContentRequestHash(deep, { maxDepth: 100 })).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Real DIDKit signature integration fixture
// ---------------------------------------------------------------------------

type DidkitWasm = {
    initSync: (input: { module: Buffer | Uint8Array }) => void;
    generateEd25519KeyFromBytes: (seed: Uint8Array) => string;
    keyToDID: (method: string, jwk: string) => string;
    issuePresentation: (
        presentation: string,
        proofOptions: string,
        key: string,
        context: string
    ) => Promise<string>;
    verifyPresentation: (
        presentation: string,
        proofOptions: string,
        context: string
    ) => Promise<string>;
};

let didkitPromise: Promise<DidkitWasm> | null = null;

const loadDidkit = (): Promise<DidkitWasm> => {
    didkitPromise ??= (async () => {
        const wasmModule =
            (await import('../../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm.js')) as unknown as DidkitWasm;

        wasmModule.initSync({
            module: readFileSync(
                new URL(
                    '../../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
                    import.meta.url
                )
            ),
        });

        return wasmModule;
    })();

    return didkitPromise;
};

const makeDidkitIdentity = async (fill: number): Promise<{ jwk: string; did: string }> => {
    const didkit = await loadDidkit();
    const seed = new Uint8Array(32).fill(fill);
    const jwk = didkit.generateEd25519KeyFromBytes(seed);

    return { jwk, did: didkit.keyToDID('key', jwk) };
};

const issueRealPresentation = async (
    identity: { jwk: string; did: string },
    claims: Record<string, unknown>
): Promise<string> => {
    const didkit = await loadDidkit();
    const presentation = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder: identity.did,
        verifiableCredential: [],
    };

    return didkit.issuePresentation(
        JSON.stringify(presentation),
        JSON.stringify({
            proofPurpose: 'authentication',
            proofFormat: 'jwt',
            challenge: JSON.stringify(claims),
        }),
        identity.jwk,
        '{}'
    );
};

const kidOf = (token: string): string => {
    const [headerPart] = token.split('.');
    const header = JSON.parse(Buffer.from(headerPart ?? '', 'base64url').toString('utf8'));

    return header.kid as string;
};

const realDidkitVerifier = async (token: string): Promise<PresentationVerificationResult> => {
    const didkit = await loadDidkit();
    const result = await didkit.verifyPresentation(
        token,
        JSON.stringify({ proofFormat: 'jwt' }),
        '{}'
    );

    return JSON.parse(result) as PresentationVerificationResult;
};

describe('share-content-auth real DIDKit signature verification', () => {
    it('accepts a genuine holder-signed VP JWT and rejects a tampered payload', async () => {
        const brain = await makeDidkitIdentity(3);
        const token = await issueRealPresentation(brain, baseClaims({ iss: brain.did }));
        const kid = kidOf(token);

        expect(kid.startsWith(`${brain.did}#`)).toBe(true);

        const config = activeConfig({
            serviceDids: [brain.did],
            verificationMethods: [kid],
        });
        const { verifier } = makeVerifier({ config, verifyImpl: realDidkitVerifier });

        const accepted = await verifier.authorize(baseRequest(), token);
        expect(accepted.ok).toBe(true);
        if (accepted.ok) {
            expect(accepted.context.signerDid).toBe(brain.did);
            expect(accepted.context.claims.aud).toBe(AUDIENCE);
        }

        // Tamper with the signed claims; the real DIDKit verifier must reject the JWS.
        const [headerPart, payloadPart, signaturePart] = token.split('.');
        const payload = JSON.parse(Buffer.from(payloadPart ?? '', 'base64url').toString('utf8'));
        payload.nonce = payload.nonce.replace('"put"', '"delete"');
        const tampered = `${headerPart}.${Buffer.from(JSON.stringify(payload), 'utf8').toString(
            'base64url'
        )}.${signaturePart}`;

        const { verifier: tamperedVerifier } = makeVerifier({
            config,
            verifyImpl: realDidkitVerifier,
        });
        await expectReject(
            tamperedVerifier.authorize(baseRequest(), tampered),
            'SIGNATURE_INVALID'
        );
    });

    it('rejects a genuine ordinary user DID before the cryptographic verifier runs', async () => {
        const brain = await makeDidkitIdentity(3);
        const user = await makeDidkitIdentity(11);
        const userToken = await issueRealPresentation(user, baseClaims({ iss: user.did }));
        const userKid = kidOf(userToken);

        const brainToken = await issueRealPresentation(brain, baseClaims({ iss: brain.did }));
        const brainKid = kidOf(brainToken);

        const config = activeConfig({
            serviceDids: [brain.did],
            verificationMethods: [brainKid],
        });

        const verify = vi.fn<PresentationVerifier>(realDidkitVerifier);
        const verifier = createShareContentAuthorizationVerifier({
            config,
            verifyPresentation: verify,
            replayStore: makeAtomicStore().store,
            now: () => NOW,
        });

        await expectReject(verifier.authorize(baseRequest(), userToken), 'UNKNOWN_SIGNER');
        expect(verify).not.toHaveBeenCalled();

        expect(userKid.startsWith(`${user.did}#`)).toBe(true);

        const accepted = await verifier.authorize(baseRequest(), brainToken);
        expect(accepted.ok).toBe(true);
        expect(verify).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Small module-contract smoke checks
// ---------------------------------------------------------------------------

describe('share-content-auth canonical base64url helper', () => {
    it('accepts canonical ids and rejects alias spellings', () => {
        expect(isCanonicalBase64Url(SHARE_ID, 16)).toBe(true);
        expect(isCanonicalBase64Url(SHARE_ID)).toBe(true);
        expect(isCanonicalBase64Url(`${SHARE_ID}=`)).toBe(false);
        expect(isCanonicalBase64Url('a')).toBe(false);
        expect(isCanonicalBase64Url('https://evil.example')).toBe(false);
        expect(isCanonicalBase64Url(SHARE_ID, 32)).toBe(false);
    });

    it('exposes a default token byte bound', () => {
        expect(DEFAULT_MAX_TOKEN_BYTES).toBe(8_192);
    });
});

describe('strict service JOSE grammar', () => {
    it.each([
        { b64: false },
        { customResolver: 'https://untrusted.example' },
        { typ: 'unexpected' },
    ])('rejects unsupported headers before verification: %j', async header => {
        const { verifier, calls } = makeVerifier();
        expect(await verifier.authorize(baseRequest(), buildToken(baseClaims(), header))).toEqual({
            ok: false,
            reason: 'UNSUPPORTED_HEADER',
        });
        expect(calls).toHaveLength(0);
    });
});
