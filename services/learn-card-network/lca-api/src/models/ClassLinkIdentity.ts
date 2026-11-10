import type { Collection, Filter, UpdateFilter } from 'mongodb';
import mongodb from '@mongo';
import type { SealedStateStudentId } from '@helpers/classlinkPii.helpers';

export const CLASSLINK_IDENTITIES_COLLECTION = 'classlinkidentities';

export interface MongoClassLinkIdentityType {
    identityKey: string;
    tenantId: string;
    sub: string;
    role: string;
    /**
     * The real school email from the id_token, when ClassLink sent one. Never a synthetic
     * `@users.classlink.invalid` address (see syntheticEmail.helpers.ts).
     */
    email?: string;
    /** Legacy plaintext field. Never written; removed on every write and by cleanup. */
    stateStudentId?: string | null;
    /** AES-256-GCM payload from sealStateStudentId, kept only until stateStudentIdExpiresAt. */
    stateStudentIdEnc?: string;
    stateStudentIdExpiresAt?: Date;
    state: string;
    firebaseUid: string;
    subject: string;
    /**
     * The wallet DID of the account this identity belongs to, recorded whenever the
     * identity is resolved for an authenticated DID and on School Connect. Keeps the link
     * when the account's Firebase provider is replaced (recovery rebind, Keycloak cutover).
     */
    primaryDid?: string;
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
            getClassLinkIdentitiesCollection().createIndex({ primaryDid: 1 }, { sparse: true }),
            getClassLinkIdentitiesCollection().createIndex(
                { stateStudentIdExpiresAt: 1 },
                { sparse: true }
            ),
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
    const { identityKey, sealedStateStudentId, ...rest } = input;
    // Optional fields that are absent keep their stored value rather than becoming null.
    const fields = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined)
    ) as Partial<typeof rest>;
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

/** Identities recorded for any of the given wallet DIDs (see `primaryDid`). */
export const findClassLinkIdentitiesByPrimaryDids = (
    dids: string[]
): Promise<MongoClassLinkIdentityType[]> =>
    dids.length
        ? getClassLinkIdentitiesCollection()
              .find({ primaryDid: { $in: dids } })
              .toArray()
        : Promise.resolve([]);

/** Identities whose AuthSubject subject is one of `subjects`. */
export const findClassLinkIdentitiesBySubjects = (
    subjects: string[]
): Promise<MongoClassLinkIdentityType[]> =>
    subjects.length
        ? getClassLinkIdentitiesCollection()
              .find({ subject: { $in: subjects } })
              .toArray()
        : Promise.resolve([]);

/**
 * Record the account DID on an identity. By default it only fills an unset `primaryDid`, so an
 * account that merely matches the identity some other way cannot take it over. Pass `replace`
 * (the DID that is recorded now) to swap it; the update is skipped if the recorded DID changed
 * meanwhile. School Connect reassigns `primaryDid` explicitly through `upsertClassLinkIdentity`.
 * Returns whether the identity changed.
 */
export const setClassLinkIdentityPrimaryDid = async (
    identityKey: string,
    primaryDid: string,
    { replace }: { replace?: string } = {}
): Promise<boolean> =>
    (
        await getClassLinkIdentitiesCollection().updateOne(
            replace
                ? { identityKey, primaryDid: replace }
                : ({
                      identityKey,
                      $or: [{ primaryDid: { $exists: false } }, { primaryDid: null }],
                  } as Filter<MongoClassLinkIdentityType>),
            { $set: { primaryDid, updatedAt: new Date() } }
        )
    ).modifiedCount > 0;

/**
 * Forget a recorded DID, only while it is still `expected` (so a concurrent re-record wins).
 * Used when the recorded account no longer exists and the identity should be recorded again
 * by the next wallet created after a fresh ClassLink sign-in.
 */
export const clearClassLinkIdentityPrimaryDid = async (
    identityKey: string,
    expected: string
): Promise<boolean> =>
    (
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey, primaryDid: expected },
            { $unset: { primaryDid: '' }, $set: { updatedAt: new Date() } }
        )
    ).modifiedCount > 0;

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

/** Delete identities by identity key. Returns the number deleted. */
export const deleteClassLinkIdentitiesByIdentityKeys = async (
    identityKeys: string[]
): Promise<number> =>
    identityKeys.length
        ? (
              await getClassLinkIdentitiesCollection().deleteMany({
                  identityKey: { $in: identityKeys },
              })
          ).deletedCount
        : 0;
