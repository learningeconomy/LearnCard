import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { initLearnCard } from '@learncard/init';
import type { Express, RequestHandler } from 'express';
import type { Db } from 'mongodb';

import {
    LEARNCARD_ASSISTANT_FEED_COLLECTION,
    createLearnCardAssistantFeedRuntime,
    createLearnCardAssistantFeedService,
    createMongoLearnCardAssistantFeedRepository,
    type LearnCardAssistantCard,
    type LearnCardAssistantCardResponse,
} from '../src/assistantFeed';
import type { ServiceConfig } from '../src/config';
import type { AgentNetworkWallet } from '../src/helpers/learnCard.helpers';
import type { MongoRuntime } from '../src/mongo';
import {
    createFieldAad,
    createLearnCardDagJweEncryptionService,
    isEncryptedEnvelope,
} from '../src/security/encryption';
import { AGENT_SERVER_SHUTDOWN, createServer } from '../src/server';

// Explicit bytes force WASM even when a native DIDKit plugin is installed.
const didkit = await readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));
const wallet = await initLearnCard({ didkit, seed: '33'.repeat(32) });
const encryption = createLearnCardDagJweEncryptionService({
    keyId: 'synthetic-feed-wasm-key',
    getWallet: async () => wallet as unknown as AgentNetworkWallet,
});
const ownerDid = wallet.id.did('key');
const timestamp = '2026-07-15T12:00:00.123Z';
const feedbackAad = (id: string): string =>
    createFieldAad({
        collectionName: LEARNCARD_ASSISTANT_FEED_COLLECTION,
        ownerDid,
        stableRecordId: id,
        fieldPath: 'feedback',
    });

type StoredDocument = Record<string, unknown> & {
    id: string;
    ownerDid: string;
    createdAt: Date;
};
const documents = new Map<string, StoredDocument>();
const matches = (item: StoredDocument, filter: Record<string, unknown>): boolean =>
    Object.entries(filter).every(([key, value]) => item[key] === value);
// Only persistence is adapted. Encryption, repository, service and HTTP handler are real.
const collection = {
    createIndex: async () => 'synthetic-index',
    listIndexes: () => ({ toArray: async () => [] }),
    find: (filter: Record<string, unknown>) => {
        let rows = [...documents.values()].filter(item => matches(item, filter));
        const cursor = {
            sort: () => {
                rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                return cursor;
            },
            limit: (limit: number) => {
                rows = rows.slice(0, limit);
                return cursor;
            },
            toArray: async () => rows,
        };
        return cursor;
    },
    findOne: async (filter: Record<string, unknown>) =>
        [...documents.values()].find(item => matches(item, filter)) ?? null,
    insertOne: async (item: StoredDocument) => {
        assert.equal(documents.has(item.id), false, 'Fixture IDs must be unique');
        documents.set(item.id, { ...item });
    },
    replaceOne: async (filter: Record<string, unknown>, item: StoredDocument) => {
        const existing = [...documents.values()].find(row => matches(row, filter));
        assert.ok(existing, 'Replacement must match a stored fixture');
        documents.set(existing.id, { ...item });
    },
};
const db = {
    collection: (name: string) => {
        assert.equal(name, LEARNCARD_ASSISTANT_FEED_COLLECTION);
        return collection;
    },
} as unknown as Db;
const repository = createMongoLearnCardAssistantFeedRepository(db, encryption);
const service = createLearnCardAssistantFeedService(repository);
const card = (id: string): LearnCardAssistantCard => ({
    id,
    ownerDid,
    origin: 'autonomous',
    type: 'message',
    title: `Synthetic ${id}`,
    description: 'Real WASM feedback timestamp regression.',
    priority: 'normal',
    createdAt: new Date(timestamp),
    updatedAt: new Date(timestamp),
});
const expectedFeedback = new Map<string, string | null>();

await repository.insert({
    ...card('new-date'),
    feedback: { type: 'thumbs-down', createdAt: new Date(timestamp) },
});
const freshEnvelope = documents.get('new-date')!.feedback;
assert.ok(isEncryptedEnvelope(freshEnvelope));
assert.deepEqual(await encryption.decryptJson(freshEnvelope, feedbackAad('new-date')), {
    type: 'thumbs-down',
    createdAt: timestamp,
});
expectedFeedback.set('new-date', timestamp);

// Reproduce the original bug through the same raw {aad,value} WASM path.
await repository.insert({ ...card('old-encrypted-date'), dedupeKey: 'legacy-feedback-refresh' });
const oldEnvelope = await encryption.encryptJson(
    { type: 'thumbs-down', createdAt: new Date(timestamp) },
    feedbackAad('old-encrypted-date')
);
assert.deepEqual(await encryption.decryptJson(oldEnvelope, feedbackAad('old-encrypted-date')), {
    type: 'thumbs-down',
    createdAt: {},
});
documents.get('old-encrypted-date')!.feedback = oldEnvelope;
expectedFeedback.set('old-encrypted-date', null);

const encryptedCases: Array<{ id: string; value: unknown; expected: string | null }> = [
    { id: 'iso', value: timestamp, expected: timestamp },
    { id: 'offset', value: '2026-07-15T14:00:00.123+02:00', expected: timestamp },
    { id: 'epoch', value: '1970-01-01T00:00:00.000Z', expected: '1970-01-01T00:00:00.000Z' },
    { id: 'before-epoch', value: '1969-12-31T23:59:59.999Z', expected: '1969-12-31T23:59:59.999Z' },
    { id: 'leap-day', value: '2024-02-29T00:00:00Z', expected: '2024-02-29T00:00:00.000Z' },
    { id: 'null', value: null, expected: null },
    { id: 'missing', value: undefined, expected: null },
    { id: 'object', value: {}, expected: null },
    { id: 'invalid', value: 'not-a-date', expected: null },
    { id: 'invalid-calendar', value: '2026-02-30T00:00:00Z', expected: null },
    { id: 'date-only', value: '2026-07-15', expected: null },
    { id: 'no-timezone', value: '2026-07-15T12:00:00.123', expected: null },
    { id: 'numeric-string', value: '0', expected: null },
    { id: 'numeric', value: 0, expected: null },
    { id: 'empty', value: '', expected: null },
    { id: 'boolean', value: false, expected: null },
    { id: 'array', value: [], expected: null },
];
for (const { id, value, expected } of encryptedCases) {
    await repository.insert(card(id));
    documents.get(id)!.feedback = await encryption.encryptJson(
        { type: 'thumbs-down', ...(value === undefined ? {} : { createdAt: value }) },
        feedbackAad(id)
    );
    expectedFeedback.set(id, expected);
}
for (const [id, createdAt] of [
    ['plaintext-date', new Date(timestamp)],
    ['plaintext-iso', timestamp],
    ['plaintext-invalid-date', new Date('invalid')],
] as const) {
    await repository.insert(card(id));
    documents.get(id)!.feedback = { type: 'thumbs-down', createdAt };
    expectedFeedback.set(id, id === 'plaintext-invalid-date' ? null : timestamp);
}
for (const [id, createdAt] of [
    ['write-null', null],
    ['write-invalid-date', new Date('invalid')],
] as const) {
    await repository.insert({ ...card(id), feedback: { type: 'thumbs-down', createdAt } });
    const envelope = documents.get(id)!.feedback;
    assert.ok(isEncryptedEnvelope(envelope));
    assert.deepEqual(await encryption.decryptJson(envelope, feedbackAad(id)), {
        type: 'thumbs-down',
        createdAt: null,
    });
    expectedFeedback.set(id, null);
}
await repository.insert(card('no-feedback'));

// Repository hydration and service cloning must preserve known Dates and unknown nulls.
for (const item of await service.listLatest(ownerDid, 50)) {
    assert.equal(item.title, `Synthetic ${item.id}`);
    assert.equal(item.origin, 'autonomous');
    if (expectedFeedback.has(item.id)) {
        const expected = expectedFeedback.get(item.id);
        assert.equal(item.feedback?.type, 'thumbs-down');
        assert.equal(item.feedback?.createdAt?.toISOString() ?? null, expected);
        if (expected !== null) assert.ok(item.feedback?.createdAt instanceof Date);
        else assert.equal(item.feedback?.createdAt, null);
    } else {
        assert.equal(item.id, 'no-feedback');
        assert.equal(item.feedback, undefined);
    }
}

const mongoRuntime: MongoRuntime = {
    getClient: async () => {
        throw new Error('No real Mongo client is permitted.');
    },
    getDb: async () => {
        throw new Error('The isolated service must already be injected.');
    },
    getStatus: async () => ({ configured: false, connected: false, dbName: 'synthetic' }),
    close: async () => undefined,
};
const config: ServiceConfig = {
    nodeEnv: 'test',
    model: 'synthetic',
    port: 0,
    maxToolRounds: 1,
    cloudWatchMetricsEnabled: false,
    consentFlowAppUrl: 'https://synthetic.invalid',
    consentFlowDataPageSize: 100,
    consentFlowDataMaxPages: 1,
    consentFlowCredentialReadLimit: 1,
    mongoDbName: 'synthetic',
    selfImprovementEnabled: false,
    retroMaxTraceChars: 100,
    authChallengeTtlMs: 300_000,
    encryptionKeyId: 'synthetic',
    debugEnabled: false,
    autonomyDevEnabled: false,
    autonomyDevDids: [],
    autonomyDevPollIntervalMs: 60_000,
    autonomyDevMaxRunsPerCycle: 1,
    autonomyDevLeaseMs: 60_000,
    autonomyLaunchDarklyFlagKey: 'synthetic',
    triggerEnabled: false,
};
const app = createServer({
    config,
    mongoRuntime,
    tools: [],
    encryptionService: encryption,
    assistantFeedRuntime: createLearnCardAssistantFeedRuntime({ mongoRuntime, service }),
});
type RouterApp = Express & {
    _router: {
        stack: Array<{
            route?: {
                path: string;
                methods: Record<string, boolean>;
                stack: Array<{ handle: RequestHandler }>;
            };
        }>;
    };
};
// Same registered-handler seam as server.test.ts; no socket, DID Auth network, or DB.
const handler = (app as RouterApp)._router.stack
    .find(
        layer => layer.route?.path === '/api/users/:did/assistant-feed' && layer.route.methods.get
    )
    ?.route?.stack.at(-1)?.handle;
assert.ok(handler, 'The real assistant feed route must be registered');
const callFeed = async (): Promise<{
    status: number;
    payload: { ok: boolean; items: LearnCardAssistantCardResponse[] };
}> => {
    const { promise, resolve, reject } = Promise.withResolvers<{
        status: number;
        payload: { ok: boolean; items: LearnCardAssistantCardResponse[] };
    }>();
    let status = 200;
    const response = {
        locals: {
            agentDidAuth: {
                did: ownerDid,
                challenge: 'synthetic',
                domain: 'https://synthetic.invalid',
            },
        },
        status: (code: number) => {
            status = code;
            return response;
        },
        json: (payload: { ok: boolean; items: LearnCardAssistantCardResponse[] }) => {
            resolve({ status, payload });
            return response;
        },
    };
    const timeout = setTimeout(() => reject(new Error('Feed handler did not respond.')), 5_000);
    try {
        await Promise.resolve(
            handler(
                {
                    params: { did: ownerDid },
                    query: { limit: '50' },
                } as Parameters<RequestHandler>[0],
                response as unknown as Parameters<RequestHandler>[1],
                reject
            )
        );
        return await promise;
    } finally {
        clearTimeout(timeout);
    }
};
try {
    const result = await callFeed();
    assert.equal(result.status, 200);
    assert.equal(result.payload.ok, true);
    assert.deepEqual(
        result.payload.items.map(item => item.id).sort(),
        [...documents.keys()].sort()
    );
    for (const item of result.payload.items) {
        if (expectedFeedback.has(item.id)) {
            assert.deepEqual(item.feedback, {
                type: 'thumbs-down',
                createdAt: expectedFeedback.get(item.id),
            });
        } else {
            assert.equal(Object.hasOwn(item, 'feedback'), false);
        }
    }

    // Ordinary later writes must not turn null into the epoch or lose the thumbs-down.
    const updated = await service.markItemRead(ownerDid, 'old-encrypted-date');
    assert.deepEqual(updated.feedback, { type: 'thumbs-down', createdAt: null });
    const updatedEnvelope = documents.get('old-encrypted-date')!.feedback;
    assert.ok(isEncryptedEnvelope(updatedEnvelope));
    assert.deepEqual(
        await encryption.decryptJson(updatedEnvelope, feedbackAad('old-encrypted-date')),
        {
            type: 'thumbs-down',
            createdAt: null,
        }
    );
    assert.deepEqual(
        (await callFeed()).payload.items.find(item => item.id === updated.id)?.feedback,
        {
            type: 'thumbs-down',
            createdAt: null,
        }
    );

    const refreshed = await service.recordItem({
        ownerDid,
        dedupeKey: 'legacy-feedback-refresh',
        origin: 'autonomous',
        type: 'message',
        title: 'Refreshed synthetic card',
        description: 'Refreshing a card must preserve its existing feedback.',
    });
    assert.equal(refreshed.id, 'old-encrypted-date');
    assert.deepEqual(refreshed.feedback, { type: 'thumbs-down', createdAt: null });
    const refreshedResponse = await callFeed();
    assert.equal(refreshedResponse.status, 200);
    assert.deepEqual(
        refreshedResponse.payload.items.find(item => item.id === refreshed.id)?.feedback,
        {
            type: 'thumbs-down',
            createdAt: null,
        }
    );

    const newlyNoted = await service.recordFeedback(ownerDid, 'no-feedback', {
        type: 'thumbs-down',
    });
    assert.ok(newlyNoted.feedback?.createdAt instanceof Date);
    assert.equal(
        (await callFeed()).payload.items.find(item => item.id === 'no-feedback')?.feedback
            ?.createdAt,
        newlyNoted.feedback.createdAt.toISOString()
    );
    console.log(
        JSON.stringify({
            ok: true,
            check: 'assistant-feed-real-wasm',
            fixtures: documents.size,
            assertions: [
                'iso-roundtrip',
                'legacy-date-corruption',
                'timestamp-boundaries',
                'feed-200',
                'null-rewrite',
                'record-feedback',
            ],
        })
    );
} finally {
    await app[AGENT_SERVER_SHUTDOWN]();
}
