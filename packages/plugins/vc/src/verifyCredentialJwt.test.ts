import { readFile } from 'node:fs/promises';

import { SignJWT, importJWK } from 'jose';
import type { JWKWithPrivateKey, VC } from '@learncard/types';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import type { VCDependentLearnCard } from './types';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { getVerifiedCredentialTemporalStatus, verifyCredentialJwt } from './verifyCredentialJwt';
import { verifyCredential } from './verifyCredential';
import { projectEnvelopeToDisplayVc, toStoredCredential } from '@learncard/helpers';

const FIXTURE_SEED = new Uint8Array(32).fill(21);
const OTHER_SEED = new Uint8Array(32).fill(22);

type DidKit = Awaited<ReturnType<typeof getDidKitPlugin>>;

const fakeLearnCard = {
    context: {
        resolveDocument: async (url: string) => {
            try {
                return (
                    (await plugin.methods.contextLoader(fakeLearnCard as never, url)) ?? undefined
                );
            } catch {
                return undefined;
            }
        },
    },
    debug: () => undefined,
} as never;

let plugin: DidKit;
let key: JWKWithPrivateKey;
let did: string;
let verificationMethod: string;
let otherKey: JWKWithPrivateKey;
let otherDid: string;
let otherVerificationMethod: string;

const issueOptions = () => ({
    proofFormat: 'jwt',
    verificationMethod,
    proofPurpose: 'assertionMethod',
});

const v1Unsigned = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
    type: ['VerifiableCredential'],
    issuer: did,
    issuanceDate: '2026-01-01T00:00:00Z',
    expirationDate: '2100-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject', achievement: { name: 'V1' } },
    ...overrides,
});

const v2Unsigned = (): Record<string, unknown> => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: 'urn:uuid:22222222-2222-2222-2222-222222222222',
    type: ['VerifiableCredential'],
    issuer: did,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2100-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject', achievement: { name: 'V2' } },
});

const issueJwt = async (credential: Record<string, unknown>) =>
    (await plugin.methods.issueCredential(
        fakeLearnCard,
        credential as never,
        issueOptions() as never,
        key
    )) as unknown as string;

const verifierFor = (
    verify: DidKit['methods']['verifyCredential'],
    verifyForRenewal: DidKit['methods']['verifyCredentialForRenewal'] = verify as never
): VCDependentLearnCard =>
    ({
        invoke: {
            verifyCredential: (credential: VC | string, options?: unknown) =>
                verify(fakeLearnCard, credential, options as never),
            verifyCredentialForRenewal: (credential: string, options?: unknown) =>
                verifyForRenewal(fakeLearnCard, credential, options as never),
        },
    }) as unknown as VCDependentLearnCard;

let verifier: VCDependentLearnCard;

const signPayload = async (
    payload: Record<string, unknown>,
    options: { kid?: string; alg?: string; keyOverride?: JWKWithPrivateKey } = {}
) => {
    const signingKey = options.keyOverride ?? key;
    const privateKey = await importJWK(signingKey as never, 'EdDSA');

    return new SignJWT(payload)
        .setProtectedHeader({
            alg: options.alg ?? 'EdDSA',
            kid: options.kid ?? verificationMethod,
        })
        .sign(privateKey);
};

const decodePayload = (token: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8'));

const jwtProofProjection = (token: string, overrides: Record<string, unknown> = {}): VC => {
    const payload = decodePayload(token);

    return {
        ...(payload.vc as Record<string, unknown>),
        proof: { type: 'JwtProof2020', jwt: token },
        ...overrides,
    } as unknown as VC;
};

beforeAll(async () => {
    const wasmBytes = new Uint8Array(
        await readFile(new URL('../../didkit/src/didkit/pkg/didkit_wasm_bg.wasm', import.meta.url))
    );

    plugin = await getDidKitPlugin(wasmBytes);

    key = plugin.methods.generateEd25519KeyFromBytes(
        fakeLearnCard,
        FIXTURE_SEED
    ) as JWKWithPrivateKey;
    did = plugin.methods.keyToDid(fakeLearnCard, 'key', key);
    verificationMethod = await plugin.methods.keyToVerificationMethod(fakeLearnCard, 'key', key);

    otherKey = plugin.methods.generateEd25519KeyFromBytes(
        fakeLearnCard,
        OTHER_SEED
    ) as JWKWithPrivateKey;
    otherDid = plugin.methods.keyToDid(fakeLearnCard, 'key', otherKey);
    otherVerificationMethod = await plugin.methods.keyToVerificationMethod(
        fakeLearnCard,
        'key',
        otherKey
    );

    verifier = verifierFor(plugin.methods.verifyCredential);
});

describe('verifyCredentialJwt — real signatures', () => {
    it('verifies and normalizes a real VCDM 1.1 VC-JWT, preserving exact bytes', async () => {
        const token = await issueJwt(v1Unsigned());

        const result = await verifyCredentialJwt(verifier, token);

        expect(result.verified).toBe(true);
        if (!result.verified) return;

        expect(result.token).toBe(token);
        expect(result.credential.proof).toMatchObject({ type: 'JwtProof2020', jwt: token });
        expect(result.metadata).toMatchObject({
            issuer: did,
            version: '1.1',
            profile: 'vc-jwt-1.1',
            subjectIds: ['did:example:subject'],
            id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
            algorithm: 'EdDSA',
        });
    });

    it('verifies and normalizes a real VCDM 2.0 VC-JWT under the legacy profile', async () => {
        const token = await issueJwt(v2Unsigned());

        const result = await verifyCredentialJwt(verifier, token);

        expect(result.verified).toBe(true);
        if (!result.verified) return;

        expect(result.token).toBe(token);
        expect(result.metadata).toMatchObject({
            issuer: did,
            version: '2.0',
            profile: 'vc-jwt-2.0-legacy',
            subjectIds: ['did:example:subject'],
        });
    });

    it('routes raw token, envelope and legacy JwtProof2020 projection through the same verification', async () => {
        const token = await issueJwt(v1Unsigned());

        const envelope = { format: 'jwt-vc-json', data: token } as never;
        const projection = jwtProofProjection(token);

        const fromToken = await verifyCredentialJwt(verifier, token);
        const fromEnvelope = await verifyCredentialJwt(verifier, envelope);
        const fromProjection = await verifyCredentialJwt(verifier, projection);

        expect(fromToken.verified && fromEnvelope.verified && fromProjection.verified).toBe(true);
        if (!fromToken.verified || !fromEnvelope.verified || !fromProjection.verified) return;

        expect(fromEnvelope.token).toBe(token);
        expect(fromProjection.token).toBe(token);
        expect(fromProjection.metadata).toEqual(fromToken.metadata);
    });

    it('ignores caller mutations of display metadata and trusts token-derived claims', async () => {
        const token = await issueJwt(v1Unsigned());

        const mutated = jwtProofProjection(token, {
            issuer: 'did:example:attacker',
            id: 'urn:uuid:attacker',
            issuanceDate: '1990-01-01T00:00:00Z',
            expirationDate: '1991-01-01T00:00:00Z',
            credentialSubject: { id: 'did:example:attacker' },
        });

        const result = await verifyCredentialJwt(verifier, mutated);

        expect(result.verified).toBe(true);
        if (!result.verified) return;

        expect(result.metadata.issuer).toBe(did);
        expect(result.metadata.subjectIds).toEqual(['did:example:subject']);
        expect(result.credential.issuer).toBe(did);
        expect(result.credential.credentialSubject).toMatchObject({ id: 'did:example:subject' });
    });

    it('fails closed on a forged signature', async () => {
        const token = await issueJwt(v1Unsigned());
        const [header, payload, signature] = token.split('.');
        const tampered = `${header}.${payload}.${signature.slice(0, -4)}AAAA`;

        const result = await verifyCredentialJwt(verifier, tampered);

        expect(result.verified).toBe(false);
    });

    it('fails closed when the token was signed by an unauthorized key', async () => {
        const payload = decodePayload(await issueJwt(v1Unsigned()));
        const forged = await signPayload(payload, {
            keyOverride: otherKey,
            kid: otherVerificationMethod,
        });

        const result = await verifyCredentialJwt(verifier, forged);

        expect(result.verified).toBe(false);
    });

    it('rejects a kid that does not belong to the normalized issuer', async () => {
        const payload = decodePayload(await issueJwt(v1Unsigned()));
        const foreignKid = `${otherDid}#key-1`;
        const forged = await signPayload(payload, { kid: foreignKid });

        const result = await verifyCredentialJwt(verifier, forged);

        // Either DIDKit rejects the key authorization or our kid binding does.
        expect(result.verified).toBe(false);
    });
});

describe('verifyCredentialJwt — claim reconciliation', () => {
    const baseVc = () => ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: { id: 'did:example:subject' },
    });

    const basePayload = () => ({
        iss: did,
        sub: 'did:example:subject',
        jti: 'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        iat: 1_767_225_600,
        nbf: 1_767_225_600,
        exp: 4_102_444_800,
        vc: {
            ...baseVc(),
            id: 'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            issuer: did,
            issuanceDate: '2026-01-01T00:00:00Z',
            expirationDate: '2100-01-01T00:00:00Z',
        },
    });

    it('accepts matching duplicate registered and embedded claims', async () => {
        const result = await verifyCredentialJwt(verifier, await signPayload(basePayload()));

        expect(result.verified).toBe(true);
        if (!result.verified) return;

        expect(result.metadata).toMatchObject({
            issuer: did,
            id: 'urn:uuid:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            subjectIds: ['did:example:subject'],
        });
    });

    it('accepts registered-only claims with no embedded duplicates', async () => {
        const payload = {
            iss: did,
            sub: 'did:example:subject',
            jti: 'urn:uuid:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            iat: 1_767_225_600,
            exp: 4_102_444_800,
            vc: baseVc(),
        };

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(true);
        if (!result.verified) return;

        expect(result.credential.id).toBe('urn:uuid:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
        expect(result.metadata.subjectIds).toEqual(['did:example:subject']);
    });

    it('accepts iat and nbf differing while both remain valid', async () => {
        const payload = {
            ...basePayload(),
            iat: 1_767_225_600,
            nbf: 1_767_312_000,
        };
        const vc = payload.vc;

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(true);
        if (!result.verified) return;

        expect(result.metadata.issuedAt).toBe(new Date(payload.iat * 1000).toISOString());
        expect(result.metadata.notBefore).toBe(new Date(payload.nbf * 1000).toISOString());
        expect(result.metadata.notBefore).not.toBe(result.metadata.issuedAt);
        expect(vc.issuanceDate).toBeTruthy();
    });

    it('rejects a conflicting iss', async () => {
        const payload = basePayload();
        payload.vc.issuer = 'did:example:attacker';

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/iss.*conflicts/i);
    });

    it('rejects a conflicting jti', async () => {
        const payload = basePayload();
        payload.vc.id = 'urn:uuid:99999999-9999-9999-9999-999999999999';

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/jti.*conflicts/i);
    });

    it('rejects a conflicting sub', async () => {
        const payload = basePayload();
        payload.vc.credentialSubject = { id: 'did:example:attacker' };

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/sub.*conflicts/i);
    });

    it('rejects an ambiguous multi-subject binding for a sub claim', async () => {
        const payload = basePayload();
        payload.vc.credentialSubject = [
            { id: 'did:example:one' },
            { id: 'did:example:two' },
        ] as never;

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/ambiguous/i);
    });

    it('rejects a conflicting iat against the embedded issuance timeline', async () => {
        const payload = basePayload();
        payload.iat = 1_600_000_000;

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/iat.*conflicts/i);
    });

    it('rejects a conflicting exp against the embedded expiration timeline', async () => {
        const payload = basePayload();
        payload.exp = 4_102_531_200; // 2100-01-02, still in the future but not equal to embedded

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/exp.*conflicts/i);
    });

    it('rejects malformed NumericDates', async () => {
        const payload = basePayload();
        payload.iat = 'not-a-number' as never;

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/NumericDate/i);
    });

    it('rejects an unsupported credential profile/context', async () => {
        const payload = basePayload();
        payload.vc['@context'] = ['https://example.com/unknown-context'];

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
        if (result.verified) return;
        expect(result.check.errors.join(' ')).toMatch(/unsupported.*profile/i);
    });

    it('rejects an expired token (temporal checks are never relaxed)', async () => {
        const payload = {
            ...basePayload(),
            iat: 1_600_000_000,
            nbf: 1_600_000_000,
            exp: 1_600_086_400,
        };
        payload.vc.issuanceDate = new Date(payload.iat * 1000).toISOString();
        payload.vc.expirationDate = new Date(payload.exp * 1000).toISOString();

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
    });

    it('rejects a not-yet-valid token', async () => {
        const future = Math.floor(Date.now() / 1000) + 86_400;
        const payload = { ...basePayload(), nbf: future, iat: future };
        payload.vc.issuanceDate = new Date(future * 1000).toISOString();

        const result = await verifyCredentialJwt(verifier, await signPayload(payload));

        expect(result.verified).toBe(false);
    });
});

describe('verifyCredentialJwt — algorithm confusion', () => {
    const base64urlJson = (value: unknown) =>
        Buffer.from(JSON.stringify(value)).toString('base64url');

    it('rejects alg=none without calling the verifier', async () => {
        const token = await issueJwt(v1Unsigned());
        const [, payload] = token.split('.');
        const unsigned = `${base64urlJson({ alg: 'none', kid: verificationMethod })}.${payload}.AAAA`;

        const spy = vi.fn(plugin.methods.verifyCredential);
        const result = await verifyCredentialJwt(verifierFor(spy as never), unsigned);

        expect(result.verified).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('rejects HS256 symmetric confusion without calling the verifier', async () => {
        const token = await issueJwt(v1Unsigned());
        const [, payload, signature] = token.split('.');
        const header = base64urlJson({ alg: 'HS256', kid: verificationMethod });

        const spy = vi.fn(plugin.methods.verifyCredential);
        const result = await verifyCredentialJwt(
            verifierFor(spy as never),
            `${header}.${payload}.${signature}`
        );

        expect(result.verified).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });
});

describe('verifyCredentialJwt — store/read/export round trip', () => {
    it('retains the exact token through storage projection and a second verification', async () => {
        const token = await issueJwt(v1Unsigned());
        const first = await verifyCredentialJwt(verifier, token);

        expect(first.verified).toBe(true);
        if (!first.verified) return;

        const stored = toStoredCredential({ vc: first.credential } as never);

        expect(stored).toMatchObject({ format: 'jwt-vc-json', data: token });

        const projected = projectEnvelopeToDisplayVc({
            format: 'jwt-vc-json',
            data: token,
        } as never);

        expect(projected).toBeDefined();
        expect((projected as VC).proof).toMatchObject({ type: 'JwtProof2020', jwt: token });

        const second = await verifyCredentialJwt(verifier, projected);

        expect(second.verified).toBe(true);
        if (!second.verified) return;

        expect(second.token).toBe(token);
        expect(second.metadata).toEqual(first.metadata);
    });

    it('retains the token through a JSON serialization round trip', async () => {
        const token = await issueJwt(v1Unsigned());
        const first = await verifyCredentialJwt(verifier, token);

        if (!first.verified) throw new Error('expected verified credential');

        const roundTripped = JSON.parse(JSON.stringify(first.credential)) as VC;
        const second = await verifyCredentialJwt(verifier, roundTripped);

        expect(second.verified).toBe(true);
        if (!second.verified) return;
        expect(second.token).toBe(token);
    });
});

describe('renewal-only policy', () => {
    const renewalVerifier = () =>
        verifierFor(plugin.methods.verifyCredential, plugin.methods.verifyCredentialForRenewal);

    const expiredToken = () =>
        issueJwt(
            v1Unsigned({
                issuanceDate: '2019-01-01T00:00:00Z',
                expirationDate: '2020-01-01T00:00:00Z',
            })
        );

    it('rejects an expired token under the default strict policy', async () => {
        const result = await verifyCredentialJwt(verifier, await expiredToken());

        expect(result.verified).toBe(false);
    });

    it('does not let caller proofOptions smuggle the low-level renewal flag', async () => {
        const result = await verifyCredentialJwt(verifier, await expiredToken(), {
            proofOptions: { allowExpiredCredential: true } as never,
        });

        expect(result.verified).toBe(false);
    });

    it('accepts an expired token only under the typed renewal policy', async () => {
        const result = await verifyCredentialJwt(renewalVerifier(), await expiredToken(), {
            policy: 'allow-expired-for-renewal',
        });

        expect(result.verified).toBe(true);
    });
});

describe('JWS-only success (embedded-proof fallback)', () => {
    it('does not let a valid inner linked-data proof authenticate an unmatched outer JWT', async () => {
        const inner = (await plugin.methods.issueCredential(
            fakeLearnCard,
            v1Unsigned({
                issuanceDate: '2019-01-01T00:00:00Z',
                expirationDate: '2020-01-01T00:00:00Z',
                credentialSubject: { id: 'did:example:subject' },
            }) as never,
            {
                proofFormat: 'ldp',
                verificationMethod,
                proofPurpose: 'assertionMethod',
            } as never,
            key
        )) as VC;

        // The inner linked-data proof is genuinely valid and cryptographically
        // verified by the pinned WASM.
        const innerCheck = await plugin.methods.verifyCredential(fakeLearnCard, inner, {
            proofFormat: 'ldp',
        });
        expect(innerCheck.errors).toEqual([]);
        expect(innerCheck.checks).toContain('proof');
        expect(innerCheck.checks).not.toContain('JWS');

        const expired = Math.floor(Date.parse('2020-01-01T00:00:00Z') / 1000);
        const token = await signPayload({ vc: inner, exp: expired });

        // Model the fork's embedded-proof fallback: the outer JWT is temporally
        // unmatched, so only the valid inner linked-data proof is reported.
        // `verifyCredentialJwt` must not accept that as token authentication.
        const fallbackVerifier = verifierFor(async () => innerCheck);

        const result = await verifyCredentialJwt(fallbackVerifier, token);
        expect(result.verified).toBe(false);
    });
});

describe('getVerifiedCredentialTemporalStatus', () => {
    it('classifies verified credentials against a supplied instant', async () => {
        const token = await issueJwt(v1Unsigned());
        const result = await verifyCredentialJwt(verifier, token);

        if (!result.verified) throw new Error('expected verified credential');

        expect(getVerifiedCredentialTemporalStatus(result, new Date('2026-06-01T00:00:00Z'))).toBe(
            'valid'
        );
        expect(getVerifiedCredentialTemporalStatus(result, new Date('2200-01-01T00:00:00Z'))).toBe(
            'expired'
        );
    });
});

describe('VC plugin verifyCredential routing', () => {
    const pluginVerifier = () =>
        ({
            invoke: {
                verifyCredential: (credential: VC | string, options?: unknown) =>
                    plugin.methods.verifyCredential(fakeLearnCard, credential, options as never),
            },
        }) as unknown as VCDependentLearnCard;

    it('verifies a JwtProof2020 projection and reports JWS', async () => {
        const token = await issueJwt(v1Unsigned());
        const projection = jwtProofProjection(token);

        const check = await verifyCredential(pluginVerifier() as never)({} as never, projection);

        expect(check).toEqual({ checks: ['JWS'], warnings: [], errors: [] });
    });

    it('does not let display metadata mutation change the verified result', async () => {
        const token = await issueJwt(v1Unsigned());
        const mutated = jwtProofProjection(token, { issuer: 'did:example:attacker' });

        const check = await verifyCredential(pluginVerifier() as never)({} as never, mutated);

        expect(check).toEqual({ checks: ['JWS'], warnings: [], errors: [] });
    });

    it('fails closed on a forged token', async () => {
        const token = await issueJwt(v1Unsigned());
        const [, payload, signature] = token.split('.');
        const forged = `${token.split('.')[0]}.${payload}.${signature.slice(0, -4)}AAAA`;

        const check = await verifyCredential(pluginVerifier() as never)({} as never, forged);

        expect(check.checks).not.toContain('JWS');
        expect(check.errors.length).toBeGreaterThan(0);
    });
});
