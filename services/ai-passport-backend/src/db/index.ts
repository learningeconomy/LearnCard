import {
    metadataExclusionReason,
    runSourceFingerprint,
    workflowSourceFingerprint,
    WORKFLOW_SOURCE_PROJECTION,
    type RunSource,
    type WorkflowOperation,
} from '../admin/run-model';
import { AI_INSIGHT_CREDENTIAL_TYPE } from '../constants/vc';
import { repairSourceFingerprint, REPAIR_SOURCE_PROJECTION } from '../admin/legacy-repair-source';
import type { ModelSafeCredentialProjection } from '@learncard/types';
import {
    vectorSourceRef,
    encryptCleanupScope,
    type SourceCleanupTask,
    type VectorSource,
} from './vector-source';
import type { StoredInsightCompaction } from '../services/insightCompaction';
import { beginAiInsightTiming, withAiInsightTiming } from '../diagnostics/ai-insight';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import type { ClientSession, Collection, Db, Document } from 'mongodb';
import { AiSessionMode, VCValidator } from '@learncard/types';
import type {
    AIPassportCredentialRecord,
    ChatMessage,
    CredentialVerificationMetadata,
    InsightArtifact,
    Thread,
    ThreadCredentialContext,
    VC,
} from '@learncard/types';
import { MongoClient, ObjectId } from 'mongodb';
import { MONGO_URI, MONGO_DB } from '../constants/env';
import type { AiAuditEvent, AiAuditTerminal } from '../ai/audit';
import type { EncryptedIdentifierMapping } from '../ai/pseudonymization';
import {
    assertRawCredentialOwner,
    encryptRawCredential,
    decryptRawCredential,
} from '../credentials/raw-vault';
import type { RawCredentialEnvelope } from '../credentials/raw-vault';
import { fingerprintCredential } from '../credentials/verification';
import { settleCredentialBatch } from '../credentials/batch';
import {
    assertCurrentAiConsent,
    getCurrentAiSubject,
    runWithAiPrivacyContext,
} from '../ai/privacy';
import { getPrivacyKeyMaterial, getPrivacySubjectRef } from '../ai/privacy-keys';
import { resolveVerifiedCredentialProjection } from '../credentials/service';
import { serializeModelSafeCredentialProjection } from '../credentials/projection';
import { getCredentialProjection } from '../credentials/projection';
import { decryptIdentifierMapping } from '../ai/pseudonymization';
import {
    withOwnerOperation,
    getCurrentOwnerOperation,
    assertOwnerOperationActive,
    PRIVACY_MAINTENANCE_KEY,
} from '../services/dataErasure';
import cache from '../utils/cache';
import { logSafeEvent } from '../logging';
import { createKeyedSerialQueue } from '../utils/keyedSerialQueue';

// Shared across ChatDB instances in this process; Mongo remains the cross-process fence.
const scheduleOwnerWrite = createKeyedSerialQueue();

export type DBMessage = {
    id: string;
    did: string;
    threadId: string;
    created_at: string;
    consentRevision?: string;
} & ChatMessage;

export type DBThreadPlan = {
    plan_data: string;
    created_at: string;
    consentRevision?: string;
};

export type DBThreadSummaryCredential = {
    summary_data: string;
    credential_uri: string;
    created_at: string;
};

export type DBArtifactSuggestion = {
    artifact: InsightArtifact;
    source_text?: string;
    created_at: string;
};

export type DBCredentialSummaryCache = {
    hash: string;
    did: string;
    consentRevision: string;
    expiresAt: Date;
    summary: string;
    model: string;
    version: string;
    created_at: string;
    updated_at: string;
};

export type DBLearnerContextPromptCache = {
    hash: string;
    did: string;
    consentRevision: string;
    expiresAt: Date;
    prompt: string;
    metadata: Record<string, unknown>;
    model: string;
    version: string;
    created_at: string;
    updated_at: string;
};
export type DBCredentialRecord = AIPassportCredentialRecord & {
    did?: string;
    embeddingEpoch?: string;
    rawCredentialJson: string;
    title?: string | null;
    source?: 'wallet' | 'generated';
    sourceFingerprint?: string;
    insightCompaction?: StoredInsightCompaction;
};

type StoredCredentialRecord = Omit<DBCredentialRecord, 'credential' | 'rawCredentialJson'> & {
    did: string;
    rawContentHash: string;
    boostId?: string;
    titleContextHash?: string;
};

export type DBCredentialVerificationRecord = CredentialVerificationMetadata & {
    did: string;
};

export type DBRawCredentialRecord = {
    did: string;
    uri: string;
    contentHash: string;
    rawCredentialJson: string;
    storedAt: string;
};

const durableWriteConcern = {
    w: 'majority' as const,
    j: true,
    wtimeoutMS: 10_000,
};

type OwnerGuard = { _id: string; erased?: boolean; revision: number };
type VectorReference = {
    subjectRef: string;
    collection: string;
    pointId: string | number;
    sourceRef?: string;
    threadRef?: string;
    sourceEpoch?: string;
    deleted?: boolean;
    cleanupComplete?: boolean;
};
type OwnerJob = {
    referenceId: string;
    did: string;
    queue: string;
    ciphertext: string;
    iv: string;
    authTag: string;
};
export type ExternalArtifactDeletion = {
    status: 'deleted' | 'retryable' | 'blocked' | 'unknown';
    attemptedAt: string;
    code?: string;
};
export type ExternalArtifact = {
    subjectRef: string;
    operationId: string;
    kind: string;
    credentialId: string;
    status: 'reserved' | 'complete' | 'failed' | 'unknown';
    uris: string[];
    reservedAt: string;
    completedAt?: string;
    deletion?: ExternalArtifactDeletion;
};

export class ChatDB {
    private client?: MongoClient;
    private db!: Db;
    private threads!: Collection<Thread>;
    private messages!: Collection<DBMessage>;
    private credentials!: Collection<StoredCredentialRecord>;
    private credentialSummaryCache!: Collection<DBCredentialSummaryCache>;
    private learnerContextPromptCache!: Collection<DBLearnerContextPromptCache>;
    private credentialVerifications!: Collection<DBCredentialVerificationRecord>;
    private rawCredentials!: Collection<RawCredentialEnvelope>;
    private aiAuditEvents!: Collection<AiAuditEvent>;
    private identifierMappings!: Collection<EncryptedIdentifierMapping>;
    private ownerGuards!: Collection<OwnerGuard>;
    private vectorReferences!: Collection<VectorReference>;
    private sourceCleanup!: Collection<SourceCleanupTask>;
    private sourceCleanupReceipts!: Collection<{
        _id: string;
        subjectRef: string;
    }>;
    private sourceCleanupLeases!: Collection<{
        _id: string;
        token: string;
        expiresAt: Date;
    }>;
    private ownerJobs!: Collection<OwnerJob>;
    private externalArtifacts!: Collection<ExternalArtifact>;
    private readonly transaction = new AsyncLocalStorage<{
        did: string;
        session: ClientSession;
    }>();
    private readonly migration = new AsyncLocalStorage<boolean>();
    private initialization?: Promise<void>;

    /* ------------------------- internal helpers ------------------------- */
    private init(): Promise<void> {
        // Offline migration connects first and must reconcile duplicate legacy rows
        // before creating unique indexes. Nested migration operations use that connection.
        if (this.migration.getStore()) return Promise.resolve();
        return (this.initialization ??= this.initialize().catch((error: unknown) => {
            this.initialization = undefined;
            throw error;
        }));
    }

    private async connectCollections(): Promise<void> {
        this.client ??= new MongoClient(MONGO_URI);
        await this.client.connect();
        this.db = this.client.db(MONGO_DB);
        this.threads = this.db.collection('threads');
        this.messages = this.db.collection('messages');
        this.credentials = this.db.collection('credentials');
        this.credentialSummaryCache = this.db.collection('credential_summary_cache');
        this.learnerContextPromptCache = this.db.collection('learner_context_prompt_cache');
        this.credentialVerifications = this.db.collection('credential_verifications');
        this.rawCredentials = this.db.collection('raw_credentials');
        this.aiAuditEvents = this.db.collection('ai_audit_events');
        this.identifierMappings = this.db.collection('identifier_mappings');
        this.ownerGuards = this.db.collection('owner_write_guards');
        this.vectorReferences = this.db.collection('owner_vector_references');
        this.sourceCleanup = this.db.collection('source_vector_cleanup');
        this.sourceCleanupReceipts = this.db.collection('source_vector_cleanup_receipts');
        this.sourceCleanupLeases = this.db.collection('source_vector_cleanup_leases');
        this.ownerJobs = this.db.collection('owner_job_payloads');
        this.externalArtifacts = this.db.collection('external_artifacts');
    }

    private async initialize(): Promise<void> {
        await this.connectCollections();

        // create indexes (runs once – duplicate indexes are a noop in Mongo)
        await Promise.all([
            this.vectorReferences.createIndex(
                { subjectRef: 1, collection: 1, pointId: 1 },
                { unique: true }
            ),
            this.vectorReferences.createIndex({ collection: 1, pointId: 1 }, { unique: true }),
            this.vectorReferences.createIndex({ subjectRef: 1, sourceRef: 1 }),
            this.vectorReferences.createIndex({ subjectRef: 1, threadRef: 1 }),
            this.vectorReferences.createIndex({ subjectRef: 1, deleted: 1 }),
            this.vectorReferences.createIndex({
                subjectRef: 1,
                deleted: 1,
                cleanupComplete: 1,
                collection: 1,
                pointId: 1,
            }),
            this.vectorReferences.createIndex({ deleted: 1, cleanupComplete: 1 }),
            this.sourceCleanupReceipts.createIndex({ subjectRef: 1 }),
            this.sourceCleanupLeases.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
            this.sourceCleanup.createIndex({
                subjectRef: 1,
                discoveryComplete: 1,
                _id: 1,
            }),
            this.ownerJobs.createIndex({ referenceId: 1 }, { unique: true }),
            this.ownerJobs.createIndex({ did: 1 }),
            this.externalArtifacts.createIndex({ subjectRef: 1, operationId: 1 }, { unique: true }),
            this.messages.createIndex(
                { did: 1, threadId: 1, created_at: 1 },
                { name: 'message_owner_thread_created_at' }
            ),
            this.threads.createIndex({ did: 1 }),
            this.threads.createIndex(
                { did: 1 },
                {
                    unique: true,
                    partialFilterExpression: { active: true },
                    name: 'one_active_thread_per_did',
                }
            ),
            this.credentials.createIndex({ did: 1 }),
            this.credentialSummaryCache.createIndex(
                { did: 1, consentRevision: 1, hash: 1 },
                { unique: true }
            ),
            this.learnerContextPromptCache.createIndex(
                { did: 1, consentRevision: 1, hash: 1 },
                { unique: true }
            ),
            this.credentialSummaryCache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
            this.learnerContextPromptCache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
            this.credentials.createIndex(
                { did: 1, uri: 1 },
                { unique: true, name: 'credential_owner_uri' }
            ),
            this.credentialVerifications.createIndex(
                { did: 1, credentialUri: 1 },
                { unique: true, name: 'credential_verification_owner_uri' }
            ),
            this.rawCredentials.createIndex(
                { did: 1, uri: 1 },
                { unique: true, name: 'raw_credential_owner_uri' }
            ),
            this.rawCredentials.createIndex(
                { expiresAt: 1 },
                { expireAfterSeconds: 0, name: 'raw_credential_retention' }
            ),
            this.aiAuditEvents.createIndex(
                { subjectRef: 1, timestamp: -1 },
                { name: 'ai_audit_subject_timestamp' }
            ),
            this.aiAuditEvents.createIndex(
                { eventId: 1 },
                { unique: true, name: 'ai_audit_event_id' }
            ),
            this.aiAuditEvents.createIndex(
                { outcome: 1, timestamp: 1 },
                { name: 'ai_audit_pending_timestamp' }
            ),
            this.identifierMappings.createIndex(
                { subjectRef: 1, token: 1 },
                { unique: true, name: 'identifier_mapping_owner_token' }
            ),
            this.identifierMappings.createIndex(
                { subjectRef: 1, valueRef: 1 },
                { unique: true, name: 'identifier_mapping_owner_value' }
            ),
            this.identifierMappings.createIndex(
                { expiresAt: 1 },
                { expireAfterSeconds: 0, name: 'identifier_mapping_retention' }
            ),
            this.credentials.createIndex(
                { did: 1, source: 1, sourceFingerprint: 1 },
                {
                    unique: true,
                    partialFilterExpression: {
                        source: 'generated',
                        sourceFingerprint: { $type: 'string' },
                    },
                    name: 'one_generated_credential_per_source',
                }
            ),
        ]);
    }

    public async assertPrivacyCapabilities({
        initializeIndexes = true,
    }: { initializeIndexes?: boolean } = {}): Promise<void> {
        if (initializeIndexes) await this.init();
        else await this.connectCollections();
        const hello = await this.db.admin().command({ hello: 1 });
        if (typeof hello.setName !== 'string' || !hello.setName) {
            throw new Error('Mongo privacy fencing requires a replica set with transactions');
        }
        const session = this.client!.startSession();
        try {
            await session.withTransaction(
                async () => {
                    const probes = this.db.collection<{ _id: string }>('privacy_capability_probes');
                    const _id = randomUUID();
                    await probes.insertOne({ _id }, { session });
                    await probes.deleteOne({ _id }, { session });
                },
                {
                    readConcern: { level: 'snapshot' },
                    writeConcern: durableWriteConcern,
                    readPreference: 'primary',
                }
            );
        } finally {
            await session.endSession();
        }
    }

    private newId() {
        return new ObjectId().toString();
    }

    private get session(): ClientSession | undefined {
        return this.transaction.getStore()?.session;
    }

    private async withOwnerWrite<T>(
        did: string,
        callback: () => Promise<T>,
        beforeWrite?: () => Promise<void>
    ): Promise<T> {
        if (!did) throw new Error('An owner is required for persistence');
        const nested = this.transaction.getStore();
        if (nested) {
            if (nested.did !== did) throw new Error('Cross-owner Mongo transaction rejected');
            if (beforeWrite) await withAiInsightTiming('owner_preflight', beforeWrite);
            return callback();
        }
        await this.init();
        const execute = async (): Promise<T> => {
            if (beforeWrite) await withAiInsightTiming('owner_preflight', beforeWrite);
            const session = this.client!.startSession();
            try {
                return await withAiInsightTiming('owner_transaction', () =>
                    session.withTransaction(
                        async () => {
                            if (!this.migration.getStore()) await assertOwnerOperationActive(did);
                            // The guard write conflicts with fencing, including when an erasure
                            // starts after this transaction's snapshot was established.
                            await this.ownerGuards.updateOne(
                                { _id: getPrivacySubjectRef(did), erased: { $ne: true } },
                                { $inc: { revision: 1 } },
                                { upsert: true, session }
                            );
                            const result = await this.transaction.run({ did, session }, callback);
                            if (!this.migration.getStore()) await assertOwnerOperationActive(did);
                            return result;
                        },
                        {
                            readConcern: { level: 'snapshot' },
                            writeConcern: durableWriteConcern,
                            readPreference: 'primary',
                        }
                    )
                );
            } finally {
                await session.endSession();
            }
        };
        const finishQueueWait = beginAiInsightTiming('owner_queue_wait');
        try {
            return await scheduleOwnerWrite(
                getPrivacySubjectRef(did),
                () => {
                    finishQueueWait();
                    return this.migration.getStore() ? execute() : withOwnerOperation(did, execute);
                },
                getCurrentOwnerOperation()?.signal
            );
        } finally {
            finishQueueWait();
        }
    }

    private mappingOwner(subjectRef: string): string {
        const did = getCurrentAiSubject();
        if (!did || getPrivacySubjectRef(did) !== subjectRef) {
            throw new Error('Authenticated mapping owner is required');
        }
        return did;
    }

    public async fenceOwnerWrites(did: string): Promise<void> {
        await this.init();
        await this.ownerGuards.updateOne(
            { _id: getPrivacySubjectRef(did) },
            { $set: { erased: true }, $inc: { revision: 1 } },
            { upsert: true, writeConcern: durableWriteConcern }
        );
    }

    public async registerVectorPoints(
        did: string,
        collection: string,
        ids: (string | number)[]
    ): Promise<void> {
        await this.withOwnerWrite(did, () =>
            this.persistVectorReferences(did, collection, ids, this.session)
        );
    }

    public async getVectorSource(
        did: string,
        kind: VectorSource['kind'],
        key: string,
        expected: {
            contentHash?: string;
            consentRevision: string;
            epoch?: string;
        }
    ): Promise<VectorSource> {
        return this.withOwnerWrite(did, async () => {
            assertRawCredentialOwner(did);
            const collection = this.db.collection<Document>('credentials');
            const filter = { did, uri: key };
            const record = await collection.findOne(filter, {
                session: this.session,
                // Source fencing only needs metadata for credentials. This path is
                // also used while preparing a metadata-only reviewed backfill plan.
                projection: { verification: 1, embeddingEpoch: 1 },
            });
            const version = record?.verification;
            if (
                !record ||
                !version ||
                version.contentHash !== expected.contentHash ||
                version.consent?.revision !== expected.consentRevision ||
                (expected.epoch && record.embeddingEpoch !== expected.epoch)
            )
                throw new Error('Vector source changed or deleted');
            const epoch = record.embeddingEpoch ?? randomUUID();
            if (!record.embeddingEpoch)
                await collection.updateOne(
                    filter,
                    { $set: { embeddingEpoch: epoch } },
                    { session: this.session }
                );
            return {
                kind,
                key,
                epoch,
                contentHash: expected.contentHash,
                consentRevision: expected.consentRevision,
            };
        });
    }

    public async registerSourceVectorPoints(
        did: string,
        collection: string,
        ids: (string | number)[],
        source: VectorSource
    ): Promise<void> {
        await this.withOwnerWrite(did, async () => {
            await this.getVectorSource(did, source.kind, source.key, {
                ...source,
                epoch: source.epoch,
            });
            await this.persistVectorReferences(did, collection, ids, this.session);
            await this.vectorReferences.updateMany(
                {
                    subjectRef: getPrivacySubjectRef(did),
                    collection,
                    pointId: { $in: ids },
                    deleted: { $ne: true },
                },
                {
                    $set: {
                        sourceRef: vectorSourceRef(did, source.kind, source.key),
                        sourceEpoch: source.epoch,
                    },
                },
                { session: this.session }
            );
            if (
                await this.vectorReferences.findOne(
                    {
                        subjectRef: getPrivacySubjectRef(did),
                        collection,
                        pointId: { $in: ids },
                        deleted: true,
                    },
                    { session: this.session }
                )
            )
                throw new Error('Vector point permanently fenced');
        });
    }

    public async registerDeletedLegacyVectorPoints(
        did: string,
        collection: string,
        ids: (string | number)[]
    ) {
        await this.withOwnerWrite(did, async () => {
            await this.persistVectorReferences(did, collection, ids, this.session);
            await this.vectorReferences.updateMany(
                {
                    subjectRef: getPrivacySubjectRef(did),
                    collection,
                    pointId: { $in: ids },
                },
                { $set: { deleted: true } },
                { session: this.session }
            );
        });
    }

    /**
     * Legacy sweep: the owner's sources (credential URI -> embedding epoch) or
     * threads that still exist. Read-only.
     */
    public async presentLegacySweepSources(
        did: string,
        kind: 'credential' | 'thread',
        keys: string[]
    ): Promise<Map<string, string | undefined>> {
        await this.init();
        return this.findLegacySweepSources(did, kind, keys);
    }

    private async findLegacySweepSources(
        did: string,
        kind: 'credential' | 'thread',
        keys: string[],
        session?: ClientSession
    ): Promise<Map<string, string | undefined>> {
        const unique = [...new Set(keys)];
        const present = new Map<string, string | undefined>();
        if (!unique.length) return present;
        if (kind === 'credential') {
            const rows = await this.db
                .collection<Document>('credentials')
                .find(
                    { did, uri: { $in: unique } },
                    { projection: { _id: 0, uri: 1, embeddingEpoch: 1 }, session }
                )
                .toArray();
            for (const row of rows)
                present.set(
                    String(row.uri),
                    typeof row.embeddingEpoch === 'string' ? row.embeddingEpoch : undefined
                );
            return present;
        }
        const rows = await this.db
            .collection<Document>('threads')
            .find({ did, id: { $in: unique } }, { projection: { _id: 0, id: 1 }, session })
            .toArray();
        for (const row of rows) present.set(String(row.id), undefined);
        return present;
    }

    /**
     * Legacy sweep apply step. Rechecks each candidate inside the owner's write
     * transaction and records only the ones that still qualify as permanently
     * deleted references (the fence ledger). Returns the point IDs to fence.
     * - `source_missing` / `thread_missing`: the source or thread is still absent.
     * - `unshared`: the URI is still outside the owner's fresh consent receipt,
     *   and the point does not belong to the source's current incarnation (a
     *   re-share would reuse that incarnation's point IDs).
     */
    public async fenceSweptLegacyVectorPoints(
        did: string,
        collection: string,
        kind: 'credential' | 'thread',
        candidates: {
            id: string | number;
            key: string;
            reason: 'source_missing' | 'unshared' | 'thread_missing';
            sourceEpoch?: string;
        }[],
        sharedUris?: ReadonlySet<string>
    ): Promise<(string | number)[]> {
        if (!candidates.length) return [];
        return this.withOwnerWrite(did, async () => {
            const present = await this.findLegacySweepSources(
                did,
                kind,
                candidates.map(candidate => candidate.key),
                this.session
            );
            const accepted = candidates
                .filter(candidate => {
                    if (candidate.reason !== 'unshared') return !present.has(candidate.key);
                    if (!sharedUris || sharedUris.has(candidate.key)) return false;
                    const epoch = present.get(candidate.key);
                    return !(
                        present.has(candidate.key) &&
                        epoch !== undefined &&
                        candidate.sourceEpoch === epoch
                    );
                })
                .map(candidate => candidate.id);
            if (!accepted.length) return [];
            await this.persistVectorReferences(did, collection, accepted, this.session);
            await this.vectorReferences.updateMany(
                {
                    subjectRef: getPrivacySubjectRef(did),
                    collection,
                    pointId: { $in: accepted },
                },
                { $set: { deleted: true } },
                { session: this.session }
            );
            return accepted;
        });
    }

    /* Retired legacy collections: written before the explicit drop action
     * deletes a collection, and never removed. `dropping` blocks writes;
     * `dropped` also lets cleanup acknowledge references whose data is gone. */
    public async listRetiredVectorCollections(): Promise<
        { _id: string; state: 'dropping' | 'dropped' }[]
    > {
        await this.init();
        return this.db
            .collection<{ _id: string; state: 'dropping' | 'dropped' }>(
                'retired_vector_collections'
            )
            .find({}, { projection: { _id: 1, state: 1 } })
            .toArray();
    }

    public async markVectorCollectionRetired(
        collection: string,
        state: 'dropping' | 'dropped'
    ): Promise<void> {
        await this.init();
        try {
            await this.db.collection<Document>('retired_vector_collections').updateOne(
                // A dropped collection never goes back to dropping.
                { _id: collection as never, state: { $ne: 'dropped' } },
                { $set: { state, [`${state}At`]: new Date() } },
                { upsert: true, writeConcern: durableWriteConcern }
            );
        } catch (error) {
            if ((error as { code?: number }).code !== 11000) throw error;
        }
    }

    private async markSourceVectorsDeleted(did: string, kind: string, keys: string[]) {
        await this.vectorReferences.updateMany(
            {
                subjectRef: getPrivacySubjectRef(did),
                deleted: { $ne: true },
                [kind === 'thread' ? 'threadRef' : 'sourceRef']: {
                    $in: keys.map(key => vectorSourceRef(did, kind, key)),
                },
            },
            { $set: { deleted: true } },
            { session: this.session }
        );
    }

    // Ciphertext is retained only while discovery/remote fencing is incomplete.
    public async queueSourceVectorCleanup(
        did: string,
        kind: 'credential' | 'thread',
        keys: string[],
        reset = false
    ) {
        const { vectorInventory } = await import('../constants/collections');
        await this.withOwnerWrite(did, async () => {
            for (const key of new Set(keys)) {
                const _id = vectorSourceRef(did, kind, key);
                const task = await this.sourceCleanup.findOne({ _id }, { session: this.session });
                if (
                    !reset &&
                    (task ||
                        (await this.sourceCleanupReceipts.findOne(
                            { _id },
                            { session: this.session }
                        )))
                )
                    continue;
                const value: SourceCleanupTask = {
                    _id,
                    subjectRef: getPrivacySubjectRef(did),
                    kind,
                    revision: randomUUID(),
                    ...encryptCleanupScope(_id, { did, key }),
                    collections: vectorInventory
                        .filter(entry => (kind === 'credential') === (entry.ownerField === 'did'))
                        .map(entry => entry.collection),
                    collectionIndex: 0,
                    discoveryComplete: false,
                };
                await this.sourceCleanup.replaceOne({ _id }, value, {
                    upsert: true,
                    session: this.session,
                });
            }
        });
    }

    public async getSourceCleanupTask(did?: string) {
        await this.init();
        return this.sourceCleanup.findOne(did ? { subjectRef: getPrivacySubjectRef(did) } : {}, {
            sort: { _id: 1 },
        });
    }

    public async sourceCleanupSummary(did?: string) {
        await this.init();
        const owner = did ? { subjectRef: getPrivacySubjectRef(did) } : {};
        return {
            pendingTasks: await this.sourceCleanup.countDocuments(owner),
            pendingPoints: await this.vectorReferences.countDocuments({
                ...owner,
                deleted: true,
                cleanupComplete: { $ne: true },
            }),
        };
    }

    public async getDeletedSourceVectorReferences(did: string, limit = 256) {
        await this.init();
        const filter = {
            subjectRef: getPrivacySubjectRef(did),
            deleted: true,
            cleanupComplete: { $ne: true },
        };
        const first = await this.vectorReferences.findOne(filter, {
            sort: { collection: 1, pointId: 1 },
        });
        return first
            ? this.vectorReferences
                  .find({ ...filter, collection: first.collection })
                  .sort({ pointId: 1 })
                  .limit(limit)
                  .toArray()
            : [];
    }

    public async withSourceCleanupLease<T>(
        did: string,
        callback: (assertLease: () => Promise<void>) => Promise<T>
    ): Promise<T> {
        await this.init();
        const _id = getPrivacySubjectRef(did),
            token = randomUUID();
        let lease;
        try {
            lease = await this.sourceCleanupLeases.findOneAndUpdate(
                { _id, expiresAt: { $lte: new Date() } },
                { $set: { token, expiresAt: new Date(Date.now() + 60000) } },
                {
                    upsert: true,
                    returnDocument: 'after',
                    writeConcern: durableWriteConcern,
                }
            );
        } catch (error) {
            if ((error as { code?: number }).code === 11000)
                throw new Error('Source cleanup busy; retry');
            throw error;
        }
        if (!lease || lease.token !== token) throw new Error('Source cleanup busy; retry');
        const assertLease = async () => {
            if (
                !(await this.sourceCleanupLeases.findOne({
                    _id,
                    token,
                    expiresAt: { $gt: new Date() },
                }))
            )
                throw new Error('Source cleanup lease expired');
        };
        try {
            return await callback(assertLease);
        } finally {
            await this.sourceCleanupLeases.deleteOne(
                { _id, token },
                { writeConcern: durableWriteConcern }
            );
        }
    }

    public async acknowledgeSourceVectorFences(
        did: string,
        collection: string,
        ids: (string | number)[]
    ) {
        await this.withOwnerWrite(did, async () => {
            await this.vectorReferences.updateMany(
                {
                    subjectRef: getPrivacySubjectRef(did),
                    collection,
                    pointId: { $in: ids },
                    deleted: true,
                },
                { $set: { cleanupComplete: true } },
                { session: this.session }
            );
        });
    }

    public async advanceSourceCleanupTask(
        did: string,
        task: SourceCleanupTask,
        progress: {
            collectionIndex: number;
            offset?: string | number;
            discoveryComplete: boolean;
        }
    ) {
        await this.withOwnerWrite(did, async () => {
            const { offset, ...value } = progress;
            const result = await this.sourceCleanup.updateOne(
                {
                    _id: task._id,
                    revision: task.revision,
                    subjectRef: getPrivacySubjectRef(did),
                    collectionIndex: task.collectionIndex,
                    ...(task.offset === undefined
                        ? { offset: { $exists: false } }
                        : { offset: task.offset }),
                },
                {
                    $set: { ...value, ...(offset === undefined ? {} : { offset }) },
                    ...(offset === undefined ? { $unset: { offset: '' } } : {}),
                },
                { session: this.session }
            );
            if (!result.matchedCount) throw new Error('Cleanup scope changed; retry');
        });
    }

    public async finishSourceCleanupTask(did: string, task: SourceCleanupTask) {
        return this.withOwnerWrite(did, async () => {
            if (
                await this.vectorReferences.findOne(
                    {
                        subjectRef: getPrivacySubjectRef(did),
                        deleted: true,
                        cleanupComplete: { $ne: true },
                    },
                    { session: this.session }
                )
            )
                return false;
            const removed = await this.sourceCleanup.deleteOne(
                {
                    _id: task._id,
                    revision: task.revision,
                    discoveryComplete: true,
                    subjectRef: getPrivacySubjectRef(did),
                },
                { session: this.session }
            );
            if (removed.deletedCount)
                await this.sourceCleanupReceipts.updateOne(
                    { _id: task._id },
                    {
                        $setOnInsert: {
                            _id: task._id,
                            subjectRef: getPrivacySubjectRef(did),
                        },
                    },
                    { upsert: true, session: this.session }
                );
            return Boolean(removed.deletedCount);
        });
    }

    public async recoverSourceVectorCleanup(did: string, limit = 32) {
        const { recoverSourceVectorCleanup } = await import('./qdrant');
        return withOwnerOperation(did, () =>
            recoverSourceVectorCleanup({ did, limit, database: this })
        );
    }

    private async persistVectorReferences(
        did: string,
        collection: string,
        ids: (string | number)[],
        session?: ClientSession
    ): Promise<void> {
        if (!collection || ids.some(id => typeof id !== 'string' && typeof id !== 'number')) {
            throw new Error('Invalid vector references');
        }
        const subjectRef = getPrivacySubjectRef(did);
        for (const pointId of new Set(ids)) {
            await this.vectorReferences.updateOne(
                { subjectRef, collection, pointId },
                { $setOnInsert: { subjectRef, collection, pointId } },
                {
                    upsert: true,
                    ...(session ? { session } : { writeConcern: durableWriteConcern }),
                }
            );
        }
    }

    // Whole-owner erasure cannot use withOwnerWrite: its permanent guard is closed.
    // Only IDs from acknowledged remote fence batches may be passed here.
    public async acknowledgeErasedSourceVectorFences(
        did: string,
        collection: string,
        ids: (string | number)[]
    ): Promise<void> {
        await this.init();
        const subjectRef = getPrivacySubjectRef(did);
        if (!(await this.ownerGuards.findOne({ _id: subjectRef, erased: true })))
            throw new Error('Owner must be permanently fenced before erasure acknowledgement');
        await this.vectorReferences.updateMany(
            {
                subjectRef,
                collection,
                pointId: { $in: ids },
                deleted: true,
                cleanupComplete: { $ne: true },
            },
            { $set: { cleanupComplete: true } },
            { writeConcern: durableWriteConcern }
        );
    }

    public async registerErasedVectorPoints(
        did: string,
        collection: string,
        ids: (string | number)[]
    ): Promise<void> {
        await this.init();
        if (
            !(await this.ownerGuards.findOne({
                _id: getPrivacySubjectRef(did),
                erased: true,
            }))
        ) {
            throw new Error('Erased vector references require an existing owner fence');
        }
        // A permanent guard cannot become live again. Appending only opaque point
        // references after fencing is necessary to fence previously unregistered IDs.
        await this.persistVectorReferences(did, collection, ids);
    }

    private async assertOfflineMaintenance(): Promise<void> {
        if (!cache.redis || !(await cache.redis.exists(PRIVACY_MAINTENANCE_KEY))) {
            throw new Error('Offline privacy maintenance is required');
        }
    }

    public async registerLegacyVectorPoints(
        did: string,
        collection: string,
        ids: (string | number)[]
    ): Promise<void> {
        await this.assertOfflineMaintenance();
        await this.init();
        await this.persistVectorReferences(did, collection, ids);
    }

    public async getVectorPointReferences(
        did: string
    ): Promise<{ collection: string; ids: (string | number)[] }[]> {
        await this.init();
        const groups = new Map<string, (string | number)[]>();
        for await (const row of this.vectorReferences.find({
            subjectRef: getPrivacySubjectRef(did),
        })) {
            const ids = groups.get(row.collection) ?? [];
            ids.push(row.pointId);
            groups.set(row.collection, ids);
        }
        return [...groups].map(([collection, ids]) => ({ collection, ids }));
    }

    public async storeOwnerJobPayload(
        did: string,
        queue: string,
        payload: unknown
    ): Promise<string> {
        return this.withOwnerWrite(did, async () => {
            const referenceId = randomUUID();
            const iv = randomBytes(12);
            const cipher = createCipheriv('aes-256-gcm', getPrivacyKeyMaterial().ownerJob, iv);
            cipher.setAAD(Buffer.from(JSON.stringify([1, referenceId, did, queue])));
            const serialized = JSON.stringify(payload);
            if (serialized === undefined || !queue) throw new Error('Invalid queued payload');
            const ciphertext = Buffer.concat([cipher.update(serialized, 'utf8'), cipher.final()]);
            await this.ownerJobs.insertOne(
                {
                    referenceId,
                    did,
                    queue,
                    ciphertext: ciphertext.toString('base64'),
                    iv: iv.toString('base64'),
                    authTag: cipher.getAuthTag().toString('base64'),
                },
                { session: this.session }
            );
            return referenceId;
        });
    }

    public async getOwnerJobPayload(
        referenceId: string
    ): Promise<{ did: string; queue: string; payload: unknown } | null> {
        await this.init();
        const job = await this.ownerJobs.findOne({ referenceId });
        if (!job) return null;
        try {
            const decipher = createDecipheriv(
                'aes-256-gcm',
                getPrivacyKeyMaterial().ownerJob,
                Buffer.from(job.iv, 'base64')
            );
            decipher.setAAD(Buffer.from(JSON.stringify([1, job.referenceId, job.did, job.queue])));
            decipher.setAuthTag(Buffer.from(job.authTag, 'base64'));
            const payload: unknown = JSON.parse(
                Buffer.concat([
                    decipher.update(Buffer.from(job.ciphertext, 'base64')),
                    decipher.final(),
                ]).toString('utf8')
            );
            return { did: job.did, queue: job.queue, payload };
        } catch {
            throw new Error('Queued payload authentication failed');
        }
    }

    public async deleteOwnerJobPayload(did: string, referenceId: string): Promise<void> {
        await this.init();
        await this.ownerJobs.deleteOne({ did, referenceId }, { writeConcern: durableWriteConcern });
    }

    public async getOwnerJobReferences(
        did: string
    ): Promise<{ referenceId: string; queue: string }[]> {
        await this.init();
        return this.ownerJobs
            .find({ did }, { projection: { _id: 0, referenceId: 1, queue: 1 } })
            .toArray();
    }

    public async reserveExternalArtifact(
        did: string,
        artifact: { operationId: string; kind: string; credentialId: string }
    ): Promise<void> {
        await this.withOwnerWrite(did, async () => {
            await this.externalArtifacts.insertOne(
                {
                    subjectRef: getPrivacySubjectRef(did),
                    ...artifact,
                    status: 'reserved',
                    uris: [],
                    reservedAt: new Date().toISOString(),
                },
                { session: this.session }
            );
        });
    }

    public async completeExternalArtifact(
        did: string,
        operationId: string,
        result: { uris: string[]; status: 'complete' | 'failed' | 'unknown' }
    ): Promise<void> {
        await this.init();
        // Completion is intentionally legal after fencing, but cannot create an
        // artifact or overwrite a terminal record when a request is retried.
        const updated = await this.externalArtifacts.updateOne(
            {
                subjectRef: getPrivacySubjectRef(did),
                operationId,
                status: 'reserved',
            },
            {
                $set: {
                    uris: result.uris,
                    status: result.status,
                    completedAt: new Date().toISOString(),
                },
            },
            { writeConcern: durableWriteConcern }
        );
        if (!updated.matchedCount) throw new Error('External artifact reservation is unavailable');
    }

    public async recordExternalArtifactDeletion(
        did: string,
        operationId: string,
        deletion: ExternalArtifactDeletion
    ): Promise<void> {
        await this.init();
        const result = await this.externalArtifacts.updateOne(
            { subjectRef: getPrivacySubjectRef(did), operationId },
            [
                {
                    $set: {
                        deletion: {
                            $cond: [
                                { $eq: ['$deletion.status', 'deleted'] },
                                '$deletion',
                                { $literal: deletion },
                            ],
                        },
                    },
                },
            ],
            { writeConcern: durableWriteConcern }
        );
        if (!result.matchedCount) throw new Error('External artifact reservation is unavailable');
    }

    public async getExternalArtifacts(did: string): Promise<ExternalArtifact[]> {
        await this.init();
        return this.externalArtifacts.find({ subjectRef: getPrivacySubjectRef(did) }).toArray();
    }

    private async backfillLegacyExternalArtifacts(did: string): Promise<void> {
        const subjectRef = getPrivacySubjectRef(did);
        const references = new Map<string, { kind: string; uri: string; credentialId: string }>();
        const add = (value: unknown, hint: string, credentialId?: unknown) => {
            if (typeof value !== 'string' || !value || value.startsWith('aiinsight:')) return;
            // Network URI object types are explicit. Never interpret a credential ID
            // as a boost ID, or use a guessed URI to compensate for a lost result.
            const type = /^lc:network:.+\/trpc:(credential|boost):[^:]+$/.exec(value)?.[1];
            const kind =
                type === 'credential' ? 'contract-credential' : type === 'boost' ? 'boost' : hint;
            references.set(JSON.stringify([kind, value]), {
                kind,
                uri: value,
                credentialId: typeof credentialId === 'string' ? credentialId : value,
            });
        };
        const object = (value: unknown): Record<string, unknown> | undefined =>
            value !== null && typeof value === 'object' && !Array.isArray(value)
                ? (value as Record<string, unknown>)
                : undefined;
        for await (const thread of this.db.collection('threads').find({ did })) {
            add(thread.topicCredentialUri, 'legacy-generated');
            add(thread.pathwayCredentialUri, 'legacy-generated');
            if (Array.isArray(thread.pathwayUris))
                for (const uri of thread.pathwayUris) add(uri, 'legacy-generated');
            if (Array.isArray(thread.summaries)) {
                for (const value of thread.summaries) {
                    const summary = object(value);
                    if (!summary) continue;
                    add(summary.credential_uri, 'legacy-generated');
                    add(summary.boostId, 'boost');
                    if (Array.isArray(summary.pathwayUris))
                        for (const uri of summary.pathwayUris) add(uri, 'legacy-generated');
                }
            }
        }
        const linkedUris = new Set([...references.values()].map(({ uri }) => uri));
        for (const collection of [
            this.db.collection('credentials'),
            this.db.collection('raw_credentials'),
        ]) {
            for await (const row of collection.find({ did })) {
                if (row.source !== 'generated' && !linkedUris.has(row.uri)) continue;
                add(row.uri, 'legacy-generated', row.id);
                add(row.boostId, 'boost', row.id);
                const originals: unknown[] = [row.credential];
                if (typeof row.rawCredentialJson === 'string') {
                    try {
                        originals.push(JSON.parse(row.rawCredentialJson));
                    } catch {
                        /* Other evidence can still be recovered. */
                    }
                }
                for (const value of originals) {
                    const credential = object(value);
                    if (!credential) continue;
                    add(credential.boostId, 'boost', credential.id);
                    const inner = object(credential.boostCredential);
                    if (inner) add(inner.boostId, 'boost', inner.id);
                }
            }
        }
        const recordedUris = new Set(
            (await this.externalArtifacts.find({ subjectRef }).toArray()).flatMap(
                artifact => artifact.uris
            )
        );
        for (const { kind, uri, credentialId } of references.values()) {
            // Current publications already have authoritative reservations. Never
            // downgrade them into duplicate, uncertain legacy evidence during erasure.
            if (recordedUris.has(uri)) continue;
            const operationId = `legacy:${JSON.stringify([kind, uri])}`;
            await this.externalArtifacts.updateOne(
                { subjectRef, operationId },
                {
                    $setOnInsert: {
                        subjectRef,
                        operationId,
                        credentialId,
                        kind,
                        status: 'unknown',
                        uris: [uri],
                        reservedAt: new Date().toISOString(),
                    },
                },
                { upsert: true, writeConcern: durableWriteConcern }
            );
        }
    }

    public async migrateLegacyPrivacyData({ apply }: { apply: boolean }) {
        if (apply) await this.assertOfflineMaintenance();
        await this.connectCollections();
        const plaintext = {
            $or: [{ credential: { $exists: true } }, { rawCredentialJson: { $exists: true } }],
        };
        const obsoleteCache = {
            $or: [
                { did: { $exists: false } },
                { consentRevision: { $exists: false } },
                { ownerRefs: { $exists: true } },
            ],
        };
        const legacyCredentials = this.db.collection('credentials');
        const legacyRaw = this.db.collection('raw_credentials');
        const report = {
            apply,
            plaintextCredentials: await legacyCredentials.countDocuments(plaintext),
            plaintextRawCredentials: await legacyRaw.countDocuments({
                rawCredentialJson: { $exists: true },
            }),
            obsoleteSummaryCaches: await this.credentialSummaryCache.countDocuments(obsoleteCache),
            obsoletePromptCaches:
                await this.learnerContextPromptCache.countDocuments(obsoleteCache),
            unversionedMessages: await this.messages.countDocuments({
                consentRevision: { $exists: false },
            }),
            preservedOriginals: 0,
            unavailableOriginals: 0,
            resyncRequired: 0,
        };
        if (!apply) return report;
        // Key/configuration failures must never turn a recoverable original into a purge.
        getPrivacyKeyMaterial();
        await this.migration.run(true, async () => {
            // Group both collections before mutating either: a corrupt raw row must
            // never delete its recoverable credential sibling or make ordering matter.
            const groups = new Map<string, { did: string; uri: string }>();
            const unattributed: {
                collection: Collection<Document>;
                row: Document;
            }[] = [];
            for (const collection of [legacyRaw, legacyCredentials]) {
                for await (const row of collection.find(
                    collection === legacyRaw
                        ? { $or: [...plaintext.$or, { version: 1 }] }
                        : plaintext
                )) {
                    if (
                        typeof row.did !== 'string' ||
                        !row.did ||
                        typeof row.uri !== 'string' ||
                        !row.uri
                    ) {
                        const recoverable = [row.rawCredentialJson, row.credential].some(value => {
                            if (value === undefined) return false;
                            try {
                                VCValidator.parse(
                                    typeof value === 'string' ? JSON.parse(value) : value
                                );
                                return true;
                            } catch {
                                return false;
                            }
                        });
                        if (recoverable || row.version === 1)
                            throw new Error(
                                'Unattributed legacy original requires offline resolution'
                            );
                        unattributed.push({ collection, row });
                    } else {
                        groups.set(JSON.stringify([row.did, row.uri]), {
                            did: row.did,
                            uri: row.uri,
                        });
                    }
                }
            }
            // Preserve issued references even for owners with only thread history.
            const owners = new Set<string>();
            for (const collection of [legacyCredentials, this.db.collection('threads')]) {
                for await (const row of collection.find(
                    { did: { $type: 'string' } },
                    { projection: { did: 1 } }
                ))
                    if (row.did) owners.add(row.did);
            }
            for (const did of owners) {
                await this.assertOfflineMaintenance();
                await this.backfillLegacyExternalArtifacts(did);
            }
            for (const { did, uri } of groups.values()) {
                await this.assertOfflineMaintenance();
                if (
                    await this.ownerGuards.findOne({
                        _id: getPrivacySubjectRef(did),
                        erased: true,
                    })
                ) {
                    await this.deleteOwnerData(did, getPrivacySubjectRef(did));
                    report.unavailableOriginals += 1;
                    continue;
                }
                const outcome = await this.withOwnerWrite(did, async () => {
                    const rawRows = await legacyRaw
                        .find({ did, uri }, { session: this.session })
                        .toArray();
                    const credentialRows = await legacyCredentials
                        .find({ did, uri }, { session: this.session })
                        .toArray();
                    const needsResync = [...rawRows, ...credentialRows].some(
                        row => 'credential' in row || 'rawCredentialJson' in row
                    );
                    if (!needsResync && rawRows.length <= 1) return undefined;
                    const now = new Date();
                    const candidates: {
                        raw: string;
                        contentHash: string;
                        storedAt: Date;
                        envelope?: RawCredentialEnvelope;
                    }[] = [];
                    let unreadableEnvelope = false;
                    let ambiguousRetention = false;
                    for (const row of [...rawRows, ...credentialRows]) {
                        if (row.version === 1) {
                            if (row.expiresAt instanceof Date && row.expiresAt <= now) continue;
                            try {
                                const envelope = row as unknown as RawCredentialEnvelope;
                                const original = runWithAiPrivacyContext(did, () =>
                                    decryptRawCredential(
                                        did,
                                        uri,
                                        envelope.contentHash,
                                        envelope,
                                        now
                                    )
                                );
                                candidates.push({
                                    raw: original.rawCredentialJson,
                                    contentHash: envelope.contentHash,
                                    storedAt: new Date(envelope.storedAt),
                                    envelope,
                                });
                            } catch {
                                unreadableEnvelope = true;
                            }
                            continue;
                        }
                        const storedAt =
                            row.storedAt === undefined
                                ? new Date(now)
                                : typeof row.storedAt === 'string' || row.storedAt instanceof Date
                                  ? new Date(row.storedAt)
                                  : new Date(NaN);
                        let retentionUncertain =
                            !Number.isFinite(storedAt.getTime()) || storedAt > now;
                        if (storedAt.getTime() + 30 * 24 * 60 * 60 * 1000 <= now.getTime())
                            continue;
                        if (row.expiresAt !== undefined) {
                            const expiry =
                                row.expiresAt instanceof Date || typeof row.expiresAt === 'string'
                                    ? new Date(row.expiresAt)
                                    : new Date(NaN);
                            // Never extend an explicitly shorter retention interval.
                            if (expiry <= now) continue;
                            if (!Number.isFinite(expiry.getTime())) retentionUncertain = true;
                            if (expiry.getTime() < storedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
                                storedAt.setTime(expiry.getTime() - 30 * 24 * 60 * 60 * 1000);
                        }
                        // Some legacy rows contain both encodings, only one of them valid.
                        for (const value of [row.rawCredentialJson, row.credential]) {
                            if (value === undefined) continue;
                            try {
                                const raw =
                                    typeof value === 'string' ? value : JSON.stringify(value);
                                const parsed: unknown = JSON.parse(raw);
                                VCValidator.parse(parsed);
                                if (retentionUncertain) ambiguousRetention = true;
                                else
                                    candidates.push({
                                        raw,
                                        contentHash: fingerprintCredential(parsed as VC),
                                        storedAt,
                                    });
                            } catch {
                                // Invalid input cannot eclipse another recoverable candidate.
                            }
                        }
                    }
                    if (ambiguousRetention)
                        throw new Error('Legacy original retention requires offline resolution');
                    if (new Set(candidates.map(({ contentHash }) => contentHash)).size > 1)
                        throw new Error('Conflicting legacy originals require offline resolution');
                    if (unreadableEnvelope && candidates.length === 0)
                        throw new Error('Encrypted legacy original requires offline recovery');
                    // Prefer authenticated vault evidence, otherwise the oldest matching
                    // candidate, so duplicate rows cannot silently renew retention.
                    candidates.sort((a, b) => a.storedAt.getTime() - b.storedAt.getTime());
                    const selected = candidates.find(({ envelope }) => envelope) ?? candidates[0];
                    const envelope =
                        selected &&
                        (selected.envelope ??
                            runWithAiPrivacyContext(did, () =>
                                encryptRawCredential(
                                    did,
                                    uri,
                                    selected.contentHash,
                                    selected.raw,
                                    selected.storedAt
                                )
                            ));
                    await legacyRaw.deleteMany({ did, uri }, { session: this.session });
                    if (envelope) {
                        // Do not carry a legacy Mongo _id or plaintext fields into the vault.
                        const {
                            version,
                            contentHash,
                            storedAt,
                            expiresAt,
                            ciphertext,
                            iv,
                            authTag,
                        } = envelope;
                        await this.rawCredentials.insertOne(
                            {
                                version,
                                did,
                                uri,
                                contentHash,
                                storedAt,
                                expiresAt,
                                ciphertext,
                                iv,
                                authTag,
                            },
                            { session: this.session }
                        );
                    }
                    if (needsResync) {
                        await legacyCredentials.deleteMany({ did, uri }, { session: this.session });
                        await this.credentialVerifications.deleteMany(
                            { did, credentialUri: uri },
                            { session: this.session }
                        );
                        // Plans, summaries and completion markers are learner history, not
                        // model caches. Plan/message replay already checks consent revision.
                        await this.threads.updateMany(
                            { did },
                            {
                                $unset: {
                                    credentials: '',
                                    artifactSuggestions: '',
                                    credentialContextStatus: '',
                                    credentialSearchTopic: '',
                                },
                            },
                            { session: this.session }
                        );
                    }
                    await this.assertOfflineMaintenance();
                    return { preserved: Boolean(envelope), needsResync };
                });
                if (outcome) {
                    if (outcome.preserved) report.preservedOriginals += 1;
                    else report.unavailableOriginals += 1;
                    if (outcome.needsResync) report.resyncRequired += 1;
                }
            }
            for (const { collection, row } of unattributed) {
                await this.assertOfflineMaintenance();
                await collection.deleteOne({ _id: row._id }, { writeConcern: durableWriteConcern });
                report.unavailableOriginals += 1;
                report.resyncRequired += 1;
            }
            await this.threads.updateMany(
                { active: { $exists: false }, 'summaries.0': { $exists: true } },
                { $set: { active: false } },
                { writeConcern: durableWriteConcern }
            );
            await this.assertOfflineMaintenance();
            await this.credentialSummaryCache.deleteMany(obsoleteCache, {
                writeConcern: durableWriteConcern,
            });
            await this.learnerContextPromptCache.deleteMany(obsoleteCache, {
                writeConcern: durableWriteConcern,
            });
            // Keep attributable historical chat for owner reads/export. Missing
            // consent revisions already exclude it from every model-facing query.
            // Old globally-unique hash indexes prevent owner-scoped cache identities.
            for (const collection of [
                this.credentialSummaryCache,
                this.learnerContextPromptCache,
            ]) {
                if (!(await this.db.listCollections({ name: collection.collectionName }).hasNext()))
                    continue;
                for (const index of await collection.listIndexes().toArray()) {
                    if (
                        index.name !== '_id_' &&
                        Object.keys(index.key).length === 1 &&
                        index.key.hash === 1 &&
                        index.name
                    ) {
                        await collection.dropIndex(index.name);
                    }
                }
            }
        });
        // Unique constraints are installed only after duplicate reconciliation.
        await this.init();
        return report;
    }

    public async storeAiAuditEvent(event: AiAuditEvent): Promise<void> {
        await this.init();
        if (event.subjectRef === 'unauthenticated') {
            if (getCurrentAiSubject()) throw new Error('Audit owner mismatch');
            await this.aiAuditEvents.insertOne(event, {
                writeConcern: durableWriteConcern,
            });
            return;
        }
        await this.withOwnerWrite(this.mappingOwner(event.subjectRef), async () => {
            await this.aiAuditEvents.insertOne(event, { session: this.session });
        });
    }

    public async completeAiAuditEvent(
        eventId: string,
        terminal: AiAuditTerminal
    ): Promise<boolean> {
        await this.init();
        const result = await this.aiAuditEvents.updateOne(
            { eventId, outcome: 'pending' },
            { $set: terminal },
            { writeConcern: { w: 'majority', j: true, wtimeoutMS: 10_000 } }
        );
        return result.modifiedCount === 1;
    }

    public async reconcileAiAuditEvents(before: string, completedAt: string): Promise<number> {
        await this.init();
        const result = await this.aiAuditEvents.updateMany(
            { outcome: 'pending', timestamp: { $lte: before } },
            {
                $set: {
                    outcome: 'indeterminate',
                    errorClass: 'interrupted',
                    completedAt,
                },
            },
            { writeConcern: { w: 'majority', j: true, wtimeoutMS: 10_000 } }
        );
        return result.modifiedCount;
    }

    public async retainIdentifierMapping(
        candidate: EncryptedIdentifierMapping,
        now: Date
    ): Promise<EncryptedIdentifierMapping> {
        return this.withOwnerWrite(this.mappingOwner(candidate.subjectRef), async () => {
            const identity = {
                subjectRef: candidate.subjectRef,
                valueRef: candidate.valueRef,
            };
            await this.identifierMappings.deleteMany(
                { ...identity, expiresAt: { $lte: now } },
                { session: this.session }
            );
            const retained = await this.identifierMappings.findOneAndUpdate(
                identity,
                { $setOnInsert: candidate },
                { upsert: true, returnDocument: 'after', session: this.session }
            );
            if (!retained || retained.expiresAt <= now) {
                throw new Error('Identifier mapping persistence was not acknowledged');
            }
            return retained;
        });
    }

    public async getIdentifierMappings(
        subjectRef: string,
        tokens: string[],
        now: Date
    ): Promise<EncryptedIdentifierMapping[]> {
        await this.init();
        return this.identifierMappings
            .find({
                subjectRef,
                token: { $in: tokens },
                expiresAt: { $gt: now },
            })
            .toArray();
    }

    public async deleteIdentifierMappings(subjectRef: string): Promise<number> {
        await this.init();
        const result = await this.identifierMappings.deleteMany(
            { subjectRef },
            { writeConcern: { w: 'majority', j: true, wtimeoutMS: 10_000 } }
        );

        return result.deletedCount;
    }

    public async exportOwnerData(did: string, subjectRef: string) {
        assertRawCredentialOwner(did);
        if (getPrivacySubjectRef(did) !== subjectRef) throw new Error('Export owner mismatch');
        await this.init();
        const now = new Date();
        const [
            threads,
            messages,
            credentials,
            credentialVerifications,
            rawCredentials,
            aiAuditEvents,
            identifierMappings,
            credentialSummaryCache,
            learnerContextPromptCache,
            vectorReferences,
            jobReferences,
            externalArtifacts,
            ownerFence,
        ] = await Promise.all([
            this.threads.find({ did }).toArray(),
            this.messages.find({ did }).toArray(),
            this.credentials.find({ did }).toArray(),
            this.credentialVerifications.find({ did }).toArray(),
            this.rawCredentials.find({ did, expiresAt: { $gt: now } }).toArray(),
            this.aiAuditEvents.find({ subjectRef }).toArray(),
            this.identifierMappings.find({ subjectRef, expiresAt: { $gt: now } }).toArray(),
            this.credentialSummaryCache.find({ did }).toArray(),
            this.learnerContextPromptCache.find({ did }).toArray(),
            this.getVectorPointReferences(did),
            this.getOwnerJobReferences(did),
            this.getExternalArtifacts(did),
            this.ownerGuards.findOne({ _id: subjectRef }),
        ]);
        const ownerJobs = [];
        for (const { referenceId } of jobReferences) {
            const job = await this.getOwnerJobPayload(referenceId);
            if (job) ownerJobs.push({ referenceId, ...job });
        }
        return {
            threads,
            messages,
            credentials,
            credentialVerifications,
            aiAuditEvents,
            credentialSummaryCache,
            learnerContextPromptCache,
            vectorReferences,
            ownerJobs,
            externalArtifacts,
            ownerFence,
            rawCredentials: rawCredentials.map(entry => ({
                did,
                uri: entry.uri,
                contentHash: entry.contentHash,
                storedAt: entry.storedAt,
                expiresAt: entry.expiresAt,
                ...decryptRawCredential(did, entry.uri, entry.contentHash, entry, now),
            })),
            identifierMappings: identifierMappings.map(entry => ({
                token: entry.token,
                kind: entry.kind,
                createdAt: entry.createdAt,
                expiresAt: entry.expiresAt,
                value: decryptIdentifierMapping(entry, subjectRef),
            })),
        };
    }

    public async deleteOwnerData(did: string, subjectRef: string) {
        if (getPrivacySubjectRef(did) !== subjectRef) throw new Error('Deletion owner mismatch');
        await this.init();
        if (!(await this.ownerGuards.findOne({ _id: subjectRef, erased: true }))) {
            throw new Error('Owner writes must be fenced before deletion');
        }
        // Recovery references must be durable before their last local evidence goes.
        await this.backfillLegacyExternalArtifacts(did);
        const deleted: Record<string, number> = {};
        const stores: [string, Collection<Document>, Document][] = [
            ['threads', this.db.collection('threads'), { did }],
            ['messages', this.db.collection('messages'), { did }],
            ['credentials', this.db.collection('credentials'), { did }],
            ['credentialVerifications', this.db.collection('credential_verifications'), { did }],
            ['rawCredentials', this.db.collection('raw_credentials'), { did }],
            ['aiAuditEvents', this.db.collection('ai_audit_events'), { subjectRef }],
            ['identifierMappings', this.db.collection('identifier_mappings'), { subjectRef }],
            [
                'credentialSummaryCache',
                this.db.collection('credential_summary_cache'),
                { $or: [{ did }, { ownerRefs: subjectRef }] },
            ],
            [
                'learnerContextPromptCache',
                this.db.collection('learner_context_prompt_cache'),
                { $or: [{ did }, { ownerRefs: subjectRef }] },
            ],
            ['ownerJobs', this.db.collection('owner_job_payloads'), { did }],
            ['sourceVectorCleanup', this.db.collection('source_vector_cleanup'), { subjectRef }],
            [
                'sourceVectorCleanupReceipts',
                this.db.collection('source_vector_cleanup_receipts'),
                { subjectRef },
            ],
            [
                'sourceVectorCleanupLeases',
                this.db.collection('source_vector_cleanup_leases'),
                { _id: subjectRef },
            ],
        ];
        for (const [name, collection, filter] of stores) {
            deleted[name] = (
                await collection.deleteMany(filter, {
                    writeConcern: durableWriteConcern,
                })
            ).deletedCount;
        }
        return {
            deleted,
            retained: {
                ownerFence: 'minimal permanent write tombstone',
                vectorReferences: 'minimal permanent point fences',
                externalArtifacts: 'durable external-effect creation and cleanup ledger',
            },
            externalArtifacts: await this.getExternalArtifacts(did),
        };
    }

    /* ----------------------------- threads ------------------------------ */
    public async createThread(
        did: string,
        title = 'Untitled Thread',
        options: { active?: boolean; mode?: AiSessionMode } = {}
    ): Promise<string> {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            const id = this.newId();
            const now = new Date().toISOString();
            const threadData: Thread = {
                id,
                did,
                title,
                topicCredentialUri: null,
                created_at: now,
                last_message_at: now,
                mode: options.mode ?? AiSessionMode.tutor,
                active: options.active ?? false,
            };
            await this.threads.insertOne(threadData, { session: this.session });

            return id;
        });
    }

    public async getThreads(did: string): Promise<Thread[]> {
        await this.init();
        const result = (await this.threads
            .find({ did })
            .sort({ last_message_at: -1 })
            .toArray()) as Thread[];

        return result;
    }
    public async hasThread(did: string, threadId: string): Promise<boolean> {
        await this.init();

        return Boolean(
            await this.threads.findOne({ did, id: threadId }, { projection: { _id: 1 } })
        );
    }

    public async ownsSummaryCredential(did: string, credentialUri: string): Promise<boolean> {
        await this.init();

        return Boolean(
            await this.threads.findOne(
                { did, 'summaries.credential_uri': credentialUri },
                { projection: { _id: 1 } }
            )
        );
    }

    public async ownsBoost(did: string, boostUri: string): Promise<boolean> {
        await this.init();

        return Boolean(
            await this.credentials.findOne(
                {
                    did,
                    $or: [{ uri: boostUri }, { boostId: boostUri }],
                },
                { projection: { _id: 1 } }
            )
        );
    }
    public async endActiveThreads(did: string): Promise<string[]> {
        return this.withOwnerWrite(did, async () => {
            await this.init();

            const activeFilter = {
                did,
                $or: [
                    { active: true },
                    {
                        active: { $exists: false },
                        ended_at: { $exists: false },
                        'summaries.0': { $exists: false },
                    },
                ],
            };
            const activeThreads = await this.threads
                .find(activeFilter, { projection: { id: 1 }, session: this.session })
                .toArray();
            const threadIds = activeThreads.map(({ id }) => id);

            if (threadIds.length === 0) return [];

            await this.threads.updateMany(
                { ...activeFilter, id: { $in: threadIds } },
                {
                    $set: {
                        active: false,
                        ended_at: new Date().toISOString(),
                    },
                },
                { session: this.session }
            );

            return threadIds;
        });
    }

    public async endThread(threadId: string, did: string): Promise<void> {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            const result = await this.threads.updateOne(
                { id: threadId, did },
                {
                    $set: {
                        active: false,
                        ended_at: new Date().toISOString(),
                    },
                },
                { session: this.session }
            );

            if (result.matchedCount === 0) {
                throw new Error('Thread not found');
            }
        });
    }

    public async isThreadEnded(threadId: string, did: string): Promise<boolean> {
        await this.init();
        const thread = await this.threads.findOne(
            { id: threadId, did },
            { projection: { active: 1, ended_at: 1 } }
        );

        return Boolean(thread && (thread.active === false || thread.ended_at));
    }

    public async deleteThread(did: string, threadId: string): Promise<boolean> {
        const deleted = await this.withOwnerWrite(did, async () => {
            await this.init();
            const exists = Boolean(
                await this.threads.findOne({ did, id: threadId }, { session: this.session })
            );
            const pending = await this.sourceCleanup.findOne(
                { _id: vectorSourceRef(did, 'thread', threadId) },
                { session: this.session }
            );
            if (exists || pending)
                await this.queueSourceVectorCleanup(did, 'thread', [threadId], exists);
            await this.markSourceVectorsDeleted(did, 'thread', [threadId]);
            const threadResult = await this.threads.deleteOne(
                { did, id: threadId },
                { session: this.session }
            );

            if (threadResult.deletedCount === 0) return false;

            await this.messages.deleteMany({ did, threadId }, { session: this.session });

            return true;
        });
        if (
            deleted ||
            (await this.sourceCleanup.findOne({
                _id: vectorSourceRef(did, 'thread', threadId),
            }))
        ) {
            const { deleteThreadEmbeddings } = await import('./qdrant');
            await withOwnerOperation(did, () => deleteThreadEmbeddings(did, threadId, this));
        }
        return deleted;
    }

    public async updateThreadTitle(did: string, threadId: string, title: string) {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            await this.threads.updateOne(
                { did, id: threadId },
                { $set: { title } },
                { session: this.session }
            );
        });
    }

    public async updateThreadTopicCredentialUri(did: string, threadId: string, uri: string) {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            await this.threads.updateOne(
                { did, id: threadId },
                { $set: { topicCredentialUri: uri } },
                { session: this.session }
            );
        });
    }

    public async getThreadTopicCredential(
        did: string,
        threadId: string
    ): Promise<string | undefined> {
        await this.init();
        const doc = await this.threads.findOne(
            { did, id: threadId },
            { projection: { topicCredentialUri: 1 } }
        );

        return doc?.topicCredentialUri ?? undefined;
    }

    public async getThreadMode(did: string, threadId: string): Promise<AiSessionMode | undefined> {
        await this.init();

        const thread = await this.threads.findOne(
            { did, id: threadId },
            { projection: { mode: 1 } }
        );

        return thread?.mode;
    }

    /* ---------------------------- messages ----------------------------- */
    public async addMessage(did: string, threadId: string, message: ChatMessage) {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            assertRawCredentialOwner(did);
            const receipt = await assertCurrentAiConsent('model-inference');
            const createdAt = new Date().toISOString();
            const threadResult = await this.threads.updateOne(
                { did, id: threadId },
                { $set: { last_message_at: createdAt } },
                { session: this.session }
            );

            if (threadResult.matchedCount === 0) throw new Error('Thread not found');

            await this.messages.insertOne(
                {
                    ...message,
                    id: this.newId(),
                    did,
                    threadId,
                    created_at: createdAt,
                    consentRevision: receipt.revision,
                },
                { session: this.session }
            );
        });
    }

    public async getMessages(did: string, threadId: string): Promise<DBMessage[]> {
        await this.init();
        const result = await this.messages
            .find({ did, threadId })
            .sort({ created_at: 1 })
            .toArray();

        return result;
    }

    public async getMessagesByIds(
        did: string,
        ids: string[],
        threadId?: string
    ): Promise<DBMessage[]> {
        assertRawCredentialOwner(did);
        const receipt = await assertCurrentAiConsent('model-inference');
        await this.init();
        if (ids.length === 0) return [];

        return this.messages
            .find({
                did,
                consentRevision: receipt.revision,
                id: { $in: ids },
                ...(threadId ? { threadId } : {}),
            })
            .toArray();
    }

    public async getModelMessages(did: string, threadId: string): Promise<DBMessage[]> {
        assertRawCredentialOwner(did);
        const receipt = await assertCurrentAiConsent('model-inference');
        await this.init();
        // Historical messages remain available to the owner through getMessages,
        // but cannot reintroduce withdrawn source facts into a later model request.
        return this.messages
            .find({ did, threadId, consentRevision: receipt.revision })
            .sort({ created_at: 1 })
            .toArray();
    }

    /* ------------------------ verifiable credentials ------------------- */
    public async storeVC(did: string, vc: DBCredentialRecord) {
        const replacedVersion = await this.withOwnerWrite(did, async () => {
            assertRawCredentialOwner(did);
            getCredentialProjection(vc);
            await this.init();
            const {
                _id: _mongoId,
                credential,
                rawCredentialJson: _raw,
                ...storedVc
            } = vc as DBCredentialRecord & { _id?: unknown };
            const previous = await this.credentials.findOne(
                { did, uri: vc.uri },
                { session: this.session }
            );
            const changed =
                !previous ||
                previous.verification?.contentHash !== vc.verification?.contentHash ||
                previous.verification?.consent.revision !== vc.verification?.consent.revision;
            if (changed) {
                if (previous)
                    await this.queueSourceVectorCleanup(did, 'credential', [vc.uri], true);
                await this.markSourceVectorsDeleted(did, 'credential', [vc.uri]);
            }
            const embeddingEpoch = changed
                ? randomUUID()
                : (previous.embeddingEpoch ?? randomUUID());
            const rawContentHash = fingerprintCredential(credential);
            await this.storeRawCredential(did, {
                uri: vc.uri,
                contentHash: rawContentHash,
                rawCredentialJson: JSON.stringify(credential),
            });
            await this.credentials.updateOne(
                { did, uri: vc.uri },
                {
                    $set: {
                        ...storedVc,
                        embeddingEpoch,
                        did,
                        rawContentHash,
                        ...(typeof credential.boostId === 'string'
                            ? { boostId: credential.boostId }
                            : {}),
                    },
                    $unset: { credential: '', rawCredentialJson: '' },
                },
                { upsert: true, session: this.session }
            );
            return changed && Boolean(previous);
        });
        if (replacedVersion) {
            const { deleteCredentialEmbeddings } = await import('./qdrant');
            await withOwnerOperation(did, () => deleteCredentialEmbeddings(did, [vc.uri], this));
        } else if (
            (await this.sourceCleanupSummary(did)).pendingTasks ||
            (await this.sourceCleanupSummary(did)).pendingPoints
        ) {
            const { fenceDeletedSourceVectors } = await import('./qdrant');
            await withOwnerOperation(did, () => fenceDeletedSourceVectors(did, this));
        }
    }

    private async hydrateCredential(
        did: string,
        record: StoredCredentialRecord
    ): Promise<DBCredentialRecord | null> {
        assertRawCredentialOwner(did);
        const envelope = await this.rawCredentials.findOne({
            did,
            uri: record.uri,
            contentHash: record.rawContentHash,
            expiresAt: { $gt: new Date() },
        });
        if (!envelope) return null;
        const { rawContentHash, boostId: _boostId, ...metadata } = record;
        return {
            ...metadata,
            ...decryptRawCredential(did, record.uri, rawContentHash, envelope),
        };
    }

    /**
     * Every credential the learner holds, hydrated from the raw vault. A row whose
     * retained raw credential is missing or expired is skipped, not fatal; only
     * the count is logged. A vault that fails to decrypt still throws.
     */
    public async getVCs(did: string): Promise<DBCredentialRecord[]> {
        assertRawCredentialOwner(did);
        await this.init();
        const records = await this.credentials.find({ did }).toArray();
        const hydrated = await Promise.all(
            records.map(record => this.hydrateCredential(did, record))
        );
        const available = hydrated.filter(
            (record): record is DBCredentialRecord => record !== null
        );
        const unavailable = hydrated.length - available.length;
        if (unavailable > 0)
            logSafeEvent('warn', 'credential_raw_unavailable', {
                count: unavailable,
            });
        return available;
    }

    /**
     * The stored ingest-time `aiContext` for just these URIs. Reads the metadata
     * rows only: nothing is hydrated from the raw vault. A row with no stored
     * text (a legacy row repaired with only its projection) gets the text ingest
     * would have stored: its stored projection, serialized, when that projection
     * passed verification at ingest. `fromProjection` marks those.
     */
    public async getCredentialAiContexts(
        did: string,
        uris: readonly string[]
    ): Promise<
        {
            uri: string;
            aiContext?: string;
            category?: string;
            fromProjection?: true;
        }[]
    > {
        assertRawCredentialOwner(did);
        if (uris.length === 0) return [];
        await this.init();
        const rows = await this.credentials
            .find(
                { did, uri: { $in: [...new Set(uris)] } },
                {
                    projection: {
                        _id: 0,
                        uri: 1,
                        aiContext: 1,
                        projection: 1,
                        verification: 1,
                    },
                }
            )
            .toArray();
        return rows.map(({ uri, aiContext, projection, verification }) => {
            let stored: ModelSafeCredentialProjection | undefined;
            try {
                // Same check every stored row passed in storeVC: a valid projection
                // whose ingest-time verification is valid and proof-checked.
                stored = getCredentialProjection({
                    category: '',
                    uri,
                    projection,
                    verification,
                });
            } catch {
                stored = undefined;
            }
            const category = stored ? { category: stored.category } : {};
            if (typeof aiContext === 'string' && aiContext.trim())
                return { uri, aiContext, ...category };
            if (stored)
                return {
                    uri,
                    aiContext: serializeModelSafeCredentialProjection(stored),
                    ...category,
                    fromProjection: true as const,
                };
            return { uri, ...(typeof aiContext === 'string' ? { aiContext } : {}) };
        });
    }

    public async getCredentialRecords(
        did: string
    ): Promise<Omit<DBCredentialRecord, 'credential' | 'rawCredentialJson'>[]> {
        assertRawCredentialOwner(did);
        await this.init();
        return this.credentials
            .find(
                { did },
                {
                    projection: {
                        credential: 0,
                        rawCredentialJson: 0,
                        rawContentHash: 0,
                    },
                }
            )
            .toArray();
    }

    public async getEmbeddingCredentialVersion(did: string, uri: string) {
        assertRawCredentialOwner(did);
        await this.init();
        const record = await this.credentials.findOne(
            { did, uri },
            { projection: { verification: 1, embeddingEpoch: 1 } }
        );
        return record?.verification
            ? { ...record.verification, embeddingEpoch: record.embeddingEpoch }
            : undefined;
    }

    public async getEmbeddingBackfillSource(did: string, _kind: 'credentials', id: ObjectId) {
        assertRawCredentialOwner(did);
        await this.init();
        return this.credentials.findOne(
            { _id: id, did },
            {
                projection: {
                    credential: 0,
                    rawCredentialJson: 0,
                    rawContentHash: 0,
                },
            }
        );
    }

    /** Fence workflow authority in the SAME transaction as source/item changes. */
    private async fenceWorkflowItem(
        operation: WorkflowOperation,
        id: ObjectId,
        state: 'pending' | 'embedding_ready'
    ) {
        const run = await this.db.collection('embedding_backfill_runs').updateOne(
            {
                _id: operation.runId,
                workflowVersion: 2,
                state: 'running',
                lease: operation.lease,
                leaseUntil: { $gt: new Date() },
                processed: operation.index,
            } as Document,
            { $inc: { workflowFence: 1 } },
            { session: this.session }
        );
        if (run.matchedCount !== 1) throw new Error('Workflow lease expired');
        const item = await this.db.collection('embedding_backfill_items').findOne(
            {
                _id: `${operation.runId}:${operation.index}`,
                runId: operation.runId,
                index: operation.index,
                sourceId: String(id),
                initialFingerprint: operation.initialFingerprint,
                state,
            } as Document,
            { session: this.session }
        );
        if (!item) throw new Error('Workflow item changed');
    }

    /** Exact retained original for a reviewed generated item; reads never renew retention. */
    public async getWorkflowRetainedOriginal(
        did: string,
        id: ObjectId,
        initialFingerprint: string,
        contentHash: string,
        operation: WorkflowOperation
    ): Promise<VC | null> {
        if (
            operation.initialFingerprint !== initialFingerprint ||
            operation.originalHash !== contentHash ||
            !/^[0-9a-f]{64}$/.test(contentHash)
        )
            throw new Error('Generated original evidence mismatch');
        return this.withOwnerWrite(did, async () => {
            assertRawCredentialOwner(did);
            const current = await this.credentials.findOne(
                { _id: id, did },
                { session: this.session, projection: WORKFLOW_SOURCE_PROJECTION }
            );
            if (
                !current ||
                workflowSourceFingerprint(current) !== initialFingerprint ||
                (current.rawContentHash !== undefined && current.rawContentHash !== contentHash)
            )
                return null;
            await this.fenceWorkflowItem(operation, id, 'pending');
            const item = await this.db.collection('embedding_backfill_items').findOne(
                {
                    _id: `${operation.runId}:${operation.index}`,
                    originalHash: contentHash,
                } as Document,
                { session: this.session }
            );
            if (!item) throw new Error('Generated original evidence mismatch');
            const envelope = await this.rawCredentials.findOne(
                { did, uri: current.uri, contentHash, expiresAt: { $gt: new Date() } },
                { session: this.session }
            );
            if (!envelope) return null;
            const original = decryptRawCredential(
                did,
                current.uri,
                contentHash,
                envelope
            ).credential;
            await this.fenceWorkflowItem(operation, id, 'pending');
            return original;
        });
    }

    /**
     * Same source/item evidence checks as getWorkflowRetainedOriginal, for when
     * the retained raw copy is gone and the caller reads the original from
     * LearnCard instead. The planned content hash stays the integrity anchor.
     */
    public async confirmWorkflowGeneratedSource(
        did: string,
        id: ObjectId,
        initialFingerprint: string,
        contentHash: string,
        operation: WorkflowOperation
    ): Promise<boolean> {
        if (
            operation.initialFingerprint !== initialFingerprint ||
            operation.originalHash !== contentHash ||
            !/^[0-9a-f]{64}$/.test(contentHash)
        )
            throw new Error('Generated original evidence mismatch');
        return this.withOwnerWrite(did, async () => {
            assertRawCredentialOwner(did);
            const current = await this.credentials.findOne(
                { _id: id, did },
                { session: this.session, projection: WORKFLOW_SOURCE_PROJECTION }
            );
            if (
                !current ||
                workflowSourceFingerprint(current) !== initialFingerprint ||
                (current.rawContentHash !== undefined && current.rawContentHash !== contentHash)
            )
                return false;
            await this.fenceWorkflowItem(operation, id, 'pending');
            const item = await this.db.collection('embedding_backfill_items').findOne(
                {
                    _id: `${operation.runId}:${operation.index}`,
                    originalHash: contentHash,
                } as Document,
                { session: this.session }
            );
            if (!item) throw new Error('Generated original evidence mismatch');
            return true;
        });
    }

    /** Resolve an already-verified source without hydrating its original. */
    public async prepareWorkflowEmbedding(
        did: string,
        id: ObjectId,
        initialFingerprint: string,
        revision: string,
        recheckConsent: () => Promise<void>,
        operation: WorkflowOperation
    ) {
        if (operation.initialFingerprint !== initialFingerprint)
            throw new Error('Workflow fingerprint mismatch');
        return this.withOwnerWrite(
            did,
            async () => {
                assertRawCredentialOwner(did);
                const current = await this.credentials.findOne(
                    { _id: id, did },
                    { session: this.session, projection: WORKFLOW_SOURCE_PROJECTION }
                );
                if (
                    !current ||
                    workflowSourceFingerprint(current) !== initialFingerprint ||
                    metadataExclusionReason(current as unknown as RunSource) ||
                    current.verification?.consent.revision !== revision
                )
                    return false;
                await recheckConsent();
                await this.fenceWorkflowItem(operation, id, 'pending');
                const source = await this.getVectorSource(did, 'credential', current.uri, {
                    contentHash: current.verification!.contentHash,
                    consentRevision: revision,
                    epoch: current.embeddingEpoch,
                });
                const changed = await this.db.collection('embedding_backfill_items').updateOne(
                    {
                        _id: `${operation.runId}:${operation.index}`,
                        state: 'pending',
                        initialFingerprint,
                    } as Document,
                    {
                        $set: {
                            state: 'embedding_ready',
                            revision,
                            resolvedFingerprint: runSourceFingerprint({
                                ...current,
                                embeddingEpoch: source.epoch,
                            }),
                        },
                    },
                    { session: this.session }
                );
                if (changed.matchedCount !== 1) throw new Error('Workflow item changed');
                await this.fenceWorkflowItem(operation, id, 'embedding_ready');
                return true;
            },
            recheckConsent
        );
    }

    /** Metadata-only legacy repair; never hydrate or extend raw retention. */
    public async commitLegacyVerification(
        did: string,
        id: ObjectId,
        expectedFingerprint: string,
        verification: CredentialVerificationMetadata,
        projection: ModelSafeCredentialProjection,
        recheckConsent: () => Promise<void>,
        operation: { jobId: string; lease: string } | WorkflowOperation
    ) {
        if (
            !operation ||
            !('runId' in operation ? operation.runId : operation.jobId) ||
            !operation.lease
        )
            throw new Error('Repair operation required');
        return this.withOwnerWrite(
            did,
            async () => {
                assertRawCredentialOwner(did);
                const managed = 'runId' in operation;
                const current = await this.credentials.findOne(
                    { _id: id, did },
                    {
                        session: this.session,
                        projection: managed ? WORKFLOW_SOURCE_PROJECTION : REPAIR_SOURCE_PROJECTION,
                    }
                );
                const generated =
                    current?.source === 'generated' ||
                    current?.category === AI_INSIGHT_CREDENTIAL_TYPE;
                if (
                    !current ||
                    (!managed && generated) ||
                    current.verification ||
                    repairSourceFingerprint(current) !== expectedFingerprint ||
                    (managed &&
                        workflowSourceFingerprint(current) !== operation.initialFingerprint) ||
                    (generated && verification.provenance.source !== 'generated')
                )
                    return false;
                if (
                    verification.status !== 'valid' ||
                    !verification.checks.includes('proof') ||
                    verification.credentialUri !== current.uri
                )
                    throw new Error('Verified repair provenance required');
                await recheckConsent();
                if (managed) {
                    await this.fenceWorkflowItem(operation, id, 'pending');
                    const epoch = randomUUID();
                    // Only the verified historical-generated branch may repair this
                    // missing provenance discriminator. Existing labels are preserved.
                    const source =
                        generated && current.source === undefined
                            ? ('generated' as const)
                            : current.source;
                    const changed = await this.db.collection('embedding_backfill_items').updateOne(
                        {
                            _id: `${operation.runId}:${operation.index}`,
                            runId: operation.runId,
                            sourceId: String(id),
                            state: 'pending',
                            initialFingerprint: operation.initialFingerprint,
                            repairFingerprint: expectedFingerprint,
                            revision: verification.consent.revision,
                            ...(generated ? { originalHash: verification.contentHash } : {}),
                        } as Document,
                        {
                            $set: {
                                state: 'embedding_ready',
                                repaired: true,
                                resolvedFingerprint: runSourceFingerprint({
                                    ...current,
                                    source,
                                    verification,
                                    projection,
                                    embeddingEpoch: epoch,
                                }),
                            },
                        },
                        { session: this.session }
                    );
                    if (changed.matchedCount !== 1)
                        throw new Error('Workflow repair claim changed');
                    await this.credentials.updateOne(
                        { _id: id, did },
                        {
                            $set: {
                                verification,
                                projection,
                                embeddingEpoch: epoch,
                                ...(source ? { source } : {}),
                            },
                        },
                        { session: this.session }
                    );
                    await this.credentialVerifications.updateOne(
                        { did, credentialUri: current.uri },
                        { $set: { did, ...verification } },
                        { upsert: true, session: this.session }
                    );
                    await this.fenceWorkflowItem(operation, id, 'embedding_ready');
                    return true;
                }
                const repairJobs = this.db.collection('embedding_legacy_repair_jobs');
                const job = await repairJobs.findOne(
                    {
                        _id: operation.jobId,
                        lease: operation.lease,
                        candidate: String(id),
                        fingerprint: expectedFingerprint,
                        revision: verification.consent.revision,
                        leaseUntil: { $gt: new Date() },
                        state: 'paused',
                        scanned: { $lt: 100 },
                    } as Document,
                    { session: this.session }
                );
                if (!job) throw new Error('Repair operation expired');
                const checkpoint = await repairJobs.updateOne(
                    {
                        _id: operation.jobId,
                        lease: operation.lease,
                        leaseUntil: { $gt: new Date() },
                    } as Document,
                    {
                        $inc: { scanned: 1, repaired: 1, 'outcomes.repaired': 1 },
                        $set: {
                            cursor: String(id),
                            state: job.scanned >= 99 ? 'completed' : 'paused',
                        },
                        $unset: { candidate: '', fingerprint: '', revision: '' },
                    },
                    { session: this.session }
                );
                if (checkpoint.matchedCount !== 1) throw new Error('Repair operation expired');
                await this.credentials.updateOne(
                    { _id: id, did },
                    {
                        $set: {
                            verification,
                            projection,
                            embeddingEpoch: randomUUID(),
                        },
                    },
                    { session: this.session }
                );
                await this.credentialVerifications.updateOne(
                    { did, credentialUri: current.uri },
                    { $set: { did, ...verification } },
                    { upsert: true, session: this.session }
                );
                return true;
            },
            recheckConsent
        );
    }

    public async getCredentialVerification(
        did: string,
        credentialUri: string
    ): Promise<DBCredentialVerificationRecord | null> {
        await this.init();
        return this.credentialVerifications.findOne(
            { did, credentialUri },
            { session: this.session }
        );
    }

    public async storeCredentialVerification(
        did: string,
        verification: CredentialVerificationMetadata,
        beforeWrite?: () => Promise<void>
    ): Promise<void> {
        return this.withOwnerWrite(
            did,
            async () => {
                await this.init();
                await this.credentialVerifications.updateOne(
                    { did, credentialUri: verification.credentialUri },
                    { $set: { ...verification, did } },
                    { upsert: true, session: this.session }
                );
            },
            beforeWrite
        );
    }

    public async storeRawCredential(
        did: string,
        { uri, contentHash, rawCredentialJson }: Omit<DBRawCredentialRecord, 'did' | 'storedAt'>,
        beforeWrite?: () => Promise<void>
    ): Promise<void> {
        return this.withOwnerWrite(
            did,
            async () => {
                assertRawCredentialOwner(did);
                const envelope = encryptRawCredential(did, uri, contentHash, rawCredentialJson);
                await this.init();
                await this.rawCredentials.replaceOne({ did, uri }, envelope, {
                    upsert: true,
                    session: this.session,
                });
            },
            beforeWrite
        );
    }

    public async deleteVCsByUris(did: string, uris: string[]): Promise<number> {
        const deleted = await this.withOwnerWrite(did, async () => {
            await this.init();
            if (!uris.length) return 0;
            for (const uri of new Set(uris)) {
                const exists = Boolean(
                    await this.credentials.findOne({ did, uri }, { session: this.session })
                );
                await this.queueSourceVectorCleanup(did, 'credential', [uri], exists);
            }
            await this.markSourceVectorsDeleted(did, 'credential', uris);
            const result = await this.credentials.deleteMany(
                {
                    did,
                    uri: { $in: uris },
                },
                { session: this.session }
            );
            await this.credentialVerifications.deleteMany(
                {
                    did,
                    credentialUri: { $in: uris },
                },
                { session: this.session }
            );
            await this.rawCredentials.deleteMany(
                { did, uri: { $in: uris } },
                { session: this.session }
            );
            return result.deletedCount ?? 0;
        });
        if (uris.length) {
            const { deleteCredentialEmbeddings } = await import('./qdrant');
            await withOwnerOperation(did, () => deleteCredentialEmbeddings(did, uris, this));
        }
        return deleted;
    }

    public async getCredentialTitle(
        did: string,
        uri: string,
        titleContextHash: string
    ): Promise<string | null> {
        await this.init();
        const doc = await this.credentials.findOne(
            { did, uri, titleContextHash },
            { projection: { title: 1 } }
        );
        return (doc?.title as string) || null;
    }

    public async updateCredentialTitle(
        did: string,
        uri: string,
        title: string,
        titleContextHash: string
    ) {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            await this.credentials.updateOne(
                { did, uri },
                { $set: { title, titleContextHash } },
                { session: this.session }
            );
        });
    }

    public async getCredentialSummaryByHash(
        did: string,
        consentRevision: string,
        hash: string
    ): Promise<DBCredentialSummaryCache | null> {
        await this.init();
        return this.credentialSummaryCache.findOne({
            did,
            consentRevision,
            hash,
            expiresAt: { $gt: new Date() },
        });
    }

    public async upsertCredentialSummaryByHash(
        input: Pick<
            DBCredentialSummaryCache,
            'did' | 'consentRevision' | 'hash' | 'summary' | 'model' | 'version'
        >
    ) {
        return this.withOwnerWrite(input.did, async () => {
            await this.init();
            const now = new Date().toISOString();

            await this.credentialSummaryCache.updateOne(
                {
                    did: input.did,
                    consentRevision: input.consentRevision,
                    hash: input.hash,
                },
                {
                    $set: {
                        summary: input.summary,
                        model: input.model,
                        version: input.version,
                        updated_at: now,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                    $setOnInsert: {
                        created_at: now,
                    },
                },
                { upsert: true, session: this.session }
            );
        });
    }

    public async getLearnerContextPromptByHash(
        did: string,
        consentRevision: string,
        hash: string
    ): Promise<DBLearnerContextPromptCache | null> {
        await this.init();
        return this.learnerContextPromptCache.findOne({
            did,
            consentRevision,
            hash,
            expiresAt: { $gt: new Date() },
        });
    }

    public async upsertLearnerContextPromptByHash(
        input: Pick<
            DBLearnerContextPromptCache,
            'did' | 'consentRevision' | 'hash' | 'prompt' | 'metadata' | 'model' | 'version'
        >
    ): Promise<void> {
        return this.withOwnerWrite(input.did, async () => {
            await this.init();
            const now = new Date().toISOString();

            await this.learnerContextPromptCache.updateOne(
                {
                    did: input.did,
                    consentRevision: input.consentRevision,
                    hash: input.hash,
                },
                {
                    $set: {
                        prompt: input.prompt,
                        metadata: input.metadata,
                        model: input.model,
                        version: input.version,
                        updated_at: now,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                    $setOnInsert: {
                        created_at: now,
                    },
                },
                { upsert: true, session: this.session }
            );
        });
    }

    public async getLatestCredentialByType(
        did: string,
        category: string
    ): Promise<DBCredentialRecord | null> {
        assertRawCredentialOwner(did);
        await this.init();
        const document = await this.credentials
            .find({ did, category })
            .sort({ createdAt: -1 })
            .limit(1)
            .next();
        return document ? this.hydrateCredential(did, document) : null;
    }

    public async getGeneratedCredentialByFingerprint(
        did: string,
        category: string,
        sourceFingerprint: string
    ): Promise<DBCredentialRecord | null> {
        assertRawCredentialOwner(did);
        await this.init();

        const document = await this.credentials.findOne({
            did,
            category,
            source: 'generated',
            sourceFingerprint,
        });
        return document ? this.hydrateCredential(did, document) : null;
    }

    /* --------------------- thread credential embeddings --------------- */
    public async storeThreadCredentials(
        did: string,
        threadId: string,
        creds: ThreadCredentialContext[]
    ) {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            const credentialState = creds.length > 0 ? 'ready' : 'empty';
            await this.threads.updateOne(
                { did, id: threadId },
                {
                    $set: {
                        credentials: creds,
                        credentialContextStatus: credentialState,
                    },
                },
                { session: this.session }
            );
        });
    }

    public async getThreadCredentials(
        did: string,
        threadId: string
    ): Promise<ThreadCredentialContext[]> {
        assertRawCredentialOwner(did);
        const receipt = await assertCurrentAiConsent('model-inference');
        await this.init();
        const thread = await this.threads.findOne(
            { did, id: threadId },
            { projection: { credentials: 1 } }
        );
        const permitted = new Set(receipt.credentialUris);
        const selected = (thread?.credentials ?? []).filter(({ uri }) => permitted.has(uri));
        // One unreadable or unverifiable credential is skipped, not the thread.
        const { loaded } = await settleCredentialBatch(
            'thread_context',
            selected.map(({ uri, score, strongestScore, averageScore, matchCount }) => async () => {
                const projection = await resolveVerifiedCredentialProjection(did, uri, receipt);
                return {
                    uri,
                    score,
                    strongestScore,
                    averageScore,
                    matchCount,
                    type: projection.category,
                    context: serializeModelSafeCredentialProjection(projection),
                    title:
                        projection.facts.find(({ kind }) => kind === 'title')?.value ??
                        projection.category,
                };
            })
        );
        return loaded;
    }

    public async claimThreadCredentialContextSearch(
        threadId: string,
        did: string,
        topic: string
    ): Promise<boolean> {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            const result = await this.threads.updateOne(
                {
                    id: threadId,
                    did,
                    credentialContextStatus: { $exists: false },
                    'credentials.0': { $exists: false },
                },
                {
                    $set: {
                        credentialContextStatus: 'pending',
                        credentialSearchTopic: topic,
                    },
                },
                { session: this.session }
            );

            return result.modifiedCount === 1;
        });
    }

    public async setThreadCredentialContextState(
        threadId: string,
        did: string,
        status: 'pending' | 'ready' | 'empty' | 'error',
        topic?: string
    ): Promise<void> {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            const result = await this.threads.updateOne(
                { id: threadId, did },
                {
                    $set: {
                        credentialContextStatus: status,
                        ...(topic === undefined ? {} : { credentialSearchTopic: topic }),
                    },
                },
                { session: this.session }
            );

            if (result.matchedCount === 0) throw new Error('Thread not found');
        });
    }

    public async getThreadCredentialContextState(
        threadId: string,
        did: string
    ): Promise<{
        status?: 'pending' | 'ready' | 'empty' | 'error';
        topic?: string;
        title: string;
    }> {
        await this.init();
        const thread = await this.threads.findOne(
            { id: threadId, did },
            {
                projection: {
                    credentialContextStatus: 1,
                    credentialSearchTopic: 1,
                    title: 1,
                },
            }
        );

        if (!thread) throw new Error('Thread not found');

        return {
            status: thread.credentialContextStatus,
            topic: thread.credentialSearchTopic,
            title: thread.title,
        };
    }

    public async removeThreadCredentialsByUris(did: string, uris: string[]): Promise<number> {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            if (!uris.length) return 0;
            const result = await this.threads.updateMany(
                { did },
                { $pull: { credentials: { uri: { $in: uris } } } },
                { session: this.session }
            );
            return result.modifiedCount ?? 0;
        });
    }

    /* ------------------------- thread plans --------------------------- */
    public async startThreadPlan(threadId: string, did: string): Promise<boolean> {
        return this.withOwnerWrite(did, async () => {
            await this.init();

            const result = await this.threads.updateOne(
                {
                    id: threadId,
                    did,
                    'plans.0': { $exists: true },
                    plan_started_at: { $exists: false },
                    active: { $ne: false },
                    ended_at: { $exists: false },
                },
                { $set: { plan_started_at: new Date().toISOString() } },
                { session: this.session }
            );

            return result.modifiedCount === 1;
        });
    }

    public async resetThreadPlanStarted(threadId: string, did: string): Promise<void> {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            await this.threads.updateOne(
                { id: threadId, did },
                { $unset: { plan_started_at: '' } },
                { session: this.session }
            );
        });
    }

    public async storeThreadPlan(did: string, threadId: string, planData: string) {
        return this.withOwnerWrite(did, async () => {
            assertRawCredentialOwner(did);
            const receipt = await assertCurrentAiConsent('model-inference');
            await this.init();
            const planDoc = {
                plan_data: planData,
                created_at: new Date().toISOString(),
                consentRevision: receipt.revision,
            };
            await this.threads.updateOne(
                { did, id: threadId },
                { $push: { plans: planDoc } },
                { session: this.session }
            );
        });
    }

    public async getThreadPlans(did: string, threadId: string): Promise<DBThreadPlan[]> {
        assertRawCredentialOwner(did);
        const receipt = await assertCurrentAiConsent('model-inference');
        await this.init();
        const thread = await this.threads.findOne(
            { did, id: threadId },
            { projection: { plans: 1 } }
        );
        const plans = (thread?.plans ?? []).filter(
            plan => plan.consentRevision === receipt.revision
        );

        return plans.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    /* ------------------ thread summary credentials -------------------- */
    public async storeThreadSummaryCredential(
        did: string,
        threadId: string,
        summaryData: string,
        credentialUri: string
    ) {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            const summaryDoc = {
                credential_uri: credentialUri,
                summary_data: summaryData,
                created_at: new Date().toISOString(),
            };

            await this.threads.updateOne(
                { did, id: threadId },
                { $push: { summaries: summaryDoc } },
                { session: this.session }
            );
        });
    }

    public async getThreadSummaryCredentials(
        did: string,
        threadId: string
    ): Promise<DBThreadSummaryCredential[]> {
        await this.init();
        const thread = await this.threads.findOne(
            { did, id: threadId },
            { projection: { summaries: 1 } }
        );
        const summaries = thread?.summaries || [];

        return summaries.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    /* ------------------ artifact suggestions ------------------ */
    public async storeArtifactSuggestion(
        did: string,
        threadId: string,
        artifact: InsightArtifact,
        sourceText: string
    ): Promise<DBArtifactSuggestion & { _id: string }> {
        return this.withOwnerWrite(did, async () => {
            await this.init();
            const suggestionDoc = {
                artifact,
                source_text: sourceText,
                created_at: new Date().toISOString(),
            };
            await this.threads.updateOne(
                { did, id: threadId },
                { $push: { artifactSuggestions: suggestionDoc } },
                { session: this.session }
            );
            const updatedThread = await this.threads.findOne(
                { did, id: threadId },
                { projection: { artifactSuggestions: 1 }, session: this.session }
            );
            const suggestions = updatedThread?.artifactSuggestions || [];
            const insertedSuggestion = suggestions[suggestions.length - 1];

            return insertedSuggestion as DBArtifactSuggestion & { _id: string };
        });
    }

    public async getArtifactSuggestions(
        did: string,
        threadId: string
    ): Promise<DBArtifactSuggestion[]> {
        await this.init();

        const thread = await this.threads.findOne(
            { did, id: threadId },
            { projection: { artifactSuggestions: 1 } }
        );

        return thread?.artifactSuggestions || [];
    }

    public async hasArtifactSuggestion(
        did: string,
        threadId: string,
        title: string,
        category: string
    ): Promise<boolean> {
        await this.init();

        const thread = await this.threads.findOne(
            { did, id: threadId },
            { projection: { artifactSuggestions: 1 } }
        );
        const existing = thread?.artifactSuggestions || [];

        return existing.some(
            suggestion =>
                suggestion.artifact.title.toLowerCase() === title.toLowerCase() &&
                suggestion.artifact.category === category
        );
    }

    public async canSuggestArtifact(
        did: string,
        threadId: string,
        cooldownMs = 2 * 60 * 1000
    ): Promise<boolean> {
        await this.init();

        const thread = await this.threads.findOne(
            { did, id: threadId },
            { projection: { artifactSuggestions: 1 } }
        );
        const suggestions = thread?.artifactSuggestions || [];

        if (suggestions.length === 0) return true;

        const last = suggestions[suggestions.length - 1];

        return Date.now() - new Date(last.created_at).getTime() > cooldownMs;
    }

    /* ------------------------------ misc ------------------------------ */
    public async close() {
        if (this.client) await this.client.close();
    }
}

export const db = new ChatDB();

export const assertMongoPrivacyCapabilities = (): Promise<void> => db.assertPrivacyCapabilities();
