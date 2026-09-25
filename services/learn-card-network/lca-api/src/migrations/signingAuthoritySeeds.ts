import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { Db, Document, Filter } from 'mongodb';

import { SIGNING_AUTHORITIES_COLLECTION } from '@models';
import {
    getSeedIdentity,
    logSeedEncryptionFailure,
    parseSeedEnvelope,
    SeedEncryptionError,
    seedEncryption,
} from '@helpers/seedEncryption.helpers';
import type { EncryptedSigningAuthoritySeed } from 'types/seed-encryption';
import type {
    MigrationSigningAuthority,
    SeedMigrationCounts,
    SeedMigrationReceipt,
    SeedMigrationRequest,
    SeedMigrationResult,
    SeedMigrationState,
} from 'types/seed-migration';

export const SEED_MIGRATION_STATE_COLLECTION = 'signingauthorityseedmigration';
export const SEED_MIGRATION_RECEIPTS_COLLECTION = 'signingauthorityseedverification';
const STATE_ID = 'sa-seeds-v1';
const LEASE_MS = 16 * 60 * 1000; // Longer than the Lambda's maximum lifetime.
const ENVELOPE_FIELDS = ['encryptedSeed', 'encryptedDek', 'keyVersion'] as const;
const RECEIPT_FIELDS = [...ENVELOPE_FIELDS, 'ownerDid', 'name', 'did'] as const;

export class SeedMigrationError extends Error {
    constructor(public readonly category: string) {
        super(`Signing authority seed migration stopped: ${category}`);
        this.name = 'SeedMigrationError';
    }
}

const hasField = (field: string): Document => ({ $ne: [{ $type: `$${field}` }, 'missing'] });
const isString = (field: string): Document => ({ $eq: [{ $type: `$${field}` }, 'string'] });

/** One aggregation reconciles the collection; cryptographic validity is checked in verify/purge. */
export const countSeedMigrationDocuments = async (db: Db): Promise<SeedMigrationCounts> => {
    const encrypted = {
        $and: [
            { $in: ['$keyVersion', ['kms-v1', 'local-v1']] },
            isString('encryptedSeed'),
            isString('encryptedDek'),
            { $ne: ['$encryptedSeed', ''] },
            { $ne: ['$encryptedDek', ''] },
        ],
    };
    const legacy = {
        $and: [
            ...ENVELOPE_FIELDS.map(field => ({ $eq: [{ $type: `$${field}` }, 'missing'] })),
            isString('seed'),
            { $ne: ['$seed', ''] },
        ],
    };
    const result = await db
        .collection(SIGNING_AUTHORITIES_COLLECTION)
        .aggregate<SeedMigrationCounts>([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    encrypted: { $sum: { $cond: [encrypted, 1, 0] } },
                    legacyOnly: { $sum: { $cond: [legacy, 1, 0] } },
                    malformed: { $sum: { $cond: [{ $or: [encrypted, legacy] }, 0, 1] } },
                    plaintextRemaining: { $sum: { $cond: [hasField('seed'), 1, 0] } },
                },
            },
            { $project: { _id: 0 } },
        ])
        .next();
    return result ?? { total: 0, encrypted: 0, legacyOnly: 0, malformed: 0, plaintextRemaining: 0 };
};

const snapshotFilter = (record: MigrationSigningAuthority): Filter<MigrationSigningAuthority> => {
    const filter: Document = { _id: record._id };
    for (const field of [...RECEIPT_FIELDS, 'seed']) {
        filter[field] = Object.hasOwn(record, field) ? { $eq: record[field] } : { $exists: false };
    }
    return filter;
};

const sameSeed = (actual: string, expected: string): boolean => {
    const left = Buffer.from(actual);
    const right = Buffer.from(expected);
    try {
        return left.length === right.length && timingSafeEqual(left, right);
    } finally {
        left.fill(0);
        right.fill(0);
    }
};

const verifyRecord = async (
    record: MigrationSigningAuthority
): Promise<EncryptedSigningAuthoritySeed> => {
    const envelope = parseSeedEnvelope(record);
    if (!envelope) throw new SeedMigrationError('legacy_record_remaining');
    const seed = await seedEncryption.decrypt(envelope, getSeedIdentity(record));
    if (
        Object.hasOwn(record, 'seed') &&
        (typeof record.seed !== 'string' || !sameSeed(seed, record.seed))
    ) {
        throw new SeedMigrationError('seed_mismatch');
    }
    return envelope;
};

const receiptFor = (
    record: MigrationSigningAuthority,
    envelope: EncryptedSigningAuthoritySeed,
    epoch: string
): SeedMigrationReceipt => ({
    _id: record._id,
    epoch,
    ...envelope,
    ownerDid: record.ownerDid,
    name: record.name,
    did: record.did ?? null,
});

// Query receipts against the CURRENT document, not an offset or a caller-supplied cursor.
// Inserts before a cursor, restarts, or document changes therefore cannot skip verification.
const pendingVerification = (epoch: string): Document[] => [
    {
        $lookup: {
            from: SEED_MIGRATION_RECEIPTS_COLLECTION,
            localField: '_id',
            foreignField: '_id',
            as: '_verification',
        },
    },
    {
        $match: {
            $expr: {
                $not: [
                    {
                        $and: [
                            { $eq: [{ $arrayElemAt: ['$_verification.epoch', 0] }, epoch] },
                            ...RECEIPT_FIELDS.map(field => ({
                                $eq: [
                                    {
                                        $ifNull: [
                                            { $arrayElemAt: [`$_verification.${field}`, 0] },
                                            null,
                                        ],
                                    },
                                    { $ifNull: [`$${field}`, null] },
                                ],
                            })),
                        ],
                    },
                ],
            },
        },
    },
    { $project: { _verification: 0 } },
];

/**
 * Process one idempotent batch. The caller repeats until done. No seed is returned or checkpointed.
 * All writes use majority acknowledgement; purge requires a completed verification epoch.
 */
export const runSeedMigrationBatch = async (
    db: Db,
    request: SeedMigrationRequest,
    options: { encryptedWritesEnabled: boolean; remainingTime?: () => number }
): Promise<SeedMigrationResult> => {
    if (
        !['dry-run', 'prepare', 'verify', 'purge'].includes(request.phase) ||
        (request.batchSize !== undefined &&
            (!Number.isInteger(request.batchSize) ||
                request.batchSize < 1 ||
                request.batchSize > 100))
    ) {
        throw new SeedMigrationError('invalid_request');
    }
    const phase = request.phase;
    const batchSize = request.batchSize ?? 50;
    if (phase === 'dry-run') {
        const result = {
            phase,
            done: true,
            processed: 0,
            counts: await countSeedMigrationDocuments(db),
        };
        console.info({ event: 'signing_authority_seed_migration', ...result });
        return result;
    }
    if (!options.encryptedWritesEnabled) throw new SeedMigrationError('encrypted_writes_required');

    const states = db.collection<SeedMigrationState>(SEED_MIGRATION_STATE_COLLECTION);
    const receipts = db.collection<SeedMigrationReceipt>(SEED_MIGRATION_RECEIPTS_COLLECTION);
    const authorities = db.collection<MigrationSigningAuthority>(SIGNING_AUTHORITIES_COLLECTION);
    const writeConcern = { w: 'majority' as const };
    // Initialize separately so a held lease never makes an upsert overwrite/duplicate the singleton.
    try {
        await states.updateOne(
            { _id: STATE_ID },
            { $setOnInsert: { _id: STATE_ID } },
            { upsert: true, writeConcern }
        );
    } catch {
        throw new SeedMigrationError('checkpoint_unavailable');
    }
    const token = randomUUID();
    const state = await states.findOneAndUpdate(
        {
            _id: STATE_ID,
            $or: [{ leaseOwner: { $exists: false } }, { leaseExpiresAt: { $lte: new Date() } }],
        },
        { $set: { leaseOwner: token, leaseExpiresAt: new Date(Date.now() + LEASE_MS) } },
        {
            returnDocument: 'after',
            writeConcern,
        }
    );
    if (!state) throw new SeedMigrationError('worker_busy');
    const lease = { _id: STATE_ID, leaseOwner: token };
    let current: MigrationSigningAuthority | undefined;
    let processed = 0;
    try {
        const countsBefore = await countSeedMigrationDocuments(db);
        if (countsBefore.malformed) throw new SeedMigrationError('malformed_records');
        if (
            phase === 'purge' &&
            (!state.verifiedEpoch || countsBefore.encrypted !== countsBefore.total)
        ) {
            throw new SeedMigrationError('verification_required');
        }
        const epoch =
            phase === 'verify'
                ? ((state.phase === 'verify' && state.status !== 'failed'
                      ? state.epoch
                      : undefined) ?? randomUUID())
                : (state.verifiedEpoch ?? '');
        const checkpoint: Partial<SeedMigrationState> = {
            phase,
            status: 'running',
            updatedAt: new Date(),
        };
        if (phase === 'verify') checkpoint.epoch = epoch;
        await states.updateOne(
            lease,
            {
                $set: checkpoint,
                ...(phase !== 'purge' ? { $unset: { verifiedEpoch: '' } } : {}),
            },
            { writeConcern }
        );

        const records =
            phase === 'verify'
                ? await authorities
                      .aggregate<MigrationSigningAuthority>([
                          ...pendingVerification(epoch),
                          { $limit: batchSize },
                      ])
                      .toArray()
                : await authorities
                      .find(
                          phase === 'prepare'
                              ? { keyVersion: { $exists: false } }
                              : { seed: { $exists: true } }
                      )
                      .limit(batchSize)
                      .toArray();

        for (const record of records) {
            if (options.remainingTime && options.remainingTime() < 15_000) break;
            current = record;
            if (phase === 'prepare') {
                if (parseSeedEnvelope(record) || typeof record.seed !== 'string') {
                    throw new SeedMigrationError('invalid_legacy_record');
                }
                const envelope = await seedEncryption.encrypt(record.seed, getSeedIdentity(record));
                const updated = await authorities.updateOne(
                    snapshotFilter(record),
                    { $set: envelope },
                    { writeConcern }
                );
                if (updated.matchedCount !== 1) throw new SeedMigrationError('document_changed');
                const persisted = await authorities.findOne(
                    snapshotFilter({ ...record, ...envelope })
                );
                if (!persisted) throw new SeedMigrationError('document_changed');
                await verifyRecord(persisted);
            } else if (phase === 'verify') {
                const envelope = await verifyRecord(record);
                if (
                    !(await authorities.findOne(snapshotFilter(record), { projection: { _id: 1 } }))
                ) {
                    throw new SeedMigrationError('document_changed');
                }
                await receipts.replaceOne(
                    { _id: record._id },
                    receiptFor(record, envelope, epoch),
                    {
                        upsert: true,
                        writeConcern,
                    }
                );
            } else {
                const envelope = parseSeedEnvelope(record);
                if (!envelope || !(await receipts.findOne(receiptFor(record, envelope, epoch)))) {
                    throw new SeedMigrationError('reverification_required');
                }
                await verifyRecord(record);
                const updated = await authorities.updateOne(
                    snapshotFilter(record),
                    { $unset: { seed: '' } },
                    { writeConcern }
                );
                if (updated.matchedCount !== 1) throw new SeedMigrationError('document_changed');
            }
            processed += 1;
        }

        const counts = await countSeedMigrationDocuments(db);
        const pending =
            phase === 'verify'
                ? Boolean(
                      await authorities
                          .aggregate([...pendingVerification(epoch), { $limit: 1 }])
                          .next()
                  )
                : phase === 'prepare'
                  ? counts.legacyOnly > 0
                  : counts.plaintextRemaining > 0;
        const done = !pending;
        if (counts.malformed || (phase !== 'prepare' && counts.encrypted !== counts.total)) {
            throw new SeedMigrationError('reconciliation_failed');
        }
        await states.updateOne(
            lease,
            {
                $set: {
                    counts,
                    status: done ? 'complete' : 'running',
                    updatedAt: new Date(),
                    ...(phase === 'verify' && done ? { verifiedEpoch: epoch } : {}),
                },
                $inc: { processed },
            },
            { writeConcern }
        );
        const result = { phase, done, processed, counts };
        console.info({ event: 'signing_authority_seed_migration', ...result });
        return result;
    } catch (error) {
        // Clear the purge gate even after partial success; rerun verify before continuing purge.
        await states.updateOne(
            lease,
            {
                $set: { status: 'failed', updatedAt: new Date() },
                $unset: { verifiedEpoch: '' },
            },
            { writeConcern }
        );
        logSeedEncryptionFailure(error, `migration_${phase}`, current);
        throw new SeedMigrationError(
            error instanceof SeedMigrationError
                ? error.category
                : error instanceof SeedEncryptionError
                  ? error.category
                  : 'operation_failed'
        );
    } finally {
        await states.updateOne(
            lease,
            { $unset: { leaseOwner: '', leaseExpiresAt: '' } },
            { writeConcern }
        );
    }
};
