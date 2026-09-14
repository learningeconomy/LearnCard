import { createHash, randomBytes, randomUUID } from 'crypto';
import { z } from 'zod';
import type { Collection } from 'mongodb';
import mongodb from '@mongo';
import { AuthProviderMappingValidator, type AuthProviderMapping } from './UserKey';

export const ESCROW_HOLDS_COLLECTION = 'escrowholds';
export const EscrowHoldValidator = z.object({
    _id: z.string().uuid(),
    authProvider: AuthProviderMappingValidator,
    primaryDid: z.string(),
    shareVersion: z.number().int().positive(),
    status: z.enum(['pending', 'cancelled', 'completed', 'expired']),
    identityProofType: z.enum(['auth-token', 'recovery-session']),
    requestedAt: z.date(),
    releaseAfter: z.date(),
    cancelledAt: z.date().optional(),
    cancelledBy: z.enum(['did', 'system']).optional(),
    completedAt: z.date().optional(),
    clientEphemeralPublicKey: z.string().min(1).max(512),
    resumeTokenHash: z.string().regex(/^[0-9a-f]{64}$/),
    notifications: z
        .array(
            z.object({
                kind: z.enum(['started', 'cancelled', 'completed']),
                sentAt: z.date(),
            })
        )
        .default([]),
    requestIp: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type EscrowHold = z.infer<typeof EscrowHoldValidator>;
export type CreateEscrowHoldInput = Omit<
    EscrowHold,
    | '_id'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'notifications'
    | 'cancelledAt'
    | 'cancelledBy'
    | 'completedAt'
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
                        Object.keys(index.key ?? {}).length === 2 &&
                        index.key?.['authProvider.type'] === 1 &&
                        index.key?.['authProvider.id'] === 1 &&
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
    await runIndexMigrationOperation(() =>
        collection.createIndex(
            { 'authProvider.type': 1, 'authProvider.id': 1 },
            {
                name: 'pending_escrow_identity_unique',
                unique: true,
                partialFilterExpression: { status: 'pending' },
            }
        )
    );
    await runIndexMigrationOperation(() =>
        collection.createIndex({ 'authProvider.type': 1, 'authProvider.id': 1, status: 1 })
    );
    await runIndexMigrationOperation(() => collection.createIndex({ releaseAfter: 1 }));
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
    authProvider: AuthProviderMapping
): Promise<EscrowHold | null> =>
    getEscrowHoldsCollection().findOne({
        'authProvider.type': authProvider.type,
        'authProvider.id': authProvider.id,
        status: 'pending',
    });
export const findEscrowHoldById = async (id: string): Promise<EscrowHold | null> =>
    getEscrowHoldsCollection().findOne({ _id: id });
export const cancelEscrowHold = async (
    id: string,
    cancelledBy: 'did' | 'system'
): Promise<EscrowHold | null> => {
    const now = new Date();
    return getEscrowHoldsCollection().findOneAndUpdate(
        { _id: id, status: 'pending' },
        {
            $set: { status: 'cancelled', cancelledBy, cancelledAt: now, updatedAt: now },
        },
        { returnDocument: 'after' }
    );
};
export const completeEscrowHold = async (id: string): Promise<EscrowHold | null> => {
    const now = new Date();
    return getEscrowHoldsCollection().findOneAndUpdate(
        { _id: id, status: 'pending' },
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
            releaseAfter: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        { $set: { status: 'expired', updatedAt: now } }
    );
    return result.modifiedCount;
};
export const hashEscrowResumeToken = (token: string): string =>
    createHash('sha256').update(token).digest('hex');
export const generateEscrowResumeToken = (): string => randomBytes(32).toString('hex');
