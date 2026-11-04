let reviewReads = 0;
import { afterAll, afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomUUID } from 'node:crypto';
import { deserialize, serialize } from 'bson';
import { recordUsageRequest, reserveProviderRequest, type UsageKind } from '../ai/usage-meter';

// Run separately: Bun module mocks are process-global. Mongo and every provider
// boundary below are synthetic. Real run/backfill/budget code is exercised.
type Document = Record<string, any>;
class FixtureObjectId {
    constructor(private value = randomUUID().replaceAll('-', '').slice(0, 24)) {}
    toString() {
        return this.value;
    }
    equals(other: unknown) {
        return String(other) === this.value;
    }
    static isValid(value: unknown) {
        return /^[a-f0-9]{24}$/.test(String(value));
    }
}
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
const get = (row: Document, path: string): any =>
    path.split('.').reduce((value, key) => value?.[key], row);
function set(row: Document, path: string, value: unknown) {
    const parts = path.split('.');
    const key = parts.pop()!;
    const parent = parts.reduce((value, part) => (value[part] ??= {}), row);
    parent[key] = copy(value);
}
function unset(row: Document, path: string) {
    const parts = path.split('.');
    const key = parts.pop()!;
    const parent = parts.reduce((value, part) => value?.[part], row);
    if (parent) delete parent[key];
}
function matches(row: Document, filter: Document): boolean {
    return Object.entries(filter).every(([key, expected]) => {
        if (key === '$or') return expected.some((part: Document) => matches(row, part));
        if (key === '$and') return expected.every((part: Document) => matches(row, part));
        const actual = get(row, key);
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
                    case '$nin':
                        return !value.some((item: any) => scalar(actual) === scalar(item));
                    case '$ne':
                        return scalar(actual) !== scalar(value);
                    case '$eq':
                        return scalar(actual) === scalar(value);
                    case '$lt':
                        return scalar(actual) < scalar(value);
                    case '$lte':
                        return scalar(actual) <= scalar(value);
                    case '$gt':
                        return scalar(actual) > scalar(value);
                    case '$gte':
                        return scalar(actual) >= scalar(value);
                    case '$type':
                        return value === 'string' ? typeof actual === 'string' : false;
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
    const result: Document = included.length ? {} : copy(row);
    for (const key of included) if (get(row, key) !== undefined) set(result, key, get(row, key));
    if (included.length && projection._id !== 0 && row._id !== undefined)
        result._id = copy(row._id);
    for (const [key, include] of Object.entries(projection)) if (!include) unset(result, key);
    return copy(result);
}
const collections = new Map<string, MemoryCollection>();
class MemoryCollection {
    rows: Document[] = [];
    writes: Document[] = [];
    reads: Document[] = [];
    indexes: { keys: string[]; partial?: Document }[] = [];
    find(filter: Document = {}, options: Document = {}) {
        this.reads.push(copy({ filter, options }));
        let rows = this.rows.filter(row => matches(row, filter));
        let projection = options.projection;
        const cursor = {
            sort(order: Document) {
                rows = [...rows].sort((a, b) => {
                    for (const [key, direction] of Object.entries(order)) {
                        if (scalar(get(a, key)) < scalar(get(b, key)))
                            return -(direction as number);
                        if (scalar(get(a, key)) > scalar(get(b, key))) return direction as number;
                    }
                    return 0;
                });
                return cursor;
            },
            limit(limit: number) {
                rows = rows.slice(0, limit);
                return cursor;
            },
            project(value: Document) {
                projection = value;
                return cursor;
            },
            next: async () => project(rows[0] ?? null, projection),
            toArray: async () => rows.map(row => project(row, projection)),
            async *[Symbol.asyncIterator]() {
                for (const row of rows) yield project(row, projection);
            },
        };
        return cursor;
    }
    async findOne(filter: Document = {}, options: Document = {}) {
        const cursor = this.find(filter, options);
        if (options.sort) cursor.sort(options.sort);
        return cursor.next();
    }
    async countDocuments(filter: Document = {}) {
        return this.rows.filter(row => matches(row, filter)).length;
    }
    async createIndex(keys: Document, options: Document = {}) {
        if (
            options.unique &&
            !this.indexes.some(
                index => JSON.stringify(index.keys) === JSON.stringify(Object.keys(keys))
            )
        )
            this.indexes.push({
                keys: Object.keys(keys),
                partial: options.partialFilterExpression,
            });
        return Object.keys(keys).join('_');
    }
    assertUnique(row: Document, old?: Document) {
        for (const index of [{ keys: ['_id'] }, ...this.indexes]) {
            if (index.partial && !matches(row, index.partial)) continue;
            if (
                this.rows.some(
                    other =>
                        other !== old &&
                        (!index.partial || matches(other, index.partial)) &&
                        index.keys.every(key => scalar(get(other, key)) === scalar(get(row, key)))
                )
            ) {
                throw Object.assign(new Error('Synthetic duplicate key'), {
                    code: 11000,
                });
            }
        }
    }
    async insertOne(row: Document) {
        const value = copy(row);
        value._id ??= new FixtureObjectId();
        this.assertUnique(value);
        this.rows.push(value);
        return { insertedId: value._id, acknowledged: true };
    }
    async insertMany(rows: Document[]) {
        for (const row of rows) await this.insertOne(row);
        return { insertedCount: rows.length };
    }
    update(filter: Document, update: Document, options: Document = {}) {
        let row = this.rows.find(candidate => matches(candidate, filter));
        if (!row && options.upsert) {
            row = Object.fromEntries(
                Object.entries(filter).filter(([, value]) => !value || typeof value !== 'object')
            );
            row._id ??= new FixtureObjectId();
            for (const [key, value] of Object.entries(update.$setOnInsert ?? {}))
                set(row, key, value);
            this.assertUnique(row);
            this.rows.push(row);
        }
        if (!row) return null;
        const updated = copy(row);
        for (const [key, value] of Object.entries(update.$set ?? {})) set(updated, key, value);
        for (const [key, value] of Object.entries(update.$inc ?? {}))
            set(updated, key, (get(updated, key) ?? 0) + (value as number));
        for (const key of Object.keys(update.$unset ?? {})) unset(updated, key);
        this.assertUnique(updated, row);
        this.writes.push(copy({ filter, ...update }));
        const before = copy(row);
        for (const key of Object.keys(row)) delete row[key];
        Object.assign(row, updated);
        return { before, after: copy(row) };
    }
    async updateOne(filter: Document, update: Document, options: Document = {}) {
        const changed = this.update(filter, update, options);
        return { matchedCount: changed ? 1 : 0, modifiedCount: changed ? 1 : 0 };
    }
    async updateMany(filter: Document, update: Document) {
        let count = 0;
        for (const row of this.rows)
            if (matches(row, filter)) {
                this.update({ _id: row._id }, update);
                count += 1;
            }
        return { matchedCount: count, modifiedCount: count };
    }
    async findOneAndUpdate(filter: Document, update: Document, options: Document = {}) {
        const changed = this.update(filter, update, options);
        return changed
            ? options.returnDocument === 'after'
                ? changed.after
                : changed.before
            : null;
    }
    async deleteMany(filter: Document = {}) {
        const before = this.rows.length;
        this.rows = this.rows.filter(row => !matches(row, filter));
        return { deletedCount: before - this.rows.length };
    }
}
function collection(name: string): MemoryCollection {
    if (!collections.has(name)) collections.set(name, new MemoryCollection());
    return collections.get(name)!;
}
let transactionTail: Promise<unknown> = Promise.resolve();
let afterTransactionCommit: (() => Promise<void>) | undefined;
mock.module('mongodb', () => ({
    ObjectId: FixtureObjectId,
    MongoClient: class {
        async connect() {
            return this;
        }
        db() {
            return { collection };
        }
        startSession() {
            return {
                withTransaction<T>(operation: () => Promise<T>): Promise<T> {
                    const next = transactionTail.then(async () => {
                        const snapshot = new Map(
                            [...collections].map(([name, value]) => [name, copy(value.rows)])
                        );
                        let result: T;
                        try {
                            result = await operation();
                        } catch (error) {
                            for (const [name, value] of collections)
                                value.rows = snapshot.get(name) ?? [];
                            throw error;
                        }
                        // A lost commit acknowledgement does not roll back committed state.
                        await afterTransactionCommit?.();
                        return result;
                    });
                    transactionTail = next.catch(() => {});
                    return next;
                },
                async endSession() {},
            };
        }
    },
}));
mock.module('../constants/env', () => ({
    MONGO_URI: 'mongodb://offline-fixture',
    MONGO_DB: 'offline-fixture',
}));

const owner = 'did:example:private-run-owner';
const revision = 'private-run-consent-revision';
const appDid = 'did:example:synthetic-application';
const unsharedUris = new Set<string>();
const siblingVerifications = new Map<string, Document>();
let retainedOriginalReads = 0;
const originalHash = (value: Document) =>
    createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceText = 'Synthetic confidential credential content';
const subject = new AsyncLocalStorage<string>();
const coveredUris = new Set<string>();
const dispatches: { kind: UsageKind; owner: string | undefined }[] = [];
let beforeDispatch: ((kind: UsageKind) => Promise<void>) | undefined;
let afterDispatch: ((kind: UsageKind) => Promise<void>) | undefined;
let afterGenerationResponse: (() => Promise<void>) | undefined;
let privacyDispatchCount = 3;
let generationDispatchCount = 1;
let embeddingDispatchCount = 5;
let parallelPrivacyDispatches = false;
const generationInputs: string[] = [];
let epochInitializations = 0;
const revokedOwners = new Set<string>();
const erasedOwners = new Set<string>();
const invalidOriginals = new Set<string>();
const unavailableOriginals = new Set<string>();
// Originals LearnCard returns by URI, for generated-insight fallback tests.
const learnCardOriginals = new Map<string, Document>();
const originalReads: string[] = [];
const verificationReads: string[] = [];
let consentChecks = 0;
let currentConsentRevision = revision;
let beforeCoverageReturn: (() => Promise<void>) | undefined;
let repairsCommitted = 0;
let beforeOriginalRead: (() => Promise<void>) | undefined;
let beforeRepairCommit: (() => Promise<void>) | undefined;
let afterRepairCommit: (() => Promise<void>) | undefined;
let afterEmbeddingWrite: (() => Promise<void>) | undefined;
let retryTimeOffset = 0;
const retrySleeps: number[] = [];
let beforeRetrySleep: ((milliseconds: number) => Promise<void>) | undefined;
class FixtureAiConsentError extends Error {
    reason: string;
    constructor(message: string, reason = 'unavailable') {
        super(message);
        this.name = 'AiConsentError';
        this.reason = reason;
    }
}
mock.module('../learncard/consent', () => ({
    AiConsentError: FixtureAiConsentError,
}));
mock.module('../learncard', () => ({
    getLearnCard: async () => ({
        id: { did: () => appDid },
        read: {
            get: async (uri: string) => {
                await beforeOriginalRead?.();
                originalReads.push(uri);
                if (unavailableOriginals.has(uri))
                    throw new Error('Synthetic unavailable original');
                if (learnCardOriginals.has(uri)) return copy(learnCardOriginals.get(uri));
                return {
                    fixtureUri: uri,
                    credentialSubject: { id: subject.getStore() },
                };
            },
        },
        invoke: {
            verifyCredential: async (credential: Document) => {
                verificationReads.push(credential.fixtureUri);
                return {
                    errors: invalidOriginals.has(credential.fixtureUri) ? ['Invalid proof'] : [],
                };
            },
        },
    }),
}));
mock.module('../credentials/verification', () => ({
    fingerprintCredential: originalHash,
    verifyCredentialForIngestion: async (options: Document) => {
        const result = await options.verify(options.credential);
        const valid = !result.errors.length;
        return {
            status: valid ? 'valid' : 'invalid',
            credentialUri: options.credentialUri,
            checks: ['proof'],
            errors: result.errors,
            contentHash: originalHash(options.credential),
            provenance: { source: 'wallet', retrievedAt: new Date().toISOString() },
            consent: { revision: options.consent.revision },
        };
    },
}));
let afterEpochInitialization: (() => Promise<void>) | undefined;
const gates: (() => void)[] = [];
function gate() {
    let release!: () => void;
    const promise = new Promise<void>(resolve => {
        release = resolve;
    });
    gates.push(release);
    return { promise, release };
}
async function dispatch(kind: UsageKind, signal?: AbortSignal) {
    await beforeDispatch?.(kind);
    signal?.throwIfAborted();
    await reserveProviderRequest(kind);
    dispatches.push({ kind, owner: subject.getStore() });
    const measure = recordUsageRequest(kind);
    await afterDispatch?.(kind);
    measure(
        kind === 'generation'
            ? { inputTokens: 1000, outputTokens: 200 }
            : kind === 'privacy'
              ? { textUnits: 2, freeTextUnits: 0 }
              : undefined
    );
}
mock.module('../services/dataErasure', () => ({
    isDataErasureRequested: async (did: string) => erasedOwners.has(did),
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
        if (revokedOwners.has(subject.getStore()!))
            throw new FixtureAiConsentError('Synthetic withdrawn consent', 'revoked');
        return {
            revision: currentConsentRevision,
            credentialUris: collection('credentials')
                .rows.filter(row => row.did === subject.getStore() && !unsharedUris.has(row.uri))
                .map(row => row.uri),
        };
    },
}));
mock.module('../db', () => ({
    db: {
        getCredentialVerification: async (_did: string, uri: string) =>
            copy(siblingVerifications.get(uri) ?? null),
        confirmWorkflowGeneratedSource: async (
            did: string,
            id: FixtureObjectId,
            initialFingerprint: string,
            contentHash: string,
            operation: Document
        ) => {
            const { workflowSourceFingerprint } = await import('./run-model');
            expect(subject.getStore()).toBe(did);
            const item = assertWorkflowOperation(operation, String(id));
            if (
                operation.initialFingerprint !== initialFingerprint ||
                operation.originalHash !== contentHash ||
                item.originalHash !== contentHash
            )
                throw new Error('Synthetic retained-original evidence mismatch');
            const row = collection('credentials').rows.find(
                candidate => String(candidate._id) === String(id) && candidate.did === did
            );
            return Boolean(
                row &&
                workflowSourceFingerprint(row) === initialFingerprint &&
                (row.rawContentHash === undefined || row.rawContentHash === contentHash)
            );
        },
        getWorkflowRetainedOriginal: async (
            did: string,
            id: FixtureObjectId,
            initialFingerprint: string,
            contentHash: string,
            operation: Document
        ) => {
            const { workflowSourceFingerprint } = await import('./run-model');
            expect(subject.getStore()).toBe(did);
            const item = assertWorkflowOperation(operation, String(id));
            if (
                operation.initialFingerprint !== initialFingerprint ||
                operation.originalHash !== contentHash ||
                item.originalHash !== contentHash
            )
                throw new Error('Synthetic retained-original evidence mismatch');
            const row = collection('credentials').rows.find(
                candidate => String(candidate._id) === String(id) && candidate.did === did
            );
            if (
                !row ||
                workflowSourceFingerprint(row) !== initialFingerprint ||
                (row.rawContentHash !== undefined && row.rawContentHash !== contentHash)
            )
                return null;
            retainedOriginalReads += 1;
            const envelope = await collection('raw_credentials').findOne({
                did,
                uri: row.uri,
                contentHash,
                expiresAt: { $gt: new Date() },
            });
            return envelope ? copy(envelope.credential) : null;
        },
        commitLegacyVerification: async (
            did: string,
            id: FixtureObjectId,
            expected: string,
            verification: Document,
            projection: Document,
            recheck: () => Promise<void>,
            operation: Document
        ) => {
            const { repairSourceFingerprint, REPAIR_SOURCE_PROJECTION } =
                await import('./legacy-repair-source');
            const { runSourceFingerprint } = await import('./run-model');
            expect(subject.getStore()).toBe(did);
            await recheck();
            await beforeRepairCommit?.();
            // Mirror the owner preflight and final in-transaction consent/evidence check.
            await recheck();
            const item = assertWorkflowOperation(operation, String(id));
            const row = collection('credentials').rows.find(
                candidate => String(candidate._id) === String(id) && candidate.did === did
            );
            if (
                !row ||
                row.verification ||
                repairSourceFingerprint(project(row, REPAIR_SOURCE_PROJECTION)) !== expected
            )
                return false;
            row.verification = copy(verification);
            if (verification.provenance?.source === 'generated') row.source = 'generated';
            row.projection = copy(projection);
            row.embeddingEpoch = randomUUID();
            Object.assign(item, {
                state: 'embedding_ready',
                resolvedFingerprint: runSourceFingerprint(row as Document & { _id: unknown }),
                repaired: true,
            });
            repairsCommitted += 1;
            await afterRepairCommit?.();
            return true;
        },
        prepareWorkflowEmbedding: async (
            did: string,
            id: FixtureObjectId,
            initialFingerprint: string,
            expectedRevision: string,
            recheck: () => Promise<void>,
            operation: Document
        ) => {
            const { runSourceFingerprint, workflowSourceFingerprint } = await import('./run-model');
            expect(subject.getStore()).toBe(did);
            await recheck();
            const item = assertWorkflowOperation(operation, String(id));
            const row = collection('credentials').rows.find(
                candidate => String(candidate._id) === String(id) && candidate.did === did
            );
            if (
                !row ||
                workflowSourceFingerprint(row as Document & { _id: unknown }) !==
                    initialFingerprint ||
                row.verification?.consent?.revision !== expectedRevision
            )
                return false;
            if (!row.embeddingEpoch) {
                row.embeddingEpoch = randomUUID();
                epochInitializations += 1;
            }
            await afterEpochInitialization?.();
            Object.assign(item, {
                state: 'embedding_ready',
                resolvedFingerprint: runSourceFingerprint(row as Document & { _id: unknown }),
            });
            return true;
        },
        getVectorSource: async (
            did: string,
            kind: string,
            uri: string,
            expected: { contentHash: string; consentRevision: string }
        ) => {
            expect(subject.getStore()).toBe(did);
            expect(kind).toBe('credential');
            const row = collection('credentials').rows.find(
                record => record.did === did && record.uri === uri
            );
            if (
                !row ||
                row.verification?.contentHash !== expected.contentHash ||
                row.verification?.consent?.revision !== expected.consentRevision
            )
                throw new Error('Vector source changed');
            if (!row.embeddingEpoch) {
                row.embeddingEpoch = randomUUID();
                epochInitializations += 1;
            }
            const epoch = row.embeddingEpoch;
            await afterEpochInitialization?.();
            return { kind, key: uri, epoch, ...expected };
        },
        getEmbeddingBackfillSource: async (did: string, kind: string, id: FixtureObjectId) => {
            expect(subject.getStore()).toBe(did);
            return collection(kind).findOne({ _id: id, did });
        },
    },
}));
mock.module('../credentials/projection', () => ({
    projectCredential: (original: Document) => ({
        schemaVersion: '1',
        name: `Verified confidential projection ${original.fixtureUri}`,
    }),
    getCredentialProjection: (record: Document) => record.projection,
    serializeModelSafeCredentialProjection: (projection: Document) => JSON.stringify(projection),
}));
mock.module('../db/qdrant', () => ({
    getCredentialVectorCoverage: async (_did: string, uris: string[]) => {
        reviewReads += 1;
        await beforeCoverageReturn?.();
        return new Map(
            uris.map(uri => [uri, new Set(coveredUris.has(uri) ? ['1', '2', '3', '4', '5'] : [])])
        );
    },
}));
mock.module('../ai/embedding-texts', () => ({
    generateCredentialEmbeddingTexts: async (text: string, options: { signal: AbortSignal }) => {
        generationInputs.push(text);
        if (parallelPrivacyDispatches) {
            const outcomes = await Promise.allSettled(
                Array.from({ length: privacyDispatchCount }, () =>
                    dispatch('privacy', options.signal)
                )
            );
            const failure = outcomes.find(outcome => outcome.status === 'rejected');
            if (failure?.status === 'rejected') throw failure.reason;
        } else
            for (let index = 0; index < privacyDispatchCount; index++)
                await dispatch('privacy', options.signal);
        for (let index = 0; index < generationDispatchCount; index++)
            await dispatch('generation', options.signal);
        await afterGenerationResponse?.();
        return {};
    },
}));
mock.module('../ai/embeddings', () => ({
    generateAndStoreCredentialEmbeddings: async (
        record: Document,
        _texts: Document,
        did: string,
        targetOnly: boolean,
        signal: AbortSignal
    ) => {
        expect(subject.getStore()).toBe(did);
        expect(targetOnly).toBe(true);
        for (let index = 0; index < embeddingDispatchCount; index++) {
            const recovery = (await import('../ai/embedding-recovery')).currentEmbeddingRecovery();
            if ((await import('./supplemental-recovery')).currentSingleRecoveryPass() && recovery) {
                await beforeDispatch?.('embedding');
                await recovery.reserve(index + 1, 60000, signal);
                dispatches.push({ kind: 'embedding', owner: subject.getStore() });
                recordUsageRequest('embedding')(undefined);
                await afterDispatch?.('embedding');
            } else await dispatch('embedding', signal);
        }
        coveredUris.add(record.uri);
        await afterEmbeddingWrite?.();
    },
}));

// Import after mocks so this suite never connects to a real service.
const realGenerationRetry = { ...(await import('./generation-retry')) };
mock.module('./generation-retry', () => ({
    ...realGenerationRetry,
    generationRetryNow: () => Date.now() + retryTimeOffset,
    sleepForGenerationRetry: async (milliseconds: number) => {
        retrySleeps.push(milliseconds);
        await beforeRetrySleep?.(milliseconds);
        retryTimeOffset += milliseconds;
    },
}));
const {
    planRun: planRunForPrincipal,
    getPlanStatus,
    diagnoseMetadata,
    startRun: startRunForPrincipal,
    stopRun: stopRunForPrincipal,
    resumeRun: resumeRunForPrincipal,
    listRuns,
    recoverRunOnce,
} = await import('./runs');
const operatorDid = 'did:example:private-run-operator';
const planRun = async (id: string, did = operatorDid, recordLimit?: number) => {
    let value = await planRunForPrincipal(id, did, recordLimit);
    await waitFor(async () => {
        value = await getPlanStatus(value?._id ?? id, did);
        return Boolean(value && ['review', 'failed', 'interrupted'].includes(value.state));
    });
    if (!value || value.state !== 'review') throw new Error(value?.reason ?? 'Review unavailable');
    return value;
};
const startRun = (
    id: string,
    planId: string,
    paid: boolean,
    principal: () => Promise<void>,
    did = operatorDid,
    replaceRunId?: string,
    generationRetryPolicy?: 'http5xx-v1' | 'transient-v2'
) => startRunForPrincipal(id, planId, paid, principal, did, replaceRunId, generationRetryPolicy);
const stopRun = (id: string, cancel: boolean, did = operatorDid) =>
    stopRunForPrincipal(id, cancel, did);
const resumeRun = (
    id: string,
    principal: () => Promise<void>,
    did = operatorDid,
    generationRetryPolicy?: 'http5xx-v1' | 'transient-v2'
) => resumeRunForPrincipal(id, principal, did, generationRetryPolicy);
const { stepJob } = await import('./backfill');
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
    'BEDROCK_GUARDRAIL_ID',
    'BEDROCK_GUARDRAIL_VERSION',
];
const previousEnvironment = Object.fromEntries(environmentKeys.map(key => [key, process.env[key]]));
const guard = async () => {};
const sourceId = (index: number) => String(index).padStart(24, '0');
function source(index: number, changes: Document = {}): Document & { _id: any } {
    return {
        _id: new FixtureObjectId(sourceId(index)),
        did: owner,
        uri: `urn:credential:private-run-${index}`,
        source: 'wallet',
        embeddingEpoch: `private-source-epoch-${index}`,
        projection: { schemaVersion: '1', name: `${sourceText} ${index}` },
        verification: {
            status: 'valid',
            credentialUri: `urn:credential:private-run-${index}`,
            checks: ['proof'],
            errors: [],
            contentHash: createHash('sha256').update(`private-content-hash-${index}`).digest('hex'),
            consent: { revision },
        },
        ...changes,
    };
}
async function waitFor(
    predicate: () => boolean | Promise<boolean>,
    message = 'Expected worker state',
    timeout = 4000
) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
        if (await predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    throw new Error(message);
}
const runStore = () => collection('embedding_backfill_runs');
const planStore = () => collection('embedding_backfill_plans');
const jobStore = () => collection('embedding_backfill_jobs');
const rawRun = (id: string) => runStore().findOne({ _id: id });
const itemStore = () => collection('embedding_backfill_items');
function assertWorkflowOperation(operation: Document, source: string) {
    const run = runStore().rows.find(
        row =>
            row._id === operation.runId &&
            row.lease === operation.lease &&
            row.state === 'running' &&
            row.leaseUntil > new Date() &&
            row.processed === operation.index
    );
    const item = itemStore().rows.find(
        row =>
            row._id === `${operation.runId}:${operation.index}` &&
            row.runId === operation.runId &&
            row.index === operation.index &&
            row.sourceId === source &&
            row.initialFingerprint === operation.initialFingerprint
    );
    if (!run || !item || item.state !== 'pending') throw new Error('Workflow operation expired');
    return item;
}
const requestCounts = () =>
    Object.fromEntries(
        ['generation', 'embedding', 'privacy'].map(kind => [
            kind,
            dispatches.filter(call => call.kind === kind).length,
        ])
    );
beforeEach(async () => {
    reviewReads = 0;
    for (const key of environmentKeys) delete process.env[key];
    Object.assign(process.env, {
        EMBEDDINGS_ADMIN_ENABLED: 'true',
        BEDROCK_EMBEDDINGS_ENABLED: 'true',
        EMBEDDINGS_DUAL_WRITE: 'true',
        AWS_REGION: 'us-east-1',
        TITLE_MODEL: 'gpt-6-luna-none',
    });
    collections.clear();
    coveredUris.clear();
    dispatches.length = generationInputs.length = gates.length = 0;
    beforeDispatch = afterDispatch = undefined;
    afterGenerationResponse = undefined;
    retryTimeOffset = 0;
    retrySleeps.length = 0;
    beforeRetrySleep = undefined;
    afterTransactionCommit = undefined;
    privacyDispatchCount = 3;
    generationDispatchCount = 1;
    embeddingDispatchCount = 5;
    parallelPrivacyDispatches = false;
    epochInitializations = 0;
    afterEpochInitialization = undefined;
    unsharedUris.clear();
    siblingVerifications.clear();
    retainedOriginalReads = 0;
    revokedOwners.clear();
    erasedOwners.clear();
    invalidOriginals.clear();
    unavailableOriginals.clear();
    learnCardOriginals.clear();
    originalReads.length = verificationReads.length = 0;
    consentChecks = repairsCommitted = 0;
    currentConsentRevision = revision;
    beforeCoverageReturn = undefined;
    beforeOriginalRead = beforeRepairCommit = afterRepairCommit = afterEmbeddingWrite = undefined;
    await collection('credentials').insertOne(source(1));
});
afterEach(async () => {
    for (const row of runStore().rows) await stopRun(row._id, true).catch(() => {});
    for (const release of gates) release();
    await waitFor(
        () => !jobStore().rows.some(row => row.lease),
        'Worker did not drain during cleanup'
    );
    await new Promise(resolve => setTimeout(resolve, 5));
});
afterAll(() => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
});

// Snapshot fingerprints bind all security-relevant metadata, while intentionally
// excluding credential payloads from the preflight read path.
test('run eligibility fails closed for incomplete or invalid verification metadata', async () => {
    const { metadataEligible, runSourceFingerprint } = await import('./run-model');
    const valid = source(1);
    expect(metadataEligible(valid)).toBe(true);
    const changes: [string, unknown][] = [
        ['did', 'not-a-did'],
        ['uri', ''],
        ['projection.schemaVersion', '2'],
        ['verification.status', 'invalid'],
        ['verification.credentialUri', 'other-uri'],
        ['verification.checks', []],
        ['verification.errors', ['invalid-proof']],
        ['verification.contentHash', 'malformed'],
        ['verification.consent.revision', ''],
    ];
    for (const [path, value] of changes) {
        const changed = copy(valid);
        set(changed, path, value);
        expect(metadataEligible(changed)).toBe(false);
        expect(runSourceFingerprint(changed)).not.toBe(runSourceFingerprint(valid));
    }
    for (const path of ['projection', 'verification', 'verification.consent']) {
        const changed = copy(valid);
        unset(changed, path);
        expect(metadataEligible(changed)).toBe(false);
    }
});

async function settled(id: string, timeout = 6000) {
    await waitFor(
        async () => {
            const row = await rawRun(id);
            return Boolean(
                row &&
                row.state !== 'running' &&
                !row.lease &&
                !jobStore().rows.some(job => job._id === id && job.lease)
            );
        },
        'Run did not finish or pause',
        timeout
    );
    // The process-local loop removes its claim after the final database write.
    await new Promise(resolve => setTimeout(resolve, 2));
    return (await listRuns()).find(row => row._id === id)!;
}
async function plannedStart(principal = guard) {
    const plan = await planRun(randomUUID());
    const run = await startRun(randomUUID(), plan._id, true, principal);
    return { plan, run };
}

test('concurrent plan requests create one immutable snapshot', async () => {
    const id = randomUUID();
    const plans = await Promise.all([planRun(id), planRun(id), planRun(id)]);
    expect(plans[0]).toEqual(plans[1]);
    expect(plans[1]).toEqual(plans[2]);
    expect(planStore().rows).toHaveLength(1);
    expect(dispatches).toHaveLength(0);
});

test('oversized inventory fails closed instead of silently approving a truncated plan', async () => {
    // Direct fixture insertion keeps setup linear while preserving detached data.
    collection('credentials').rows = Array.from({ length: 10001 }, (_, index) => source(index + 1));
    await expect(planRun(randomUUID())).rejects.toThrow('no partial plan');
    expect(planStore().rows).toHaveLength(0);
    expect(dispatches).toHaveLength(0);
});

test('paid authorization, current principal and reviewed configuration are mandatory', async () => {
    const plan = await planRun(randomUUID());
    await expect(startRun(randomUUID(), plan._id, false, guard)).rejects.toThrow('authorization');
    await expect(
        startRun(randomUUID(), plan._id, true, async () => {
            throw new Error('Session expired');
        })
    ).rejects.toThrow('Session expired');
    await expect(startRun(randomUUID(), randomUUID(), true, guard)).rejects.toThrow(
        'Reviewed plan'
    );
    process.env.TITLE_MODEL = 'changed-model';
    await expect(startRun(randomUUID(), plan._id, true, guard)).rejects.toThrow(
        'Configuration changed'
    );
    expect(runStore().rows).toHaveLength(0);
    expect(jobStore().rows).toHaveLength(0);
    expect(dispatches).toHaveLength(0);
});

test('concurrent starts are idempotent and a second run cannot own the global slot or reviewed plan', async () => {
    const hold = gate();
    let entered = false;
    beforeDispatch = async () => {
        entered = true;
        await hold.promise;
    };
    const plan = await planRun(randomUUID());
    const otherPlan = await planRun(randomUUID());
    const id = randomUUID();
    const results = await Promise.all([
        startRun(id, plan._id, true, guard),
        startRun(id, plan._id, true, guard),
    ]);
    expect(results[0]._id).toBe(results[1]._id);
    await waitFor(() => entered);
    expect(runStore().rows).toHaveLength(1);
    expect(jobStore().rows).toHaveLength(1);
    await expect(startRun(randomUUID(), otherPlan._id, true, guard)).rejects.toThrow(
        'global runner slot'
    );
    await expect(startRun(id, otherPlan._id, true, guard)).rejects.toThrow('Idempotency');
    await expect(stepJob(id)).rejects.toThrow();
    await stopRun(id, false);
    hold.release();
    await settled(id);
    await startRun(id, plan._id, true, guard);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(dispatches).toHaveLength(0);
    await expect(startRun(randomUUID(), otherPlan._id, true, guard)).rejects.toThrow(
        'global runner slot'
    );
    await stopRun(id, true);
    await expect(startRun(randomUUID(), plan._id, true, guard)).rejects.toThrow('owns this plan');
});

test('one start automatically crosses the old 100-record boundary and excludes later credentials and all messages', async () => {
    collection('credentials').rows = Array.from({ length: 101 }, (_, index) => source(index + 1));
    const plan = await planRun(randomUUID());
    await collection('credentials').insertOne(source(102));
    await collection('messages').insertOne({
        _id: new FixtureObjectId(sourceId(103)),
        did: owner,
        consentRevision: revision,
        content: 'Not in credential plan',
    });
    const run = await startRun(randomUUID(), plan._id, true, guard);
    const done = await settled(run._id, 20000);
    expect(done.state).toBe('completed');
    expect(done.recordLimit).toBe(101);
    expect(done.processed).toBe(101);
    expect(done.written).toBe(101);
    expect(done.generationRequests).toBe(101);
    expect(done.embeddingRequests).toBe(505);
    expect(done.privacyRequests).toBe(303);
    expect(requestCounts()).toEqual({
        generation: 101,
        embedding: 505,
        privacy: 303,
    });
    expect(generationInputs).toHaveLength(101);
    expect(generationInputs).not.toContain(JSON.stringify(source(102).projection));
    expect((await rawRun(run._id))?.occupied).toBe(false);
}, 25000);

test.each([false, true])(
    'stop cancel=%s blocks every provider dispatch while an in-flight unit drains',
    async cancel => {
        const hold = gate();
        let entered = false;
        beforeDispatch = async () => {
            entered = true;
            await hold.promise;
        };
        const { run } = await plannedStart();
        await waitFor(() => entered);
        const stopped = await stopRun(run._id, cancel);
        expect(stopped.state).toBe(cancel ? 'cancelled' : 'paused');
        expect(stopped.draining).toBe(true);
        await expect(resumeRun(run._id, guard)).rejects.toThrow();
        hold.release();
        const done = await settled(run._id);
        expect(done.state).toBe(cancel ? 'cancelled' : 'paused');
        expect(done.draining).toBe(false);
        expect(dispatches).toHaveLength(0);
        expect(done.generationRequests).toBe(0);
        expect(done.embeddingRequests).toBe(0);
        expect(done.privacyRequests).toBe(0);
        expect((await rawRun(run._id))?.occupied).toBe(!cancel);
    }
);

test('explicit resume preserves committed snapshot progress and all prior request reservations', async () => {
    await collection('credentials').insertOne(source(2));
    const hold = gate();
    let entered = false;
    beforeDispatch = async () => {
        if (dispatches.length === 9) {
            entered = true;
            await hold.promise;
        }
    };
    const { run } = await plannedStart();
    await waitFor(() => entered);
    await stopRun(run._id, false);
    hold.release();
    const paused = await settled(run._id);
    expect(paused.processed).toBe(1);
    expect(paused.written).toBe(1);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    expect(paused.generationRequests).toBe(1);
    expect(paused.embeddingRequests).toBe(5);
    expect(paused.privacyRequests).toBe(3);
    beforeDispatch = undefined;
    await resumeRun(run._id, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.processed).toBe(2);
    expect(done.written).toBe(2);
    expect(done.generationRequests).toBe(2);
    expect(done.embeddingRequests).toBe(10);
    expect(done.privacyRequests).toBe(6);
    expect(requestCounts()).toEqual({ generation: 2, embedding: 10, privacy: 6 });
});

test.each(['generation', 'embedding', 'privacy'] as const)(
    '%s cap is reserved before every dispatch, including extra attempts',
    async kind => {
        if (kind === 'generation') generationDispatchCount = 2;
        if (kind === 'embedding') embeddingDispatchCount = 6;
        if (kind === 'privacy') privacyDispatchCount = 4;
        const { run } = await plannedStart();
        const paused = await settled(run._id);
        const limit = { generation: 1, embedding: 5, privacy: 3 }[kind];
        expect(paused.state).toBe('paused');
        expect(paused.reason).toContain('budget exhausted');
        expect(requestCounts()[kind]).toBe(limit);
        expect((await rawRun(run._id))?.[`${kind}Requests`]).toBe(limit);
        expect(paused.written).toBe(0);
        expect(paused.processed).toBe(0);
        const before = requestCounts();
        await listRuns();
        await startRun(run._id, (await rawRun(run._id))!.planId, true, guard);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(requestCounts()).toEqual(before);
        // A deliberate retry cannot refill any allowance that was already spent.
        await resumeRun(run._id, guard);
        const retried = await settled(run._id);
        expect(retried.state).toBe('paused');
        expect((await rawRun(run._id))?.[`${kind}Requests`]).toBe(limit);
        expect(requestCounts()[kind]).toBe(limit);
    }
);

test('source changes before start are conserved as blockers without paid work', async () => {
    const plan = await planRun(randomUUID());
    await collection('credentials').updateOne(
        { _id: new FixtureObjectId(sourceId(1)) },
        { $set: { 'verification.contentHash': 'a'.repeat(64) } }
    );
    const run = await startRun(randomUUID(), plan._id, true, guard);
    const paused = await settled(run._id);
    expect(paused.state).toBe('completed_with_blockers');
    expect(paused.blockedReasons).toEqual({ source_changed: 1 });
    expect(paused.processed).toBe(1);
    expect(paused.blocked).toBe(1);
    expectConservation(paused);
    expect(dispatches).toHaveLength(0);
});

test('source fingerprint is checked again between provider dispatches', async () => {
    afterDispatch = async () => {
        if (dispatches.length === 1)
            await collection('credentials').updateOne(
                { _id: new FixtureObjectId(sourceId(1)) },
                { $set: { embeddingEpoch: 'new-source-epoch' } }
            );
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.reason).toContain('Verified source changed');
    expect(dispatches).toHaveLength(1);
    expect(paused.privacyRequests).toBe(1);
    expect(paused.generationRequests).toBe(0);
    expect(paused.embeddingRequests).toBe(0);
});

test('changed principal or configuration stops the next dispatch without silently resuming', async () => {
    let authenticated = true;
    const principal = async () => {
        if (!authenticated) throw new Error('Session revoked');
    };
    afterDispatch = async () => {
        authenticated = false;
    };
    const { run } = await plannedStart(principal);
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.reason).toContain('Authorization expired');
    expect(dispatches).toHaveLength(1);
    await expect(resumeRun(run._id, principal)).rejects.toThrow('Session revoked');
    authenticated = true;
    process.env.TITLE_MODEL = 'different-provider-route';
    await expect(resumeRun(run._id, principal)).rejects.toThrow('Configuration changed');
    expect(dispatches).toHaveLength(1);
});

test('persisted plan mutation blocks the next dispatch and explicit resume', async () => {
    afterDispatch = async () => {
        if (dispatches.length === 1) {
            const plan = planStore().rows[0]!;
            await planStore().updateOne({ _id: plan._id }, { $set: { maxPrivacyRequests: 999 } });
        }
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.reason).toContain('Reviewed plan');
    expect(dispatches).toHaveLength(1);
    await expect(resumeRun(run._id, guard)).rejects.toThrow('Stored plan changed');
});

test('a foreign server with a live lease stays running; expiry interrupts without auto-resume and retains budgets', async () => {
    const hold = gate();
    let entered = false;
    afterDispatch = async () => {
        if (dispatches.length === 1) {
            entered = true;
            await hold.promise;
        }
    };
    const { plan, run } = await plannedStart();
    await waitFor(() => entered);
    await runStore().updateOne({ _id: run._id }, { $set: { process: 'previous-server-process' } });
    let observed = (await listRuns()).find(row => row._id === run._id)!;
    expect(observed.state).toBe('running');
    expect(observed.draining).toBe(true);
    expect((await resumeRun(run._id, guard)).state).toBe('running');
    expect(dispatches).toHaveLength(1);
    hold.release();
    await waitFor(() => !jobStore().rows.some(job => job.lease));
    await new Promise(resolve => setTimeout(resolve, 5));
    await runStore().updateOne({ _id: run._id }, { $set: { leaseUntil: new Date(0) } });
    observed = (await listRuns()).find(row => row._id === run._id)!;
    expect(observed.state).toBe('interrupted');
    expect(observed.resumable).toBe(true);
    expect((await rawRun(run._id))?.state).toBe('running');
    await startRun(run._id, plan._id, true, guard);
    await listRuns();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(dispatches).toHaveLength(1);
    afterDispatch = undefined;
    await resumeRun(run._id, guard);
    const resumed = await settled(run._id);
    expect(resumed.state).toBe('paused');
    expect(resumed.privacyRequests).toBe(3);
    expect(dispatches).toHaveLength(3);
    expect(resumed.generationRequests).toBe(0);
});

test('public plan and run outputs never reveal source IDs, fingerprints, owners, contents or internal leases', async () => {
    const { plan, run } = await plannedStart();
    const done = await settled(run._id);
    const stored = await planStore().findOne({ _id: plan._id });
    const result = JSON.stringify({ plan, run, done, listing: await listRuns() });
    for (const secret of [
        owner,
        revision,
        sourceText,
        sourceId(1),
        source(1).uri,
        source(1).verification.contentHash,
        stored!.snapshot[0].fingerprint,
    ])
        expect(result).not.toContain(secret);
    for (const field of [
        'snapshot',
        'planDigest',
        'principalRef',
        'lease',
        'leaseUntil',
        'process',
        'cursor',
        'highWater',
        'managedRunId',
    ])
        expect(Object.keys(done)).not.toContain(field);
    expect(done.observedUsage).toBeDefined();
    expect(done.written).toBe(1);
});

test('a different authenticated principal cannot reuse the plan, start key, pause, cancel or resume', async () => {
    const foreign = 'did:example:another-operator';
    const hold = gate();
    let entered = false;
    beforeDispatch = async () => {
        entered = true;
        await hold.promise;
    };
    const plan = await planRun(randomUUID());
    await expect(planRun(plan._id, foreign)).rejects.toThrow('principal');
    await expect(startRun(randomUUID(), plan._id, true, guard, foreign)).rejects.toThrow(
        'principal'
    );
    const run = await startRun(randomUUID(), plan._id, true, guard);
    await waitFor(() => entered);
    await expect(startRun(run._id, plan._id, true, guard, foreign)).rejects.toThrow('Idempotency');
    await expect(stopRun(run._id, false, foreign)).rejects.toThrow();
    await expect(stopRun(run._id, true, foreign)).rejects.toThrow();
    expect((await rawRun(run._id))?.state).toBe('running');
    await stopRun(run._id, false);
    hold.release();
    await settled(run._id);
    await expect(resumeRun(run._id, guard, foreign)).rejects.toThrow();
    expect(dispatches).toHaveLength(0);
});

test.each(['BEDROCK_GUARDRAIL_ID', 'BEDROCK_GUARDRAIL_VERSION'])(
    '%s drift prevents a reviewed plan from starting',
    async key => {
        process.env.BEDROCK_GUARDRAIL_ID = 'original-guardrail';
        process.env.BEDROCK_GUARDRAIL_VERSION = '1';
        const plan = await planRun(randomUUID());
        process.env[key] = 'changed-guardrail-configuration';
        await expect(startRun(randomUUID(), plan._id, true, guard)).rejects.toThrow(
            'Configuration changed'
        );
        expect(dispatches).toHaveLength(0);
        expect(runStore().rows).toHaveLength(0);
    }
);

test('provider configuration drift during an in-flight unit stops the next dispatch', async () => {
    afterDispatch = async () => {
        process.env.BEDROCK_GUARDRAIL_VERSION = 'changed';
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.reason).toContain('configuration changed');
    expect(dispatches).toHaveLength(1);
});

test('concurrent provider reservations cannot race past a hard request cap', async () => {
    parallelPrivacyDispatches = true;
    privacyDispatchCount = 20;
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.privacyRequests).toBe(3);
    expect(requestCounts()).toEqual({ generation: 0, embedding: 0, privacy: 3 });
    expect(paused.written).toBe(0);
});

test('an empty reviewed snapshot completes without launching any provider work', async () => {
    collection('credentials').rows = [];
    const { plan, run } = await plannedStart();
    expect(plan.recordLimit).toBe(0);
    expect(run.state).toBe('completed');
    expect(run.draining).toBe(false);
    expect((await rawRun(run._id))?.occupied).toBe(false);
    expect(dispatches).toHaveLength(0);
    await expect(resumeRun(run._id, guard)).rejects.toThrow('not resumable');
});

test('metadata diagnosis returns only bounded aggregate reasons without writes or external checks', async () => {
    await collection('credentials').insertMany([
        source(2, { verification: undefined }),
        source(3, { projection: undefined }),
    ]);
    const before = JSON.stringify(collection('credentials').rows);
    const result = await diagnoseMetadata();
    expect(result).toMatchObject({
        scanned: 3,
        metadataEligible: 1,
        excluded: 2,
        incomplete: false,
        exclusionReasons: { missing_verification: 1, missing_projection: 1 },
    });
    expect(JSON.stringify(collection('credentials').rows)).toBe(before);
    expect(reviewReads).toBe(0);
    expect(dispatches).toHaveLength(0);
    for (const secret of [owner, sourceText, sourceId(1), source(1).uri])
        expect(JSON.stringify(result)).not.toContain(secret);
    const read = collection('credentials').reads.at(-1)!;
    expect(read.options.maxTimeMS).toBe(5000);
    expect(read.options.projection.credential).toBeUndefined();
    collection('credentials').rows = Array.from({ length: 10001 }, (_, i) =>
        source(i + 1, { verification: undefined })
    );
    const partial = await diagnoseMetadata();
    expect(partial).toMatchObject({
        scanned: 10000,
        excluded: 10000,
        incomplete: true,
        limit: 10000,
    });
    expect(partial.exclusionReasons).toEqual({ missing_verification: 10000 });
    expect(reviewReads).toBe(0);
    expect(dispatches).toHaveLength(0);
});

test('malformed proof-check metadata is counted instead of failing the entire diagnostic', async () => {
    await collection('credentials').insertMany([
        source(2, { verification: { ...source(2).verification, checks: {} } }),
        source(3, { verification: { ...source(3).verification, checks: 7 } }),
    ]);
    expect(await diagnoseMetadata()).toMatchObject({
        scanned: 3,
        excluded: 2,
        exclusionReasons: { invalid_verification: 2 },
    });
    expect(dispatches).toHaveLength(0);
    expect(reviewReads).toBe(0);
});

function legacySource(index: number, changes: Document = {}) {
    return source(index, {
        verification: undefined,
        projection: undefined,
        embeddingEpoch: undefined,
        ...changes,
    });
}

function expectConservation(run: Document) {
    expect(run.written + run.alreadyComplete + run.blocked).toBe(run.processed);
    expect(run.processed).toBeLessThanOrEqual(run.recordLimit);
}

async function seedV1Plan() {
    const plan = await planRun(randomUUID());
    const { runSourceFingerprint } = await import('./run-model');
    const snapshot = collection('credentials').rows.map(row => ({
        id: String(row._id),
        fingerprint: runSourceFingerprint(row as Document & { _id: unknown }),
    }));
    await planStore().updateOne(
        { _id: plan._id },
        {
            $unset: { workflowVersion: '' },
            $set: {
                snapshot,
                recordLimit: snapshot.length,
                maxGenerationRequests: snapshot.length,
                maxEmbeddingRequests: snapshot.length * 5,
                maxPrivacyRequests: snapshot.length * 3,
                excludedComplete: 0,
                excludedIneligible: 0,
                initializedSourceEpochs: 0,
            },
        }
    );
    return plan._id;
}

test('v2 planning snapshots all selected metadata quickly without Qdrant, verification, consent or provider work', async () => {
    collection('credentials').rows = [
        legacySource(1),
        source(2),
        source(3, { source: 'generated' }),
        source(4, { did: undefined }),
        source(5, { verification: { status: 'invalid' } }),
    ];
    coveredUris.add(source(2).uri);
    const before = JSON.stringify(collection('credentials').rows);
    const plan = await planRun(randomUUID());
    expect(plan.workflowVersion).toBe(2);
    expect(plan.recordLimit).toBe(5);
    expect(plan.maxGenerationRequests).toBe(5);
    expect(plan.maxEmbeddingRequests).toBe(25);
    expect(plan.maxPrivacyRequests).toBe(15);
    expect(reviewReads).toBe(0);
    expect(consentChecks).toBe(0);
    expect(epochInitializations).toBe(0);
    expect(originalReads).toHaveLength(0);
    expect(verificationReads).toHaveLength(0);
    expect(dispatches).toHaveLength(0);
    expect(JSON.stringify(collection('credentials').rows)).toBe(before);
    const saved = await planStore().findOne({ _id: plan._id });
    expect(saved?.snapshot).toHaveLength(5);
    const serialized = JSON.stringify(plan);
    for (const secret of [
        owner,
        revision,
        sourceText,
        sourceId(1),
        source(1).uri,
        source(2).verification.contentHash,
        saved!.snapshot[0].fingerprint,
    ])
        expect(serialized).not.toContain(secret);
    for (const read of collection('credentials').reads) {
        expect(read.options.projection).toBeDefined();
        expect(read.options.projection.credential).toBeUndefined();
        expect(read.options.projection.rawCredential).toBeUndefined();
        expect(read.options.projection.projection).toBeUndefined();
    }
    await collection('credentials').insertOne(source(6));
    expect(await planRun(plan._id)).toEqual(plan);
    expect(await planStore().findOne({ _id: plan._id })).toEqual(saved);
});

test('explicit v2 selection limit fixes the source set and bounds every provider allowance', async () => {
    collection('credentials').rows = [source(1), source(2), source(3)];
    const plan = await planRun(randomUUID(), operatorDid, 2);
    expect(plan.recordLimit).toBe(2);
    expect(plan.maxGenerationRequests).toBe(2);
    expect(plan.maxEmbeddingRequests).toBe(10);
    expect(plan.maxPrivacyRequests).toBe(6);
    const run = await startRun(randomUUID(), plan._id, true, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.processed).toBe(2);
    expect(done.written).toBe(2);
    expectConservation(done);
    expect(generationInputs).not.toContain(JSON.stringify(source(3).projection));
});

test('one v2 workflow repairs legacy originals, writes uncovered sources and reports generated, revoked and invalid blockers', async () => {
    const revoked = 'did:example:revoked-run-owner';
    collection('credentials').rows = [
        legacySource(1),
        source(2),
        legacySource(3, { source: 'generated', rawContentHash: 'c'.repeat(64) }),
        legacySource(4, { did: revoked }),
        legacySource(5),
        source(6),
    ];
    coveredUris.add(source(2).uri);
    revokedOwners.add(revoked);
    invalidOriginals.add(source(5).uri);
    const plan = await planRun(randomUUID());
    expect(plan.recordLimit).toBe(6);
    const run = await startRun(randomUUID(), plan._id, true, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed_with_blockers');
    expect(done.written).toBe(2);
    expect(done.alreadyComplete).toBe(1);
    expect(done.blocked).toBe(3);
    expect(done.processed).toBe(6);
    expect(done.reconciled).toBe(6);
    expectConservation(done);
    expect(requestCounts()).toEqual({ generation: 2, embedding: 10, privacy: 6 });
    expect(repairsCommitted).toBe(1);
    const items = itemStore().rows.filter(row => row.runId === run._id);
    expect(items).toHaveLength(6);
    expect(items.filter(row => row.state === 'written')).toHaveLength(2);
    expect(items.filter(row => row.state === 'already_complete')).toHaveLength(1);
    expect(items.filter(row => row.state === 'blocked')).toHaveLength(3);
    expect(items.every(row => row.reconciled === true)).toBe(true);
    const repaired = items.find(row => row.index === 0)!;
    expect(repaired.repaired).toBe(true);
    expect(repaired.resolvedFingerprint).not.toBe(repaired.initialFingerprint);
    expect(JSON.stringify(items.find(row => row.index === 2))).toContain('generated_');
    expect(JSON.stringify(items.find(row => row.index === 3))).toContain('consent_revoked');
    expect(JSON.stringify(items.find(row => row.index === 4))).toContain('credential_invalid');
    // The generated source has no retained copy, so it is read back from
    // LearnCard; that fixture fails the issuer check and stays blocked.
    expect(originalReads).toContain(source(3).uri);
    expect(originalReads).not.toContain(source(4).uri);
    const serialized = JSON.stringify({ plan, done, listed: await listRuns() });
    for (const secret of [
        owner,
        revoked,
        revision,
        sourceId(1),
        source(1).uri,
        sourceText,
        repaired.initialFingerprint,
        repaired.resolvedFingerprint,
    ])
        expect(serialized).not.toContain(secret);
});

test('an already-complete v2 source still checks current consent and reconciles without provider calls', async () => {
    coveredUris.add(source(1).uri);
    const { plan, run } = await plannedStart();
    expect(plan.recordLimit).toBe(1);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.written).toBe(0);
    expect(done.alreadyComplete).toBe(1);
    expect(done.reconciled).toBe(1);
    expectConservation(done);
    expect(consentChecks).toBeGreaterThan(0);
    expect(dispatches).toHaveLength(0);
});

test('missing originals become actionable blockers without consuming provider reservations', async () => {
    collection('credentials').rows = [legacySource(1)];
    unavailableOriginals.add(source(1).uri);
    const { run } = await plannedStart();
    const done = await settled(run._id);
    expect(done.state).toBe('completed_with_blockers');
    expect(done.blocked).toBe(1);
    expect(done.written).toBe(0);
    expect(done.reconciled).toBe(1);
    expectConservation(done);
    expect(JSON.stringify(itemStore().rows)).toContain('original_unavailable');
    expect(dispatches).toHaveLength(0);
    expect(repairsCommitted).toBe(0);
});

test.each([false, true])(
    'pause/cancel=%s during original retrieval prevents repair and provider work after draining',
    async cancel => {
        collection('credentials').rows = [legacySource(1)];
        const hold = gate();
        let entered = false;
        beforeOriginalRead = async () => {
            entered = true;
            await hold.promise;
        };
        const { run } = await plannedStart();
        await waitFor(() => entered);
        const stopped = await stopRun(run._id, cancel);
        expect(stopped.state).toBe(cancel ? 'cancelled' : 'paused');
        expect(stopped.draining).toBe(true);
        hold.release();
        const done = await settled(run._id);
        expect(done.state).toBe(cancel ? 'cancelled' : 'paused');
        expect(repairsCommitted).toBe(0);
        expect(dispatches).toHaveLength(0);
        expect(
            (
                await collection('credentials').findOne({
                    _id: new FixtureObjectId(sourceId(1)),
                })
            )?.verification
        ).toBeUndefined();
        expect(itemStore().rows[0]?.state).toBe('pending');
    }
);

test('crash after atomic repair resumes from the durable resolved source without another original repair', async () => {
    collection('credentials').rows = [legacySource(1)];
    afterRepairCommit = async () => {
        await runStore().updateOne(
            { _id: runStore().rows[0]!._id },
            { $set: { leaseUntil: new Date(0) } }
        );
        throw new Error('Synthetic process failure after successful repair transaction');
    };
    const { run } = await plannedStart();
    const interrupted = await settled(run._id);
    expect(interrupted.state).toBe('interrupted');
    expect(itemStore().rows[0]?.state).toBe('embedding_ready');
    expect(repairsCommitted).toBe(1);
    expect(dispatches).toHaveLength(0);
    const saved = copy(itemStore().rows[0]);
    afterRepairCommit = undefined;
    await resumeRun(run._id, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.written).toBe(1);
    expect(done.reconciled).toBe(1);
    expectConservation(done);
    expect(repairsCommitted).toBe(1);
    expect(itemStore().rows[0]?.resolvedFingerprint).toBe(saved.resolvedFingerprint);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
});

test('an uncertain provider response with complete vectors is reconciled on explicit resume without another paid attempt', async () => {
    let failed = false;
    afterEmbeddingWrite = async () => {
        if (!failed) {
            failed = true;
            throw new Error('Synthetic response lost after vector writes');
        }
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.lastFailure).toMatchObject({
        record: 1,
        stage: 'embedding',
        dispatchStatus: 'possibly_dispatched',
        requests: { generation: 1, embedding: 5, privacy: 3 },
    });
    const spent = requestCounts();
    expect(spent).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    await resumeRun(run._id, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.written + done.alreadyComplete).toBe(1);
    expect(done.reconciled).toBe(1);
    expectConservation(done);
    expect(requestCounts()).toEqual(spent);
    expect(done.lastFailure).toEqual(paused.lastFailure);
});

test('persisted v1 plans still execute through the legacy bounded snapshot path', async () => {
    const planId = await seedV1Plan();
    const run = await startRun(randomUUID(), planId, true, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.written).toBe(1);
    expect(done.processed).toBe(1);
    expect(itemStore().rows).toHaveLength(0);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
});

test('a paused persisted v1 run remains resumable without creating v2 workflow items', async () => {
    const hold = gate();
    let entered = false;
    beforeDispatch = async () => {
        entered = true;
        await hold.promise;
    };
    const planId = await seedV1Plan();
    const run = await startRun(randomUUID(), planId, true, guard);
    await waitFor(() => entered);
    await stopRun(run._id, false);
    hold.release();
    await settled(run._id);
    expect(itemStore().rows).toHaveLength(0);
    beforeDispatch = undefined;
    await resumeRun(run._id, guard);
    expect((await settled(run._id)).written).toBe(1);
    expect(itemStore().rows).toHaveLength(0);
});

async function retainedGeneratedSource(index = 1, changes: Document = {}) {
    const uri = source(index).uri;
    const original = {
        fixtureUri: uri,
        type: ['VerifiableCredential', 'AIInsightCredential'],
        issuer: appDid,
        credentialSubject: { id: owner },
        proof: { type: 'SyntheticProof' },
        ...changes,
    };
    const hash = originalHash(original);
    const row = legacySource(index, {
        source: 'generated',
        category: 'AIInsightCredential',
        rawContentHash: hash,
    });
    await collection('raw_credentials').insertOne({
        did: owner,
        uri,
        contentHash: hash,
        expiresAt: new Date(Date.now() + 60000),
        credential: original,
    });
    return row;
}
function generatedSibling(uri: string, hash: string, consentRevision = revision): Document {
    const now = new Date().toISOString();
    return {
        credentialUri: uri,
        contentHash: hash,
        status: 'valid',
        checkedAt: now,
        verifier: { name: 'Synthetic verifier', version: '1' },
        verifiedPayload: 'credential',
        checks: ['proof'],
        errors: [],
        warnings: [],
        provenance: { source: 'generated', retrievedAt: now },
        consent: {
            contractUri: 'urn:synthetic:contract',
            receiptId: 'synthetic-receipt',
            updatedAt: now,
            contractUpdatedAt: now,
            status: 'live',
            categories: ['AIInsightCredential'],
            credentialUris: [],
            personalFields: [],
            purpose: 'embedding',
            revision: consentRevision,
            guardian: { required: false, approved: false },
        },
    };
}

test.each(['explicit grant', 'matching retained receipt'])(
    'generated historical originals migrate under %s without generating replacement insights',
    async evidence => {
        const row = await retainedGeneratedSource();
        collection('credentials').rows = [row];
        if (evidence === 'matching retained receipt') {
            unsharedUris.add(row.uri);
            siblingVerifications.set(row.uri, generatedSibling(row.uri, row.rawContentHash));
        }
        const rawBefore = JSON.stringify(collection('raw_credentials').rows);
        const plan = await planRun(randomUUID());
        expect(retainedOriginalReads).toBe(0);
        expect(dispatches).toHaveLength(0);
        expect((await planStore().findOne({ _id: plan._id }))?.snapshot[0].originalHash).toBe(
            row.rawContentHash
        );
        const run = await startRun(randomUUID(), plan._id, true, guard);
        const done = await settled(run._id);
        expect(done.state).toBe('completed');
        expect(done.written).toBe(1);
        expect(done.repaired).toBe(1);
        expect(done.reconciled).toBe(1);
        expectConservation(done);
        expect(repairsCommitted).toBe(1);
        expect(retainedOriginalReads).toBe(4);
        expect(originalReads).toHaveLength(0);
        expect(verificationReads).toEqual([row.uri]);
        expect(requestCounts()).toEqual({
            generation: 1,
            embedding: 5,
            privacy: 3,
        });
        expect(JSON.stringify(collection('raw_credentials').rows)).toBe(rawBefore);
        expect(collection('credentials').rows[0]?.verification.provenance.source).toBe('generated');
        expect(JSON.stringify(done)).not.toContain(row.rawContentHash);
    }
);

test.each([
    ['missing', 'generated_consent_evidence_missing'],
    ['changed revision', 'generated_consent_evidence_changed'],
    ['changed hash', 'generated_consent_evidence_changed'],
] as const)(
    'generated %s consent evidence is blocked before verification or paid calls',
    async (mode, reason) => {
        const row = await retainedGeneratedSource();
        collection('credentials').rows = [row];
        unsharedUris.add(row.uri);
        if (mode !== 'missing')
            siblingVerifications.set(
                row.uri,
                generatedSibling(
                    row.uri,
                    mode === 'changed hash' ? 'a'.repeat(64) : row.rawContentHash,
                    mode === 'changed revision' ? 'previous-consent' : revision
                )
            );
        const { run } = await plannedStart();
        const done = await settled(run._id);
        expect(done.state).toBe('completed_with_blockers');
        expect(done.blockedReasons).toEqual({ [reason]: 1 });
        expect(done.reconciled).toBe(1);
        expectConservation(done);
        expect(repairsCommitted).toBe(0);
        expect(verificationReads).toHaveLength(0);
        expect(dispatches).toHaveLength(0);
    }
);

test.each(['absent', 'expired'])(
    'generated %s retained originals stay blocked when LearnCard cannot return the original, and retention is never extended',
    async mode => {
        const row = await retainedGeneratedSource();
        collection('credentials').rows = [row];
        if (mode === 'absent') collection('raw_credentials').rows = [];
        else collection('raw_credentials').rows[0]!.expiresAt = new Date(0);
        unavailableOriginals.add(row.uri);
        const rawBefore = JSON.stringify(collection('raw_credentials').rows);
        const { run } = await plannedStart();
        const done = await settled(run._id);
        expect(done.state).toBe('completed_with_blockers');
        expect(done.blockedReasons).toEqual({ generated_original_unavailable: 1 });
        expectConservation(done);
        expect(originalReads).toEqual([row.uri]);
        expect(dispatches).toHaveLength(0);
        expect(repairsCommitted).toBe(0);
        expect(JSON.stringify(collection('raw_credentials').rows)).toBe(rawBefore);
    }
);

test.each(['absent', 'expired'])(
    'generated %s retained originals are migrated from the LearnCard original without reissuing or extending retention',
    async mode => {
        const row = await retainedGeneratedSource();
        const original = copy(collection('raw_credentials').rows[0]!.credential);
        collection('credentials').rows = [row];
        if (mode === 'absent') collection('raw_credentials').rows = [];
        else collection('raw_credentials').rows[0]!.expiresAt = new Date(0);
        learnCardOriginals.set(row.uri, original);
        const rawBefore = JSON.stringify(collection('raw_credentials').rows);
        const { run } = await plannedStart();
        const done = await settled(run._id);
        expect(done.state).toBe('completed');
        expect(done.blockedReasons ?? {}).toEqual({});
        expectConservation(done);
        expect(originalReads).toEqual([row.uri]);
        expect(verificationReads).toEqual([row.uri]);
        expect(repairsCommitted).toBe(1);
        expect(collection('credentials').rows[0]?.verification.provenance.source).toBe('generated');
        expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
        expect(JSON.stringify(collection('raw_credentials').rows)).toBe(rawBefore);
    }
);

test.each([
    ['a different payload', { tampered: true }, 'generated_original_integrity'],
    ['another issuer', { issuer: 'did:web:synthetic:other' }, 'generated_issuer_mismatch'],
    ['a non-insight type', { type: ['VerifiableCredential'] }, 'generated_type_mismatch'],
] as const)(
    'a LearnCard original with %s is blocked before any paid call',
    async (_label, change, reason) => {
        const row = await retainedGeneratedSource();
        const original = copy(collection('raw_credentials').rows[0]!.credential);
        collection('credentials').rows = [row];
        collection('raw_credentials').rows = [];
        learnCardOriginals.set(row.uri, { ...original, ...change });
        const { run } = await plannedStart();
        const done = await settled(run._id);
        expect(done.state).toBe('completed_with_blockers');
        expect(done.blockedReasons).toEqual({ [reason]: 1 });
        expectConservation(done);
        expect(repairsCommitted).toBe(0);
        expect(dispatches).toHaveLength(0);
    }
);

test('the LearnCard fallback still needs current consent evidence for an unshared insight', async () => {
    const row = await retainedGeneratedSource();
    const original = copy(collection('raw_credentials').rows[0]!.credential);
    collection('credentials').rows = [row];
    collection('raw_credentials').rows = [];
    learnCardOriginals.set(row.uri, original);
    unsharedUris.add(row.uri);
    const { run } = await plannedStart();
    const done = await settled(run._id);
    expect(done.blockedReasons).toEqual({
        generated_consent_evidence_missing: 1,
    });
    expect(verificationReads).toHaveLength(0);
    expect(dispatches).toHaveLength(0);
});

test('planning pins a unique retained generated original hash from metadata when the historical row lacks it', async () => {
    const row = await retainedGeneratedSource();
    const hash = row.rawContentHash;
    delete row.rawContentHash;
    collection('credentials').rows = [row];
    const plan = await planRun(randomUUID());
    expect((await planStore().findOne({ _id: plan._id }))?.snapshot[0].originalHash).toBe(hash);
    expect(retainedOriginalReads).toBe(0);
    for (const read of collection('raw_credentials').reads)
        expect(read.options.projection).toEqual({ _id: 0, contentHash: 1 });
    const run = await startRun(randomUUID(), plan._id, true, guard);
    expect((await settled(run._id)).state).toBe('completed');
});

test('replacing a drained owned v1 run requires its exact ID and preserves every old reservation', async () => {
    const priorPlan = await seedV1Plan();
    afterDispatch = async () => {
        await stopRun(runStore().rows[0]!._id, false);
    };
    const prior = await startRun(randomUUID(), priorPlan, true, guard);
    const paused = await settled(prior._id);
    expect(paused.state).toBe('paused');
    expect(paused.privacyRequests).toBe(1);
    afterDispatch = undefined;
    const oldBefore = await rawRun(prior._id);
    const plan = await planRun(randomUUID());
    await expect(startRun(randomUUID(), plan._id, true, guard)).rejects.toThrow(
        'global runner slot'
    );
    await expect(
        startRun(randomUUID(), plan._id, true, guard, operatorDid, randomUUID())
    ).rejects.toThrow();
    expect((await rawRun(prior._id))?.state).toBe('paused');
    const next = await startRun(randomUUID(), plan._id, true, guard, operatorDid, prior._id);
    const done = await settled(next._id);
    expect(done.state).toBe('completed');
    expect(done.workflowVersion).toBe(2);
    expectConservation(done);
    const oldAfter = await rawRun(prior._id);
    expect(oldAfter?.state).toBe('cancelled');
    expect(oldAfter?.occupied).toBe(false);
    for (const field of ['generationRequests', 'embeddingRequests', 'privacyRequests'])
        expect(oldAfter?.[field]).toBe(oldBefore?.[field]);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 4 });
});

test('v1 replacement cannot seize a still-draining unit or another principal’s owned run', async () => {
    const hold = gate();
    let entered = false;
    beforeDispatch = async () => {
        entered = true;
        await hold.promise;
    };
    const prior = await startRun(randomUUID(), await seedV1Plan(), true, guard);
    await waitFor(() => entered);
    await stopRun(prior._id, false);
    const plan = await planRun(randomUUID());
    await expect(
        startRun(randomUUID(), plan._id, true, guard, operatorDid, prior._id)
    ).rejects.toThrow();
    expect((await rawRun(prior._id))?.state).toBe('paused');
    expect((await rawRun(prior._id))?.occupied).toBe(true);
    hold.release();
    await settled(prior._id);
    beforeDispatch = undefined;
    const foreign = 'did:example:unrelated-service-principal';
    const foreignPlan = await planRun(randomUUID(), foreign);
    await expect(
        startRun(randomUUID(), foreignPlan._id, true, guard, foreign, prior._id)
    ).rejects.toThrow();
    expect((await rawRun(prior._id))?.state).toBe('paused');
    expect(dispatches).toHaveLength(0);
});

test('category-only generated history is normalized only after the retained original is verified', async () => {
    const row = await retainedGeneratedSource();
    delete row.source;
    collection('credentials').rows = [row];
    unsharedUris.add(row.uri);
    siblingVerifications.set(row.uri, generatedSibling(row.uri, row.rawContentHash));
    const plan = await planRun(randomUUID());
    expect(collection('credentials').rows[0]?.source).toBeUndefined();
    const run = await startRun(randomUUID(), plan._id, true, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.written).toBe(1);
    expect(done.repaired).toBe(1);
    expect(collection('credentials').rows[0]?.source).toBe('generated');
    expectConservation(done);
});

test('pause after proof verification but before the repair commit prevents metadata mutation', async () => {
    collection('credentials').rows = [legacySource(1)];
    beforeRepairCommit = async () => {
        await stopRun(runStore().rows[0]!._id, false);
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(verificationReads).toHaveLength(1);
    expect(repairsCommitted).toBe(0);
    expect(itemStore().rows[0]?.state).toBe('pending');
    expect(collection('credentials').rows[0]?.verification).toBeUndefined();
    expect(dispatches).toHaveLength(0);
    beforeRepairCommit = undefined;
    await resumeRun(run._id, guard);
    expect((await settled(run._id)).written).toBe(1);
});

test('final reconciliation converts incomplete writes to blockers without inflating progress or rebilling', async () => {
    afterEmbeddingWrite = async () => {
        coveredUris.clear();
    };
    const { run } = await plannedStart();
    const done = await settled(run._id);
    expect(done.state).toBe('completed_with_blockers');
    expect(done.written).toBe(0);
    expect(done.blocked).toBe(1);
    expect(done.reconciled).toBe(1);
    expect(done.blockedReasons).toEqual({
        embedding_reconciliation_incomplete: 1,
    });
    expectConservation(done);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
});

test.each(['sibling changed', 'sibling removed', 'original unavailable'] as const)(
    'generated %s between verification and the final transactional recheck blocks migration',
    async change => {
        const row = await retainedGeneratedSource();
        collection('credentials').rows = [row];
        unsharedUris.add(row.uri);
        siblingVerifications.set(row.uri, generatedSibling(row.uri, row.rawContentHash));
        beforeRepairCommit = async () => {
            if (change === 'sibling changed')
                siblingVerifications.set(
                    row.uri,
                    generatedSibling(row.uri, row.rawContentHash, 'changed-after-verification')
                );
            else if (change === 'sibling removed') siblingVerifications.delete(row.uri);
            else collection('raw_credentials').rows = [];
        };
        const { run } = await plannedStart();
        const done = await settled(run._id);
        const reason =
            change === 'original unavailable'
                ? 'generated_original_unavailable'
                : 'generated_consent_evidence_changed';
        expect(done.state).toBe('completed_with_blockers');
        expect(done.blockedReasons).toEqual({ [reason]: 1 });
        expect(done.reconciled).toBe(1);
        expectConservation(done);
        expect(verificationReads).toHaveLength(1);
        expect(repairsCommitted).toBe(0);
        expect(collection('credentials').rows[0]?.verification).toBeUndefined();
        expect(dispatches).toHaveLength(0);
    }
);

test.each(['revoked', 'revision changed'] as const)(
    'consent %s while final reconciliation awaits Qdrant reclassifies the source as blocked',
    async change => {
        const hold = gate();
        let entered = false;
        beforeCoverageReturn = async () => {
            if (runStore().rows[0]?.stage === 'reconciliation') {
                entered = true;
                await hold.promise;
            }
        };
        const { run } = await plannedStart();
        await waitFor(() => entered);
        const spent = requestCounts();
        if (change === 'revoked') revokedOwners.add(owner);
        else currentConsentRevision = 'changed-while-coverage-pending';
        hold.release();
        const done = await settled(run._id);
        expect(done.state).toBe('completed_with_blockers');
        expect(done.written).toBe(0);
        expect(done.blocked).toBe(1);
        expect(done.reconciled).toBe(1);
        expect(done.blockedReasons).toEqual({
            [change === 'revoked' ? 'consent_revoked' : 'consent_revision_changed']: 1,
        });
        expectConservation(done);
        expect(requestCounts()).toEqual(spent);
    }
);

test('a new v1 plan cannot replace an older paused v1 run even with its exact ID', async () => {
    const priorPlan = await seedV1Plan();
    afterDispatch = async () => {
        await stopRun(runStore().rows[0]!._id, false);
    };
    const prior = await startRun(randomUUID(), priorPlan, true, guard);
    await settled(prior._id);
    afterDispatch = undefined;
    const before = await rawRun(prior._id);
    const invalidReplacement = await seedV1Plan();
    await expect(
        startRun(randomUUID(), invalidReplacement, true, guard, operatorDid, prior._id)
    ).rejects.toThrow('Only a whole-workflow plan');
    expect(await rawRun(prior._id)).toEqual(before);
    expect(runStore().rows).toHaveLength(1);
    expect(requestCounts()).toEqual({ generation: 0, embedding: 0, privacy: 1 });
});

async function validOversizedSource(index: number) {
    const { ModelSafeCredentialProjectionValidator, CredentialVerificationMetadataValidator } =
        await import('@learncard/types');
    const projection = ModelSafeCredentialProjectionValidator.parse({
        schemaVersion: '1',
        category: 'Synthetic verified credential',
        credentialTypes: ['VerifiableCredential'],
        facts: Array.from({ length: 100 }, (_, fact) => ({
            kind: 'skill',
            value: `Synthetic skill ${fact} ${'detail '.repeat(40)}`.slice(0, 240),
        })),
    });
    const template = source(index);
    const verification = CredentialVerificationMetadataValidator.parse({
        ...generatedSibling(template.uri, template.verification.contentHash),
        provenance: { source: 'wallet', retrievedAt: new Date().toISOString() },
    });
    expect(Buffer.byteLength(JSON.stringify(projection))).toBeGreaterThan(16384);
    return source(index, { projection, verification });
}

test('v2 blocks a valid projection above the unchanged input byte cap before dispatch and continues the next source', async () => {
    collection('credentials').rows = [await validOversizedSource(1), source(2)];
    const { run } = await plannedStart();
    const done = await settled(run._id);
    expect(done.state).toBe('completed_with_blockers');
    expect(done.blockedReasons).toEqual({ representation_input_too_large: 1 });
    expect(done.recordLimit).toBe(2);
    expect(done.processed).toBe(2);
    expect(done.written).toBe(1);
    expect(done.blocked).toBe(1);
    expect(done.reconciled).toBe(2);
    expectConservation(done);
    expect(generationInputs).toEqual([JSON.stringify(source(2).projection)]);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    expect(done.generationRequests).toBe(1);
    expect(done.embeddingRequests).toBe(5);
    expect(done.privacyRequests).toBe(3);
    const first = itemStore().rows.find(item => item.runId === run._id && item.index === 0)!;
    const second = itemStore().rows.find(item => item.runId === run._id && item.index === 1)!;
    expect(first.state).toBe('blocked');
    expect(first.reason).toBe('representation_input_too_large');
    expect(second.state).toBe('written');
    const job = await jobStore().findOne({ _id: run._id });
    expect(job?.snapshotIndex).toBe(2);
    expect(job?.representationCalls).toBe(1);
    expect(job?.embeddingRequests).toBe(5);
    expect(job?.errors).toBe(0);
});

test('a paid provider failure with the input-budget error text still pauses and preserves its cursor', async () => {
    collection('credentials').rows = [source(1), source(2)];
    afterDispatch = async kind => {
        if (kind === 'generation') throw new Error('representation_input_exceeds_budget');
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.reason).toContain('Provider requests may have been attempted');
    expect(paused.lastFailure).toMatchObject({
        record: 1,
        stage: 'generation',
        code: 'record_failed',
        dispatchStatus: 'possibly_dispatched',
        requests: { generation: 1, embedding: 0, privacy: 3 },
    });
    expect(JSON.stringify(paused.lastFailure)).not.toContain('representation_input_exceeds_budget');
    expect(paused.processed).toBe(0);
    expect(paused.written).toBe(0);
    expect(paused.blocked).toBe(0);
    expect(paused.blockedReasons).toEqual({});
    expectConservation(paused);
    expect(generationInputs).toEqual([JSON.stringify(source(1).projection)]);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 0, privacy: 3 });
    expect((await jobStore().findOne({ _id: run._id }))?.snapshotIndex).toBe(0);
    expect(itemStore().rows.find(item => item.runId === run._id && item.index === 0)?.state).toBe(
        'embedding_ready'
    );
    expect(itemStore().rows.find(item => item.runId === run._id && item.index === 1)?.state).toBe(
        'pending'
    );
});

test('an oversized projection in a persisted v1 plan retains the legacy pause without any dispatch', async () => {
    collection('credentials').rows = [await validOversizedSource(1)];
    const run = await startRun(randomUUID(), await seedV1Plan(), true, guard);
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.processed).toBe(0);
    expect(paused.written).toBe(0);
    expect(dispatches).toHaveLength(0);
    expect(generationInputs).toHaveLength(0);
    expect((await jobStore().findOne({ _id: run._id }))?.snapshotIndex).toBe(0);
});

test('v2 accepts a valid projection at exactly 16384 UTF-8 bytes without changing the cap', async () => {
    const { ModelSafeCredentialProjectionValidator } = await import('@learncard/types');
    const row = await validOversizedSource(1);
    const projection = {
        schemaVersion: '1' as const,
        category: 'Synthetic verified credential',
        credentialTypes: ['VerifiableCredential'],
        facts: [] as { kind: 'skill'; value: string }[],
    };
    while (Buffer.byteLength(JSON.stringify(projection)) < 16384)
        projection.facts.push({
            kind: 'skill',
            value: 'detail '.repeat(40).slice(0, 240),
        });
    const extra = Buffer.byteLength(JSON.stringify(projection)) - 16384;
    const last = projection.facts.at(-1)!;
    last.value = last.value.slice(0, last.value.length - extra);
    row.projection = ModelSafeCredentialProjectionValidator.parse(projection);
    expect(Buffer.byteLength(JSON.stringify(row.projection))).toBe(16384);
    collection('credentials').rows = [row];
    const { run } = await plannedStart();
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.written).toBe(1);
    expect(done.blocked).toBe(0);
    expectConservation(done);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
});

test('v2 input limits count UTF-8 bytes even when the projection has fewer than 16384 characters', async () => {
    const { ModelSafeCredentialProjectionValidator } = await import('@learncard/types');
    const row = await validOversizedSource(1);
    row.projection = ModelSafeCredentialProjectionValidator.parse({
        schemaVersion: '1',
        category: 'Synthetic',
        credentialTypes: ['VerifiableCredential'],
        facts: Array.from({ length: 40 }, () => ({
            kind: 'skill',
            value: 'é'.repeat(240),
        })),
    });
    const serialized = JSON.stringify(row.projection);
    expect(serialized.length).toBeLessThan(16384);
    expect(Buffer.byteLength(serialized)).toBeGreaterThan(16384);
    collection('credentials').rows = [row];
    const { run } = await plannedStart();
    const done = await settled(run._id);
    expect(done.state).toBe('completed_with_blockers');
    expect(done.blockedReasons).toEqual({ representation_input_too_large: 1 });
    expect(done.processed).toBe(1);
    expect(done.blocked).toBe(1);
    expectConservation(done);
    expect(dispatches).toHaveLength(0);
    expect(generationInputs).toHaveLength(0);
});

test('explicit resume recovers an existing v2 job paused on oversized input without refunding or repeating its cursor', async () => {
    collection('credentials').rows = [await validOversizedSource(1), source(2)];
    const hold = gate();
    let entered = false;
    beforeCoverageReturn = async () => {
        if (runStore().rows[0]?.stage === 'embedding') {
            entered = true;
            await hold.promise;
        }
    };
    const { run } = await plannedStart();
    await waitFor(() => entered);
    await stopRun(run._id, false);
    hold.release();
    await settled(run._id);
    beforeCoverageReturn = undefined;
    // Reproduce the durable state from the former pre-dispatch error path.
    await jobStore().updateOne(
        { _id: run._id },
        {
            $set: {
                state: 'paused',
                errors: 1,
                scanned: 1,
                snapshotIndex: 0,
                lastError: 'record_failed_or_budget_exhausted_cursor_preserved',
                representationCalls: 0,
                embeddingRequests: 0,
            },
        }
    );
    await itemStore().updateOne(
        { _id: `${run._id}:0` },
        {
            $set: {
                attemptBaseline: { written: 0, skipped: 0, errors: 0, skipReasons: {} },
            },
        }
    );
    await runStore().updateOne(
        { _id: run._id },
        {
            $set: {
                reason: 'Record failed or result uncertain; inspect progress before explicit resume',
            },
        }
    );
    expect(itemStore().rows.find(item => item._id === `${run._id}:0`)?.state).toBe(
        'embedding_ready'
    );
    expect(requestCounts()).toEqual({ generation: 0, embedding: 0, privacy: 0 });
    await resumeRun(run._id, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed_with_blockers');
    expect(done.blockedReasons).toEqual({ representation_input_too_large: 1 });
    expect(done.processed).toBe(2);
    expect(done.written).toBe(1);
    expect(done.blocked).toBe(1);
    expect(done.reconciled).toBe(2);
    expectConservation(done);
    expect(generationInputs).toEqual([JSON.stringify(source(2).projection)]);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    const job = await jobStore().findOne({ _id: run._id });
    expect(job?.snapshotIndex).toBe(2);
    expect(job?.errors).toBe(1);
    expect(job?.representationCalls).toBe(1);
    expect(job?.embeddingRequests).toBe(5);
});

test('predispatch diagnostics retain the failed record ordinal and survive explicit resume without resetting budgets', async () => {
    collection('credentials').rows = [source(1), source(2)];
    const secret = `${owner} ${source(2).uri} ${sourceText}`;
    beforeCoverageReturn = async () => {
        if (runStore().rows[0]?.processed === 1 && jobStore().rows[0]?.state === 'running')
            throw new Error(secret, { cause: { payload: secret } });
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.processed).toBe(1);
    expect(paused.lastFailure).toMatchObject({
        version: 1,
        record: 2,
        stage: 'coverage',
        code: 'record_failed',
        dispatchStatus: 'not_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 0 },
    });
    expect(paused.reason).toContain('Record 2 paused at coverage');
    expect(paused.reason).toContain('No provider request started in this attempt');
    const failure = paused.lastFailure!;
    expect((await jobStore().findOne({ _id: run._id }))?.lastFailure).toEqual(failure);
    expect(JSON.stringify(failure)).not.toContain(secret);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    expectConservation(paused);
    await listRuns();
    await listRuns();
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    beforeCoverageReturn = undefined;
    const hold = gate();
    let entered = false;
    beforeDispatch = async () => {
        entered = true;
        await hold.promise;
    };
    await resumeRun(run._id, guard);
    await waitFor(() => entered);
    const resumed = (await listRuns()).find(value => value._id === run._id)!;
    expect(resumed.state).toBe('running');
    expect(resumed.reason).toBeUndefined();
    expect(resumed.lastFailure).toEqual(failure);
    expect(resumed.generationRequests).toBe(paused.generationRequests);
    expect(resumed.embeddingRequests).toBe(paused.embeddingRequests);
    expect(resumed.privacyRequests).toBe(paused.privacyRequests);
    expect(resumed.maxGenerationRequests).toBe(paused.maxGenerationRequests);
    expect(resumed.maxEmbeddingRequests).toBe(paused.maxEmbeddingRequests);
    expect(resumed.maxPrivacyRequests).toBe(paused.maxPrivacyRequests);
    beforeDispatch = undefined;
    hold.release();
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.processed).toBe(2);
    expect(done.written).toBe(2);
    expect(done.lastFailure).toEqual(failure);
    expect(done.reason).not.toContain('paused');
    expect(done.reason).not.toBe(paused.reason);
    expect((await jobStore().findOne({ _id: run._id }))?.lastFailure).toEqual(failure);
    expect(requestCounts()).toEqual({ generation: 2, embedding: 10, privacy: 6 });
    expectConservation(done);
});

test('pipeline entry with no observed request still records possible dispatch and never replays on GET', async () => {
    beforeDispatch = async () => {
        throw new Error('Synthetic pipeline failure before metering');
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.lastFailure).toMatchObject({
        record: 1,
        stage: 'generation',
        code: 'record_failed',
        dispatchStatus: 'possibly_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 0 },
    });
    expect(paused.reason).toContain('Provider requests may have been attempted');
    expect(requestCounts()).toEqual({ generation: 0, embedding: 0, privacy: 0 });
    expect(generationInputs).toHaveLength(1);
    await listRuns();
    await listRuns();
    expect(generationInputs).toHaveLength(1);
    expect((await jobStore().findOne({ _id: run._id }))?.snapshotIndex).toBe(0);
    expect((await jobStore().findOne({ _id: run._id }))?.usage).toBeUndefined();
});

test.each(['provider', 'privacy'] as const)(
    'managed %s failures expose only durable allowlisted metadata without source identifiers',
    async kind => {
        const secret = `${owner} ${source(1).uri} ${sourceText}`;
        const { markProviderFailure } = await import('../ai/provider-diagnostics');
        const { markPrivacyFailure, withPrivacyInputOrigin } =
            await import('../ai/privacy-diagnostics');
        const provider = markProviderFailure(new Error(secret), {
            providerOperation: 'response_validation',
            providerFailureReason: 'response_shape',
            providerStatus: 502,
        });
        const privacy = withPrivacyInputOrigin('source_cohort', () =>
            markPrivacyFailure(
                new Error(secret),
                'guardrail_request',
                Object.assign(new Error(secret), {
                    name: 'ThrottlingException',
                    $metadata: { httpStatusCode: 429, requestId: secret },
                })
            )
        );
        afterDispatch = async dispatched => {
            if (dispatched === (kind === 'provider' ? 'generation' : 'privacy'))
                throw kind === 'provider' ? provider : privacy;
        };
        const { run } = await plannedStart();
        const paused = await settled(run._id);
        expect(paused.state).toBe('paused');
        expect(paused.lastFailure).toMatchObject({
            stage: 'generation',
            record: 1,
            dispatchStatus: 'possibly_dispatched',
            ...(kind === 'provider'
                ? {
                      providerOperation: 'response_validation',
                      providerFailureReason: 'response_shape',
                      providerStatus: 502,
                      requests: { generation: 1, embedding: 0, privacy: 3 },
                  }
                : {
                      code: 'privacy_failed',
                      privacyOperation: 'guardrail_request',
                      privacyCategory: 'throttled',
                      privacyStatus: 429,
                      privacyInputOrigin: 'source_cohort',
                      requests: { generation: 0, embedding: 0, privacy: 1 },
                  }),
        });
        expect((await jobStore().findOne({ _id: run._id }))?.lastFailure).toEqual(
            paused.lastFailure
        );
        const exposed = JSON.stringify({ paused, listing: await listRuns() });
        for (const value of [owner, source(1).uri, sourceText, source(1).verification.contentHash])
            expect(exposed).not.toContain(value);
        expect(paused.lastFailure).not.toHaveProperty('message');
        expect(paused.lastFailure).not.toHaveProperty('cause');
        expect(paused.lastFailure).not.toHaveProperty('stack');
        expect(paused.lastFailure).not.toHaveProperty('requestId');
        expect(paused.processed).toBe(0);
        expectConservation(paused);
    }
);

async function legacyBsonPausedRun() {
    beforeCoverageReturn = async () => {
        if (jobStore().rows[0]?.state === 'running')
            throw new Error('Synthetic coverage failure without dispatch');
    };
    const { run } = await plannedStart();
    await settled(run._id);
    beforeCoverageReturn = undefined;
    const { GENERIC_BACKFILL_PAUSE_REASON } = await import('./backfill-diagnostics');
    const storedRun = (await rawRun(run._id))!;
    const storedJob = (await jobStore().findOne({ _id: run._id }))!;
    const at = Date.now() - 3000;
    storedRun.reason = GENERIC_BACKFILL_PAUSE_REASON;
    storedRun.updatedAt = new Date(at + 2000);
    storedJob.updatedAt = new Date(at + 1000);
    storedJob.lastFailure = {
        ...storedJob.lastFailure,
        at: new Date(at).toISOString(),
        providerOperation: undefined,
        providerFailureReason: undefined,
        providerStatus: undefined,
        privacyOperation: undefined,
        privacyCategory: undefined,
        privacyStatus: undefined,
        privacyInputOrigin: undefined,
        privacyLanguageReason: undefined,
    };
    // Real BSON serialization with the Mongo driver's default, without a connection.
    runStore().rows = [deserialize(serialize(storedRun, { ignoreUndefined: false }))];
    jobStore().rows = [deserialize(serialize(storedJob, { ignoreUndefined: false }))];
    expect(jobStore().rows[0]?.lastFailure.providerOperation).toBeNull();
    expect(jobStore().rows[0]?.lastFailure.privacyLanguageReason).toBeNull();
    return { id: run._id, genericReason: GENERIC_BACKFILL_PAUSE_REASON };
}

test('the run GET projection recovers a legacy BSON-null diagnostic without writes or provider work', async () => {
    const { id, genericReason } = await legacyBsonPausedRun();
    const beforeRun = copy(runStore().rows);
    const beforeJob = copy(jobStore().rows);
    const beforeSources = copy(collection('credentials').rows);
    const beforeReads = reviewReads;
    const first = (await listRuns()).find(run => run._id === id)!;
    const second = (await listRuns()).find(run => run._id === id)!;
    expect(first.state).toBe('paused');
    expect(first.reason).toContain('Record 1 paused at coverage');
    expect(first.reason).toContain('No provider request started in this attempt');
    expect(first.reason).not.toBe(genericReason);
    expect(first.lastFailure).toMatchObject({
        record: 1,
        stage: 'coverage',
        code: 'record_failed',
        dispatchStatus: 'not_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 0 },
    });
    expect(first.lastFailure).not.toHaveProperty('providerOperation');
    expect(first.lastFailure).not.toHaveProperty('privacyLanguageReason');
    expect(second).toEqual(first);
    expect(runStore().rows).toEqual(beforeRun);
    expect(jobStore().rows).toEqual(beforeJob);
    expect(collection('credentials').rows).toEqual(beforeSources);
    expect(reviewReads).toBe(beforeReads);
    expect(requestCounts()).toEqual({ generation: 0, embedding: 0, privacy: 0 });
    expect(generationInputs).toHaveLength(0);
    for (const value of [owner, source(1).uri, sourceText, source(1).verification.contentHash])
        expect(JSON.stringify(first)).not.toContain(value);
});

const legacyRecoveryRejections: [string, (run: Document, job: Document) => void][] = [
    [
        'active run',
        run => {
            run.state = 'running';
            run.leaseUntil = new Date(Date.now() + 60000);
        },
    ],
    [
        'resumed run',
        run => {
            run.state = 'running';
            run.leaseUntil = new Date(Date.now() + 60000);
            delete run.reason;
        },
    ],
    [
        'completed run',
        run => {
            run.state = 'completed';
        },
    ],
    [
        'completed run with blockers',
        run => {
            run.state = 'completed_with_blockers';
        },
    ],
    [
        'cancelled run',
        run => {
            run.state = 'cancelled';
        },
    ],
    [
        'manual pause',
        run => {
            run.reason = 'Paused by operator';
        },
    ],
    [
        'unrelated authorization pause',
        run => {
            run.reason = 'Authorization expired, revoked or unavailable; fresh login required';
        },
    ],
    [
        'nonexact generic reason',
        run => {
            run.reason += ' ';
        },
    ],
    [
        'v1 run',
        run => {
            delete run.workflowVersion;
        },
    ],
    [
        'draining run',
        run => {
            run.leaseUntil = new Date(Date.now() + 60000);
        },
    ],
    [
        'draining job',
        (_run, job) => {
            job.leaseUntil = new Date(Date.now() + 60000);
        },
    ],
    [
        'nonpaused job',
        (_run, job) => {
            job.state = 'completed';
        },
    ],
    [
        'foreign managed job',
        (_run, job) => {
            job.managedRunId = randomUUID();
        },
    ],
    [
        'different current error',
        (_run, job) => {
            job.lastError = 'snapshot_source_changed';
        },
    ],
    [
        'no current error',
        (_run, job) => {
            delete job.lastError;
        },
    ],
    [
        'no recorded errors',
        (_run, job) => {
            job.errors = 0;
        },
    ],
    [
        'advanced job cursor',
        (_run, job) => {
            job.snapshotIndex = 1;
        },
    ],
    [
        'advanced run cursor',
        run => {
            run.processed = 1;
        },
    ],
    [
        'different failure ordinal',
        (_run, job) => {
            job.lastFailure.record = 2;
        },
    ],
    [
        'failure newer than checkpoint',
        (_run, job) => {
            job.lastFailure.at = new Date(job.updatedAt.getTime() + 1).toISOString();
        },
    ],
    [
        'job newer than run checkpoint',
        (run, job) => {
            job.updatedAt = new Date(run.updatedAt.getTime() + 1);
        },
    ],
    [
        'invalid required diagnostic value',
        (_run, job) => {
            job.lastFailure.stage = null;
        },
    ],
];

test.each(legacyRecoveryRejections)(
    'legacy reason recovery cannot relabel a %s',
    async (_name, change) => {
        const { id } = await legacyBsonPausedRun();
        change(runStore().rows[0]!, jobStore().rows[0]!);
        const beforeRun = copy(runStore().rows);
        const beforeJob = copy(jobStore().rows);
        const observed = (await listRuns()).find(run => run._id === id)!;
        expect(observed.reason).toBe(beforeRun[0]?.reason);
        expect(runStore().rows).toEqual(beforeRun);
        expect(jobStore().rows).toEqual(beforeJob);
        expect(requestCounts()).toEqual({
            generation: 0,
            embedding: 0,
            privacy: 0,
        });
        expect(generationInputs).toHaveLength(0);
    }
);

async function generationHttpError(status = 500) {
    const { AiProviderError } = await import('../ai/errors');
    const { markProviderFailure } = await import('../ai/provider-diagnostics');
    return new AiProviderError({
        code: 'ai_provider_unavailable',
        provider: 'bedrock',
        retryable: true,
        httpStatus: 503,
        cause: markProviderFailure(new Error('Synthetic provider HTTP failure'), {
            providerOperation: 'request',
            providerFailureReason: 'request_failed',
            providerStatus: status,
        }),
    });
}
function retryInventory(count = 8) {
    collection('credentials').rows = Array.from({ length: count }, (_, index) => source(index + 1));
    for (let index = 2; index <= count; index += 1) coveredUris.add(source(index).uri);
}
async function retryPlannedStart(
    principal = guard,
    policy: 'http5xx-v1' | 'transient-v2' = 'http5xx-v1'
) {
    const plan = await planRun(randomUUID());
    const run = await startRun(
        randomUUID(),
        plan._id,
        true,
        principal,
        operatorDid,
        undefined,
        policy
    );
    return { plan, run };
}

test.each([500, 502, 503])(
    'approved generation HTTP %i retries once within unchanged caps and records failed usage',
    async status => {
        retryInventory();
        const failure = await generationHttpError(status);
        afterDispatch = async kind => {
            if (kind === 'generation' && requestCounts().generation === 1) throw failure;
        };
        const { run } = await retryPlannedStart();
        const done = await settled(run._id);
        expect(done.state).toBe('completed');
        expect(done.processed).toBe(8);
        expect(done.written).toBe(1);
        expect(done.alreadyComplete).toBe(7);
        expectConservation(done);
        expect(requestCounts()).toEqual({
            generation: 2,
            embedding: 5,
            privacy: 6,
        });
        expect(done.maxGenerationRequests).toBe(8);
        expect(done.maxEmbeddingRequests).toBe(40);
        expect(done.maxPrivacyRequests).toBe(24);
        expect(itemStore().rows.find(item => item._id === `${run._id}:0`)?.autoRetries).toBe(1);
        expect(retrySleeps.reduce((sum, delay) => sum + delay, 0)).toBeGreaterThan(29000);
        const job = await jobStore().findOne({ _id: run._id });
        expect(job?.errors).toBe(1);
        expect(job?.usage.attempts).toBe(2);
        expect(job?.usage.failedAttempts).toBe(1);
        expect(job?.usage.totals.generation.requests).toBe(2);
        expect(job?.usage.totals.generation.measuredRequests).toBe(1);
    }
);

test('approved retries stop after exactly three durable delays and explicit resume does not reset the lifetime count', async () => {
    retryInventory();
    const failure = await generationHttpError();
    afterDispatch = async kind => {
        if (kind === 'generation') throw failure;
    };
    const observed = new Map<number, Document>();
    beforeRetrySleep = async () => {
        const current = (await listRuns())[0]!;
        if (current.retry && !observed.has(current.retry.attempt)) {
            observed.set(current.retry.attempt, copy(current.retry));
            const remaining =
                new Date(current.retry.nextAttemptAt).getTime() - Date.now() - retryTimeOffset;
            expect(remaining).toBeGreaterThan(
                [30000, 120000, 300000][current.retry.attempt - 1]! - 1000
            );
            expect(current.retry.maxAttempts).toBe(3);
            expect(current.retry.record).toBe(1);
        }
    };
    const { run } = await retryPlannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.processed).toBe(0);
    expect(paused.written).toBe(0);
    expect(requestCounts()).toEqual({ generation: 4, embedding: 0, privacy: 12 });
    expect(paused.reason).toBe(
        'Automatic generation retry limit reached; run paused without advancing this record'
    );
    expect([...observed.keys()]).toEqual([1, 2, 3]);
    expect(retrySleeps.reduce((sum, delay) => sum + delay, 0)).toBeGreaterThan(447000);
    expect(itemStore().rows[0]?.autoRetries).toBe(3);
    expect((await jobStore().findOne({ _id: run._id }))?.snapshotIndex).toBe(0);
    await listRuns();
    expect(requestCounts().generation).toBe(4);
    const sleeps = retrySleeps.length;
    await resumeRun(run._id, guard, operatorDid, 'http5xx-v1');
    const again = await settled(run._id);
    expect(again.state).toBe('paused');
    expect(requestCounts()).toEqual({ generation: 5, embedding: 0, privacy: 15 });
    expect(again.reason).toBe(paused.reason);
    expect(itemStore().rows[0]?.autoRetries).toBe(3);
    expect(retrySleeps).toHaveLength(sleeps);
    expect((await jobStore().findOne({ _id: run._id }))?.errors).toBe(5);
});

test('omitting retry authorization preserves the existing pause on explicit HTTP failure', async () => {
    retryInventory();
    const failure = await generationHttpError();
    afterDispatch = async kind => {
        if (kind === 'generation') throw failure;
    };
    const { run } = await plannedStart();
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(requestCounts()).toEqual({ generation: 1, embedding: 0, privacy: 3 });
    expect(retrySleeps).toHaveLength(0);
    expect(itemStore().rows[0]?.autoRetries ?? 0).toBe(0);
});

test.each([false, true])(
    'pause/cancel=%s during durable generation backoff prevents another dispatch',
    async cancel => {
        retryInventory();
        const failure = await generationHttpError();
        afterDispatch = async kind => {
            if (kind === 'generation') throw failure;
        };
        const hold = gate();
        let entered = false;
        beforeRetrySleep = async () => {
            entered = true;
            await hold.promise;
        };
        const { run } = await retryPlannedStart();
        await waitFor(() => entered);
        const waiting = (await listRuns()).find(value => value._id === run._id)!;
        expect(waiting.retry).toMatchObject({
            attempt: 1,
            maxAttempts: 3,
            record: 1,
        });
        const spent = requestCounts();
        await stopRun(run._id, cancel);
        hold.release();
        const stopped = await settled(run._id);
        expect(stopped.state).toBe(cancel ? 'cancelled' : 'paused');
        expect(requestCounts()).toEqual(spent);
        expect(itemStore().rows[0]?.autoRetries).toBe(1);
        expect((await jobStore().findOne({ _id: run._id }))?.snapshotIndex).toBe(0);
    }
);

test.each(['source', 'consent', 'principal', 'lease', 'configuration'] as const)(
    '%s changes during generation backoff prevent another paid request',
    async change => {
        retryInventory();
        const failure = await generationHttpError();
        afterDispatch = async kind => {
            if (kind === 'generation') throw failure;
        };
        let principalValid = true;
        const principal = async () => {
            if (!principalValid) throw new Error('Synthetic expired session');
        };
        const hold = gate();
        let entered = false;
        beforeRetrySleep = async () => {
            entered = true;
            await hold.promise;
        };
        const { run } = await retryPlannedStart(principal);
        await waitFor(() => entered);
        const spent = requestCounts();
        if (change === 'source')
            collection('credentials').rows[0]!.verification.contentHash = 'a'.repeat(64);
        if (change === 'consent') revokedOwners.add(owner);
        if (change === 'principal') principalValid = false;
        if (change === 'lease') runStore().rows[0]!.leaseUntil = new Date(Date.now() - 1);
        if (change === 'configuration') process.env.TITLE_MODEL = 'changed-model';
        hold.release();
        const stopped = await settled(run._id);
        expect(stopped.state).not.toBe('running');
        expect(requestCounts()).toEqual(spent);
        expect(itemStore().rows[0]?.autoRetries).toBe(1);
    }
);

test.each(['http5xx-v1', 'transient-v2'] as const)(
    '%s restart leaves a waiting retry inert until explicit resume and concurrent resumes cannot duplicate its claim',
    async policy => {
        retryInventory();
        const failure =
            policy === 'transient-v2'
                ? await generationTimeoutFailure()
                : await generationHttpError();
        afterDispatch = async kind => {
            if (kind === 'generation' && requestCounts().generation === 1) throw failure;
        };
        const hold = gate();
        let entered = false;
        beforeRetrySleep = async () => {
            entered = true;
            await hold.promise;
        };
        const { run } = await retryPlannedStart(guard, policy);
        await waitFor(() => entered);
        const deadline = itemStore().rows[0]!.generationRetry.nextAttemptAt.getTime();
        await stopRun(run._id, false);
        hold.release();
        await settled(run._id);
        beforeRetrySleep = undefined;
        await runStore().updateOne(
            { _id: run._id },
            {
                $set: {
                    state: 'running',
                    process: 'synthetic-previous-process',
                    leaseUntil: new Date(Date.now() - 1),
                },
            }
        );
        expect((await listRuns()).find(value => value._id === run._id)?.state).toBe('interrupted');
        await listRuns();
        expect(requestCounts()).toEqual({ generation: 1, embedding: 0, privacy: 3 });
        beforeDispatch = async kind => {
            if (kind === 'generation')
                expect(Date.now() + retryTimeOffset).toBeGreaterThanOrEqual(deadline);
        };
        const results = await Promise.allSettled([
            resumeRun(run._id, guard, operatorDid, policy),
            resumeRun(run._id, guard, operatorDid, policy),
        ]);
        expect(results.some(result => result.status === 'fulfilled')).toBe(true);
        const done = await settled(run._id);
        expect(done.state).toBe('completed');
        expect(requestCounts()).toEqual({ generation: 2, embedding: 5, privacy: 6 });
        expect(itemStore().rows[0]?.autoRetries).toBe(1);
    }
);

test.each(['http5xx-v1', 'transient-v2'] as const)(
    '%s resume without the retry policy disables further automatic retries without resetting the consumed count',
    async policy => {
        retryInventory();
        const failure =
            policy === 'transient-v2'
                ? await generationTimeoutFailure()
                : await generationHttpError();
        afterDispatch = async kind => {
            if (kind === 'generation') throw failure;
        };
        const hold = gate();
        let entered = false;
        beforeRetrySleep = async () => {
            entered = true;
            await hold.promise;
        };
        const { run } = await retryPlannedStart(guard, policy);
        await waitFor(() => entered);
        await stopRun(run._id, false);
        hold.release();
        await settled(run._id);
        beforeRetrySleep = undefined;
        const sleepsBeforeResume = retrySleeps.length;
        beforeDispatch = async () => {
            expect(itemStore().rows[0]?.generationRetry.phase).toBe('abandoned');
            expect(runStore().rows[0]?.reason).toBeUndefined();
            expect(runStore().rows[0]?.retry).toBeUndefined();
        };
        await resumeRun(run._id, guard);
        const paused = await settled(run._id);
        expect(paused.state).toBe('paused');
        expect(paused.generationRetryPolicy).toBeUndefined();
        expect(itemStore().rows[0]?.autoRetries).toBe(1);
        expect(itemStore().rows[0]?.generationRetry.phase).toBe('abandoned');
        expect(retrySleeps).toHaveLength(sleepsBeforeResume);
        expect(requestCounts()).toEqual({ generation: 2, embedding: 0, privacy: 6 });
    }
);

test.each(['generation', 'embedding', 'privacy'] as const)(
    'automatic generation retries cannot exceed the durable %s request cap',
    async kind => {
        retryInventory();
        const failure = await generationHttpError();
        afterDispatch = async dispatched => {
            if (dispatched === 'generation') {
                const raw = runStore().rows[0]!;
                const cap = {
                    generation: 'maxGenerationRequests',
                    embedding: 'maxEmbeddingRequests',
                    privacy: 'maxPrivacyRequests',
                }[kind];
                raw[`${kind}Requests`] = raw[cap];
                throw failure;
            }
        };
        const { run } = await retryPlannedStart();
        const paused = await settled(run._id);
        const field = `${kind}Requests`;
        const cap = { generation: 8, embedding: 40, privacy: 24 }[kind];
        expect(paused.state).toBe('paused');
        expect((await rawRun(run._id))?.[field]).toBe(cap);
        expect(requestCounts()[kind]).toBe(kind === 'generation' ? 1 : kind === 'privacy' ? 3 : 0);
        expect(itemStore().rows[0]?.autoRetries ?? 0).toBeLessThanOrEqual(3);
        expect(paused.maxGenerationRequests).toBe(8);
        expect(paused.maxEmbeddingRequests).toBe(40);
        expect(paused.maxPrivacyRequests).toBe(24);
    }
);

test.each(['HTTP504', 'HTTP429', 'network', 'privacy', 'measured response', 'embedding'] as const)(
    'retry authorization does not replay a %s failure',
    async mode => {
        retryInventory();
        let failure: Error = await generationHttpError(
            mode === 'HTTP504' ? 504 : mode === 'HTTP429' ? 429 : 500
        );
        if (mode === 'network') {
            const { AiProviderError } = await import('../ai/errors');
            failure = new AiProviderError({
                code: 'ai_provider_unavailable',
                provider: 'bedrock',
                retryable: true,
                httpStatus: 503,
                cause: new Error('Synthetic network reset'),
            });
        }
        if (mode === 'privacy') {
            const { markPrivacyFailure } = await import('../ai/privacy-diagnostics');
            failure = markPrivacyFailure(
                failure,
                'guardrail_request',
                failure,
                'service_unavailable'
            );
        }
        if (mode === 'measured response')
            afterGenerationResponse = async () => {
                throw failure;
            };
        else
            afterDispatch = async kind => {
                if (
                    kind ===
                    (mode === 'privacy'
                        ? 'privacy'
                        : mode === 'embedding'
                          ? 'embedding'
                          : 'generation')
                )
                    throw failure;
            };
        const { run } = await retryPlannedStart();
        const paused = await settled(run._id);
        expect(paused.state).toBe('paused');
        expect(paused.processed).toBe(0);
        expect(itemStore().rows[0]?.autoRetries ?? 0).toBe(0);
        expect(retrySleeps).toHaveLength(0);
        const spent = requestCounts();
        await listRuns();
        expect(requestCounts()).toEqual(spent);
        expect(generationInputs).toHaveLength(1);
    }
);

test('invalid or v1 retry authorizations fail before launching provider work', async () => {
    const plan = await planRun(randomUUID());
    await expect(
        startRun(
            randomUUID(),
            plan._id,
            true,
            guard,
            operatorDid,
            undefined,
            'unsupported' as never
        )
    ).rejects.toThrow();
    expect(runStore().rows).toHaveLength(0);
    const legacy = await seedV1Plan();
    await expect(
        startRun(randomUUID(), legacy, true, guard, operatorDid, undefined, 'http5xx-v1')
    ).rejects.toThrow();
    expect(runStore().rows).toHaveLength(0);
    expect(dispatches).toHaveLength(0);
});

test('the start idempotency key cannot silently add or remove retry authorization', async () => {
    retryInventory();
    const hold = gate();
    let entered = false;
    beforeDispatch = async () => {
        entered = true;
        await hold.promise;
    };
    const { plan, run } = await retryPlannedStart();
    await waitFor(() => entered);
    await expect(startRun(run._id, plan._id, true, guard)).rejects.toThrow('Idempotency');
    const repeated = await startRun(
        run._id,
        plan._id,
        true,
        guard,
        operatorDid,
        undefined,
        'http5xx-v1'
    );
    expect(repeated._id).toBe(run._id);
    expect(runStore().rows).toHaveLength(1);
    await stopRun(run._id, false);
    hold.release();
    await settled(run._id);
    await expect(resumeRun(run._id, guard, operatorDid, 'unsupported' as never)).rejects.toThrow();
    expect(dispatches).toHaveLength(0);
});

test.each(['waiting', 'claimed'] as const)(
    'a lost %s retry-ticket commit acknowledgement cannot trigger automatic replay',
    async phase => {
        retryInventory();
        const failure = await generationHttpError();
        afterDispatch = async kind => {
            if (kind === 'generation' && requestCounts().generation === 1) throw failure;
        };
        let acknowledgementLost = false;
        afterTransactionCommit = async () => {
            if (!acknowledgementLost && itemStore().rows[0]?.generationRetry?.phase === phase) {
                acknowledgementLost = true;
                throw new Error('Synthetic lost durable commit acknowledgement');
            }
        };
        const { run } = await retryPlannedStart();
        const interrupted = await settled(run._id);
        expect(acknowledgementLost).toBe(true);
        expect(interrupted.state).toBe('interrupted');
        expect(itemStore().rows[0]?.autoRetries).toBe(1);
        expect(itemStore().rows[0]?.generationRetry?.phase).toBe(phase);
        expect((await jobStore().findOne({ _id: run._id }))?.snapshotIndex).toBe(0);
        await listRuns();
        await listRuns();
        expect(requestCounts()).toEqual({
            generation: 1,
            embedding: 0,
            privacy: 3,
        });
        afterTransactionCommit = undefined;
        await resumeRun(run._id, guard, operatorDid, 'http5xx-v1');
        const done = await settled(run._id);
        expect(done.state).toBe('completed');
        expect(itemStore().rows[0]?.autoRetries).toBe(1);
        expect(requestCounts()).toEqual({
            generation: 2,
            embedding: 5,
            privacy: 6,
        });
    }
);

test.each(['error sequence', 'failure timestamp', 'already claimed'] as const)(
    'a changed %s prevents claiming the same failed generation retry ticket',
    async change => {
        retryInventory();
        const failure = await generationHttpError();
        afterDispatch = async kind => {
            if (kind === 'generation') throw failure;
        };
        const hold = gate();
        let entered = false;
        beforeRetrySleep = async () => {
            entered = true;
            await hold.promise;
        };
        const { run } = await retryPlannedStart();
        await waitFor(() => entered);
        if (change === 'error sequence') jobStore().rows[0]!.errors += 1;
        if (change === 'failure timestamp')
            jobStore().rows[0]!.lastFailure.at = new Date(Date.now() + 1000).toISOString();
        if (change === 'already claimed') itemStore().rows[0]!.generationRetry.phase = 'claimed';
        hold.release();
        const interrupted = await settled(run._id);
        expect(interrupted.state).toBe('interrupted');
        expect(requestCounts()).toEqual({
            generation: 1,
            embedding: 0,
            privacy: 3,
        });
        expect(itemStore().rows[0]?.autoRetries).toBe(1);
        expect((await jobStore().findOne({ _id: run._id }))?.snapshotIndex).toBe(0);
    }
);

test('generation backoff performs no source, consent or coverage reads and remains responsive to pause', async () => {
    retryInventory();
    const failure = await generationHttpError();
    afterDispatch = async kind => {
        if (kind === 'generation') throw failure;
    };
    let waitingReads: { source: number; consent: number; coverage: number } | undefined;
    let ticks = 0;
    beforeRetrySleep = async () => {
        const reads = {
            source: collection('credentials').reads.length,
            consent: consentChecks,
            coverage: reviewReads,
        };
        waitingReads ??= reads;
        expect(reads).toEqual(waitingReads);
        ticks += 1;
        if (ticks === 10) await stopRun(runStore().rows[0]!._id, false);
    };
    const { run } = await retryPlannedStart();
    const paused = await settled(run._id);
    expect(ticks).toBe(10);
    expect(paused.state).toBe('paused');
    expect(requestCounts()).toEqual({ generation: 1, embedding: 0, privacy: 3 });
    expect(itemStore().rows[0]?.generationRetry.phase).toBe('waiting');
    expect(itemStore().rows[0]?.autoRetries).toBe(1);
});

test('managed runner refuses a live lease with insufficient whole-unit headroom before any dispatch', async () => {
    let shortened = false;
    const principal = async () => {
        const row = runStore().rows.find(row => row.state === 'running');
        if (row && !shortened) {
            shortened = true;
            await runStore().updateOne(
                { _id: row._id },
                { $set: { leaseUntil: new Date(Date.now() + 350000) } }
            );
        }
    };
    const { run } = await plannedStart(principal);
    const paused = await settled(run._id);
    expect(paused.state).toBe('paused');
    expect(paused.reason).toContain('headroom');
    expect(paused.processed).toBe(0);
    expect(paused.written).toBe(0);
    expect(paused.generationRequests).toBe(0);
    expect(paused.privacyRequests).toBe(0);
    expect(paused.embeddingRequests).toBe(0);
    expect(dispatches).toHaveLength(0);
});

async function generationTimeoutFailure(caller = false) {
    const { markGenerationFailure } = await import('../ai/generation-failure');
    const { markProviderFailure } = await import('../ai/provider-diagnostics');
    const { normalizeAiProviderError } = await import('../ai/errors');
    const failure = normalizeAiProviderError(
        markProviderFailure(
            Object.assign(new Error('synthetic timeout'), { name: 'TimeoutError' }),
            { providerOperation: 'request', providerFailureReason: 'request_failed' }
        ),
        'bedrock'
    );
    markGenerationFailure(failure, caller ? 'caller_aborted' : 'provider_timeout');
    return failure;
}
test('v2 confirmed generation timeout recovers through durable queue within original caps and writes once', async () => {
    retryInventory();
    const failure = await generationTimeoutFailure();
    afterDispatch = async kind => {
        if (kind === 'generation' && requestCounts().generation === 1) throw failure;
    };
    const { run } = await retryPlannedStart(guard, 'transient-v2');
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.written).toBe(1);
    expectConservation(done);
    expect(requestCounts()).toEqual({ generation: 2, embedding: 5, privacy: 6 });
    expect(done.maxGenerationRequests).toBe(8);
    expect(itemStore().rows[0]?.autoRetries).toBe(1);
    expect(itemStore().rows[0]?.generationRetry.policy).toBe('transient-v2');
});
test.each(['http5xx-v1', 'transient-v2'] as const)(
    '%s never replays caller/stage cancellation; HTTP-only policy excludes provider timeouts',
    async policy => {
        retryInventory();
        const failure = await generationTimeoutFailure(policy === 'transient-v2');
        afterDispatch = async kind => {
            if (kind === 'generation') throw failure;
        };
        const { run } = await retryPlannedStart(guard, policy);
        const stopped = await settled(run._id);
        expect(stopped.state).toBe('paused');
        expect(requestCounts().generation).toBe(1);
        expect(retrySleeps).toHaveLength(0);
    }
);
test('v2 generation timeouts exhaust exactly three durable retries without increasing budgets', async () => {
    retryInventory();
    const failure = await generationTimeoutFailure();
    afterDispatch = async kind => {
        if (kind === 'generation') throw failure;
    };
    const { run } = await retryPlannedStart(guard, 'transient-v2');
    const stopped = await settled(run._id);
    expect(stopped.state).toBe('paused');
    expect(stopped.processed).toBe(0);
    expect(stopped.written).toBe(0);
    expect(requestCounts()).toEqual({ generation: 4, embedding: 0, privacy: 12 });
    expect(itemStore().rows[0]?.autoRetries).toBe(3);
    expect(stopped.maxGenerationRequests).toBe(8);
});
test('v2 cancellation during timeout backoff preserves its ticket and spends no additional requests', async () => {
    retryInventory();
    const failure = await generationTimeoutFailure();
    afterDispatch = async kind => {
        if (kind === 'generation') throw failure;
    };
    const hold = gate();
    let entered = false;
    beforeRetrySleep = async () => {
        entered = true;
        await hold.promise;
    };
    const { run } = await retryPlannedStart(guard, 'transient-v2');
    await waitFor(() => entered);
    const spent = requestCounts();
    await stopRun(run._id, true);
    hold.release();
    const stopped = await settled(run._id);
    expect(stopped.state).toBe('cancelled');
    expect(requestCounts()).toEqual(spent);
    expect(itemStore().rows[0]?.autoRetries).toBe(1);
});

test.each(['generation', 'embedding', 'privacy'] as const)(
    'v2 timeout recovery honors durable %s cap before scheduling another request',
    async kind => {
        retryInventory();
        const failure = await generationTimeoutFailure();
        afterDispatch = async dispatched => {
            if (dispatched === 'generation') {
                const raw = runStore().rows[0]!;
                const cap = {
                    generation: 'maxGenerationRequests',
                    embedding: 'maxEmbeddingRequests',
                    privacy: 'maxPrivacyRequests',
                }[kind];
                raw[`${kind}Requests`] = raw[cap];
                throw failure;
            }
        };
        const { run } = await retryPlannedStart(guard, 'transient-v2');
        const stopped = await settled(run._id);
        expect(stopped.state).toBe('paused');
        expect(requestCounts().generation).toBe(1);
        expect(retrySleeps).toHaveLength(0);
        expect(stopped.maxGenerationRequests).toBe(8);
        expect(stopped.maxEmbeddingRequests).toBe(40);
        expect(stopped.maxPrivacyRequests).toBe(24);
    }
);

test.each(['job_guard', 'embedding'] as const)(
    'current exhausted %s stop blocks repeated Resume without mutations, charges, skips or counter resets',
    async stage => {
        beforeDispatch = async () => {
            throw new Error('Synthetic pre-dispatch pause');
        };
        const { run } = await plannedStart();
        await settled(run._id);
        const raw = jobStore().rows.find(row => row._id === run._id)!;
        raw.embeddingRecovery = {
            record: 1,
            fingerprint: 'synthetic-source',
            slots: [1, 3, 1, 1, 3].map(attempts => ({ attempts, notBefore: 0 })),
        };
        raw.lastFailure = {
            version: 1,
            at: new Date().toISOString(),
            record: 1,
            stage,
            code: 'record_failed',
            dispatchStatus: stage === 'embedding' ? 'possibly_dispatched' : 'not_dispatched',
            requests: {
                generation: stage === 'embedding' ? 1 : 0,
                embedding: stage === 'embedding' ? 3 : 0,
                privacy: stage === 'embedding' ? 3 : 0,
            },
            embeddingStop: 'attempts_exhausted',
        };
        const savedJob = copy(raw),
            savedRun = copy(await rawRun(run._id)),
            spent = requestCounts();
        const view = (await listRuns()).find(row => row._id === run._id)!;
        expect(view.resumable).toBe(false);
        expect(view.resumeBlock).toMatchObject({ code: 'embedding_attempts_exhausted', record: 1 });
        for (let attempt = 0; attempt < 2; attempt += 1)
            await expect(resumeRun(run._id, guard, operatorDid, 'transient-v2')).rejects.toThrow(
                'Resume cannot add attempts'
            );
        expect(requestCounts()).toEqual(spent);
        expect(jobStore().rows.find(row => row._id === run._id)).toEqual(savedJob);
        expect(await rawRun(run._id)).toEqual(savedRun);
        await stopRun(run._id, true);
        expect((await settled(run._id)).state).toBe('cancelled');
        expect(raw.embeddingRecovery).toEqual(savedJob.embeddingRecovery);
    }
);
test('historical exhausted diagnostics do not block a different current record', async () => {
    beforeDispatch = async () => {
        throw new Error('Synthetic pre-dispatch pause');
    };
    const { run } = await plannedStart();
    await settled(run._id);
    const raw = jobStore().rows.find(row => row._id === run._id)!;
    raw.embeddingRecovery = {
        record: 2,
        fingerprint: 'synthetic-source',
        slots: Array.from({ length: 5 }, () => ({ attempts: 3, notBefore: 0 })),
    };
    raw.lastFailure = {
        version: 1,
        at: new Date().toISOString(),
        record: 2,
        stage: 'job_guard',
        code: 'record_failed',
        dispatchStatus: 'not_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 0 },
        embeddingStop: 'attempts_exhausted',
    };
    const view = (await listRuns()).find(row => row._id === run._id)!;
    expect(view.resumable).toBe(true);
    expect(view.resumeBlock).toBeUndefined();
});

test('completed coverage can still reconcile without provider replay when the pause is not an exhaustion stop', async () => {
    retryInventory();
    beforeDispatch = async () => {
        throw new Error('Synthetic pause');
    };
    const { run } = await plannedStart();
    await settled(run._id);
    const raw = jobStore().rows.find(row => row._id === run._id)!;
    raw.embeddingRecovery = {
        record: 1,
        fingerprint: 'synthetic-source',
        slots: Array.from({ length: 5 }, () => ({ attempts: 3, notBefore: 0 })),
    };
    expect(raw.lastFailure?.embeddingStop).toBeUndefined();
    coveredUris.add(source(1).uri);
    beforeDispatch = undefined;
    const spent = requestCounts();
    await resumeRun(run._id, guard);
    const done = await settled(run._id);
    expect(done.state).toBe('completed');
    expect(done.alreadyComplete).toBe(8);
    expect(requestCounts()).toEqual(spent);
});

test('public diagnostics keep current earlier dispatched evidence separate from the zero-request pause', async () => {
    beforeDispatch = async () => {
        throw new Error('Synthetic guard');
    };
    const { run } = await plannedStart();
    await settled(run._id);
    const raw = jobStore().rows.find(row => row._id === run._id)!;
    raw.lastDispatchedFailure = {
        version: 1,
        at: new Date().toISOString(),
        record: 1,
        stage: 'embedding',
        code: 'ai_request_timeout',
        dispatchStatus: 'possibly_dispatched',
        requests: { generation: 1, embedding: 7, privacy: 3 },
        secret: 'private source must never escape',
    };
    const view = (await listRuns()).find(row => row._id === run._id)!;
    expect(view.lastDispatchedFailure).toMatchObject({
        stage: 'embedding',
        requests: { embedding: 7 },
    });
    expect(view.lastDispatchedFailure).not.toHaveProperty('secret');
    expect(view.lastFailure?.stage).not.toBe('embedding');
    raw.lastDispatchedFailure.record = 2;
    expect(
        (await listRuns()).find(row => row._id === run._id)?.lastDispatchedFailure
    ).toBeUndefined();
});

async function exhaustedRecoveryFixture() {
    beforeDispatch = async () => {
        throw new Error('Synthetic pre-dispatch pause');
    };
    const { run } = await plannedStart();
    await settled(run._id);
    const item = itemStore().rows.find(row => row._id === `${run._id}:0`)!;
    const job = jobStore().rows.find(row => row._id === run._id)!;
    job.embeddingRecovery = {
        record: 1,
        fingerprint: item.resolvedFingerprint,
        slots: [1, 3, 1, 1, 3].map(attempts => ({ attempts, notBefore: 0 })),
    };
    job.lastFailure = {
        version: 1,
        at: new Date().toISOString(),
        record: 1,
        stage: 'job_guard',
        code: 'record_failed',
        dispatchStatus: 'not_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 0 },
        embeddingStop: 'attempts_exhausted',
    };
    beforeDispatch = undefined;
    return {
        run,
        item,
        job,
        baseline: copy(job.embeddingRecovery),
        request: {
            requestId: randomUUID(),
            record: 1,
            paidAuthorized: true as const,
            caps: { generation: 1 as const, embedding: 5 as const, privacy: 3 as const },
        },
    };
}
test('single-use recovery spends at most 1/5/3, preserves exhausted ledger, pauses before next record and deduplicates', async () => {
    const { run, item, job, baseline, request } = await exhaustedRecoveryFixture();
    const hold = gate();
    beforeDispatch = async kind => {
        if (kind === 'generation') await hold.promise;
    };
    await recoverRunOnce(run._id, guard, operatorDid, request);
    await waitFor(() => item.supplementalRecovery?.used.privacy >= 1);
    await recoverRunOnce(run._id, guard, operatorDid, request);
    await expect(
        recoverRunOnce(run._id, guard, operatorDid, { ...request, requestId: randomUUID() })
    ).rejects.toThrow('already been claimed');
    await expect(resumeRun(run._id, guard, operatorDid, 'transient-v2')).rejects.toThrow();
    hold.release();
    const stopped = await settled(run._id);
    expect(stopped.state).toBe('paused');
    expect(stopped.processed).toBe(1);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    expect(item.supplementalRecovery.used).toEqual(requestCounts());
    expect(item.supplementalRecovery.phase).toBe('completed');
    expect(job.embeddingRecovery).toEqual(baseline);
    await recoverRunOnce(run._id, guard, operatorDid, request);
    expect(requestCounts().generation).toBe(1);
});
test.each(['generation', 'embedding', 'privacy'] as const)(
    'single-use recovery refuses insufficient remaining %s budget before claiming',
    async kind => {
        const { run, item, request } = await exhaustedRecoveryFixture();
        const raw = runStore().rows.find(row => row._id === run._id)!;
        const field = `${kind}Requests`,
            cap = `max${kind[0].toUpperCase()}${kind.slice(1)}Requests`;
        raw[field] = raw[cap];
        await expect(recoverRunOnce(run._id, guard, operatorDid, request)).rejects.toThrow(
            'insufficient'
        );
        expect(item.supplementalRecovery).toBeUndefined();
        expect(requestCounts().generation).toBe(0);
    }
);
test.each(['source', 'consent', 'cancel', 'interruption', 'baseline'] as const)(
    'single-use recovery preserves cursor and cannot replay after %s changes',
    async change => {
        const { run, item, job, baseline, request } = await exhaustedRecoveryFixture();
        const hold = gate();
        beforeDispatch = async kind => {
            if (kind === 'generation') await hold.promise;
        };
        await recoverRunOnce(run._id, guard, operatorDid, request);
        await waitFor(() => item.supplementalRecovery?.used.privacy >= 1);
        if (change === 'source') collection('credentials').rows[0].embeddingEpoch = 'changed';
        if (change === 'consent') revokedOwners.add(owner);
        if (change === 'cancel') await stopRun(run._id, true);
        if (change === 'interruption')
            runStore().rows.find(row => row._id === run._id)!.leaseUntil = new Date(0);
        if (change === 'baseline') job.embeddingRecovery.slots[0].attempts = 2;
        hold.release();
        const stopped = await settled(run._id);
        expect(stopped.processed).toBe(0);
        expect(job.snapshotIndex).toBe(0);
        expect(stopped.skipped).toBe(0);
        expect(requestCounts().embedding).toBe(0);
        if (change !== 'baseline') expect(job.embeddingRecovery).toEqual(baseline);
        const spent = requestCounts();
        await recoverRunOnce(run._id, guard, operatorDid, request);
        if (change !== 'cancel')
            await expect(resumeRun(run._id, guard, operatorDid)).rejects.toThrow(
                'already been claimed'
            );
        expect(requestCounts()).toEqual(spent);
    }
);
test('single-use recovery is bound to current record, principal, source and live consent before claiming', async () => {
    const { run, item, request } = await exhaustedRecoveryFixture();
    await expect(recoverRunOnce(run._id, guard, 'did:example:other', request)).rejects.toThrow(
        'unavailable'
    );
    await expect(
        recoverRunOnce(run._id, guard, operatorDid, { ...request, record: 2 })
    ).rejects.toThrow('current');
    revokedOwners.add(owner);
    await expect(recoverRunOnce(run._id, guard, operatorDid, request)).rejects.toThrow('consent');
    expect(item.supplementalRecovery).toBeUndefined();
    expect(requestCounts().generation).toBe(0);
});

test.each(['generation', 'embedding', 'privacy'] as const)(
    'single-use recovery cannot overrun %s sub-budget or silently skip',
    async kind => {
        const { run, item, job, baseline, request } = await exhaustedRecoveryFixture();
        if (kind === 'generation') generationDispatchCount = 2;
        if (kind === 'embedding') embeddingDispatchCount = 6;
        if (kind === 'privacy') privacyDispatchCount = 4;
        await recoverRunOnce(run._id, guard, operatorDid, request);
        const stopped = await settled(run._id);
        expect(stopped.processed).toBe(0);
        expect(job.snapshotIndex).toBe(0);
        expect(stopped.skipped).toBe(0);
        expect(item.supplementalRecovery.used[kind]).toBe(
            { generation: 1, embedding: 5, privacy: 3 }[kind]
        );
        expect(job.embeddingRecovery).toEqual(baseline);
        expect(itemStore().rows.find(row => row._id === item._id)!.supplementalRecovery.phase).toBe(
            'failed'
        );
    }
);
test('concurrent recovery claims and Resume produce exactly one pass', async () => {
    const { run, item, request } = await exhaustedRecoveryFixture();
    const hold = gate();
    beforeDispatch = async kind => {
        if (kind === 'generation') await hold.promise;
    };
    const outcomes = await Promise.allSettled([
        recoverRunOnce(run._id, guard, operatorDid, request),
        recoverRunOnce(run._id, guard, operatorDid, request),
        resumeRun(run._id, guard, operatorDid, 'transient-v2'),
    ]);
    expect(outcomes.some(result => result.status === 'fulfilled')).toBe(true);
    hold.release();
    await settled(run._id);
    expect(requestCounts()).toEqual({ generation: 1, embedding: 5, privacy: 3 });
    expect(itemStore().rows.find(row => row._id === item._id)!.supplementalRecovery.used).toEqual(
        requestCounts()
    );
});
test('expired pass cannot dispatch or replay after a paused provider boundary', async () => {
    const { run, item, job, request } = await exhaustedRecoveryFixture();
    const hold = gate();
    beforeDispatch = async kind => {
        if (kind === 'generation') await hold.promise;
    };
    await recoverRunOnce(run._id, guard, operatorDid, request);
    await waitFor(() => item.supplementalRecovery?.used.privacy >= 1);
    item.supplementalRecovery.expiresAt = new Date(0);
    hold.release();
    await settled(run._id);
    expect(requestCounts().generation).toBe(0);
    expect(job.snapshotIndex).toBe(0);
    await expect(resumeRun(run._id, guard, operatorDid)).rejects.toThrow('already been claimed');
});

test('lost grant commit acknowledgement cannot launch or replay the claimed pass', async () => {
    const { run, item, request } = await exhaustedRecoveryFixture();
    afterTransactionCommit = async () => {
        afterTransactionCommit = undefined;
        throw new Error('Synthetic lost grant acknowledgement');
    };
    await expect(recoverRunOnce(run._id, guard, operatorDid, request)).rejects.toThrow(
        'lost grant acknowledgement'
    );
    expect(itemStore().rows.find(row => row._id === item._id)!.supplementalRecovery.id).toBe(
        request.requestId
    );
    await recoverRunOnce(run._id, guard, operatorDid, request);
    expect(requestCounts()).toEqual({ generation: 0, embedding: 0, privacy: 0 });
    const raw = runStore().rows.find(row => row._id === run._id)!;
    raw.leaseUntil = new Date(0);
    await expect(resumeRun(run._id, guard, operatorDid)).rejects.toThrow('already been claimed');
});
