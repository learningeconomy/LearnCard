import { createHash, randomBytes, randomUUID } from 'crypto';
import { z } from 'zod';
import type { Collection } from 'mongodb';
import mongodb from '@mongo';
import { environment } from '@environment';
import { AuthProviderMappingValidator, type AuthProviderMapping } from './UserKey';

export const ESCROW_HOLDS_COLLECTION = 'escrowholds';
export const ESCROW_HOLD_STALE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const ESCROW_HOLD_RESTART_MIN_AGE_MS = environment.ESCROW_HOLD_RESTART_MIN_AGE_MS;
export const ESCROW_HOLD_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
export const EscrowHoldValidator = z.object({
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
    cancelledBy: z.enum(['did', 'system', 'link']).optional(),
    completedAt: z.date().optional(),
    clientEphemeralPublicKey: z.string().min(1).max(512),
    resumeTokenHash: z.string().regex(/^[0-9a-f]{64}$/),
    cancelTokenHash: z
        .string()
        .regex(/^[0-9a-f]{64}$/)
        .optional(),
    cancelTokenUsedAt: z.date().optional(),
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
};

export const createEscrowHold = async (input: CreateEscrowHoldInput): Promise<EscrowHold> => {
    const now = new Date();
    const parsed = EscrowHoldValidator.safeParse({
        ...input,
        _id: randomUUID(),
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
            cancelTokenHash,
            cancelTokenUsedAt: { $exists: false },
        },
        {
            $set: {
                status: 'cancelled',
                cancelledBy: 'link',
                cancelledAt: now,
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
                updatedAt: now,
            },
        }
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
        .sort({ releaseAfter: 1 })
        .limit(limit)
        .toArray();

/**
 * Atomically marks a hold as reminded by pushing the `reminder` marker
 * BEFORE any notification is sent — this write IS the claim. Matching on
 * `'notifications.kind': {$ne:'reminder'}` means two concurrent calls for
 * the same hold can never both succeed: MongoDB serializes writes to a
 * single document, so only the first `findOneAndUpdate` still observes the
 * pre-push state; the second sees the just-pushed entry and matches
 * nothing. The reminders job treats a successful claim as the durable
 * notification record (it tells the notifier to skip its own post-delivery
 * write for this call), so a claimed hold is never retried even if the
 * subsequent send fails — an intentional trade-off of "claim before send"
 * over the alternative of two concurrent runs both delivering a reminder.
 * Returns the post-claim hold, or null if it is no longer pending or was
 * already claimed by a concurrent run.
 */
export const claimEscrowHoldForReminder = async (
    id: string,
    now: Date
): Promise<EscrowHold | null> =>
    getEscrowHoldsCollection().findOneAndUpdate(
        { _id: id, status: 'pending', 'notifications.kind': { $ne: 'reminder' } },
        { $push: { notifications: { kind: 'reminder', sentAt: now } }, $set: { updatedAt: now } },
        { returnDocument: 'after' }
    );

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
        { _id: holdId },
        { $push: { notifications: { kind, sentAt: now } }, $set: { updatedAt: now } }
    );
};

/**
 * Issues a fresh single-use cancel token for a hold and returns its plaintext.
 * Only 'started' emails carry the original plaintext token (it is never
 * persisted); 'reminder' and 'pin-locked' notifications call this instead to
 * mint a new one. This intentionally invalidates any previously issued
 * cancel link for the hold (the old hash is overwritten), so only the most
 * recently sent email's link still works. Hashing matches
 * `hashEscrowCancelToken` in `@helpers/escrowCancelToken` exactly (plain
 * SHA-256, no key) so links rotated here still verify there; duplicated
 * in-line rather than imported to avoid a models→helpers dependency.
 * Requires the hold to still be `pending` — matching `cancelTokenMatches`'s
 * own precondition — so a cancelled/completed hold's hash is left
 * untouched; no `cancelTokenUsedAt` unset is needed because a pending hold
 * can never have one set (it's only ever written atomically alongside the
 * `status` transition away from pending, in `cancelEscrowHoldByCancelToken`).
 * Returns null if no pending hold matches.
 */
export const rotateEscrowCancelToken = async (holdId: string): Promise<string | null> => {
    const token = randomBytes(32).toString('hex');
    const cancelTokenHash = createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const result = await getEscrowHoldsCollection().findOneAndUpdate(
        { _id: holdId, status: 'pending' },
        { $set: { cancelTokenHash, updatedAt: now } },
        { returnDocument: 'after' }
    );
    return result ? token : null;
};
