import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { withProviderBudget } from '../ai/usage-meter';
import { runSourceFingerprint } from './run-model';
import { beforeEach, afterAll, expect, mock, spyOn, test } from 'bun:test';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
process.env.EMBEDDINGS_DUAL_WRITE = 'true';
const mongo = new MongoClient(process.env.MONGO_URI!);
await mongo.connect();
const database = mongo.db(process.env.MONGO_DB!);
const subject = new AsyncLocalStorage<string>();
let exerciseNovaRecovery = false;
let erased = false,
    missingSource = false;
let typedRevocation = false;
let revoked = false,
    generated = 0,
    written = 0;
let observedGeneration:
    { signal: AbortSignal; timeoutMs?: number; maxOutputTokens?: number } | undefined;
let ignoreGenerationAbort = false;
let beforeGeneration: (() => Promise<void>) | undefined;
const coverage = new Map<string, string>();
mock.module('../services/dataErasure', () => ({
    isDataErasureRequested: async () => erased,
    withOwnerOperation: async (did: string, fn: (signal: AbortSignal) => Promise<unknown>) => {
        if (erased) {
            const error = new Error('fixture');
            error.name = 'DataErasureRequestedError';
            throw error;
        }
        return subject.run(did, () => fn(new AbortController().signal));
    },
}));
mock.module('../ai/privacy', () => ({
    runWithAiPrivacyContext: (did: string, fn: () => unknown) => {
        expect(subject.getStore()).toBe(did);
        return fn();
    },
    assertCurrentAiConsent: async () => {
        if (revoked) {
            const error = new Error('consent withdrawn');
            if (typedRevocation) error.name = 'AiConsentError';
            throw error;
        }
        return { revision: 'rev1', credentialUris: ['urn:test:one'] };
    },
}));
mock.module('../db', () => ({
    db: {
        getEmbeddingBackfillSource: async (did: string, kind: string, id: ObjectId) => {
            expect(subject.getStore()).toBe(did);
            return missingSource ? null : database.collection(kind).findOne({ _id: id, did });
        },
    },
}));
mock.module('../credentials/projection', () => ({
    getCredentialProjection: (record: object) => record,
    serializeModelSafeCredentialProjection: () => 'Synthetic learning facts',
}));
mock.module('../db/qdrant', () => ({
    getCredentialVectorCoverage: async (
        _did: string,
        uris: string[],
        version: { contentHash: string }
    ) =>
        new Map(
            uris.map(uri => [
                uri,
                coverage.get(uri) === version.contentHash
                    ? new Set(['1', '2', '3', '4', '5'])
                    : new Set(),
            ])
        ),
}));
mock.module('../ai/embedding-texts', () => ({
    generateCredentialEmbeddingTexts: async (
        _text: string,
        options: { signal: AbortSignal; timeoutMs?: number; maxOutputTokens?: number }
    ) => {
        generated += 1;
        observedGeneration = options;
        await beforeGeneration?.();
        if (!ignoreGenerationAbort) options.signal.throwIfAborted();
        return {};
    },
}));
mock.module('../ai/embeddings', () => ({
    generateAndStoreCredentialEmbeddings: async (
        record: { uri: string; verification: { contentHash: string } },
        _texts: object,
        did: string,
        targetOnly: boolean
    ) => {
        expect(subject.getStore()).toBe(did);
        expect(targetOnly).toBe(true);
        if (exerciseNovaRecovery) {
            const { novaEmbeddings } = await import('../ai/nova-embeddings');
            await novaEmbeddings(['full', 'domain', 'claims', 'metadata', 'context'], 'document');
        }
        written += 1;
        coverage.set(record.uri, record.verification.contentHash);
    },
}));
const { createJob, stepJob, cancelJob } = await import('./backfill');
const owner = 'did:example:fixture-learner';
beforeEach(async () => {
    for (const name of ['credentials', 'messages', 'embedding_backfill_jobs'])
        await database.collection(name).deleteMany({});
    erased = missingSource = false;
    typedRevocation = false;
    revoked = false;
    exerciseNovaRecovery = false;
    generated = 0;
    written = 0;
    beforeGeneration = undefined;
    observedGeneration = undefined;
    ignoreGenerationAbort = false;
    coverage.clear();
    await database.collection('credentials').insertOne({
        did: owner,
        uri: 'urn:test:one',
        source: 'wallet',
        verification: { contentHash: 'hash1', consent: { revision: 'rev1' } },
    });
});
afterAll(async () => {
    await database.dropDatabase();
    await mongo.close();
});
test('dry run makes no provider calls, resumes and excludes later ingestion above highwater', async () => {
    const id = randomUUID();
    const job = await createJob(true, id);
    expect((await createJob(true, id))._id).toBe(job._id);
    await database.collection('credentials').insertOne({ did: owner, uri: 'urn:late' });
    expect((await stepJob(id, 1))?.scanned).toBe(1);
    const done = await stepJob(id, 5);
    expect(done?.state).toBe('completed');
    expect(done?.corpusComplete).toBe(true);
    expect(done?.scanned).toBe(1);
    expect(done?.dryRunObserved).toBe(1);
    expect(done?.skipped).toBe(0);
    expect(done?.skipReasons).toEqual({});
    expect(generated).toBe(0);
    expect(written).toBe(0);
});
test('apply requires explicit regeneration and reserves calls before errors', async () => {
    await expect(createJob(false, randomUUID(), false)).rejects.toThrow();
    const job = await createJob(false, randomUUID(), true);
    beforeGeneration = async () => {
        throw new Error('synthetic provider failure');
    };
    const failed = await stepJob(job._id);
    expect(failed?.cursor).toBe('');
    expect(failed?.state).toBe('paused');
    expect(failed?.representationCalls).toBe(1);
    expect(failed?.embeddingRequests).toBe(5);
    expect(written).toBe(0);
    beforeGeneration = undefined;
    const retry = await stepJob(job._id);
    expect(retry?.written).toBe(1);
    expect(retry?.representationCalls).toBe(2);
    expect(retry?.lastError).toBeUndefined();
});
test('revocation and concurrent source changes stop writes with cursor preserved', async () => {
    const job = await createJob(false, randomUUID(), true);
    revoked = true;
    expect((await stepJob(job._id))?.cursor).toBe('');
    expect(generated).toBe(0);
    revoked = false;
    beforeGeneration = async () => {
        await database
            .collection('credentials')
            .updateOne({ uri: 'urn:test:one' }, { $set: { 'verification.contentHash': 'hash2' } });
    };
    expect((await stepJob(job._id))?.cursor).toBe('');
    expect(written).toBe(0);
});
test('exclusive batch lease, cancellation and interruption never advance a failed record', async () => {
    const job = await createJob(false, randomUUID(), true);
    const entered = Promise.withResolvers<void>(),
        release = Promise.withResolvers<void>();
    beforeGeneration = async () => {
        entered.resolve();
        await release.promise;
    };
    const first = stepJob(job._id);
    await entered.promise;
    await expect(stepJob(job._id)).rejects.toThrow('lease');
    await cancelJob(job._id);
    release.resolve();
    await first;
    const cancelled = await database
        .collection('embedding_backfill_jobs')
        .findOne({ _id: job._id } as never);
    expect(cancelled?.state).toBe('cancelled');
    expect(cancelled?.cursor).toBe('');
    expect(written).toBe(0);
});
test('matching target coverage skips regeneration after an interrupted checkpoint', async () => {
    const job = await createJob(false, randomUUID(), true);
    await stepJob(job._id);
    expect(written).toBe(1);
    await database
        .collection('embedding_backfill_jobs')
        .updateOne({ _id: job._id } as never, { $set: { cursor: '', scanned: 0 } });
    await stepJob(job._id);
    expect(generated).toBe(1);
    expect(written).toBe(1);
});

test('missing learner consent before paid work is excluded without stopping other inventory', async () => {
    const job = await createJob(false, randomUUID(), true);
    revoked = true;
    typedRevocation = true;
    const result = await stepJob(job._id);
    expect(result?.skipped).toBe(1);
    expect(result?.cursor).not.toBe('');
    expect(result?.errors).toBe(0);
    expect(generated).toBe(0);
    expect(written).toBe(0);
});

test('an expired worker cannot renew its lease, publish vectors or advance its cursor', async () => {
    const job = await createJob(false, randomUUID(), true);
    beforeGeneration = async () => {
        await database.collection('embedding_backfill_jobs').updateOne({ _id: job._id } as never, {
            $set: { leaseUntil: new Date(0) },
        });
    };
    await stepJob(job._id);
    const expired = await database
        .collection('embedding_backfill_jobs')
        .findOne({ _id: job._id } as never);
    expect(expired?.cursor).toBe('');
    expect(expired?.leaseUntil.getTime()).toBe(0);
    expect(expired?.state).toBe('running');
    expect(written).toBe(0);
    beforeGeneration = undefined;
    expect((await stepJob(job._id))?.written).toBe(1);
});

for (const [reason, fields] of [
    ['missing_owner', { did: 'invalid' }],
    ['missing_verification', { verification: null }],
    ['missing_consent_revision', { verification: { contentHash: 'hash1', consent: {} } }],
    [
        'consent_revision_changed',
        { verification: { contentHash: 'hash1', consent: { revision: 'old' } } },
    ],
    ['outside_consent_scope', { uri: 'urn:outside' }],
] as const) {
    test(`apply records ${reason} without providers`, async () => {
        await database.collection('credentials').updateOne({}, { $set: fields });
        const job = await createJob(false, randomUUID(), true);
        const result = await stepJob(job._id);
        expect(result?.skipReasons).toEqual({ [reason]: 1 });
        expect(result?.skipped).toBe(1);
        expect(result?.errors).toBe(0);
        expect(result?.embeddingRequests).toBe(0);
        expect(generated).toBe(0);
    });
}
for (const reason of [
    'missing_source',
    'already_complete',
    'consent_unavailable',
    'owner_erased',
] as const) {
    test(`apply records ${reason} across persisted paused jobs`, async () => {
        const job = await createJob(false, randomUUID(), true);
        missingSource = reason === 'missing_source';
        erased = reason === 'owner_erased';
        revoked = typedRevocation = reason === 'consent_unavailable';
        if (reason === 'already_complete') coverage.set('urn:test:one', 'hash1');
        const result = await stepJob(job._id);
        expect(result?.skipReasons).toEqual({ [reason]: 1 });
        expect(result?.representationCalls).toBe(0);
        const saved = await database
            .collection('embedding_backfill_jobs')
            .findOne({ _id: job._id } as never);
        expect(saved?.skipReasons).toEqual({ [reason]: 1 });
        await stepJob(job._id);
        expect(
            (
                await database
                    .collection('embedding_backfill_jobs')
                    .findOne({ _id: job._id } as never)
            )?.skipReasons
        ).toEqual({ [reason]: 1 });
        expect(generated).toBe(0);
    });
}
test('legacy jobs retain historical skips and cursor while adding new reasons', async () => {
    const job = await createJob(false, randomUUID(), true);
    await database.collection('embedding_backfill_jobs').updateOne({ _id: job._id } as never, {
        $unset: { skipReasons: '', dryRunObserved: '' },
        $set: { skipped: 1 },
    });
    missingSource = true;
    const result = await stepJob(job._id);
    expect(result?.skipped).toBe(2);
    expect(result?.skipReasons).toEqual({ missing_source: 1 });
    expect(result?.cursor).not.toBe('');
});
test('messages are never read or embedded, including by a job an earlier build left on messages', async () => {
    await database.collection('credentials').deleteMany({});
    await database
        .collection('messages')
        .insertOne({ did: owner, consentRevision: 'rev1', content: 'Synthetic' });
    const job = await createJob(false, randomUUID(), true);
    expect(job.highWater).toEqual({ credentials: '' });
    const result = await stepJob(job._id, 5);
    expect(result?.state).toBe('completed');
    expect(result?.kind).toBe('credentials');
    expect(result?.scanned).toBe(0);
    expect(result?.skipReasons).toEqual({});
    expect(result?.embeddingRequests).toBe(0);
    expect(written).toBe(0);
    const legacy = await createJob(false, randomUUID(), true);
    await database.collection('embedding_backfill_jobs').updateOne({ _id: legacy._id } as never, {
        $set: { kind: 'messages', cursor: '', 'highWater.messages': 'ffffffffffffffffffffffff' },
    });
    const stopped = await stepJob(legacy._id, 5);
    expect(stopped?.state).toBe('completed');
    expect(stopped?.scanned).toBe(0);
    expect(stopped?.embeddingRequests).toBe(0);
    expect(generated).toBe(0);
    expect(written).toBe(0);
});

test('legacy dry-run resumes without reclassifying prior skipped observations', async () => {
    const job = await createJob(true, randomUUID());
    await database.collection('embedding_backfill_jobs').updateOne({ _id: job._id } as never, {
        $unset: { skipReasons: '', dryRunObserved: '' },
        $set: { skipped: 2, scanned: 2 },
    });
    const result = await stepJob(job._id);
    expect(result?.skipped).toBe(2);
    expect(result?.dryRunObserved).toBe(1);
    expect(result?.scanned).toBe(3);
    expect(result?.maxRecords).toBe(100);
    expect(result?.skipReasons).toEqual({});
    expect(generated).toBe(0);
    expect(written).toBe(0);
});

test('manual steps cannot claim a batch-owned source job', async () => {
    const job = await createJob(true, randomUUID());
    await database
        .collection('embedding_backfill_jobs')
        .updateOne({ _id: job._id } as never, { $set: { batchId: randomUUID() } });
    await expect(stepJob(job._id)).rejects.toThrow();
    expect(generated).toBe(0);
});

async function managedFixture() {
    const job = await createJob(false, randomUUID(), true);
    await database
        .collection('embedding_backfill_jobs')
        .updateOne({ _id: job._id } as never, { $set: { managedRunId: job._id } });
    return job;
}
test('managed credentials receive bounded deadlines; normal backfill retains 120 seconds and caps', async () => {
    const timers: { ms: number; controller: AbortController }[] = [];
    const clock = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
        const controller = new AbortController();
        timers.push({ ms, controller });
        return controller.signal;
    });
    try {
        const job = await managedFixture();
        const guards: number[] = [];
        const result = await stepJob(
            job._id,
            1,
            async ms => {
                guards.push(ms ?? 0);
            },
            undefined,
            job._id
        );
        expect(result?.written).toBe(1);
        expect(timers.some(t => t.ms === 360000)).toBe(true);
        expect(observedGeneration?.timeoutMs).toBe(240000);
        expect(observedGeneration?.maxOutputTokens).toBe(4096);
        expect(guards).toContain(390000);
        expect(result?.maxRecords).toBe(100);
        expect(result?.maxRepresentationCalls).toBe(100);
        expect(result?.maxEmbeddingRequests).toBe(600);
        timers.length = 0;
        coverage.clear();
        const normal = await createJob(false, randomUUID(), true);
        await stepJob(normal._id);
        expect(timers.map(t => t.ms)).toEqual([120000]);
        expect(observedGeneration?.timeoutMs).toBeUndefined();
    } finally {
        clock.mockRestore();
    }
});
for (const boundary of ['generation pipeline', 'whole unit'] as const) {
    test(`${boundary} expiry prevents late completion from writing or advancing`, async () => {
        const timers: { ms: number; controller: AbortController }[] = [];
        const clock = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
            const controller = new AbortController();
            timers.push({ ms, controller });
            return controller.signal;
        });
        try {
            const job = await managedFixture();
            ignoreGenerationAbort = true;
            beforeGeneration = async () => {
                const timer = timers.find(t =>
                    boundary === 'whole unit' ? t.ms === 360000 : t.ms <= 300000 && t.ms > 250000
                )!;
                timer.controller.abort(new DOMException('synthetic timeout', 'TimeoutError'));
            };
            const result = await stepJob(job._id, 1, async () => {}, undefined, job._id);
            expect(generated).toBe(1);
            expect(written).toBe(0);
            expect(result?.written).toBe(0);
            expect(result?.cursor).toBe('');
            expect(result?.errors).toBe(1);
            expect(result?.representationCalls).toBe(1);
            expect(result?.embeddingRequests).toBe(5);
        } finally {
            clock.mockRestore();
        }
    });
}
test('managed cancellation remains independent of longer timeouts and late output cannot write', async () => {
    const job = await managedFixture();
    const hold = Promise.withResolvers<void>();
    let permitted = true;
    ignoreGenerationAbort = true;
    beforeGeneration = async () => hold.promise;
    const work = stepJob(
        job._id,
        1,
        async () => {
            if (!permitted) throw new Error('synthetic pause');
        },
        undefined,
        job._id
    );
    for (let i = 0; i < 200 && !observedGeneration; i += 1)
        await new Promise(r => setTimeout(r, 5));
    expect(generated).toBe(1);
    permitted = false;
    for (let i = 0; i < 200 && !observedGeneration?.signal.aborted; i += 1)
        await new Promise(r => setTimeout(r, 5));
    expect(observedGeneration?.signal.aborted).toBe(true);
    hold.resolve();
    const result = await work;
    expect(result?.written).toBe(0);
    expect(result?.cursor).toBe('');
    expect(written).toBe(0);
});
test('insufficient managed runner lease headroom stops before generation reservations', async () => {
    const job = await managedFixture();
    const result = await stepJob(
        job._id,
        1,
        async ms => {
            if ((ms ?? 0) > 350000) throw new Error('synthetic lease headroom');
        },
        undefined,
        job._id
    );
    expect(result?.errors).toBe(1);
    expect(generated).toBe(0);
    expect(written).toBe(0);
    expect(result?.representationCalls).toBe(0);
    expect(result?.embeddingRequests).toBe(0);
    expect(result?.cursor).toBe('');
});

test('a managed generation completing after the old 120s cutoff remains inside its bounded unit', async () => {
    const baseNow = Date.now;
    let offset = 0;
    const timers: { deadline: number; controller: AbortController }[] = [];
    const now = spyOn(Date, 'now').mockImplementation(() => baseNow() + offset);
    const timeout = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
        const controller = new AbortController();
        timers.push({ deadline: Date.now() + ms, controller });
        return controller.signal;
    });
    try {
        const job = await managedFixture();
        beforeGeneration = async () => {
            offset = 130000;
            for (const timer of timers)
                if (timer.deadline <= Date.now())
                    timer.controller.abort(
                        new DOMException('synthetic elapsed deadline', 'TimeoutError')
                    );
        };
        const result = await stepJob(job._id, 1, async () => {}, undefined, job._id);
        expect(result?.written).toBe(1);
        expect(result?.errors).toBe(0);
        expect(generated).toBe(1);
        expect(written).toBe(1);
    } finally {
        timeout.mockRestore();
        now.mockRestore();
    }
});

async function recoveryFixture() {
    const job = await managedFixture();
    const source = (await database.collection('credentials').findOne({ did: owner }))!;
    const fingerprint = runSourceFingerprint(source as never);
    await database.collection('embedding_backfill_jobs').updateOne({ _id: job._id } as never, {
        $set: {
            workflowVersion: 2,
            snapshot: [{ id: String(source._id), kind: 'credentials', fingerprint }],
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
    exerciseNovaRecovery = true;
    process.env.AWS_REGION = 'us-east-1';
    return job;
}
test('managed record recovers transient embedding without repeating generation or advancing before all vectors', async () => {
    const job = await recoveryFixture();
    let calls = 0,
        reserved = 0,
        domainAttempts = 0;
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async command => {
        calls += 1;
        expect(written).toBe(0);
        if (!(command instanceof InvokeModelCommand))
            throw new Error('Unexpected synthetic command');
        const body =
            typeof command.input.body === 'string' ? JSON.parse(command.input.body) : undefined;
        if (body?.singleEmbeddingParams.text.value === 'domain') domainAttempts += 1;
        if (body?.singleEmbeddingParams.text.value === 'domain' && domainAttempts === 1)
            throw Object.assign(new Error('Stream timed out because of no activity for 15000 ms'), {
                name: 'TimeoutError',
            });
        return {
            body: new TextEncoder().encode(
                JSON.stringify({
                    embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
                })
            ),
        } as never;
    });
    try {
        const result = await withProviderBudget(
            async () => {
                reserved += 1;
            },
            () => stepJob(job._id, 1, async () => {}, undefined, job._id)
        );
        expect(generated).toBe(1);
        expect(written).toBe(1);
        expect(calls).toBe(6);
        expect(reserved).toBe(6);
        expect(result?.errors).toBe(0);
        expect(result?.snapshotIndex).toBe(1);
        expect(result?.embeddingRecovery?.slots.map(s => s.attempts)).toEqual([1, 2, 1, 1, 1]);
        // Existing coverage prevents point replay after an interrupted cursor checkpoint.
        await database
            .collection('embedding_backfill_jobs')
            .updateOne({ _id: job._id } as never, { $set: { snapshotIndex: 0, cursor: '' } });
        await stepJob(job._id, 1, async () => {}, undefined, job._id);
        expect(generated).toBe(1);
        expect(written).toBe(1);
        expect(calls).toBe(6);
    } finally {
        send.mockRestore();
    }
}, 15000);
test('retry counter survives job finalization and a later explicit resume cannot reset exhaustion', async () => {
    const job = await recoveryFixture();
    let calls = 0;
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async command => {
        calls += 1;
        if (!(command instanceof InvokeModelCommand))
            throw new Error('Unexpected synthetic command');
        const body =
            typeof command.input.body === 'string' ? JSON.parse(command.input.body) : undefined;
        if (body?.singleEmbeddingParams.text.value === 'full')
            throw Object.assign(new Error('timeout'), { name: 'TimeoutError' });
        return {
            body: new TextEncoder().encode(
                JSON.stringify({
                    embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
                })
            ),
        } as never;
    });
    try {
        const first = await stepJob(job._id, 1, async () => {}, undefined, job._id);
        expect(first?.errors).toBe(1);
        expect(first?.embeddingRecovery?.slots[0]?.attempts).toBe(3);
        expect(written).toBe(0);
        expect(calls).toBe(7);
        // Upgrade compatibility: an older job may have only lastFailure.
        await database
            .collection('embedding_backfill_jobs')
            .updateOne({ _id: job._id } as never, { $unset: { lastDispatchedFailure: '' } });
        const second = await stepJob(job._id, 1, async () => {}, undefined, job._id);
        expect(second?.embeddingRecovery?.slots[0]?.attempts).toBe(3);
        expect(calls).toBe(7);
        expect(generated).toBe(1);
        expect(second?.snapshotIndex).toBe(0);
        expect(first?.lastDispatchedFailure).toEqual(first?.lastFailure);
        expect(second?.lastFailure?.stage).toBe('job_guard');
        expect(second?.lastDispatchedFailure).toEqual(first?.lastDispatchedFailure);
        expect(second?.lastDispatchedFailure?.stage).toBe('embedding');
        expect(second?.lastDispatchedFailure?.requests.embedding).toBe(7);
    } finally {
        send.mockRestore();
    }
}, 15000);

test('full record fits unchanged 360s deadline after 40s privacy + 240s generation + five 25s embeddings', async () => {
    const job = await recoveryFixture();
    const baseline = Date.now();
    let offset = 0;
    const deadlines: { at: number; controller: AbortController }[] = [];
    const now = spyOn(Date, 'now').mockImplementation(() => baseline + offset);
    const timeout = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
        const controller = new AbortController();
        deadlines.push({ at: Date.now() + ms, controller });
        return controller.signal;
    });
    const advance = (ms: number) => {
        offset += ms;
        for (const d of deadlines)
            if (d.at <= Date.now())
                d.controller.abort(
                    new DOMException('synthetic record/stage deadline', 'TimeoutError')
                );
    };
    const pending: (() => void)[] = [];
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(
        async (_command, options) => {
            expect(written).toBe(0);
            expect(typeof options === 'object' ? options.requestTimeout : undefined).toBe(60000);
            return await new Promise<never>(resolve => {
                pending.push(() =>
                    resolve({
                        body: new TextEncoder().encode(
                            JSON.stringify({
                                embeddings: [
                                    { embeddingType: 'TEXT', embedding: Array(1024).fill(1) },
                                ],
                            })
                        ),
                    } as never)
                );
                if (pending.length === 5) {
                    advance(25000);
                    for (const finish of pending) finish();
                }
            });
        }
    );
    beforeGeneration = async () => {
        advance(40000);
        advance(240000);
        expect(observedGeneration?.signal.aborted).toBe(false);
    };
    try {
        const result = await stepJob(job._id, 1, async () => {}, undefined, job._id);
        expect(result?.errors).toBe(0);
        expect(result?.written).toBe(1);
        expect(result?.snapshotIndex).toBe(1);
        expect(generated).toBe(1);
        expect(written).toBe(1);
        expect(send).toHaveBeenCalledTimes(5);
        expect(result?.embeddingRecovery?.slots.map(s => s.attempts)).toEqual([1, 1, 1, 1, 1]);
        expect(offset).toBe(305000);
        expect(280000 + 5 * 25000).toBeGreaterThan(360000);
    } finally {
        send.mockRestore();
        timeout.mockRestore();
        now.mockRestore();
    }
});

test('full record retains four completed vectors while a 60s SDK timeout retries inside unchanged deadline', async () => {
    const job = await recoveryFixture();
    const baseline = Date.now();
    let offset = 0,
        fullAttempts = 0;
    const now = spyOn(Date, 'now').mockImplementation(() => baseline + offset);
    const deadlines: { at: number; controller: AbortController }[] = [];
    const timeout = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
        const controller = new AbortController();
        deadlines.push({ at: Date.now() + ms, controller });
        return controller.signal;
    });
    const advance = (ms: number) => {
        offset += ms;
        for (const d of deadlines)
            if (d.at <= Date.now())
                d.controller.abort(new DOMException('synthetic deadline', 'TimeoutError'));
    };
    const response = () => ({
        body: new TextEncoder().encode(
            JSON.stringify({
                embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
            })
        ),
    });
    const initial: {
        text: string;
        resolve: (value: never) => void;
        reject: (error: unknown) => void;
    }[] = [];
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async command => {
        expect(written).toBe(0);
        if (!(command instanceof InvokeModelCommand) || typeof command.input.body !== 'string')
            throw new Error('Unexpected synthetic command');
        const text = JSON.parse(command.input.body).singleEmbeddingParams.text.value;
        if (text === 'full') fullAttempts += 1;
        if (text === 'full' && fullAttempts === 2) {
            advance(1000);
            advance(25000);
            return response() as never;
        }
        return await new Promise<never>((resolve, reject) => {
            initial.push({ text, resolve, reject });
            if (initial.length === 5) {
                advance(25000);
                for (const call of initial)
                    if (call.text !== 'full') call.resolve(response() as never);
                advance(35000);
                initial
                    .find(call => call.text === 'full')!
                    .reject(
                        Object.assign(new Error('synthetic HTTP2 stream timeout'), {
                            name: 'TimeoutError',
                        })
                    );
            }
        });
    });
    beforeGeneration = async () => advance(200000);
    try {
        const result = await stepJob(job._id, 1, async () => {}, undefined, job._id);
        expect(result?.errors).toBe(0);
        expect(result?.written).toBe(1);
        expect(generated).toBe(1);
        expect(written).toBe(1);
        expect(send).toHaveBeenCalledTimes(6);
        expect(result?.embeddingRecovery?.slots.map(s => s.attempts)).toEqual([2, 1, 1, 1, 1]);
        expect(offset).toBe(286000);
        expect(200000 + 4 * 25000 + 60000 + 1000 + 25000).toBeGreaterThan(360000);
    } finally {
        send.mockRestore();
        timeout.mockRestore();
        now.mockRestore();
    }
});
