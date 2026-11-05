import Fastify from 'fastify';
import { importJWK, jwtVerify, type JWK } from 'jose';
import { base64url } from 'multiformats/bases/base64';
import { base58btc } from 'multiformats/bases/base58';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { env, cacheStore, randomUUIDMock } = vi.hoisted(() => ({
    env: {
        SEED: 'b'.repeat(64),
        IS_OFFLINE: false,
        PORT: 3000,
        LEARN_CLOUD_URL: undefined as string | undefined,
        SKIP_DIDKIT_NAPI: undefined as boolean | undefined,
    },
    cacheStore: new Map<string, string>(),
    randomUUIDMock: vi.fn(() => 'fixed-jti-00000000-0000-0000-0000-000000000000'),
}));

vi.mock('@environment', () => ({ environment: env }));
// `learnCard.helpers.ts` imports this unconditionally (for `getSigningAuthorityLearnCard`,
// which this spec never calls); its real module pulls in Mongo models that fail fast
// outside the Mongo-backed integration config, so it must be mocked the same way
// `src/helpers/learnCard.signingAuthority.test.ts` does.
vi.mock('@accesslayer/signing-authority/read', () => ({ getSigningAuthorityForDid: vi.fn() }));
vi.mock('@cache', () => ({
    default: {
        get: async (key: string) => cacheStore.get(key) ?? null,
        set: async (key: string, value: string) => {
            cacheStore.set(key, value);
            return 'OK' as const;
        },
        delete: async (keys: string[]) => {
            keys.forEach(key => cacheStore.delete(key));
            return keys.length;
        },
    },
}));
vi.mock('node:crypto', async importOriginal => {
    const actual = await importOriginal<typeof import('node:crypto')>();
    return { ...actual, randomUUID: randomUUIDMock };
});

import { didFastifyPlugin } from '../src/dids';
import {
    ISSUER_ASSERTION_TTL_SECONDS,
    getServiceDidWeb,
    signIssuerAssertion,
    type IssuerAssertionClaims,
} from '../src/helpers/issuerAssertion.helpers';

const domain = 'api.test';
const audience = 'https://issuer.example/assertions';
const fixedNow = new Date('2026-01-01T00:00:00.000Z');
const fixedIat = Math.floor(fixedNow.getTime() / 1000);

const baseClaims: IssuerAssertionClaims = {
    sub: 'did:key:z6MkpStudent00000000000000000000000000000',
    learncard_profile_id: 'profile-123',
    state: 'XX',
    state_student_id: 'state-student-456',
    classlink_tenant_id: 'tenant-test',
    classlink_auth_time: 1_770_000_000,
    consent_at: 1_770_000_100,
};

type VerificationMethod = {
    id: string;
    publicKeyJwk?: { x?: string };
    publicKeyMultibase?: string;
    publicKeyBase58?: string;
};

const decodeSegment = (jwt: string, index: 0 | 1): Record<string, unknown> =>
    JSON.parse(Buffer.from(jwt.split('.')[index]!, 'base64url').toString('utf8'));

/** Mirrors `src/dids.ts`'s own verification-method decoder (duplicated for the test only,
 *  since that decoder is a private, unexported helper inside `dids.ts`). */
const extractEd25519PublicJwk = (vm: VerificationMethod | undefined): JWK => {
    if (vm?.publicKeyJwk?.x) return { kty: 'OKP', crv: 'Ed25519', x: vm.publicKeyJwk.x };
    if (vm?.publicKeyMultibase) {
        const decoded = base58btc.decode(vm.publicKeyMultibase);
        const raw = decoded[0] === 0xed && decoded[1] === 0x01 ? decoded.slice(2) : decoded;
        return { kty: 'OKP', crv: 'Ed25519', x: base64url.encode(raw).slice(1) };
    }
    if (vm?.publicKeyBase58) {
        const raw = base58btc.baseDecode(vm.publicKeyBase58);
        return { kty: 'OKP', crv: 'Ed25519', x: base64url.encode(raw).slice(1) };
    }
    throw new Error('Unsupported verification method format');
};

const fetchOwnerPublicJwk = async (): Promise<JWK> => {
    const app = Fastify();
    await app.register(didFastifyPlugin);
    await app.ready();
    try {
        const response = await app.inject({
            method: 'GET',
            url: '/.well-known/did.json',
            headers: { host: domain },
        });
        expect(response.statusCode).toBe(200);
        const didDoc = response.json();
        expect(didDoc.id).toBe(`did:web:${domain}`);
        const ownerVm = (didDoc.verificationMethod as VerificationMethod[]).find(
            vm => vm.id === `did:web:${domain}#owner`
        );
        expect(ownerVm).toBeDefined();
        return extractEd25519PublicJwk(ownerVm);
    } finally {
        await app.close();
    }
};

describe('issuer assertion signer', () => {
    beforeEach(() => {
        cacheStore.clear();
        randomUUIDMock.mockReturnValue('fixed-jti-00000000-0000-0000-0000-000000000000');
        Object.assign(env, {
            SEED: 'b'.repeat(64),
            IS_OFFLINE: false,
            PORT: 3000,
            LEARN_CLOUD_URL: undefined,
            SKIP_DIDKIT_NAPI: undefined,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getServiceDidWeb', () => {
        it('derives a did:web identifier, encoding ":" as "%3A"', () => {
            expect(getServiceDidWeb('api.test')).toBe('did:web:api.test');
            expect(getServiceDidWeb('localhost:3000')).toBe('did:web:localhost%3A3000');
        });
    });

    describe('signIssuerAssertion', () => {
        it('produces a claim snapshot with every Must-Have claim and exp - iat === 300', async () => {
            const { jwt, jti, exp } = await signIssuerAssertion(baseClaims, {
                domain,
                audience,
                now: fixedNow,
            });

            expect(jti).toBe('fixed-jti-00000000-0000-0000-0000-000000000000');
            expect(exp - fixedIat).toBe(300);
            expect(exp - fixedIat).toBe(ISSUER_ASSERTION_TTL_SECONDS);

            const header = decodeSegment(jwt, 0);
            const payload = decodeSegment(jwt, 1);

            expect(header).toMatchObject({
                alg: 'EdDSA',
                typ: 'JWT',
                kid: `did:web:${domain}#owner`,
            });
            expect(payload).toMatchObject({
                iss: `did:web:${domain}`,
                aud: audience,
                sub: baseClaims.sub,
                jti: 'fixed-jti-00000000-0000-0000-0000-000000000000',
                iat: fixedIat,
                exp,
                learncard_profile_id: baseClaims.learncard_profile_id,
                state: baseClaims.state,
                state_student_id: baseClaims.state_student_id,
                classlink_tenant_id: baseClaims.classlink_tenant_id,
                classlink_auth_time: baseClaims.classlink_auth_time,
                consent_at: baseClaims.consent_at,
            });
        });

        it('omits the optional learncard_profile_id claim when the caller does not supply one', async () => {
            const { learncard_profile_id: _drop, ...withoutProfile } = baseClaims;
            const { jwt } = await signIssuerAssertion(withoutProfile, {
                domain,
                audience,
                now: fixedNow,
            });

            const payload = decodeSegment(jwt, 1);
            expect('learncard_profile_id' in payload).toBe(false);
        });

        it('verifies against the did:web document served by didFastifyPlugin, with a matching kid', async () => {
            const { jwt } = await signIssuerAssertion(baseClaims, {
                domain,
                audience,
                now: fixedNow,
            });

            const publicJwk = await fetchOwnerPublicJwk();
            const publicKey = await importJWK({ ...publicJwk, alg: 'EdDSA' }, 'EdDSA');

            const { payload, protectedHeader } = await jwtVerify(jwt, publicKey, {
                issuer: `did:web:${domain}`,
                audience,
                currentDate: fixedNow,
            });

            expect(protectedHeader.kid).toBe(`did:web:${domain}#owner`);
            expect(payload.sub).toBe(baseClaims.sub);
            expect(payload.state_student_id).toBe(baseClaims.state_student_id);
        });

        it('rejects a tampered payload', async () => {
            const { jwt } = await signIssuerAssertion(baseClaims, {
                domain,
                audience,
                now: fixedNow,
            });

            const publicJwk = await fetchOwnerPublicJwk();
            const publicKey = await importJWK({ ...publicJwk, alg: 'EdDSA' }, 'EdDSA');

            const [headerB64, , signatureB64] = jwt.split('.') as [string, string, string];
            const tamperedPayload = decodeSegment(jwt, 1);
            tamperedPayload.sub = 'did:key:z6MkAttacker000000000000000000000000000';
            const tamperedPayloadB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString(
                'base64url'
            );
            const tamperedJwt = `${headerB64}.${tamperedPayloadB64}.${signatureB64}`;

            await expect(
                jwtVerify(tamperedJwt, publicKey, {
                    issuer: `did:web:${domain}`,
                    audience,
                    currentDate: fixedNow,
                })
            ).rejects.toMatchObject({ code: 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED' });
        });
    });
});
