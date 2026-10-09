import { createHash, createHmac, randomBytes } from 'crypto';
import { z } from 'zod';
import type { Collection } from 'mongodb';
import mongodb from '@mongo';
import { environment } from '@environment';
import {
    AuthProviderMappingValidator,
    EscrowEnvelopeValidator,
    type AuthProviderMapping,
} from './UserKey';

export const ESCROW_HOLDS_COLLECTION = 'escrowholds';
export const ESCROW_HOLD_STALE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const ESCROW_HOLD_RESTART_MIN_AGE_MS = environment.ESCROW_HOLD_RESTART_MIN_AGE_MS;
export const ESCROW_HOLD_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
// Opaque JSON validated for shape, not signature authenticity. Preserve signed extensions.
export const EscrowHoldRecordValidator = z
    .object({
        hold: z
            .object({
                holdId: z.string().min(1),
                did: z.string().min(1),
                shareVersion: z.number().int().positive(),
                blobHash: z.string().regex(/^[0-9a-f]{64}$/),
                enrollmentEpoch: z.number().int().positive(),
                releasePolicy: z.enum(['hold', 'pin']),
                clientEphemeralPublicKey: z.string().min(1),
                createdLo: z.number().int().nonnegative(),
                createdHi: z.number().int().nonnegative(),
                policyVersion: z.number().int().positive(),
                signature: z.string().min(1),
            })
            .passthrough(),
        holdDurationMs: z.number().int().nonnegative(),
        ledgerSeq: z.number().int().nonnegative(),
    })
    .passthrough();
export const EscrowHoldValidator = z.object({
    // Required for new holds before escrow production launch. Raw Mongo reads can
    // still return legacy rows without it; cancellation/release must check at runtime.
    holdRecord: EscrowHoldRecordValidator,
    _id: z.string().uuid(),
    authProvider: AuthProviderMappingValidator,
    primaryDid: z.string(),
    shareVersion: z.number().int().positive(),
    status: z.enum(['pending', 'cancelled', 'completed', 'expired']),
    identityProofType: z.enum(['auth-token', 'recovery-session']),
    requestedAt: z.date(),
    releaseAfter: z.date(),
    releasePolicy: z.enum(['hold', 'pin']).default('hold'),
    cancelReason: z.enum(['pin-mismatch', 'pin-locked', 'superseded', 'release-failed']).optional(),
    cancelledAt: z.date().optional(),
    enclaveCancelPendingAt: z.date().optional(),
    enclaveCancelConfirmedAt: z.date().optional(),
    enclaveCancelAttempts: z.number().int().nonnegative().optional(),
    // Retain ciphertext for revocation even after account removal or re-enrollment.
    enclaveEnvelope: EscrowEnvelopeValidator.optional(),
    cancelledBy: z.enum(['did', 'system', 'link']).optional(),
    completedAt: z.date().optional(),
    clientEphemeralPublicKey: z.string().min(1).max(512),
    resumeTokenHash: z.string().regex(/^[0-9a-f]{64}$/),
    cancelTokenHash: z
        .string()
        .regex(/^[0-9a-f]{64}$/)
        .optional(),
    cancelTokenUsedAt: z.date().optional(),
    cancelTokenHashes: z
        .array(z.string().regex(/^[0-9a-f]{64}$/))
        .max(4)
        .optional(),
    startedNotificationPending: z.boolean().optional(),
    reminderClaimedUntil: z.date().optional(),
    startedNotificationAttemptedAt: z.date().optional(),
    reminderAttemptedAt: z.date().optional(),
    notifications: z
        .array(
            z.object({
                kind: z.enum(['started', 'reminder', 'completed', 'cancelled', 'pin-locked']),
                sentAt: z.date(),
            })
        )
        .default([]),
    requestIp: z.string().optional(),
    /**
     * Resolved tenant id (`ResolvedTenant.id`) at the moment `startRecovery`
     * created this hold. Optional because holds created before this field
     * existed have none; the reminders job (P5.5) falls back to the default
     * tenant via the email-templates registry when absent.
     */
    tenantId: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type EscrowHold = z.infer<typeof EscrowHoldValidator>;
export type CreateEscrowHoldInput = Omit<
    z.input<typeof EscrowHoldValidator>,
    | '_id'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'notifications'
    | 'cancelledAt'
    | 'cancelledBy'
    | 'completedAt'
    | 'cancelReason'
    | 'cancelTokenUsedAt'
    | 'enclaveCancelPendingAt'
    | 'enclaveCancelConfirmedAt'
    | 'enclaveCancelAttempts'
>;

export const getEscrowHoldsCollection = (): Collection<EscrowHold> =>
    mongodb.collection<EscrowHold>(ESCROW_HOLDS_COLLECTION);

const runIndexMigrationOperation = async (operation: () => Promise<unknown>): Promise<void> => {
    try {
        await operation();
    } catch (error) {
        const code =
            typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        // Unlike lookup indexes, uniqueness is a security invariant: fail closed on duplicates.
        if (code === 27 || code === 85 || code === 86) {
            const indexes = await getEscrowHoldsCollection().listIndexes().toArray();
            if (
                indexes.some(
                    index =>
                        index.unique &&
                        Object.keys(index.key ?? {}).length === 3 &&
                        index.key?.['authProvider.type'] === 1 &&
                        index.key?.['authProvider.id'] === 1 &&
                        index.key?.releasePolicy === 1 &&
                        Object.keys(index.partialFilterExpression ?? {}).length === 1 &&
                        index.partialFilterExpression?.status === 'pending'
                )
            )
                return;
        }
        throw new Error('Escrow hold index initialization failed', { cause: error });
    }
};

export const createEscrowHoldsIndexes = async (): Promise<void> => {
    const collection = getEscrowHoldsCollection();
    // Normalize legacy rows while the old, stricter index still protects them.
    await collection.updateMany(
        { releasePolicy: { $exists: false } },
        { $set: { releasePolicy: 'hold' } }
    );
    await runIndexMigrationOperation(() =>
        collection.createIndex(
            { 'authProvider.type': 1, 'authProvider.id': 1, releasePolicy: 1 },
            {
                name: 'pending_escrow_identity_policy_unique',
                unique: true,
                partialFilterExpression: { status: 'pending' },
            }
        )
    );
    // Install the replacement before dropping the old index: no uniqueness gap.
    try {
        await collection.dropIndex('pending_escrow_identity_unique');
    } catch (error) {
        if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 27))
            throw error;
    }
    await runIndexMigrationOperation(() =>
        collection.createIndex({ 'authProvider.type': 1, 'authProvider.id': 1, status: 1 })
    );
    await runIndexMigrationOperation(() => collection.createIndex({ releaseAfter: 1 }));
    // Backs findEscrowHoldsDueForReminder's { status:'pending', releaseAfter: {$gt,$lte} } scan.
    await collection.createIndex(
        { status: 1, releaseAfter: 1 },
        { name: 'pending_escrow_hold_reminder_lookup' }
    );
    await collection.createIndex(
        { status: 1, enclaveCancelConfirmedAt: 1, enclaveCancelAttempts: 1, releaseAfter: 1 },
        { name: 'escrow_enclave_cancel_retry_lookup' }
    );
    await collection.createIndex(
        { primaryDid: 1, status: 1, enclaveCancelConfirmedAt: 1 },
        { name: 'escrow_enclave_cancel_identity_lookup' }
    );
};

export const createEscrowHold = async (input: CreateEscrowHoldInput): Promise<EscrowHold> => {
    const now = new Date();
    const parsed = EscrowHoldValidator.safeParse({
        ...input,
        _id: input.holdRecord?.hold?.holdId,
        status: 'pending',
        notifications: [],
        createdAt: now,
        updatedAt: now,
    });
    if (!parsed.success) throw new Error('Invalid escrow hold');
    const hold = parsed.data;
    await getEscrowHoldsCollection().insertOne(hold);
    return hold;
};
export const findPendingEscrowHoldByAuthProvider = async (
    authProvider: AuthProviderMapping,
    releasePolicy?: EscrowHold['releasePolicy']
): Promise<EscrowHold | null> =>
    getEscrowHoldsCollection().findOne({
        'authProvider.type': authProvider.type,
        'authProvider.id': authProvider.id,
        status: 'pending',
        ...(releasePolicy === 'hold'
            ? { $or: [{ releasePolicy: 'hold' as const }, { releasePolicy: { $exists: false } }] }
            : releasePolicy
              ? { releasePolicy }
              : {}),
    });
export const findEscrowHoldById = async (id: string): Promise<EscrowHold | null> =>
    getEscrowHoldsCollection().findOne({ _id: id });
/** Fail closed across linked providers and enrollment changes until revocation is confirmed. */
export const hasUnconfirmedEscrowCancellation = async (primaryDid: string): Promise<boolean> =>
    (await getEscrowHoldsCollection().countDocuments(
        {
            primaryDid,
            status: 'cancelled',
            enclaveCancelPendingAt: { $exists: true },
            enclaveCancelConfirmedAt: { $exists: false },
        },
        { limit: 1 }
    )) > 0;

export const findEscrowHoldsPendingEnclaveCancellation = async (
    limit: number
): Promise<EscrowHold[]> =>
    getEscrowHoldsCollection()
        .find({
            status: 'cancelled',
            enclaveCancelPendingAt: { $exists: true },
            enclaveCancelConfirmedAt: { $exists: false },
        })
        .sort({ enclaveCancelAttempts: 1, releaseAfter: 1 })
        .limit(limit)
        .toArray();

export const countEscrowCancellationsNearRelease = async (now: Date): Promise<number> =>
    getEscrowHoldsCollection().countDocuments({
        status: 'cancelled',
        enclaveCancelPendingAt: { $exists: true },
        enclaveCancelConfirmedAt: { $exists: false },
        releaseAfter: { $lte: new Date(now.getTime() + ESCROW_HOLD_REMINDER_WINDOW_MS) },
    });

export const recordEscrowEnclaveCancelAttempt = async (id: string): Promise<boolean> => {
    const result = await getEscrowHoldsCollection().updateOne(
        {
            _id: id,
            status: 'cancelled',
            enclaveCancelPendingAt: { $exists: true },
            enclaveCancelConfirmedAt: { $exists: false },
        },
        { $inc: { enclaveCancelAttempts: 1 }, $set: { updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
};

export const confirmEscrowEnclaveCancellation = async (id: string): Promise<void> => {
    const now = new Date();
    await getEscrowHoldsCollection().updateOne(
        {
            _id: id,
            status: 'cancelled',
            enclaveCancelPendingAt: { $exists: true },
            enclaveCancelConfirmedAt: { $exists: false },
        },
        {
            $set: { enclaveCancelConfirmedAt: now, updatedAt: now },
            $unset: { enclaveCancelPendingAt: '', enclaveEnvelope: '' },
        }
    );
};

export const cancelEscrowHold = async (
    id: string,
    cancelledBy: 'did' | 'system',
    cancelReason?: EscrowHold['cancelReason']
): Promise<EscrowHold | null> => {
    const now = new Date();
    return getEscrowHoldsCollection().findOneAndUpdate(
        { _id: id, status: 'pending' },
        {
            $set: {
                status: 'cancelled',
                cancelledBy,
                cancelledAt: now,
                enclaveCancelPendingAt: now,
                enclaveCancelAttempts: 0,
                updatedAt: now,
                ...(cancelReason ? { cancelReason } : {}),
            },
        },
        { returnDocument: 'after' }
    );
};
/**
 * Cancels a hold via its single-use cancel-link token. The status transition
 * and burning the token happen in one conditional update — matching on the
 * exact `cancelTokenHash` plus `cancelTokenUsedAt` being unset — so two
 * concurrent clicks on the same link can never both succeed; only the first
 * `findOneAndUpdate` observes the pre-burn state and wins the CAS.
 */
export const cancelEscrowHoldByCancelToken = async (
    id: string,
    cancelTokenHash: string
): Promise<EscrowHold | null> => {
    const now = new Date();
    return getEscrowHoldsCollection().findOneAndUpdate(
        {
            _id: id,
            status: 'pending',
            $or: [{ cancelTokenHash }, { cancelTokenHashes: cancelTokenHash }],
            cancelTokenUsedAt: { $exists: false },
        },
        {
            $set: {
                status: 'cancelled',
                cancelledBy: 'link',
                cancelledAt: now,
                enclaveCancelPendingAt: now,
                enclaveCancelAttempts: 0,
                cancelTokenUsedAt: now,
                updatedAt: now,
            },
        },
        { returnDocument: 'after' }
    );
};
export const completeEscrowHold = async (id: string): Promise<EscrowHold | null> => {
    const now = new Date();
    return getEscrowHoldsCollection().findOneAndUpdate(
        {
            _id: id,
            status: 'pending',
            releaseAfter: { $gte: new Date(now.getTime() - ESCROW_HOLD_STALE_WINDOW_MS) },
        },
        {
            $set: { status: 'completed', completedAt: now, updatedAt: now },
        },
        { returnDocument: 'after' }
    );
};
/** Whether escrow material at this share version has already been released. */
export const hasCompletedEscrowHoldForVersion = async (
    authProvider: AuthProviderMapping,
    shareVersion: number
): Promise<boolean> =>
    (await getEscrowHoldsCollection().countDocuments(
        {
            'authProvider.type': authProvider.type,
            'authProvider.id': authProvider.id,
            shareVersion,
            status: 'completed',
        },
        { limit: 1 }
    )) > 0;
export const expireStaleEscrowHolds = async (now: Date): Promise<number> => {
    const result = await getEscrowHoldsCollection().updateMany(
        {
            status: 'pending',
            releaseAfter: { $lt: new Date(now.getTime() - ESCROW_HOLD_STALE_WINDOW_MS) },
        },
        { $set: { status: 'expired', updatedAt: now } }
    );
    return result.modifiedCount;
};

/** Only rewrite the completed row claimed by this request; never reopen a burned hold. */
export const markClaimedEscrowHoldFailed = async (
    id: string,
    reason: 'pin-mismatch' | 'pin-locked' | 'release-failed',
    completedAt: Date
): Promise<void> => {
    const now = new Date();
    await getEscrowHoldsCollection().updateOne(
        { _id: id, status: 'completed', completedAt },
        {
            $set: {
                status: 'cancelled',
                cancelledBy: 'system',
                cancelReason: reason,
                cancelledAt: now,
                enclaveCancelPendingAt: now,
                enclaveCancelAttempts: 0,
                updatedAt: now,
            },
        }
    );
};
/** Reopen only our own failed release claim, never another request's terminal row. */
export const retryClaimedEscrowHold = async (id: string, completedAt: Date): Promise<void> => {
    try {
        await getEscrowHoldsCollection().updateOne(
            { _id: id, status: 'completed', completedAt },
            { $set: { status: 'pending', updatedAt: new Date() }, $unset: { completedAt: '' } }
        );
    } catch (error) {
        // A replacement hold may have won the pending unique index while we released.
        if (!(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 11000
        ))
            throw error;
        await markClaimedEscrowHoldFailed(id, 'release-failed', completedAt);
    }
};

export const findEscrowHoldsPendingStartNotification = async (
    limit: number
): Promise<EscrowHold[]> =>
    getEscrowHoldsCollection()
        .find({ status: 'pending', startedNotificationPending: true })
        .sort({ startedNotificationAttemptedAt: 1, requestedAt: 1 })
        .limit(limit)
        .toArray();

export const recordEscrowStartNotificationAttempt = async (
    id: string,
    now: Date
): Promise<void> => {
    await getEscrowHoldsCollection().updateOne(
        { _id: id, status: 'pending', startedNotificationPending: true },
        { $set: { startedNotificationAttemptedAt: now } }
    );
};
/**
 * Pending, hold-policy holds whose waiting period ends within the next 24h
 * (and hasn't ended yet) that have never been reminded. `pin`-policy holds
 * release immediately at creation (`releaseAfter` set to the creation time,
 * not a future date — see `startRecovery`), so `releaseAfter > now` already
 * excludes them in practice within a few ms of job execution; the explicit
 * releasePolicy filter documents that exclusion instead of relying on
 * timing alone. Legacy rows predating `releasePolicy` are treated as `hold`,
 * matching `findPendingEscrowHoldByAuthProvider`'s own `$or`.
 */
export const findEscrowHoldsDueForReminder = async (
    now: Date,
    limit: number
): Promise<EscrowHold[]> =>
    getEscrowHoldsCollection()
        .find({
            status: 'pending',
            $or: [{ releasePolicy: 'hold' as const }, { releasePolicy: { $exists: false } }],
            releaseAfter: {
                $gt: now,
                $lte: new Date(now.getTime() + ESCROW_HOLD_REMINDER_WINDOW_MS),
            },
            'notifications.kind': { $ne: 'reminder' },
        })
        .sort({ reminderAttemptedAt: 1, releaseAfter: 1 })
        .limit(limit)
        .toArray();

/** A short delivery lease avoids concurrent sends without recording false success.
 * A crashed Lambda's lease expires before the next hourly run. */
export const claimEscrowHoldForReminder = async (
    id: string,
    now: Date
): Promise<EscrowHold | null> =>
    getEscrowHoldsCollection().findOneAndUpdate(
        {
            _id: id,
            status: 'pending',
            'notifications.kind': { $ne: 'reminder' },
            $or: [
                { reminderClaimedUntil: { $exists: false } },
                { reminderClaimedUntil: { $lte: now } },
            ],
        },
        {
            $set: {
                reminderClaimedUntil: new Date(now.getTime() + 5 * 60_000),
                reminderAttemptedAt: now,
                updatedAt: now,
            },
        },
        { returnDocument: 'after' }
    );

export const releaseEscrowReminderClaim = async (hold: EscrowHold): Promise<void> => {
    await getEscrowHoldsCollection().updateOne(
        { _id: hold._id, reminderClaimedUntil: hold.reminderClaimedUntil },
        { $unset: { reminderClaimedUntil: '' } }
    );
};

export const hashEscrowResumeToken = (token: string): string =>
    createHash('sha256').update(token).digest('hex');
export const generateEscrowResumeToken = (): string => randomBytes(32).toString('hex');

/** Appends a delivery record; a missing holdId is a no-op rather than a throw. */
export const recordEscrowHoldNotification = async (
    holdId: string,
    kind: EscrowHold['notifications'][number]['kind']
): Promise<void> => {
    const now = new Date();
    await getEscrowHoldsCollection().updateOne(
        { _id: holdId, 'notifications.kind': { $ne: kind } },
        {
            $push: { notifications: { kind, sentAt: now } },
            $set: {
                updatedAt: now,
                ...(kind === 'started' ? { startedNotificationPending: false } : {}),
            },
        }
    );
};

/**
 * Adds a retry-stable, domain-separated token without revoking earlier links.
 * HMAC allows delivery retries without storing plaintext or exhausting the
 * bounded hash set. The original random hash remains valid until terminal.
 * At most four additional hashes (plus the legacy original) are accepted;
 * never evict a previously delivered link, even after a server seed rotation.
 */
export const rotateEscrowCancelToken = async (holdId: string): Promise<string | null> => {
    const token = createHmac('sha256', environment.SEED)
        .update(`escrow-cancel-notification:v1:${holdId}`)
        .digest('hex');
    const cancelTokenHash = createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const result = await getEscrowHoldsCollection().findOneAndUpdate(
        {
            _id: holdId,
            status: 'pending',
            $or: [
                { cancelTokenHashes: cancelTokenHash },
                { 'cancelTokenHashes.3': { $exists: false } },
            ],
        },
        { $addToSet: { cancelTokenHashes: cancelTokenHash }, $set: { updatedAt: now } },
        { returnDocument: 'after' }
    );
    return result ? token : null;
};
