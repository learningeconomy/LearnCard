import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { AiConsentError } from '../learncard/consent';
import { repairSourceFingerprint } from './legacy-repair-source';
const mongo = new MongoClient(process.env.MONGO_URI!);
await mongo.connect();
const database = mongo.db(process.env.MONGO_DB!);
const did = 'did:example:synthetic-owner',
    uri = 'urn:synthetic:original';
let revision = 'current',
    shared = true,
    consentError: string | undefined,
    erasure = false;
let reads = 0,
    verifies = 0,
    commits = 0,
    returned = true;
let verifyErrors: string[] = [],
    checks = ['proof'],
    mismatched = false;
let duringVerify: (() => Promise<void>) | undefined;
let holdRead: Promise<void> | undefined;
const receipt = () => ({
    contractUri: 'test:contract',
    receiptId: 'test:receipt',
    status: 'live' as const,
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: shared ? [uri] : [],
    personalFields: [],
    purpose: 'credential-ingestion' as const,
    revision,
    guardian: { required: false, approved: false },
});
mock.module('../ai/privacy', () => ({
    runWithAiPrivacyContext: (_did: string, fn: () => unknown) => fn(),
    assertCurrentAiConsent: async () => {
        if (consentError) throw new AiConsentError(undefined, consentError as never);
        return receipt();
    },
}));
mock.module('../services/dataErasure', () => ({
    isDataErasureRequested: async () => erasure,
    withOwnerOperation: async (_did: string, fn: (signal: AbortSignal) => unknown) => {
        if (erasure) {
            const e = new Error('fixture');
            e.name = 'DataErasureRequestedError';
            throw e;
        }
        return fn(new AbortController().signal);
    },
}));
mock.module('../learncard', () => ({
    getLearnCard: async () => ({
        read: {
            get: async () => {
                reads += 1;
                await holdRead;
                return returned
                    ? {
                          '@context': ['https://www.w3.org/2018/credentials/v1'],
                          id: uri,
                          type: ['VerifiableCredential'],
                          proof: {
                              created: '2026-01-01T00:00:00Z',
                              type: 'Ed25519Signature2020',
                              proofPurpose: 'assertionMethod',
                              verificationMethod: 'did:example:issuer#key-1',
                              proofValue: 'synthetic',
                          },
                          issuer: 'did:example:issuer',
                          issuanceDate: '2026-01-01T00:00:00Z',
                          credentialSubject: {
                              id: mismatched ? 'did:example:other' : did,
                              skills: ['Synthetic algebra'],
                          },
                      }
                    : null;
            },
        },
        invoke: {
            verifyCredential: async () => {
                verifies += 1;
                await duringVerify?.();
                return { checks, errors: verifyErrors, warnings: [] };
            },
        },
    }),
}));
mock.module('../db', () => ({
    db: {
        commitLegacyVerification: async (
            _did: string,
            id: ObjectId,
            fingerprint: string,
            verification: unknown,
            projection: unknown,
            recheck: () => Promise<void>
        ) => {
            await recheck();
            const source = await database.collection('credentials').findOne({ _id: id });
            if (!source || source.verification || repairSourceFingerprint(source) !== fingerprint)
                return false;
            commits += 1;
            await database
                .collection('credentials')
                .updateOne(
                    { _id: id },
                    { $set: { verification, projection, embeddingEpoch: 'new' } }
                );
            return true;
        },
    },
}));
const { inspectLegacySource, createRepairJob, repairJobAction, listRepairJobs } =
    await import('./legacy-repair');
let source: { _id: ObjectId; did: string; uri: string; source: string };
beforeEach(async () => {
    await database.collection('credentials').deleteMany({});
    await database.collection('embedding_legacy_repair_jobs').deleteMany({});
    revision = 'current';
    shared = returned = true;
    erasure = mismatched = false;
    consentError = undefined;
    reads = verifies = commits = 0;
    verifyErrors = [];
    checks = ['proof'];
    duringVerify = undefined;
    holdRead = undefined;
    source = { _id: new ObjectId(), did, uri, source: 'wallet' };
    await database.collection('credentials').insertOne(source);
});
afterAll(async () => {
    await database.dropDatabase();
    await mongo.close();
});
const expected = () => ({
    fingerprint: repairSourceFingerprint(source),
    revision: 'current',
});
test('preview is eligibility-only; explicit verification saves metadata without ingestion or raw retention', async () => {
    const job = await createRepairJob(randomUUID());
    const preview = await repairJobAction(job._id, false);
    expect(preview.awaitingVerification).toBe(true);
    expect(reads + verifies + commits).toBe(0);
    const result = await repairJobAction(job._id, true);
    expect(result.outcomes).toEqual({ repaired: 1 });
    expect([reads, verifies, commits]).toEqual([1, 1, 1]);
    const saved = await database.collection('credentials').findOne({ _id: source._id });
    expect(saved?.verification.status).toBe('valid');
    expect(saved).not.toHaveProperty('rawCredentialJson');
    expect(await database.collection('raw_credentials').countDocuments()).toBe(0);
    await expect(repairJobAction(job._id, true)).rejects.toThrow('preview');
    expect(commits).toBe(1);
    expect(JSON.stringify(await listRepairJobs())).not.toContain(uri);
    expect(JSON.stringify(await listRepairJobs())).not.toContain(did);
});
for (const [reason, change] of [
    ['missing_owner', { did: 'invalid' }],
    ['missing_uri', { uri: '' }],
    ['generated', { source: 'generated' }],
    ['generated', { source: undefined, category: 'AIInsightCredential' }],
    ['already_verified', { verification: { status: 'invalid' } }],
] as const)
    test(`preview excludes ${reason} without original reads`, async () => {
        expect((await inspectLegacySource({ ...source, ...change }, false)).outcome).toBe(reason);
        expect(reads + verifies + commits).toBe(0);
    });
for (const reason of ['missing', 'revoked', 'expired', 'guardian_required', 'unavailable'] as const)
    test(`consent ${reason} fails closed before original read`, async () => {
        consentError = reason;
        const result = await inspectLegacySource(source, true, expected());
        expect(result.outcome).toBe(reason === 'guardian_required' ? reason : `consent_${reason}`);
        expect(reads + verifies + commits).toBe(0);
    });
test('unshared and erased originals are never read', async () => {
    shared = false;
    expect((await inspectLegacySource(source, false)).outcome).toBe('unshared');
    erasure = true;
    expect((await inspectLegacySource(source, false)).outcome).toBe('owner_erased');
    expect(reads + verifies + commits).toBe(0);
});
for (const [reason, errors] of [
    ['credential_invalid', ['Invalid signature']],
    ['credential_revoked', ['Credential is revoked.']],
    ['credential_expired', ['expiration error: Credential is not valid yet']],
    ['credential_invalid', ['expiration error: Credential is expired', 'Invalid signature']],
    ['verification_unavailable', ['Resolver unavailable: sensitive fixture text']],
] as const)
    test(`invalid original ${reason} never changes persisted source`, async () => {
        verifyErrors = [...errors];
        expect((await inspectLegacySource(source, true, expected())).outcome).toBe(reason);
        expect(commits).toBe(0);
        expect(
            (await database.collection('credentials').findOne({ _id: source._id }))?.verification
        ).toBeUndefined();
    });
for (const error of [
    'expiration error: Credential is expired',
    'expiration error: Credential is no longer valid',
])
    test(`an expired original with a confirmed proof is repaired and marked expired (${error})`, async () => {
        verifyErrors = [error];
        expect((await inspectLegacySource(source, true, expected())).outcome).toBe('repaired');
        expect(commits).toBe(1);
        const saved = await database.collection('credentials').findOne({ _id: source._id });
        expect(saved?.verification.status).toBe('valid');
        expect(saved?.verification.errors).toEqual([]);
        expect(saved?.verification.warnings).toContain('credential_expired');
        expect(saved?.projection.expired).toBe(true);
    });
test('an expired original without a confirmed proof stays blocked as expired', async () => {
    verifyErrors = ['expiration error: Credential is expired'];
    checks = [];
    expect((await inspectLegacySource(source, true, expected())).outcome).toBe(
        'credential_expired'
    );
    expect(commits).toBe(0);
});
test('subject mismatch, missing proof and missing original fail closed', async () => {
    mismatched = true;
    expect((await inspectLegacySource(source, true, expected())).outcome).toBe('subject_mismatch');
    mismatched = false;
    checks = [];
    expect((await inspectLegacySource(source, true, expected())).outcome).toBe(
        'verification_unavailable'
    );
    returned = false;
    expect((await inspectLegacySource(source, true, expected())).outcome).toBe(
        'original_unavailable'
    );
    expect(commits).toBe(0);
});
test('source and consent changes after preview or during verification prevent repair', async () => {
    const job = await createRepairJob(randomUUID());
    await repairJobAction(job._id, false);
    await database
        .collection('credentials')
        .updateOne({ _id: source._id }, { $set: { embeddingEpoch: 'concurrent' } });
    expect((await repairJobAction(job._id, true)).outcomes.source_changed).toBe(1);
    expect(reads).toBe(0);
    duringVerify = async () => {
        revision = 'changed';
    };
    expect((await inspectLegacySource(source, true, expected())).outcome).toBe(
        'consent_unavailable'
    );
    expect(commits).toBe(0);
});
test('exclusive durable lease and restarted preview do not repeat or race repair', async () => {
    const job = await createRepairJob(randomUUID());
    await repairJobAction(job._id, false);
    const entered = Promise.withResolvers<void>(),
        release = Promise.withResolvers<void>();
    holdRead = release.promise;
    duringVerify = async () => {
        entered.resolve();
    };
    const first = repairJobAction(job._id, true);
    while (!reads) await new Promise(resolve => setTimeout(resolve, 1));
    await expect(repairJobAction(job._id, true)).rejects.toThrow('active');
    release.resolve();
    await first;
    expect(commits).toBe(1);
    const saved = await database
        .collection('embedding_legacy_repair_jobs')
        .findOne({ _id: job._id } as never);
    expect(saved?.cursor).toBe(String(source._id));
    expect(saved?.candidate).toBeUndefined();
});

test('range caps and continuation preserve cursor without touching backfill', async () => {
    const id = randomUUID();
    await createRepairJob(id);
    await database
        .collection('credentials')
        .updateOne({ _id: source._id }, { $set: { source: 'generated' } });
    await database
        .collection('embedding_legacy_repair_jobs')
        .updateOne({ _id: id } as never, { $set: { scanned: 99 } });
    const done = await repairJobAction(id, false);
    expect(done.state).toBe('completed');
    expect(done.scanned).toBe(100);
    const next = await createRepairJob(randomUUID(), id);
    expect(next.scanned).toBe(0);
    expect((await repairJobAction(next._id, false)).state).toBe('completed');
    expect(await database.collection('embedding_backfill_jobs').countDocuments()).toBe(0);
});
test('expired lease after preview cannot publish success or commit metadata', async () => {
    const job = await createRepairJob(randomUUID());
    await repairJobAction(job._id, false);
    duringVerify = async () => {
        await database
            .collection('embedding_legacy_repair_jobs')
            .updateOne({ _id: job._id } as never, {
                $set: { leaseUntil: new Date(0) },
            });
    };
    await expect(repairJobAction(job._id, true)).rejects.toThrow('unavailable');
    expect(commits).toBe(0);
    expect(
        (await database.collection('credentials').findOne({ _id: source._id }))?.verification
    ).toBeUndefined();
});

test('manual repair cannot claim batch-owned job and paused guard stops original retrieval', async () => {
    const job = await createRepairJob(randomUUID());
    await database
        .collection('embedding_legacy_repair_jobs')
        .updateOne({ _id: job._id } as never, { $set: { batchId: 'fixture-batch' } });
    await expect(repairJobAction(job._id, false)).rejects.toThrow();
    await repairJobAction(job._id, false, async () => {}, 'fixture-batch');
    let checks = 0;
    const result = await repairJobAction(
        job._id,
        true,
        async () => {
            checks += 1;
            if (checks > 1) throw new Error('paused');
        },
        'fixture-batch'
    );
    expect(result.repaired).toBe(0);
    expect(reads).toBe(0);
    expect(verifies).toBe(0);
    expect(commits).toBe(0);
});
