import type { Collection, UpdateFilter } from 'mongodb';
import mongodb from '@mongo';

export const CLASSLINK_IDENTITIES_COLLECTION = 'classlinkidentities';

export interface MongoClassLinkIdentityType {
    identityKey: string;
    tenantId: string;
    sourcedId: string;
    sub: string;
    role: string;
    email: string;
    stateStudentId: string | null;
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

export type ClassLinkIdentityInput = Omit<MongoClassLinkIdentityType, 'createdAt' | 'updatedAt'>;

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
    const { identityKey, ...fields } = input;
    const upsert = () =>
        getClassLinkIdentitiesCollection().findOneAndUpdate(
            { identityKey },
            { $setOnInsert: { identityKey, createdAt: now }, $set: { ...fields, updatedAt: now } },
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
    partial: Partial<Omit<MongoClassLinkIdentityType, 'identityKey' | 'createdAt'>>
): Promise<MongoClassLinkIdentityType | null> => {
    const result = await getClassLinkIdentitiesCollection().findOneAndUpdate(
        { identityKey },
        { $set: { ...partial, updatedAt: new Date() } } as UpdateFilter<MongoClassLinkIdentityType>,
        { returnDocument: 'after' }
    );
    return result;
};

// This audit field is removed with the account during account deletion.
export const deleteClassLinkIdentitiesByFirebaseUid = async (
    firebaseUid: string
): Promise<number> =>
    (await getClassLinkIdentitiesCollection().deleteMany({ firebaseUid })).deletedCount;
