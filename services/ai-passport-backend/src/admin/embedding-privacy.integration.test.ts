import { afterAll, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import type { VC } from '@learncard/types';
import type { ActiveAiConsentReceipt } from '../learncard/consent';

// Only external I/O is synthetic: real stepJob, projection, mapping/filtering,
// audit, generation adapter, deadlines, Nova group and retry ledger execute.
const mongo = new MongoClient(process.env.MONGO_URI!);
await mongo.connect();
const database = mongo.db(process.env.MONGO_DB!);
const owner = 'did:example:privacy-record',
    uri = 'urn:synthetic:privacy-record';
const ownerScope = new AsyncLocalStorage<AbortSignal>();
let sdkTimeout = true;
let enabled = true,
    revoked = false,
    permitted = true,
    hang = 0,
    invalid = false;
let generated = 0,
    applies = 0,
    embeddingApplies = 0,
    loggingChecks = 0,
    novaCalls = 0;
let onEmbeddingApply: ((signal: AbortSignal) => void) | undefined;
const points = new Map<string, unknown>();
const auditRows = new Map<string, { outcome: string }>();
const receipt = (
    purpose: 'embedding' | 'model-inference' = 'embedding'
): ActiveAiConsentReceipt => ({
    contractUri: 'lc:network:contract:synthetic',
    receiptId: 'lc:terms:synthetic',
    status: 'live',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: [uri],
    personalFields: [],
    guardian: { required: false, approved: false },
    purpose,
    revision: 'synthetic-revision',
});
mock.module('../db', () => ({
    db: {
        getEmbeddingBackfillSource: async (did: string, kind: string, id: ObjectId) =>
            database.collection(kind).findOne({ _id: id, did }),
        getEmbeddingCredentialVersion: async () =>
            (await database.collection('credentials').findOne({ did: owner }))?.verification,
        getVectorSource: async (_did: string, kind: string, key: string, version: object) => ({
            kind,
            key,
            ...version,
            epoch: 'synthetic-epoch',
        }),
        retainIdentifierMapping: async (value: unknown) => value,
        getIdentifierMappings: async () => [],
        deleteIdentifierMappings: async () => 0,
        storeAiAuditEvent: async (event: { eventId: string; outcome: string }) => {
            auditRows.set(event.eventId, { outcome: event.outcome });
        },
        completeAiAuditEvent: async (id: string, terminal: { outcome: string }) => {
            const previous = auditRows.get(id);
            if (previous?.outcome !== 'pending') return false;
            auditRows.set(id, terminal);
            return true;
        },
    },
}));
const dataErasure = await import('../services/dataErasure');
mock.module('../services/dataErasure', () => ({
    ...dataErasure,
    getCurrentOwnerOperation: () => {
        const signal = ownerScope.getStore();
        return signal
            ? { signal, did: owner, subjectRef: 'synthetic', token: 'synthetic' }
            : undefined;
    },
    isDataErasureRequested: async () => false,
    withOwnerOperation: async (
        _did: string,
        callback: (signal: AbortSignal) => Promise<unknown>
    ) => {
        const signal = new AbortController().signal;
        return ownerScope.run(signal, () => callback(signal));
    },
}));
const privacy = await import('../ai/privacy');
const { AiConsentError } = await import('../learncard/consent');
mock.module('../ai/privacy', () => ({
    ...privacy,
    assertCurrentAiConsent: async (purpose: 'embedding' | 'model-inference') => {
        if (revoked) throw new AiConsentError('Synthetic revoked');
        if (privacy.getCurrentAiSubject() !== owner) throw new Error('Synthetic owner mismatch');
        privacy.bindAiConsentRevision(owner, 'synthetic-revision', {}, [uri]);
        return receipt(purpose);
    },
}));
const qdrant = await import('../db/qdrant');
mock.module('../db/qdrant', () => ({
    ...qdrant,
    createCollectionIfNotExists: async () => {},
    getCredentialVectorCoverage: async () =>
        new Map([[uri, new Set(points.size === 5 ? ['1', '2', '3', '4', '5'] : [])]]),
    storeEmbeddings: async (_collection: string, values: { id: string }[]) => {
        expect(novaCalls).toBe(5);
        for (const value of values) points.set(value.id, value);
    },
}));
const guardrails = await import('../ai/bedrock-guardrails');
const { PRIVACY_PII_TYPES } = await import('../ai/bedrock-config');
let masker: ReturnType<typeof guardrails.createGuardrailMasker>;
mock.module('../ai/bedrock-guardrails', () => ({
    ...guardrails,
    maskSensitiveText: (text: string, source: 'INPUT' | 'OUTPUT') => masker(text, source),
}));
const generation = await import('../ai/bedrock-generation');
const createGenerationClient = generation.createBedrockResponsesClient;
const texts = {
    fullText: 'embedding synthetic full',
    domainSummary: 'embedding synthetic domain',
    keyClaims: 'embedding synthetic claims',
    technicalMetadata: 'embedding synthetic metadata',
    comparisonContext: 'embedding synthetic comparison',
};
mock.module('../ai/bedrock-generation', () => ({
    ...generation,
    createBedrockResponsesClient: () =>
        createGenerationClient(
            {},
            async () => {
                generated += 1;
                return Response.json({
                    status: 'completed',
                    output: [
                        {
                            type: 'function_call',
                            id: 'synthetic-item',
                            call_id: 'synthetic-call',
                            name: 'function_0',
                            arguments: JSON.stringify(texts),
                            status: 'completed',
                        },
                    ],
                    usage: { input_tokens: 10, output_tokens: 20 },
                });
            },
            () => async () => 'synthetic-token'
        ),
}));
const recoveryModule = await import('./embedding-recovery');
const createRecovery = recoveryModule.managedEmbeddingRecovery;
mock.module('./embedding-recovery', () => ({
    ...recoveryModule,
    managedEmbeddingRecovery: (
        options: Parameters<typeof recoveryModule.managedEmbeddingRecovery>[0]
    ) => {
        const recovery = createRecovery(options);
        if (!enabled) delete recovery.privacy;
        return recovery;
    },
}));
const { createJob, stepJob } = await import('./backfill');
const { projectCredential } = await import('../credentials/projection');
const { fingerprintCredential } = await import('../credentials/verification');
const { runSourceFingerprint } = await import('./run-model');
const { withProviderBudget } = await import('../ai/usage-meter');
const { withAiAudit } = await import('../ai/audit');
const originalEnv = { ...process.env };
beforeEach(async () => {
    mock.restore();
    for (const name of [
        'credentials',
        'messages',
        'embedding_backfill_jobs',
        'embedding_backfill_items',
    ])
        await database.collection(name).deleteMany({});
    sdkTimeout = true;
    enabled = true;
    revoked = false;
    permitted = true;
    hang = 0;
    invalid = false;
    onEmbeddingApply = undefined;
    generated = applies = embeddingApplies = loggingChecks = novaCalls = 0;
    points.clear();
    auditRows.clear();
    process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
    process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
    process.env.EMBEDDINGS_DUAL_WRITE = 'true';
    process.env.AWS_REGION = 'us-east-1';
    for (const key of [
        'AWS_ENDPOINT_URL',
        'AWS_ENDPOINT_URL_BEDROCK',
        'AWS_ENDPOINT_URL_BEDROCK_RUNTIME',
    ])
        delete process.env[key];
    const config = {
        region: 'us-east-1',
        guardrailIdentifier: 'synthetic123',
        guardrailVersion: '1',
    } as const;
    masker = guardrails.createGuardrailMasker({
        config: () => config,
        locale: () => 'en',
        timeoutMs: 10,
        getPolicy: async () => ({
            blockedInputMessaging: 'Input blocked',
            blockedOutputsMessaging: 'Output blocked',
            guardrailId: config.guardrailIdentifier,
            guardrailArn: `arn:aws:bedrock:us-east-1:123456789012:guardrail/${config.guardrailIdentifier}`,
            version: '1',
            status: 'READY',
            sensitiveInformationPolicy: {
                piiEntities: PRIVACY_PII_TYPES.map(type => ({
                    type,
                    action: 'ANONYMIZE',
                    inputAction: 'ANONYMIZE',
                    outputAction: 'ANONYMIZE',
                    inputEnabled: true,
                    outputEnabled: true,
                })),
            },
        }),
        getLogging: async () => {
            loggingChecks += 1;
            return {};
        },
        assertConsent: async () => {
            if (revoked) throw new AiConsentError('Synthetic revoked');
        },
        withAudit: withAiAudit,
        apply: async (_config, text, _source, signal) => {
            applies += 1;
            const embedding = text.includes('embedding synthetic full');
            if (embedding) {
                embeddingApplies += 1;
                onEmbeddingApply?.(signal);
            }
            if (embedding && hang > 0) {
                hang -= 1;
                if (sdkTimeout)
                    throw Object.assign(new Error('Synthetic SDK request timeout'), {
                        name: 'TimeoutError',
                        code: 'ETIMEDOUT',
                    });
                return await new Promise<never>((_resolve, reject) => {
                    const abort = () => reject(new Error('Synthetic transport aborted'));
                    if (signal.aborted) abort();
                    else signal.addEventListener('abort', abort, { once: true });
                });
            }
            if (embedding && invalid)
                return {
                    action: 'NONE',
                    outputs: [{ text: 'invalid' }],
                    assessments: [{}],
                };
            return {
                action: 'NONE',
                outputs: [],
                assessments: [{}],
                usage: {
                    sensitiveInformationPolicyUnits: 1,
                    sensitiveInformationPolicyFreeUnits: 0,
                },
            };
        },
    });
    spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        novaCalls += 1;
        return {
            body: new TextEncoder().encode(
                JSON.stringify({
                    embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
                })
            ),
        } as never;
    });
    const credential: VC = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: uri,
        type: ['VerifiableCredential', 'TestCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2026-01-01T00:00:00.000Z',
        credentialSubject: { id: owner, skills: ['Calculus'] },
        proof: {
            type: 'Ed25519Signature2020',
            created: '2026-01-01T00:00:00.000Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#key-1',
            proofValue: 'synthetic-proof',
        },
    };
    const verification = {
        credentialUri: uri,
        contentHash: fingerprintCredential(credential),
        status: 'valid' as const,
        checkedAt: '2026-01-01T00:00:00.000Z',
        verifiedPayload: 'credential' as const,
        checks: ['proof'],
        errors: [],
        warnings: [],
        verifier: { name: 'fixture', version: '1' },
        provenance: {
            source: 'wallet' as const,
            retrievedAt: '2026-01-01T00:00:00.000Z',
        },
        consent: receipt(),
    };
    await database.collection('credentials').insertOne({
        did: owner,
        uri,
        source: 'wallet',
        id: 'synthetic',
        category: 'Achievement',
        credential,
        rawCredentialJson: JSON.stringify(credential),
        aiContext: 'synthetic',
        createdAt: verification.checkedAt,
        verification,
        projection: projectCredential(credential, 'Achievement', verification),
    });
});
afterAll(async () => {
    mock.restore();
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
    await database.dropDatabase();
    await mongo.close();
});
async function fixture() {
    const job = await createJob(false, randomUUID(), true);
    const source = (await database.collection('credentials').findOne({ did: owner }))!;
    const fingerprint = runSourceFingerprint(source as never);
    await database.collection('embedding_backfill_jobs').updateOne({ _id: job._id } as never, {
        $set: {
            managedRunId: job._id,
            workflowVersion: 2,
            snapshot: [{ id: String(source._id), fingerprint }],
            snapshotIndex: 0,
        },
    });
    await database.collection('embedding_backfill_items').insertOne({
        _id: `${job._id}:0`,
        runId: job._id,
        index: 0,
        sourceId: String(source._id),
        initialFingerprint: fingerprint,
        resolvedFingerprint: fingerprint,
        state: 'embedding_ready',
    } as never);
    return job;
}
const step = (id: string) =>
    stepJob(
        id,
        1,
        async () => {
            if (!permitted) throw new Error('Synthetic run paused');
        },
        undefined,
        id
    );

test('real privacy/generation path reproduces exact live embedding(timeout) failure before any Nova call', async () => {
    enabled = false;
    hang = 1;
    const job = await fixture();
    const result = await step(job._id);
    expect(result?.lastFailure).toMatchObject({
        stage: 'embedding',
        code: 'privacy_failed',
        privacyOperation: 'guardrail_request',
        privacyCategory: 'timeout',
        requests: { generation: 1, embedding: 0, privacy: 3 },
    });
    expect(generated).toBe(1);
    expect(novaCalls).toBe(0);
    expect(points.size).toBe(0);
    expect(result?.snapshotIndex).toBe(0);
});
test('real path recovers guardrail timeout without repeating generation, with fresh logging/consent and five unique writes', async () => {
    hang = 1;
    const job = await fixture();
    const result = await step(job._id);
    expect(result?.errors).toBe(0);
    expect(result?.written).toBe(1);
    expect(generated).toBe(1);
    expect(embeddingApplies).toBe(2);
    expect(loggingChecks).toBe(4);
    expect(novaCalls).toBe(5);
    expect(points.size).toBe(5);
    expect(result?.usage?.totals.privacy.requests).toBe(4);
    expect(result?.embeddingRecovery?.privacyRetry?.used).toBe(1);
    expect([...auditRows.values()].every(row => row.outcome !== 'pending')).toBe(true);
    await database.collection('embedding_backfill_jobs').updateOne({ _id: job._id } as never, {
        $set: { snapshotIndex: 0, cursor: '' },
    });
    await step(job._id);
    expect(generated).toBe(1);
    expect(points.size).toBe(5);
    expect(novaCalls).toBe(5);
}, 15000);
test('guardrail retries exhaust durably and explicit resume does not reset the retry count', async () => {
    hang = 100;
    const job = await fixture();
    const result = await step(job._id);
    expect(generated).toBe(1);
    expect(embeddingApplies).toBe(3);
    expect(result?.embeddingRecovery?.privacyRetry?.used).toBe(2);
    expect(result?.snapshotIndex).toBe(0);
    expect(novaCalls).toBe(0);
    expect(points.size).toBe(0);
    const again = await step(job._id);
    expect(again?.embeddingRecovery?.privacyRetry?.used).toBe(2);
    expect(embeddingApplies).toBe(4);
    expect(novaCalls).toBe(0);
}, 15000);
test('privacy request budget refusal stops recovery without dispatching a fourth privacy request', async () => {
    hang = 1;
    const job = await fixture();
    let spent = 0;
    const result = await withProviderBudget(
        async kind => {
            if (kind === 'privacy') {
                if (spent >= 3) throw new Error('Synthetic privacy budget exhausted');
                spent += 1;
            }
        },
        () => step(job._id)
    );
    expect(spent).toBe(3);
    expect(applies).toBe(3);
    expect(generated).toBe(1);
    expect(novaCalls).toBe(0);
    expect(points.size).toBe(0);
    expect(result?.snapshotIndex).toBe(0);
}, 15000);
test('expired generation controllers are not reused by embedding privacy or Nova', async () => {
    const timers: { ms: number; controller: AbortController }[] = [];
    const clock = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
        const controller = new AbortController();
        timers.push({ ms, controller });
        return controller.signal;
    });
    onEmbeddingApply = signal => {
        for (const timer of timers)
            if (timer.ms !== 360000)
                timer.controller.abort(
                    new DOMException('Synthetic completed generation deadline', 'TimeoutError')
                );
        expect(signal.aborted).toBe(false);
    };
    try {
        const job = await fixture();
        const result = await step(job._id);
        expect(result?.written).toBe(1);
        expect(generated).toBe(1);
        expect(novaCalls).toBe(5);
        expect(points.size).toBe(5);
    } finally {
        clock.mockRestore();
    }
});

test('non-timeout privacy validation failures never retry or dispatch Nova', async () => {
    invalid = true;
    const job = await fixture();
    const result = await step(job._id);
    expect(result?.errors).toBe(1);
    expect(embeddingApplies).toBe(1);
    expect(novaCalls).toBe(0);
    expect(points.size).toBe(0);
    expect(result?.embeddingRecovery?.privacyRetry).toBeUndefined();
});
test('local guardrail deadline cannot retry after consent is revoked', async () => {
    sdkTimeout = false;
    hang = 1;
    const job = await fixture();
    onEmbeddingApply = signal => {
        if (embeddingApplies === 1)
            signal.addEventListener(
                'abort',
                () => {
                    revoked = true;
                },
                { once: true }
            );
    };
    const result = await step(job._id);
    expect(generated).toBe(1);
    expect(embeddingApplies).toBe(1);
    expect(novaCalls).toBe(0);
    expect(points.size).toBe(0);
    expect(result?.snapshotIndex).toBe(0);
}, 15000);
test('run pause during durable privacy backoff prevents all further requests', async () => {
    hang = 1;
    const job = await fixture();
    const work = step(job._id);
    for (let i = 0; i < 200; i += 1) {
        const current = await database
            .collection('embedding_backfill_jobs')
            .findOne({ _id: job._id } as never);
        if (current?.embeddingRecovery?.privacyRetry?.used === 1) break;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    permitted = false;
    const result = await work;
    expect(result?.embeddingRecovery?.privacyRetry?.used).toBe(1);
    expect(embeddingApplies).toBe(1);
    expect(generated).toBe(1);
    expect(novaCalls).toBe(0);
    expect(points.size).toBe(0);
}, 15000);

test("the privacy request's own deadline recovers with a fresh controller", async () => {
    sdkTimeout = false;
    hang = 1;
    const job = await fixture();
    const result = await step(job._id);
    expect(result?.written).toBe(1);
    expect(generated).toBe(1);
    expect(embeddingApplies).toBe(2);
    expect(novaCalls).toBe(5);
    expect(points.size).toBe(5);
}, 15000);

test('record deadline during privacy filtering is cancellation, never a retryable request timeout', async () => {
    sdkTimeout = false;
    hang = 100;
    const timers: { ms: number; controller: AbortController }[] = [];
    const clock = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
        const controller = new AbortController();
        timers.push({ ms, controller });
        return controller.signal;
    });
    onEmbeddingApply = () => {
        const unit = timers.find(timer => timer.ms === 360000);
        if (!unit) throw new Error('Expected record deadline');
        unit.controller.abort(new DOMException('Synthetic record deadline', 'TimeoutError'));
    };
    try {
        const job = await fixture();
        const result = await step(job._id);
        expect(result?.snapshotIndex).toBe(0);
        expect(embeddingApplies).toBe(1);
        expect(generated).toBe(1);
        expect(result?.embeddingRecovery?.privacyRetry).toBeUndefined();
        expect(novaCalls).toBe(0);
        expect(points.size).toBe(0);
    } finally {
        clock.mockRestore();
    }
});
