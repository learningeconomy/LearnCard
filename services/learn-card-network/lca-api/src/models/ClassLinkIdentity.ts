import type { Collection, Filter, UpdateFilter } from 'mongodb';
import mongodb from '@mongo';
import type { SealedStateStudentId } from '@helpers/classlinkPii.helpers';

export const CLASSLINK_IDENTITIES_COLLECTION = 'classlinkidentities';

export interface MongoClassLinkIdentityType {
    identityKey: string;
    tenantId: string;
    sub: string;
    role: string;
    email: string;
    /** Legacy plaintext field. Never written; removed on every write and by cleanup. */
    stateStudentId?: string | null;
    /** AES-256-GCM payload from sealStateStudentId, kept only until stateStudentIdExpiresAt. */
    stateStudentIdEnc?: string;
    stateStudentIdExpiresAt?: Date;
    state: string;
    firebaseUid: string;
    subject: string;
    lastAuthTime: Date;
    isMinorHint?: boolean;
    personalEmail?: string;
    personalEmailVerifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

type StateStudentIdField = 'stateStudentId' | 'stateStudentIdEnc' | 'stateStudentIdExpiresAt';
const STATE_STUDENT_ID_UNSET = {
    sourcedId: '',
    stateStudentId: '',
    stateStudentIdEnc: '',
    stateStudentIdExpiresAt: '',
} as const;
const LEGACY_STATE_STUDENT_ID_UNSET = { stateStudentId: '', sourcedId: '' } as const;

export type ClassLinkIdentityInput = Omit<
    MongoClassLinkIdentityType,
    'createdAt' | 'updatedAt' | StateStudentIdField
> & {
    /** The sealed ID from this sign-in. Null clears any ID stored by an earlier sign-in. */
    sealedStateStudentId: SealedStateStudentId | null;
};

export const getClassLinkIdentitiesCollection = (): Collection<MongoClassLinkIdentityType> =>
    mongodb.collection<MongoClassLinkIdentityType>(CLASSLINK_IDENTITIES_COLLECTION);

const MONGO_DUPLICATE_KEY = 11000;
const isDuplicateKeyError = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY;

let classLinkIdentityIndexesReady: Promise<void> | undefined;

export const ensureClassLinkIdentityIndexes = (): Promise<void> => {
    if (!classLinkIdentityIndexesReady) {
        classLinkIdentityIndexesReady = Promise.all([
            getClassLinkIdentitiesCollection().createIndex({ identityKey: 1 }, { unique: true }),
            getClassLinkIdentitiesCollection().createIndex({ firebaseUid: 1 }),
            getClassLinkIdentitiesCollection().createIndex({ subject: 1 }),
        ])
            .then(() => undefined)
            .catch(error => {
                classLinkIdentityIndexesReady = undefined;
                throw error;
            });
    }
    return classLinkIdentityIndexesReady;
};

export const upsertClassLinkIdentity = async (
    input: ClassLinkIdentityInput
): Promise<MongoClassLinkIdentityType> => {
    await ensureClassLinkIdentityIndexes();
    const now = new Date();
    const { identityKey, sealedStateStudentId, ...fields } = input;
    const upsert = () =>
        getClassLinkIdentitiesCollection().findOneAndUpdate(
            { identityKey },
            {
                $setOnInsert: { identityKey, createdAt: now },
                $set: { ...fields, ...sealedStateStudentId, updatedAt: now },
                $unset: sealedStateStudentId
                    ? LEGACY_STATE_STUDENT_ID_UNSET
                    : STATE_STUDENT_ID_UNSET,
            },
            { upsert: true, returnDocument: 'after' }
        );

    let record: MongoClassLinkIdentityType | null;
    try {
        record = await upsert();
    } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        record = await upsert();
    }
    if (!record) throw new Error('Unable to persist ClassLink identity');
    return record;
};

export const findClassLinkIdentityByFirebaseUid = (
    firebaseUid: string
): Promise<MongoClassLinkIdentityType | null> =>
    getClassLinkIdentitiesCollection().findOne({ firebaseUid });

export const findClassLinkIdentityByIdentityKey = (
    identityKey: string
): Promise<MongoClassLinkIdentityType | null> =>
    getClassLinkIdentitiesCollection().findOne({ identityKey });

export const updateClassLinkIdentity = async (
    identityKey: string,
    partial: Partial<
        Omit<MongoClassLinkIdentityType, 'identityKey' | 'createdAt' | StateStudentIdField>
    >
): Promise<MongoClassLinkIdentityType | null> => {
    const result = await getClassLinkIdentitiesCollection().findOneAndUpdate(
        { identityKey },
        {
            $set: { ...partial, updatedAt: new Date() },
            $unset: LEGACY_STATE_STUDENT_ID_UNSET,
        } as UpdateFilter<MongoClassLinkIdentityType>,
        { returnDocument: 'after' }
    );
    return result;
};

/**
 * Remove an expired state ID only if it is still the one that was read, so a lazy clear
 * never removes the ID from a newer sign-in.
 */
export const clearStateStudentIdIfUnchanged = async (
    identity: Pick<
        MongoClassLinkIdentityType,
        'identityKey' | 'stateStudentIdEnc' | 'stateStudentIdExpiresAt'
    >
): Promise<boolean> => {
    const result = await getClassLinkIdentitiesCollection().updateOne(
        {
            identityKey: identity.identityKey,
            stateStudentIdEnc: identity.stateStudentIdEnc ?? { $exists: false },
            stateStudentIdExpiresAt: identity.stateStudentIdExpiresAt ?? { $exists: false },
        } as Filter<MongoClassLinkIdentityType>,
        { $unset: STATE_STUDENT_ID_UNSET }
    );
    return result.modifiedCount > 0;
};

const expiredStateStudentIdFilter = (now: Date): Filter<MongoClassLinkIdentityType> => ({
    $or: [
        { stateStudentId: { $exists: true } },
        { stateStudentIdExpiresAt: { $lte: now } },
        { stateStudentIdEnc: { $exists: true }, stateStudentIdExpiresAt: { $exists: false } },
    ],
});

export const countExpiredStateStudentIds = (now = new Date()): Promise<number> =>
    getClassLinkIdentitiesCollection().countDocuments(expiredStateStudentIdFilter(now));

/** Remove every expired (or legacy plaintext) state ID. Returns the number of records changed. */
export const clearExpiredStateStudentIds = async (now = new Date()): Promise<number> =>
    (
        await getClassLinkIdentitiesCollection().updateMany(expiredStateStudentIdFilter(now), {
            $unset: STATE_STUDENT_ID_UNSET,
        })
    ).modifiedCount;

// This audit field is removed with the account during account deletion.
export const deleteClassLinkIdentitiesByFirebaseUid = async (
    firebaseUid: string
): Promise<number> =>
    (await getClassLinkIdentitiesCollection().deleteMany({ firebaseUid })).deletedCount;
