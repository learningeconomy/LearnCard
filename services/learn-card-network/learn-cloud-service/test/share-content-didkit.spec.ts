import { randomUUID } from 'node:crypto';
import { inject } from 'vitest';
import { createShareContentClient } from '../../brain-service/src/helpers/share-content-client/client';
import { resolveShareContentClientConfig } from '../../brain-service/src/helpers/share-content-client/config';
import { createShareContentRedisReplayStore } from '../src/share-content/production';

import Fastify, { type FastifyInstance } from 'fastify';
import { MongoClient, type Collection, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { encodeBase64Url, type ShareEnvelope } from '@learncard/types';

import {
    createShareContentRepository,
    type ShareContentObjectBinding,
} from '@accesslayer/share-content';
import {
    SHARE_CONTENT_AUTH_PURPOSE,
    createDidkitPresentationVerifier,
    createShareContentAuthorizationVerifier,
    computeShareContentRequestHash,
    type ShareContentAuthorizationVerifier,
} from '@helpers/share-content-auth';
import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import type { MongoShareContentDocument } from '@models';

import {
    SHARE_CONTENT_PLUGIN_PREFIX,
    resolveShareContentConfig,
    shareContentFastifyPlugin,
    type ShareContentPluginOptions,
} from '../src/share-content';

const NOW = 1_700_000_000;
const AUDIENCE = 'did:web:cloud.learncard.com';
const NAMESPACE = 'learncard';
const SHARE_ID = Buffer.from(new Uint8Array(16).fill(7)).toString('base64url');

const SIGNER_SEED = 'c'.repeat(64);
const USER_SEED = 'd'.repeat(64);

const makeEnvelope = (fill = 1, bytes = 64): ShareEnvelope => ({
    v: 1,
    alg: 'A256GCM',
    iv: encodeBase64Url(new Uint8Array(12).fill(7)),
    ct: encodeBase64Url(new Uint8Array(bytes).fill(fill)),
});

const makeRecovery = () => ({
    protected: 'protected-a',
    iv: 'iv-a',
    ciphertext: 'recovery-real-didkit',
    tag: 'tag-a',
});

const makeBinding = (): ShareContentObjectBinding => ({
    namespace: NAMESPACE,
    ownerProfileId: 'owner-profile-1',
    shareId: SHARE_ID,
    contentVersion: 1,
    objectId: 'object-didkit-1',
    operationId: 'operation-didkit-1',
});

const makePutBody = () => ({
    ...makeBinding(),
    envelope: makeEnvelope(1),
    ownerEncryptedRecovery: makeRecovery(),
});

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;
let db: Db;

let signerDid: string;
let signerLearnCard: Awaited<ReturnType<typeof getLearnCard>>;
let userLearnCard: Awaited<ReturnType<typeof getLearnCard>>;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoClient = new MongoClient(mongoServer.getUri());
    await mongoClient.connect();
    db = mongoClient.db('share_content_didkit');

    signerLearnCard = await getLearnCard(SIGNER_SEED);
    userLearnCard = await getLearnCard(USER_SEED);
    signerDid = signerLearnCard.id.did();
}, 120_000);

afterAll(async () => {
    await mongoClient?.close();
    await mongoServer?.stop();
});

const buildClaims = (
    op: string,
    body: Record<string, unknown>,
    overrides: Record<string, unknown> = {}
) => ({
    iss: signerDid,
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

const signClaims = async (
    learnCard: Awaited<ReturnType<typeof getLearnCard>>,
    holderDid: string,
    claims: unknown
): Promise<string> =>
    learnCard.invoke.issuePresentation(
        {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: holderDid,
            verifiableCredential: [],
        },
        {
            proofFormat: 'jwt',
            proofPurpose: 'authentication',
            challenge: JSON.stringify(claims),
        }
    );

const decodeKid = (token: string): string => {
    const header = JSON.parse(Buffer.from(token.split('.')[0] as string, 'base64url').toString());

    return header.kid;
};

const makeReplayStore = () => {
    const seen = new Set<string>();

    return {
        store: {
            consumeOnce: async (key: string) => {
                if (seen.has(key)) return false;

                seen.add(key);

                return true;
            },
        },
        close: async () => {},
    };
};

type DidkitHarness = {
    app: FastifyInstance;
    verifier: ShareContentAuthorizationVerifier;
    collection: Collection<MongoShareContentDocument>;
    close: () => Promise<void>;
};

const makeHarness = async (realRedis = false): Promise<DidkitHarness> => {
    const collection = db.collection<MongoShareContentDocument>(
        `share_content_didkit_${randomUUID().replace(/-/g, '')}`
    );
    const repository = createShareContentRepository(collection);
    await repository.initialize();

    // A real signed token is required to learn the exact `kid`, exactly like an
    // operator provisions the allowlist before rotating a signing key.
    const probeBody = makePutBody();
    const probeToken = await signClaims(
        signerLearnCard,
        signerDid,
        buildClaims('put', probeBody as unknown as Record<string, unknown>)
    );
    const kid = decodeKid(probeToken);

    const resolved = resolveShareContentConfig({
        enabled: true,
        audience: AUDIENCE,
        serviceDids: [signerDid],
        verificationMethods: [kid],
        namespaceBindings: { [signerDid]: [NAMESPACE] },
    });

    if (resolved.status !== 'enabled') {
        throw new Error(`test config not enabled: ${JSON.stringify(resolved)}`);
    }

    const replay = realRedis
        ? createShareContentRedisReplayStore({
              host: inject('share-content-redis-host'),
              port: inject('share-content-redis-port'),
          })
        : makeReplayStore();

    const verifier = createShareContentAuthorizationVerifier({
        config: resolved.trustConfig,
        verifyPresentation: createDidkitPresentationVerifier(() => getEmptyLearnCard()),
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
        verifier,
        collection,
        close: async () => {
            await app.close();
            await replay.close();
        },
    };
};

const injectPut = (app: FastifyInstance, body: unknown, token: string) =>
    app.inject({
        method: 'POST',
        url: `${SHARE_CONTENT_PLUGIN_PREFIX}/put`,
        headers: { authorization: `Bearer ${token}` },
        payload: body as object,
    });

describe('share-content real DIDKit signed JWT VP acceptance', () => {
    it('accepts a real holder-signed presentation and serves the put through the full stack', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const claims = buildClaims('put', body as unknown as Record<string, unknown>);
            const token = await signClaims(signerLearnCard, signerDid, claims);

            const response = await injectPut(harness.app, body, token);

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body).value.status).toBe('created');
        } finally {
            await harness.close();
        }
    });

    it('rejects a tampered signature', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const token = await signClaims(
                signerLearnCard,
                signerDid,
                buildClaims('put', body as unknown as Record<string, unknown>)
            );

            const parts = token.split('.');
            const signature = parts[2] as string;
            const tampered = signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A');
            const tamperedToken = `${parts[0]}.${parts[1]}.${tampered}`;

            const response = await injectPut(harness.app, body, tamperedToken);

            expect(response.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });

    it('rejects a token signed by a non-allowlisted user DID', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const userDid = userLearnCard.id.did();
            const claims = buildClaims('put', body as unknown as Record<string, unknown>, {
                iss: userDid,
            });
            const token = await signClaims(userLearnCard, userDid, claims);

            const response = await injectPut(harness.app, body, token);

            expect(response.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });

    it('rejects a replayed real token', async () => {
        const harness = await makeHarness();

        try {
            const body = makePutBody();
            const token = await signClaims(
                signerLearnCard,
                signerDid,
                buildClaims('put', body as unknown as Record<string, unknown>)
            );

            const first = await injectPut(harness.app, body, token);
            const second = await injectPut(harness.app, body, token);

            expect(first.statusCode).toBe(200);
            expect(second.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });

    it('rejects a real token bound to a different body hash', async () => {
        const harness = await makeHarness();

        try {
            const signedBody = makePutBody();
            const token = await signClaims(
                signerLearnCard,
                signerDid,
                buildClaims('put', signedBody as unknown as Record<string, unknown>)
            );
            const differentBody = {
                ...signedBody,
                envelope: makeEnvelope(9),
            };

            const response = await injectPut(harness.app, differentBody, token);

            expect(response.statusCode).toBe(401);
        } finally {
            await harness.close();
        }
    });
});

describe('Brain client against the actual LearnCloud HTTP endpoint', () => {
    it('signs all operations, retries a lost committed response, and preserves permanent deletion', async () => {
        const harness = await makeHarness(true);
        try {
            const origin = await harness.app.listen({ host: '127.0.0.1', port: 0 });
            const nonces: string[] = [];
            let loseFirstResponse = true;
            const client = createShareContentClient(
                resolveShareContentClientConfig({
                    enabled: true,
                    origin,
                    allowInsecureLoopback: true,
                    namespace: NAMESPACE,
                    audience: AUDIENCE,
                    signerDid,
                    now: () => NOW * 1000,
                    maxAttempts: 2,
                    retryBackoffMs: 0,
                    signer: async (claims: { jti: string }) => {
                        nonces.push(claims.jti);
                        return signClaims(signerLearnCard, signerDid, claims);
                    },
                    fetchImpl: async (...args: Parameters<typeof fetch>) => {
                        const response = await fetch(...args);
                        if (loseFirstResponse) {
                            loseFirstResponse = false;
                            expect(response.status).toBe(200);
                            await response.text();
                            throw new Error('Simulated lost response after Mongo commit');
                        }
                        return response;
                    },
                })
            );
            const body = makePutBody();
            const binding = makeBinding();
            const put = await client.put(body);
            expect(put.ok).toBe(true);
            expect(nonces).toHaveLength(2);
            expect(new Set(nonces).size).toBe(2);
            const content = await client.get(binding);
            expect(content).toMatchObject({ ok: true, value: { envelope: body.envelope } });
            if (content.ok) expect(content.value).not.toHaveProperty('ownerEncryptedRecovery');
            const recovery = await client.readRecovery(binding);
            expect(recovery).toMatchObject({
                ok: true,
                value: { ownerEncryptedRecovery: body.ownerEncryptedRecovery },
            });
            if (recovery.ok) expect(recovery.value).not.toHaveProperty('envelope');
            expect(await client.stat(binding)).toMatchObject({
                ok: true,
                value: { kind: 'active' },
            });
            expect(await client.delete(binding)).toMatchObject({ ok: true });
            expect(await client.stat(binding)).toMatchObject({
                ok: true,
                value: { kind: 'tombstone' },
            });
            expect(await client.get(binding)).toMatchObject({ ok: false });
            expect(await client.put(body)).toEqual({ ok: false, error: 'CONFLICT' });
        } finally {
            await harness.close();
        }
    });
});
