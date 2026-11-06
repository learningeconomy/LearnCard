import { expect, mock, test } from 'bun:test';
import { AsyncLocalStorage } from 'node:async_hooks';

// Exercise the real source method against detached metadata, without Mongo,
// Redis, Qdrant, network credentials or paid providers.
const owner = 'did:example:metadata-test';
mock.module('../utils/cache', () => ({ default: {} }));
mock.module('../credentials/service', () => ({
    resolveVerifiedCredentialProjection: () => {
        throw new Error('not used');
    },
}));
mock.module('../credentials/verification', () => ({
    // db/index imports credentials/batch, which checks this class.
    CredentialVerificationUnavailableError: class extends Error {},
    fingerprintCredential: () => {
        throw new Error('not used');
    },
    // db/index also reaches credentials/projection, which imports this.
    getSubjectPayloadShape: () => {
        throw new Error('not used');
    },
}));
mock.module('../ai/pseudonymization', () => ({
    decryptIdentifierMapping: () => {
        throw new Error('not used');
    },
}));
mock.module('../credentials/raw-vault', () => ({
    assertRawCredentialOwner: (did: string) => {
        if (did !== owner) throw new Error('Owner mismatch');
    },
    encryptRawCredential: () => {
        throw new Error('not used');
    },
    decryptRawCredential: () => {
        throw new Error('not used');
    },
}));
mock.module('../services/dataErasure', () => ({
    withOwnerOperation: () => {
        throw new Error('not used');
    },
    getCurrentOwnerOperation: () => undefined,
    assertOwnerOperationActive: () => {
        throw new Error('not used');
    },
    PRIVACY_MAINTENANCE_KEY: 'offline-only',
}));
const { ChatDB } = await import('.');
function fixture(initial: Record<string, any>) {
    const record = structuredClone(initial);
    const reads: Record<string, any>[] = [],
        writes: Record<string, any>[] = [];
    const guarded: string[] = [];
    const collection = {
        findOne: async (filter: Record<string, any>, options: Record<string, any>) => {
            reads.push({ filter, options });
            if (options.projection)
                return Object.fromEntries(
                    Object.keys(options.projection)
                        .filter(key => key in record)
                        .map(key => [key, structuredClone(record[key])])
                );
            return structuredClone(record);
        },
        updateOne: async (filter: Record<string, any>, update: Record<string, any>) => {
            writes.push({ filter, update });
            Object.assign(record, update.$set);
        },
    };
    const database = Object.create(ChatDB.prototype) as InstanceType<typeof ChatDB>;
    Object.assign(database, {
        transaction: new AsyncLocalStorage(),
        db: { collection: () => collection },
        withOwnerWrite: async (did: string, operation: () => Promise<unknown>) => {
            guarded.push(did);
            return operation();
        },
    });
    return { database, reads, writes, record, guarded };
}
test('credential source fencing reads only metadata and preserves existing epoch contract', async () => {
    const f = fixture({
        did: owner,
        uri: 'urn:test',
        embeddingEpoch: 'stable-epoch',
        verification: { contentHash: 'hash', consent: { revision: 'revision' } },
        credential: 'private original',
        rawCredentialJson: 'private original',
        projection: { facts: ['private fact'] },
    });
    expect(
        await f.database.getVectorSource(owner, 'credential', 'urn:test', {
            contentHash: 'hash',
            consentRevision: 'revision',
            epoch: 'stable-epoch',
        })
    ).toEqual({
        kind: 'credential',
        key: 'urn:test',
        epoch: 'stable-epoch',
        contentHash: 'hash',
        consentRevision: 'revision',
    });
    expect(f.reads[0].options.projection).toEqual({
        verification: 1,
        embeddingEpoch: 1,
    });
    expect(f.guarded).toEqual([owner]);
    expect(f.writes).toHaveLength(0);
    await expect(
        f.database.getVectorSource(owner, 'credential', 'urn:test', {
            contentHash: 'different',
            consentRevision: 'revision',
            epoch: 'stable-epoch',
        })
    ).rejects.toThrow('changed');
});
test('missing credential epoch initializes once through the existing owner write boundary', async () => {
    const f = fixture({
        verification: { contentHash: 'hash', consent: { revision: 'revision' } },
    });
    const first = await f.database.getVectorSource(owner, 'credential', 'urn:test', {
        contentHash: 'hash',
        consentRevision: 'revision',
    });
    expect(first.epoch).toMatch(/^[0-9a-f-]{36}$/);
    expect(f.writes).toHaveLength(1);
    expect(f.writes[0]).toEqual({
        filter: { did: owner, uri: 'urn:test' },
        update: { $set: { embeddingEpoch: first.epoch } },
    });
    expect(
        (
            await f.database.getVectorSource(owner, 'credential', 'urn:test', {
                contentHash: 'hash',
                consentRevision: 'revision',
            })
        ).epoch
    ).toBe(first.epoch);
    expect(f.writes).toHaveLength(1);
    expect(f.guarded).toEqual([owner, owner]);
});
// Transaction-shaped fixture for the real v2 source/item commit methods. The
// owner transaction is synthetic; the production method still supplies all
// same-transaction run/item predicates, source CAS and metadata writes.
const { workflowSourceFingerprint, runSourceFingerprint } = await import('../admin/run-model');
function workflowFixture(generated = false) {
    const id = '000000000000000000000042';
    const hash = 'a'.repeat(64),
        revision = 'revision';
    const source: Record<string, any> = {
        _id: id,
        did: owner,
        uri: 'urn:workflow',
        source: generated ? undefined : 'wallet',
        category: generated ? 'AIInsightCredential' : 'Achievement',
        rawContentHash: hash,
        createdAt: '2026-10-14',
        projection: generated ? undefined : { schemaVersion: '1' },
        ...(generated
            ? {}
            : {
                  verification: {
                      contentHash: hash,
                      status: 'valid',
                      credentialUri: 'urn:workflow',
                      checks: ['proof'],
                      errors: [],
                      consent: { revision },
                  },
              }),
    };
    const operation = {
        runId: 'workflow',
        lease: 'lease',
        index: 101,
        initialFingerprint: workflowSourceFingerprint(source),
        originalHash: hash,
    };
    const rows: Record<string, Record<string, any>[]> = {
        credentials: [source],
        embedding_backfill_runs: [
            {
                _id: operation.runId,
                workflowVersion: 2,
                state: 'running',
                lease: operation.lease,
                leaseUntil: new Date(Date.now() + 100000),
                processed: operation.index,
            },
        ],
        embedding_backfill_items: [
            {
                _id: 'workflow:101',
                runId: 'workflow',
                index: 101,
                sourceId: id,
                initialFingerprint: operation.initialFingerprint,
                originalHash: hash,
                state: 'pending',
            },
        ],
        credential_verifications: [],
        raw_credentials: [
            {
                did: owner,
                uri: source.uri,
                contentHash: hash,
                ciphertext: 'preserved',
                expiresAt: new Date(Date.now() + 10000),
            },
        ],
    };
    const scalar = (value: unknown) => (value instanceof Date ? value.getTime() : value);
    const matches = (row: Record<string, any>, filter: Record<string, any>): boolean =>
        Object.entries(filter).every(([key, value]) => {
            const actual = row[key];
            if (value && typeof value === 'object' && !(value instanceof Date))
                return Object.entries(value).every(([op, wanted]) =>
                    op === '$gt'
                        ? scalar(actual)! > scalar(wanted)!
                        : op === '$ne'
                          ? actual !== wanted
                          : false
                );
            return scalar(actual) === scalar(value);
        });
    let expireDuringWrite = false;
    const collections = new Map<string, any>();
    const collection = (name: string) => {
        if (!collections.has(name))
            collections.set(name, {
                findOne: async (filter: Record<string, any>) =>
                    structuredClone(rows[name]?.find(row => matches(row, filter)) ?? null),
                updateOne: async (
                    filter: Record<string, any>,
                    update: Record<string, any>,
                    options: Record<string, any> = {}
                ) => {
                    let row = rows[name]?.find(candidate => matches(candidate, filter));
                    if (!row && options.upsert) {
                        row = { ...filter };
                        (rows[name] ??= []).push(row);
                    }
                    if (!row) return { matchedCount: 0 };
                    Object.assign(row, structuredClone(update.$set ?? {}));
                    for (const [key, increment] of Object.entries(update.$inc ?? {}))
                        row[key] = (row[key] ?? 0) + Number(increment);
                    if (name === 'credentials' && expireDuringWrite)
                        rows.embedding_backfill_runs[0]!.leaseUntil = new Date(0);
                    return { matchedCount: 1 };
                },
            });
        return collections.get(name);
    };
    const database = Object.create(ChatDB.prototype) as InstanceType<typeof ChatDB>;
    Object.assign(database, {
        transaction: new AsyncLocalStorage(),
        db: { collection },
        credentials: collection('credentials'),
        credentialVerifications: collection('credential_verifications'),
        withOwnerWrite: async (did: string, callback: () => Promise<unknown>) => {
            expect(did).toBe(owner);
            const before = structuredClone(rows);
            try {
                return await callback();
            } catch (error) {
                for (const key of Object.keys(rows)) rows[key] = before[key];
                throw error;
            }
        },
    });
    return {
        rows,
        database,
        operation,
        id,
        hash,
        revision,
        source: () => rows.credentials[0]!,
        item: () => rows.embedding_backfill_items[0]!,
        expireDuringWrite: () => {
            expireDuringWrite = true;
        },
    };
}
test('v2 verified-source readiness initializes epoch and resolves the item in its fenced owner transaction', async () => {
    const f = workflowFixture();
    const before = structuredClone(f.rows.raw_credentials);
    expect(
        await f.database.prepareWorkflowEmbedding(
            owner,
            f.id as never,
            f.operation.initialFingerprint,
            f.revision,
            async () => {},
            f.operation
        )
    ).toBe(true);
    expect(f.source().embeddingEpoch).toMatch(/^[0-9a-f-]{36}$/);
    expect(f.item().state).toBe('embedding_ready');
    expect(f.item().resolvedFingerprint).toBe(runSourceFingerprint(f.source() as never));
    expect(f.rows.embedding_backfill_runs[0]!.workflowFence).toBe(2);
    expect(f.rows.raw_credentials).toEqual(before);
});
test('v2 readiness refuses paused authority, source changes and wrong item claims without partial metadata writes', async () => {
    for (const mutation of ['pause', 'source', 'item']) {
        const f = workflowFixture();
        if (mutation === 'pause') f.rows.embedding_backfill_runs[0]!.state = 'paused';
        if (mutation === 'source') f.source().rawContentHash = 'b'.repeat(64);
        if (mutation === 'item') f.item().initialFingerprint = 'wrong';
        const before = structuredClone(f.rows);
        if (mutation === 'source')
            expect(
                await f.database.prepareWorkflowEmbedding(
                    owner,
                    f.id as never,
                    f.operation.initialFingerprint,
                    f.revision,
                    async () => {},
                    f.operation
                )
            ).toBe(false);
        else
            await expect(
                f.database.prepareWorkflowEmbedding(
                    owner,
                    f.id as never,
                    f.operation.initialFingerprint,
                    f.revision,
                    async () => {},
                    f.operation
                )
            ).rejects.toThrow();
        expect(f.rows).toEqual(before);
    }
});
test('v2 generated repair beyond record 100 preserves raw retention and atomically records trusted provenance', async () => {
    const f = workflowFixture(true);
    const { repairSourceFingerprint } = await import('../admin/legacy-repair-source');
    const fingerprint = repairSourceFingerprint(f.source());
    Object.assign(f.item(), {
        repairFingerprint: fingerprint,
        revision: f.revision,
    });
    const original = structuredClone(f.rows.raw_credentials);
    const verification = {
        status: 'valid',
        checks: ['proof'],
        credentialUri: f.source().uri,
        contentHash: f.hash,
        consent: { revision: f.revision },
        provenance: { source: 'generated' },
    };
    expect(
        await f.database.commitLegacyVerification(
            owner,
            f.id as never,
            fingerprint,
            verification as never,
            {
                schemaVersion: '1',
                category: 'AIInsightCredential',
                credentialTypes: ['AIInsightCredential'],
                facts: [],
            },
            async () => {},
            f.operation
        )
    ).toBe(true);
    expect(f.source().source).toBe('generated');
    expect(f.source().uri).toBe('urn:workflow');
    expect(f.source().rawContentHash).toBe(f.hash);
    expect(f.item()).toMatchObject({
        state: 'embedding_ready',
        repaired: true,
        resolvedFingerprint: runSourceFingerprint(f.source() as never),
    });
    expect(f.rows.raw_credentials).toEqual(original);
});
test('v2 generated repair cannot swap the reviewed retained-original hash', async () => {
    const f = workflowFixture(true);
    const { repairSourceFingerprint } = await import('../admin/legacy-repair-source');
    const fingerprint = repairSourceFingerprint(f.source());
    Object.assign(f.item(), {
        repairFingerprint: fingerprint,
        revision: f.revision,
    });
    const before = structuredClone(f.rows);
    await expect(
        f.database.commitLegacyVerification(
            owner,
            f.id as never,
            fingerprint,
            {
                status: 'valid',
                checks: ['proof'],
                credentialUri: f.source().uri,
                contentHash: 'b'.repeat(64),
                consent: { revision: f.revision },
                provenance: { source: 'generated' },
            } as never,
            {} as never,
            async () => {},
            f.operation
        )
    ).rejects.toThrow();
    expect(f.rows).toEqual(before);
});

test('v2 late metadata writes roll back when the workflow lease expires before transaction completion', async () => {
    for (const generated of [false, true]) {
        const f = workflowFixture(generated);
        const { repairSourceFingerprint } = await import('../admin/legacy-repair-source');
        const fingerprint = repairSourceFingerprint(f.source());
        if (generated)
            Object.assign(f.item(), { repairFingerprint: fingerprint, revision: f.revision });
        const before = structuredClone(f.rows);
        f.expireDuringWrite();
        const operation = generated
            ? f.database.commitLegacyVerification(
                  owner,
                  f.id as never,
                  fingerprint,
                  {
                      status: 'valid',
                      checks: ['proof'],
                      credentialUri: f.source().uri,
                      contentHash: f.hash,
                      consent: { revision: f.revision },
                      provenance: { source: 'generated' },
                  } as never,
                  {
                      schemaVersion: '1',
                      category: 'AIInsightCredential',
                      credentialTypes: [],
                      facts: [],
                  },
                  async () => {},
                  f.operation
              )
            : f.database.prepareWorkflowEmbedding(
                  owner,
                  f.id as never,
                  f.operation.initialFingerprint,
                  f.revision,
                  async () => {},
                  f.operation
              );
        await expect(operation).rejects.toThrow('lease expired');
        expect(f.rows).toEqual(before);
    }
});
