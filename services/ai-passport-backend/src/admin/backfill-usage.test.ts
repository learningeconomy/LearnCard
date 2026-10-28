import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { recordUsageRequest } from '../ai/usage-meter';

// Run in its own Bun process, like the other module-mocking suites. Every
// database/provider boundary is synthetic; no Mongo process or paid call runs.
class FixtureObjectId {
    constructor(private value: string) {}
    toString() {
        return this.value;
    }
}
type Document = Record<string, any>;
const copy = <T>(value: T): T => {
    if (value instanceof Date) return new Date(value) as T;
    if (value instanceof FixtureObjectId) return new FixtureObjectId(String(value)) as T;
    if (Array.isArray(value)) return value.map(copy) as T;
    if (value && typeof value === 'object')
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, copy(item)])
        ) as T;
    return value;
};
const scalar = (value: any): any =>
    value instanceof Date
        ? value.getTime()
        : value instanceof FixtureObjectId
          ? String(value)
          : value;
function matches(row: Document, filter: Document): boolean {
    return Object.entries(filter).every(([key, expected]) => {
        if (key === '$or') return expected.some((part: Document) => matches(row, part));
        const actual = row[key];
        if (
            expected &&
            typeof expected === 'object' &&
            !(expected instanceof Date) &&
            !(expected instanceof FixtureObjectId)
        ) {
            return Object.entries(expected).every(([operator, value]: [string, any]) => {
                switch (operator) {
                    case '$exists':
                        return (actual !== undefined) === value;
                    case '$in':
                        return value.some((item: any) => scalar(actual) === scalar(item));
                    case '$ne':
                        return scalar(actual) !== scalar(value);
                    case '$lt':
                        return scalar(actual) < scalar(value);
                    case '$lte':
                        return scalar(actual) <= scalar(value);
                    case '$gt':
                        return scalar(actual) > scalar(value);
                    default:
                        throw new Error(`Unsupported fixture query operator: ${operator}`);
                }
            });
        }
        return scalar(actual) === scalar(expected);
    });
}
function project(row: Document | null, projection?: Document): Document | null {
    if (!row) return null;
    if (!projection) return copy(row);
    const included = Object.keys(projection).filter(key => projection[key] === 1);
    const result = included.length
        ? Object.fromEntries(included.filter(key => key in row).map(key => [key, row[key]]))
        : row;
    const detached = copy(result);
    for (const [key, include] of Object.entries(projection)) if (!include) delete detached[key];
    return detached;
}
const collections = new Map<string, MemoryCollection>();
class MemoryCollection {
    rows: Document[] = [];
    writes: Document[] = [];
    find(filter: Document = {}, options: Document = {}) {
        let rows = this.rows.filter(row => matches(row, filter));
        const cursor = {
            sort(order: Document) {
                const [key, direction] = Object.entries(order)[0]!;
                rows = [...rows].sort((a, b) =>
                    scalar(a[key]) < scalar(b[key])
                        ? -direction
                        : scalar(a[key]) > scalar(b[key])
                          ? direction
                          : 0
                );
                return cursor;
            },
            limit(limit: number) {
                rows = rows.slice(0, limit);
                return cursor;
            },
            next: async () => project(rows[0] ?? null, options.projection),
            toArray: async () => rows.map(row => project(row, options.projection)),
        };
        return cursor;
    }
    async findOne(filter: Document, options: Document = {}) {
        const cursor = this.find(filter, options);
        if (options.sort) cursor.sort(options.sort);
        return cursor.next();
    }
    async insertOne(row: Document) {
        this.rows.push(copy(row));
        return { insertedId: row._id };
    }
    async updateOne(filter: Document, update: Document) {
        const row = this.rows.find(candidate => matches(candidate, filter));
        if (!row) return { matchedCount: 0, modifiedCount: 0 };
        Object.assign(row, copy(update.$set ?? {}));
        for (const key of Object.keys(update.$unset ?? {})) delete row[key];
        this.writes.push(copy(update));
        return { matchedCount: 1, modifiedCount: 1 };
    }
    async findOneAndUpdate(filter: Document, update: Document) {
        const row = this.rows.find(candidate => matches(candidate, filter));
        if (!row) return null;
        await this.updateOne(filter, update);
        return copy(row);
    }
}
function collection(name: string): MemoryCollection {
    if (!collections.has(name)) collections.set(name, new MemoryCollection());
    return collections.get(name)!;
}
mock.module('mongodb', () => ({
    ObjectId: FixtureObjectId,
    MongoClient: class {
        async connect() {
            return this;
        }
        db() {
            return { collection };
        }
    },
}));
mock.module('../constants/env', () => ({
    MONGO_URI: 'mongodb://offline-fixture',
    MONGO_DB: 'offline-fixture',
}));

const owner = 'did:example:usage-private-owner';
const uri = 'urn:credential:usage-private-source';
const sourceId = '000000000000000000000042';
const contentHash = 'private-source-content-hash';
const revision = 'private-consent-revision';
const sourceText = 'Synthetic confidential credential content';
const subject = new AsyncLocalStorage<string>();
let mode: 'success' | 'generation-failure' | 'embedding-failure' | 'final-consent-failure' =
    'success';
let covered = false;
let generated = 0;
let embedded = 0;
let consentChecks = 0;
mock.module('../services/dataErasure', () => ({
    isDataErasureRequested: async () => false,
    withOwnerOperation: (did: string, operation: (signal: AbortSignal) => Promise<unknown>) =>
        subject.run(did, () => operation(new AbortController().signal)),
}));
mock.module('../ai/privacy', () => ({
    runWithAiPrivacyContext: (did: string, operation: () => unknown) => {
        expect(subject.getStore()).toBe(did);
        return operation();
    },
    assertCurrentAiConsent: async () => {
        consentChecks += 1;
        if (mode === 'final-consent-failure' && consentChecks === 2) {
            const error = new Error('Synthetic consent withdrawal after provider work');
            error.name = 'AiConsentError';
            throw error;
        }
        return { revision, credentialUris: [uri] };
    },
}));
mock.module('../db', () => ({
    db: {
        getEmbeddingBackfillSource: async (did: string, kind: string, id: FixtureObjectId) => {
            expect(subject.getStore()).toBe(did);
            return collection(kind).findOne({ _id: id, did });
        },
    },
}));
mock.module('../credentials/projection', () => ({
    getCredentialProjection: (record: Document) => record,
    serializeModelSafeCredentialProjection: () => sourceText,
}));
mock.module('../db/qdrant', () => ({
    getCredentialVectorCoverage: async () =>
        new Map([[uri, new Set(covered ? ['1', '2', '3', '4', '5'] : [])]]),
}));
mock.module('../ai/embedding-texts', () => ({
    generateCredentialEmbeddingTexts: async (_text: string, options: { signal: AbortSignal }) => {
        options.signal.throwIfAborted();
        expect(subject.getStore()).toBe(owner);
        generated += 1;
        recordUsageRequest('privacy')({ textUnits: 2, freeTextUnits: 1 });
        await Promise.resolve();
        recordUsageRequest('privacy')({ textUnits: 3, freeTextUnits: 0 });
        recordUsageRequest('generation')({ inputTokens: 1000, outputTokens: 200 });
        if (mode === 'generation-failure')
            throw new Error(`${sourceText}: synthetic generation failure`);
        return {};
    },
}));
mock.module('../ai/embeddings', () => ({
    generateAndStoreCredentialEmbeddings: async (
        _record: Document,
        _texts: Document,
        did: string,
        targetOnly: boolean
    ) => {
        expect(subject.getStore()).toBe(did);
        expect(targetOnly).toBe(true);
        recordUsageRequest('privacy')({ textUnits: 4, freeTextUnits: 2 });
        for (let index = 0; index < 5; index++) {
            // Nova's fixture response contains no trustworthy token counter.
            recordUsageRequest('embedding')(undefined);
            embedded += 1;
            await Promise.resolve();
            if (mode === 'embedding-failure' && index === 1)
                throw new Error(`${uri}: synthetic vector failure`);
        }
    },
}));
const { createJob, stepJob, costPlan } = await import('./backfill');
const environmentKeys = [
    'EMBEDDINGS_ADMIN_ENABLED',
    'BEDROCK_EMBEDDINGS_ENABLED',
    'EMBEDDINGS_DUAL_WRITE',
    'AWS_REGION',
    'TITLE_MODEL',
    'AWS_ENDPOINT_URL',
    'AWS_ENDPOINT_URL_BEDROCK',
    'AWS_ENDPOINT_URL_BEDROCK_RUNTIME',
    'BEDROCK_BASE_URL',
    'NOVA_EMBEDDING_USD_PER_MILLION_TOKENS',
    'NOVA_EMBEDDING_RATE_SOURCE',
    'EMBEDDING_REPRESENTATION_USD_PER_CALL_ESTIMATE',
    'EMBEDDING_REPRESENTATION_RATE_SOURCE',
];
const previousEnvironment = Object.fromEntries(environmentKeys.map(key => [key, process.env[key]]));
beforeEach(async () => {
    for (const key of environmentKeys) delete process.env[key];
    Object.assign(process.env, {
        EMBEDDINGS_ADMIN_ENABLED: 'true',
        BEDROCK_EMBEDDINGS_ENABLED: 'true',
        EMBEDDINGS_DUAL_WRITE: 'true',
        AWS_REGION: 'us-east-1',
        TITLE_MODEL: 'gpt-6-luna-none',
    });
    collections.clear();
    mode = 'success';
    covered = false;
    generated = embedded = consentChecks = 0;
    await collection('credentials').insertOne({
        _id: new FixtureObjectId(sourceId),
        did: owner,
        uri,
        source: 'wallet',
        credential: { text: sourceText },
        verification: { contentHash, consent: { revision } },
    });
});
afterAll(() => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
});
const expectedKnownUsd = (1000 * 0.11 + 200 * 0.55) / 1e6 + (9 * 0.1) / 1000;
const expectedEmbeddingAllowanceUsd = (5 * 8192 * 0.135) / 1e6;

test('successful real step persists measured generation/privacy and five unmeasured Nova requests as a sample', async () => {
    const job = await createJob(false, randomUUID(), true);
    const result = await stepJob(job._id);
    expect(result?.written).toBe(1);
    expect(result?.cursor).toBe(sourceId);
    expect(result?.representationCalls).toBe(1);
    expect(result?.embeddingRequests).toBe(5);
    expect(generated).toBe(1);
    expect(embedded).toBe(5);
    const usage = result!.usage!;
    expect(usage.attempts).toBe(1);
    expect(usage.failedAttempts).toBe(0);
    expect(usage.historicalRequestsUnmeasured).toBe(false);
    expect(usage.totals).toEqual({
        generation: {
            requests: 1,
            measuredRequests: 1,
            inputTokens: 1000,
            outputTokens: 200,
        },
        embedding: { requests: 5, measuredRequests: 0, inputTokens: 0 },
        privacy: {
            requests: 3,
            measuredRequests: 3,
            textUnits: 9,
            freeTextUnits: 3,
        },
    });
    expect(usage.knownListPriceUsd).toBeCloseTo(expectedKnownUsd, 12);
    expect(usage.samples.count).toBe(1);
    expect(usage.samples.sumKnownUsd).toBeCloseTo(expectedKnownUsd, 12);
    expect(usage.samples.sumWithEmbeddingAllowanceUsd).toBeCloseTo(
        expectedKnownUsd + expectedEmbeddingAllowanceUsd,
        12
    );
    const store = collection('embedding_backfill_jobs');
    expect((await store.findOne({ _id: job._id }))?.usage).toEqual(usage);
    expect(
        store.writes.some(
            write => write.$set?.cursor === sourceId && write.$set?.usage?.samples.count === 1
        )
    ).toBe(true);
    const summary = costPlan(
        result!.embeddingRequests,
        result!.representationCalls,
        usage
    ).observedUsage!;
    expect(summary.unmeasuredRequests).toEqual({
        generation: 0,
        embedding: 5,
        privacy: 0,
    });
    expect(summary.sample?.count).toBe(1);
    // Detached reads ensure an accidentally mutated return value cannot alter Mongo.
    usage.attempts = 999;
    expect((await store.findOne({ _id: job._id }))?.usage.attempts).toBe(1);
});

test.each(['generation-failure', 'embedding-failure', 'final-consent-failure'] as const)(
    '%s preserves partial usage and retry adds only the new attempt',
    async failure => {
        const job = await createJob(false, randomUUID(), true);
        mode = failure;
        const failed = await stepJob(job._id);
        const privacyUnits = failure === 'generation-failure' ? 5 : 9;
        const privacyRequests = failure === 'generation-failure' ? 2 : 3;
        const embeddingRequests =
            failure === 'generation-failure' ? 0 : failure === 'embedding-failure' ? 2 : 5;
        const partialCost = (1000 * 0.11 + 200 * 0.55) / 1e6 + (privacyUnits * 0.1) / 1000;
        expect(failed?.state).toBe('paused');
        expect(failed?.cursor).toBe('');
        expect(failed?.written).toBe(0);
        expect(failed?.errors).toBe(1);
        expect(failed?.embeddingRequests).toBe(5); // Budget reservations are separate from actual dispatches.
        expect(failed?.usage?.attempts).toBe(1);
        expect(failed?.usage?.failedAttempts).toBe(1);
        expect(failed?.usage?.samples.count).toBe(0);
        expect(failed?.usage?.totals.generation.requests).toBe(1);
        expect(failed?.usage?.totals.privacy.requests).toBe(privacyRequests);
        expect(failed?.usage?.totals.embedding.requests).toBe(embeddingRequests);
        expect(failed?.usage?.knownListPriceUsd).toBeCloseTo(partialCost, 12);
        expect(
            (await collection('embedding_backfill_jobs').findOne({ _id: job._id }))?.usage
        ).toEqual(failed?.usage);
        expect(costPlan(5, 1, failed?.usage).observedUsage?.sample).toBeNull();

        mode = 'success';
        const retried = await stepJob(job._id);
        expect(retried?.written).toBe(1);
        expect(retried?.cursor).toBe(sourceId);
        expect(retried?.lastError).toBeUndefined();
        expect(retried?.representationCalls).toBe(2);
        expect(retried?.embeddingRequests).toBe(10);
        expect(retried?.usage?.attempts).toBe(2);
        expect(retried?.usage?.failedAttempts).toBe(1);
        expect(retried?.usage?.historicalRequestsUnmeasured).toBe(false);
        expect(retried?.usage?.totals.generation.inputTokens).toBe(2000);
        expect(retried?.usage?.totals.privacy.textUnits).toBe(privacyUnits + 9);
        expect(retried?.usage?.totals.embedding.requests).toBe(embeddingRequests + 5);
        expect(retried?.usage?.samples.count).toBe(1);
        expect(retried?.usage?.samples.sumKnownUsd).toBeCloseTo(expectedKnownUsd, 12);
        expect(retried?.usage?.knownListPriceUsd).toBeCloseTo(partialCost + expectedKnownUsd, 12);
        // Advancing the now-empty corpus cannot re-add the last meter.
        const completed = await stepJob(job._id);
        expect(completed?.state).toBe('completed');
        expect(completed?.usage).toEqual(retried?.usage);
    }
);

test('legacy job reservations are flagged as historical unmeasured without inventing usage', async () => {
    const job = await createJob(false, randomUUID(), true);
    await collection('embedding_backfill_jobs').updateOne(
        { _id: job._id },
        {
            $set: { representationCalls: 3, embeddingRequests: 15 },
            $unset: { usage: '' },
        }
    );
    const result = await stepJob(job._id);
    expect(result?.representationCalls).toBe(4);
    expect(result?.embeddingRequests).toBe(20);
    expect(result?.usage?.historicalRequestsUnmeasured).toBe(true);
    expect(result?.usage?.attempts).toBe(1);
    expect(result?.usage?.totals.generation.requests).toBe(1);
    expect(result?.usage?.totals.embedding.requests).toBe(5);
    expect(result?.usage?.knownListPriceUsd).toBeCloseTo(expectedKnownUsd, 12);
    expect(costPlan(20, 4, result?.usage).observedUsage?.historicalRequestsUnmeasured).toBe(true);
});

test('persisted usage and public cost summary contain no source identifiers or content', async () => {
    const job = await createJob(false, randomUUID(), true);
    mode = 'embedding-failure';
    await stepJob(job._id);
    mode = 'success';
    const result = await stepJob(job._id);
    const ledger = (await collection('embedding_backfill_jobs').findOne({
        _id: job._id,
    }))!.usage;
    const serialized = JSON.stringify({
        ledger,
        observed: costPlan(10, 2, result?.usage).observedUsage,
    });
    for (const sensitive of [owner, uri, sourceId, contentHash, revision, sourceText, job._id])
        expect(serialized).not.toContain(sensitive);
    expect(Object.keys(ledger).sort()).toEqual([
        'attempts',
        'failedAttempts',
        'historicalRequestsUnmeasured',
        'knownListPriceUsd',
        'mixedPricing',
        'pricing',
        'samples',
        'totals',
        'unpricedComponents',
        'version',
    ]);
});

test('dry runs and already-covered records do not fabricate measured usage or samples', async () => {
    const dry = await createJob(true, randomUUID());
    const dryResult = await stepJob(dry._id);
    expect(dryResult?.dryRunObserved).toBe(1);
    expect(dryResult?.usage).toBeUndefined();
    const apply = await createJob(false, randomUUID(), true);
    covered = true;
    const coveredResult = await stepJob(apply._id);
    expect(coveredResult?.skipReasons).toEqual({ already_complete: 1 });
    expect(coveredResult?.usage).toBeUndefined();
    expect(generated).toBe(0);
    expect(embedded).toBe(0);
});
