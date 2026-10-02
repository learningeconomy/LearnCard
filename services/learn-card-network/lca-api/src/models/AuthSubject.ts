import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import mongodb from '@mongo';

export const AUTH_SUBJECTS_COLLECTION = 'authsubjects';

export interface AuthSubjectAttributes {
    email?: string;
    emailVerified: boolean;
    displayName?: string;
    pictureUrl?: string;
}

export interface MongoAuthSubjectType extends AuthSubjectAttributes {
    subject: string;
    identityKey: string;
    createdAt: Date;
    lastLoginAt: Date;
}

export const getAuthSubjectsCollection = (): Collection<MongoAuthSubjectType> =>
    mongodb.collection<MongoAuthSubjectType>(AUTH_SUBJECTS_COLLECTION);

export const createAuthSubjectIndexes = async (): Promise<void> => {
    const collection = getAuthSubjectsCollection();
    await collection.createIndex({ subject: 1 }, { unique: true });
    await collection.createIndex({ identityKey: 1 }, { unique: true });
};

let authSubjectIndexesReady: Promise<void> | undefined;

/** Create the indexes once per process (startup in Docker, first login in Lambda). */
export const ensureAuthSubjectIndexes = (): Promise<void> => {
    if (!authSubjectIndexesReady) {
        authSubjectIndexesReady = createAuthSubjectIndexes().catch(error => {
            authSubjectIndexesReady = undefined;
            console.error('Unable to create AuthSubject indexes:', error);
        });
    }
    return authSubjectIndexesReady;
};

const MONGO_DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY;

/**
 * Persist a random, permanent subject independently of Firebase and UserKey.
 *
 * Two concurrent first logins for the same identity can both miss the lookup
 * and race on the insert; the unique `identityKey` index rejects the loser
 * with E11000. Retrying once then finds the winner's document and only runs
 * the `$set` half of the upsert.
 */
export const getOrCreateAuthSubject = async (
    identityKey: string,
    attrs: AuthSubjectAttributes
): Promise<MongoAuthSubjectType> => {
    await ensureAuthSubjectIndexes();
    const now = new Date();
    const fields: Partial<MongoAuthSubjectType> = {
        lastLoginAt: now,
        emailVerified: attrs.emailVerified,
    };
    if (attrs.email !== undefined) fields.email = attrs.email;
    if (attrs.displayName !== undefined) fields.displayName = attrs.displayName;
    if (attrs.pictureUrl !== undefined) fields.pictureUrl = attrs.pictureUrl;

    const upsert = () =>
        getAuthSubjectsCollection().findOneAndUpdate(
            { identityKey },
            {
                $setOnInsert: { subject: randomUUID(), identityKey, createdAt: now },
                $set: fields,
            },
            { upsert: true, returnDocument: 'after' }
        );

    let record: MongoAuthSubjectType | null;
    try {
        record = await upsert();
    } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        record = await upsert();
    }
    if (!record) throw new Error('Unable to persist authentication subject');
    return record;
};
