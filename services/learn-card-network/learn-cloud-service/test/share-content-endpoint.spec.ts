import { randomUUID } from 'node:crypto';

import Fastify, { type FastifyInstance } from 'fastify';
import { MongoClient, type Collection, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { inject } from 'vitest';

import { encodeBase64Url, type ShareEnvelope } from '@learncard/types';

import {
    createShareContentRepository,
    type ShareContentObjectBinding,
    type ShareContentRepository,
} from '@accesslayer/share-content';
import {
    SHARE_CONTENT_AUTH_PURPOSE,
    computeShareContentRequestHash,
    createShareContentAuthorizationVerifier,
    type PresentationVerificationResult,
    type PresentationVerifier,
} from '@helpers/share-content-auth';
import type { MongoShareContentDocument } from '@models';

import {
    SHARE_CONTENT_PLUGIN_PREFIX,
    buildShareContentRuntime,
    resolveShareContentConfig,
    shareContentFastifyPlugin,
    type ShareContentPluginOptions,
    type ShareContentReplayStoreFactory,
} from '../src/share-content';
import { createShareContentRedisReplayStore } from '../src/share-content/production';

declare module 'vitest' {
    export interface ProvidedContext {
        'share-content-redis-host': string;
        'share-content-redis-port': number;
    }
}

const REDIS_HOST = inject('share-content-redis-host');
const REDIS_PORT = inject('share-content-redis-port');

// Fail loudly rather than silently defaulting to an ambient localhost Redis: the
// replay path must be exercised against the disposable container from
// `test/share-content-redis-setup.ts`.
if (typeof REDIS_HOST !== 'string' || typeof REDIS_PORT !== 'number') {
    throw new Error(
        'share-content endpoint tests require the real Redis global setup (vitest.share-content-endpoint.config.ts)'
    );
}

const NOW = 1_700_000_000;
const AUDIENCE = 'did:web:cloud.learncard.com';
const SIGNER = 'did:web:brain.learncard.com';
const KID = `${SIGNER}#key-1`;
const USER_DID = 'did:key:z6Mkenduserenduserenduserenduserenduserenduser';
const NAMESPACE = 'learncard';
const SHARE_ID = Buffer.from(new Uint8Array(16).fill(7)).toString('base64url');
const OTHER_SHARE_ID = Buffer.from(new Uint8Array(16).fill(8)).toString('base64url');
const DUMMY_SIGNATURE = Buffer.from(new Uint8Array(64).fill(1)).toString('base64url');
const RECOVERY_CIPHERTEXT = 'recovery-secret-ciphertext-value';

const encodePart = (value: unknown): string =>
    Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const makeEnvelope = (fill = 1, bytes = 64): ShareEnvelope => ({
    v: 1,
    alg: 'A256GCM',
    iv: encodeBase64Url(new Uint8Array(12).fill(7)),
    ct: encodeBase64Url(new Uint8Array(bytes).fill(fill)),
});

const makeRecovery = (overrides: Record<string, unknown> = {}) => ({
    protected: 'protected-a',
    iv: 'iv-a',
    ciphertext: RECOVERY_CIPHERTEXT,
    tag: 'tag-a',
    ...overrides,
});

const makeBinding = (
    overrides: Partial<ShareContentObjectBinding> = {}
): ShareContentObjectBinding => ({
    namespace: NAMESPACE,
    ownerProfileId: 'owner-profile-1',
    shareId: SHARE_ID,
    contentVersion: 1,
    objectId: 'object-0001',
    operationId: 'operation-0001',
    ...overrides,
});

const makePutBody = (overrides: Record<string, unknown> = {}) => ({
    ...makeBinding(),
    envelope: makeEnvelope(1),
    ownerEncryptedRecovery: makeRecovery(),
    ...overrides,
});

const makeClaims = (op: string, body: Record<string, unknown>, overrides = {}) => ({
    iss: SIGNER,
    aud: AUDIENCE,
    purpose: SHARE_CONTENT_AUTH_PURPOSE,
    namespace: body.namespace,
    op,
    shareId: body.shareId,
    contentVersion: body.contentVersion,
    ownerProfileId: body.ownerProfileId,
    objectId: body.objectId,
    operationId: body.operationId,
    requestHash: computeShareContentRequestHash(body),
    iat: NOW,
    exp: NOW + 30,
    jti: `jti-${randomUUID().replace(/-/g, '')}`,
    ...overrides,
});

const buildToken = (
    claims: unknown,
    options: { signerDid?: string; kid?: string; header?: Record<string, unknown> } = {}
): string => {
    const signerDid = options.signerDid ?? SIGNER;
    const kid = options.kid ?? `${signerDid}#key-1`;

    const payload = {
        iss: signerDid,
        vp: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: signerDid,
            verifiableCredential: [],
        },
        nonce: JSON.stringify(claims),
    };

    return `${encodePart({ alg: 'EdDSA', kid, ...(options.header ?? {}) })}.${encodePart(
        payload
    )}.${DUMMY_SIGNATURE}`;
};

const okVerification = (): PresentationVerificationResult => ({
    checks: ['JWS'],
    warnings: [],
    errors: [],
});

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;
let db: Db;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoClient = new MongoClient(mongoServer.getUri());
    await mongoClient.connect();
    db = mongoClient.db('share_content_endpoint');
});

afterAll(async () => {
    await mongoClient?.close();
    await mongoServer?.stop();
});

type InjectInput = {
    payload?: unknown;
    token?: string;
    authorization?: string;
    contentType?: string;
};

type Harness = {
    app: FastifyInstance;
    repository: ShareContentRepository;
    collection: Collection<MongoShareContentDocument>;
    verifyCalls: string[];
    replay: ReturnType<ShareContentReplayStoreFactory>;
    close: () => Promise<void>;
};

const makeHarness = async (
    options: {
        configOverrides?: Record<string, unknown>;
        verifyImpl?: PresentationVerifier;
        createReplayStore?: ShareContentReplayStoreFactory;
    } = {}
): Promise<Harness> => {
    const collection = db.collection<MongoShareContentDocument>(
        `share_content_${randomUUID().replace(/-/g, '')}`
    );
    const repository = createShareContentRepository(collection);
    await repository.initialize();

    const resolved = resolveShareContentConfig({
        enabled: true,
        audience: AUDIENCE,
        serviceDids: [SIGNER],
        verificationMethods: [KID],
        namespaceBindings: { [SIGNER]: [NAMESPACE] },
        ...options.configOverrides,
    });

    if (resolved.status !== 'enabled') {
        throw new Error(`test config not enabled: ${JSON.stringify(resolved)}`);
    }

    const verifyCalls: string[] = [];
    const verifyPresentation: PresentationVerifier =
        options.verifyImpl ??
        (async token => {
            verifyCalls.push(token);

            return okVerification();
        });

    const replay =
        options.createReplayStore?.() ??
        createShareContentRedisReplayStore({ host: REDIS_HOST, port: REDIS_PORT });

    const verifier = createShareContentAuthorizationVerifier({
        config: resolved.trustConfig,
        verifyPresentation,
        replayStore: replay.store,
        now: () => NOW,
    });

    const pluginOptions: ShareContentPluginOptions = {
        verifier,
        repository,
        namespacePolicy: resolved.namespacePolicy,
    };

    const app = Fastify({ logger: false });
    await app.register(shareContentFastifyPlugin, {
        prefix: SHARE_CONTENT_PLUGIN_PREFIX,
        ...pluginOptions,
    });
    await app.ready();

    return {
        app,
        repository,
        collection,
        verifyCalls,
        replay,
        close: async () => {
            await app.close();
            await replay.close();
        },
    };
};

const injectRoute = (app: FastifyInstance, op: string, input: InjectInput = {}) => {
    const headers: Record<string, string> = {};

    if (input.token) headers.authorization = `Bearer ${input.token}`;
    if (input.authorization) headers.authorization = input.authorization;
    if (input.contentType) headers['content-type'] = input.contentType;

    return app.inject({
        method: 'POST',
        url: `${SHARE_CONTENT_PLUGIN_PREFIX}/${op}`,
        headers,
        ...(input.payload === undefined ? {} : { payload: input.payload as object }),
    });
};

const parseBody = (body: string) => JSON.parse(body);

describe('share-content endpoint contract', () => {
    it('creates content on a valid put and echoes the C2 success shape with ISO dates', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const response = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });
            const parsed = parseBody(response.body);

            expect(response.statusCode).toBe(200);
            expect(response.headers['cache-control']).toBe('no-store');
            expect(parsed.ok).toBe(true);
            expect(parsed.value.status).toBe('created');
            expect(parsed.value.record.objectId).toBe('object-0001');
            expect(typeof parsed.value.record.createdAt).toBe('string');
            expect(harness.verifyCalls).toHaveLength(1);
        } finally {
            await harness.close();
        }
    });

    it('treats an exact replay with a fresh token as an idempotent success', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const first = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });
            const second = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            expect(first.statusCode).toBe(200);
            expect(parseBody(first.body).value.status).toBe('created');
            expect(second.statusCode).toBe(200);
            expect(parseBody(second.body).value.status).toBe('idempotent');
        } finally {
            await harness.close();
        }
    });

    it('uses the route operation, not the body, and rejects an unknown op field', async () => {
        const harness = await makeHarness();

        try {
            const body: Record<string, unknown> = { ...makePutBody(), op: 'put' };
            const response = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', makePutBody())),
            });

            expect(response.statusCode).toBe(400);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'INVALID_INPUT' });
        } finally {
            await harness.close();
        }
    });

    it('returns the exact object content on get without ever exposing recovery', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            const binding = makeBinding();
            const response = await injectRoute(harness.app, 'get', {
                payload: binding,
                token: buildToken(makeClaims('get', binding)),
            });
            const parsed = parseBody(response.body);

            expect(response.statusCode).toBe(200);
            expect(parsed.value.kind).toBe('active');
            expect(parsed.value.ownerEncryptedRecovery).toBeUndefined();
            expect(response.body).not.toContain('ownerEncryptedRecovery');
            expect(response.body).not.toContain(RECOVERY_CIPHERTEXT);
        } finally {
            await harness.close();
        }
    });

    it('only returns recovery for a specifically signed readRecovery intent', async () => {
        const harness = await makeHarness();

        try {
            const putBody = makePutBody();
            await injectRoute(harness.app, 'put', {
                payload: putBody,
                token: buildToken(makeClaims('put', putBody)),
            });

            const binding = makeBinding();
            const recovery = await injectRoute(harness.app, 'readRecovery', {
                payload: binding,
                token: buildToken(makeClaims('readRecovery', binding)),
            });
            expect(recovery.statusCode).toBe(200);
            expect(parseBody(recovery.body).value.ownerEncryptedRecovery.ciphertext).toBe(
                RECOVERY_CIPHERTEXT
            );

            // A `get`-signed token is not accepted for the recovery route.
            const mismatch = await injectRoute(harness.app, 'readRecovery', {
                payload: binding,
                token: buildToken(makeClaims('get', binding)),
            });
            expect(mismatch.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });

    it('stats active then tombstone and rejects a late put after delete', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            const binding = makeBinding();
            const activeStat = await injectRoute(harness.app, 'stat', {
                payload: binding,
                token: buildToken(makeClaims('stat', binding)),
            });
            expect(parseBody(activeStat.body).value.kind).toBe('active');

            const deleted = await injectRoute(harness.app, 'delete', {
                payload: binding,
                token: buildToken(makeClaims('delete', binding)),
            });
            expect(deleted.statusCode).toBe(200);
            expect(parseBody(deleted.body).value.kind).toBe('tombstone');

            const tombstoneStat = await injectRoute(harness.app, 'stat', {
                payload: binding,
                token: buildToken(makeClaims('stat', binding)),
            });
            expect(parseBody(tombstoneStat.body).value.kind).toBe('tombstone');

            const latePut = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });
            expect(latePut.statusCode).toBe(409);
            expect(parseBody(latePut.body)).toEqual({ ok: false, error: 'CONFLICT' });
        } finally {
            await harness.close();
        }
    });

    it('returns NOT_FOUND for an absent exact object', async () => {
        const harness = await makeHarness();

        try {
            const binding = makeBinding({ objectId: 'object-absent' });
            const response = await injectRoute(harness.app, 'get', {
                payload: binding,
                token: buildToken(makeClaims('get', binding)),
            });

            expect(response.statusCode).toBe(404);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'NOT_FOUND' });
        } finally {
            await harness.close();
        }
    });
});

describe('share-content endpoint authorization', () => {
    it('rejects missing, malformed and oversized authorization headers', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();

            expect((await injectRoute(harness.app, 'put', { payload: body })).statusCode).toBe(401);
            expect(
                (
                    await injectRoute(harness.app, 'put', {
                        payload: body,
                        authorization: 'Basic abc',
                    })
                ).statusCode
            ).toBe(401);
            expect(
                (
                    await injectRoute(harness.app, 'put', {
                        payload: body,
                        authorization: `Bearer ${'a'.repeat(9000)}`,
                    })
                ).statusCode
            ).toBe(401);
            expect(
                (
                    await injectRoute(harness.app, 'put', {
                        payload: body,
                        authorization: 'Bearer ..',
                    })
                ).statusCode
            ).toBe(401);
        } finally {
            await harness.close();
        }
    });

    it('rejects a malformed token before invoking the signature verifier', async () => {
        const harness = await makeHarness();

        try {
            const response = await injectRoute(harness.app, 'put', {
                payload: makePutBody(),
                authorization: 'Bearer not.a.jwt',
            });

            expect(response.statusCode).toBe(401);
            expect(harness.verifyCalls).toHaveLength(0);
        } finally {
            await harness.close();
        }
    });

    it('never invokes the verifier for an unknown signer or unknown kid', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();

            const unknownSigner = buildToken(makeClaims('put', body), { signerDid: USER_DID });
            const unknownKid = buildToken(makeClaims('put', body), {
                signerDid: SIGNER,
                kid: `${SIGNER}#key-unknown`,
            });

            expect(
                (await injectRoute(harness.app, 'put', { payload: body, token: unknownSigner }))
                    .statusCode
            ).toBe(401);
            expect(
                (await injectRoute(harness.app, 'put', { payload: body, token: unknownKid }))
                    .statusCode
            ).toBe(401);
            expect(harness.verifyCalls).toHaveLength(0);
        } finally {
            await harness.close();
        }
    });

    it('rejects wrong audience, purpose, operation and signer mismatch', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();

            const cases = [
                makeClaims('put', body, { aud: 'did:web:other.example' }),
                makeClaims('put', body, { purpose: 'other/v1' }),
                makeClaims('put', body, { op: 'get' }),
                makeClaims('put', body, { iss: USER_DID }),
            ];

            for (const claims of cases) {
                const response = await injectRoute(harness.app, 'put', {
                    payload: body,
                    token: buildToken(claims),
                });

                expect(response.statusCode).toBe(401);
            }
        } finally {
            await harness.close();
        }
    });

    it('rejects a wrong tuple binding and a wrong body hash', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();

            for (const override of [
                { objectId: 'object-other' },
                { ownerProfileId: 'owner-other' },
                { shareId: OTHER_SHARE_ID },
                { operationId: 'operation-other' },
                { contentVersion: 2 },
            ]) {
                const wrongBinding = makeClaims('put', body, override);
                const response = await injectRoute(harness.app, 'put', {
                    payload: body,
                    token: buildToken(wrongBinding),
                });

                expect(response.statusCode).toBe(401);
            }

            const wrongHashBody = makePutBody({ envelope: makeEnvelope(2) });
            const wrongHashClaims = makeClaims('put', body);
            const hashResponse = await injectRoute(harness.app, 'put', {
                payload: wrongHashBody,
                token: buildToken(wrongHashClaims),
            });
            expect(hashResponse.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });

    it('rejects a token whose namespace is not bound to the signing service', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody({ namespace: 'tenant-other' });
            const response = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            expect(response.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });

    it('rejects a regular user DID even when the signature verifier would accept it', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const token = buildToken(makeClaims('put', body), { signerDid: USER_DID });
            const response = await injectRoute(harness.app, 'put', { payload: body, token });

            expect(response.statusCode).toBe(401);
            expect(harness.verifyCalls).toHaveLength(0);
        } finally {
            await harness.close();
        }
    });

    it('rejects a token whose signature verifier reports an error', async () => {
        const harness = await makeHarness({
            verifyImpl: async () => ({ checks: [], warnings: [], errors: ['bad signature'] }),
        });

        try {
            const body = makePutBody();
            const response = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            expect(response.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });
});

describe('share-content endpoint replay protection', () => {
    it('rejects a sequential replay of the same token', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const token = buildToken(makeClaims('put', body));

            const first = await injectRoute(harness.app, 'put', { payload: body, token });
            const second = await injectRoute(harness.app, 'put', { payload: body, token });

            expect(first.statusCode).toBe(200);
            expect(second.statusCode).toBe(401);
            expect(parseBody(second.body)).toEqual({ ok: false, error: 'UNAUTHORIZED' });
        } finally {
            await harness.close();
        }
    });

    it('accepts exactly one of two concurrent duplicate tokens (atomic SET NX)', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const token = buildToken(makeClaims('put', body));

            const [first, second] = await Promise.all([
                injectRoute(harness.app, 'put', { payload: body, token }),
                injectRoute(harness.app, 'put', { payload: body, token }),
            ]);

            const statuses = [first.statusCode, second.statusCode].sort();
            expect(statuses).toEqual([200, 401]);
            expect(await harness.collection.countDocuments()).toBe(1);
        } finally {
            await harness.close();
        }
    });

    it('fails closed with UNAVAILABLE and no database effect when Redis is down', async () => {
        const harness = await makeHarness();

        try {
            const warmBody = makePutBody({ objectId: 'object-warm' });
            const warm = await injectRoute(harness.app, 'put', {
                payload: warmBody,
                token: buildToken(makeClaims('put', warmBody)),
            });
            expect(warm.statusCode).toBe(200);

            await harness.replay.close();

            const body = makePutBody({ objectId: 'object-after-redis-down' });
            const response = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            expect(response.statusCode).toBe(503);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'UNAVAILABLE' });
            expect(await harness.collection.countDocuments()).toBe(1);
        } finally {
            await harness.close();
        }
    });
});

describe('share-content endpoint body bounds', () => {
    it('rejects a total request larger than 1 MiB', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody({ filler: 'a'.repeat(1024 * 1024 + 1024) });
            const response = await injectRoute(harness.app, 'put', { payload: body });

            expect(response.statusCode).toBe(413);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
        } finally {
            await harness.close();
        }
    });

    it('rejects decoded ciphertext above 512 KiB', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody({
                envelope: {
                    v: 1,
                    alg: 'A256GCM',
                    iv: encodeBase64Url(new Uint8Array(12).fill(7)),
                    ct: encodeBase64Url(new Uint8Array(512 * 1024 + 16).fill(3)),
                },
            });
            const response = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            expect(response.statusCode).toBe(413);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
        } finally {
            await harness.close();
        }
    });

    it('rejects serialized recovery above 64 KiB', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody({
                ownerEncryptedRecovery: makeRecovery({ ciphertext: 'b'.repeat(70 * 1024) }),
            });
            const response = await injectRoute(harness.app, 'put', {
                payload: body,
                token: buildToken(makeClaims('put', body)),
            });

            expect(response.statusCode).toBe(413);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
        } finally {
            await harness.close();
        }
    });

    it('rejects a non-JSON body with the generic invalid-input error', async () => {
        const harness = await makeHarness();

        try {
            const response = await injectRoute(harness.app, 'put', {
                payload: 'not-json',
                contentType: 'application/json',
            });

            expect(response.statusCode).toBe(400);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'INVALID_INPUT' });
        } finally {
            await harness.close();
        }
    });

    it('rejects an unsupported content type with the generic invalid-input error', async () => {
        const harness = await makeHarness();

        try {
            const response = await injectRoute(harness.app, 'put', {
                payload: JSON.stringify(makePutBody()),
                contentType: 'application/xml',
            });

            expect(response.statusCode).toBe(400);
            expect(parseBody(response.body)).toEqual({ ok: false, error: 'INVALID_INPUT' });
        } finally {
            await harness.close();
        }
    });
});

describe('share-content disabled configuration', () => {
    it('registers no routes when the runtime is disabled', async () => {
        const runtime = await buildShareContentRuntime(
            { enabled: false },
            {
                getLearnCard: async () => {
                    throw new Error('must not be called');
                },
                createReplayStore: () => {
                    throw new Error('must not be called');
                },
                getRepository: async () => {
                    throw new Error('must not be called');
                },
            }
        );

        expect(runtime.enabled).toBe(false);

        const app = Fastify({ logger: false });
        await app.ready();

        const response = await injectRoute(app, 'put', { payload: makePutBody() });

        expect(response.statusCode).toBe(404);

        await app.close();
    });
});
