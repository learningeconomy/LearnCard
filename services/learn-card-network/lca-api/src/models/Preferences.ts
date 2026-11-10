import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import mongodb from '@mongo';
import { ThemeEnum } from '../types/preferences';

export const PREFERENCES_COLLECTION = 'preferences';

export const MongoPreferencesValidator = z.object({
    _id: z.string().optional(),
    theme: z.nativeEnum(ThemeEnum),
    did: z.string(),
    aiEnabled: z.boolean().optional(),
    aiAutoDisabled: z.boolean().optional(),
    analyticsEnabled: z.boolean().optional(),
    analyticsAutoDisabled: z.boolean().optional(),
    bugReportsEnabled: z.boolean().optional(),
    bugReportsAutoDisabled: z.boolean().optional(),
    isMinor: z.boolean().optional(),
    privacyLock: z.object({ source: z.string(), lockedAt: z.date() }).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
export type MongoPreferencesType = z.infer<typeof MongoPreferencesValidator>;

export const createPreferencesCollection = async () => {
    return mongodb.createCollection(PREFERENCES_COLLECTION, {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['theme'],
                additionalProperties: true,
                properties: {
                    _id: {},
                    did: { bsonType: 'string', description: "'did' is required and is a string" },
                    theme: {
                        bsonType: 'string',
                        enum: ThemeEnum,
                        description: "'theme' is required and must be a valid ThemeEnum",
                    },
                    createdAt: {
                        bsonType: 'string',
                        description: "'createdAt' is optional and is a string",
                    },
                    updatedAt: {
                        bsonType: 'string',
                        description: "'updatedAt' is optional and is a string",
                    },
                },
            },
        },
    });
};

/** Settings every ClassLink student account must have (AI, analytics, bug reports off). */
export const MINOR_PREFERENCE_VALUES = Object.freeze({
    aiEnabled: false,
    aiAutoDisabled: true,
    analyticsEnabled: false,
    analyticsAutoDisabled: true,
    bugReportsEnabled: false,
    bugReportsAutoDisabled: true,
    isMinor: true,
});

/**
 * Default source for a privacy lock. Only the server sets a lock; no route accepts it as input.
 */
export const CLASSLINK_PRIVACY_LOCK_SOURCE = 'classlink';

/** True when the stored preferences carry a server-owned privacy lock. */
export const isPrivacyLocked = (preferences: MongoPreferencesType | null | undefined): boolean =>
    Boolean(preferences?.privacyLock);

/**
 * Create minor preferences (with a privacy lock) when the DID has none yet.
 * Returns true when a record was created; existing preferences are left untouched.
 */
export const createMinorPreferencesIfAbsent = async (
    did: string,
    source: string = CLASSLINK_PRIVACY_LOCK_SOURCE
): Promise<boolean> => {
    const collection = mongodb.collection<MongoPreferencesType>(PREFERENCES_COLLECTION);
    if (await collection.findOne({ did })) return false;
    const now = new Date();
    await collection.insertOne({
        _id: randomUUID(),
        did,
        theme: ThemeEnum.Colorful,
        ...MINOR_PREFERENCE_VALUES,
        privacyLock: { source, lockedAt: now },
        createdAt: now,
        updatedAt: now,
    });
    return true;
};

/**
 * Force minor settings and set the server-owned privacy lock, creating the record if needed.
 * Once locked, the preferences routes keep these values without any further lookup. An
 * existing lock keeps its original source and lockedAt. Returns true when anything changed.
 */
export const enforceMinorPreferences = async (
    did: string,
    source: string = CLASSLINK_PRIVACY_LOCK_SOURCE
): Promise<boolean> => {
    const collection = mongodb.collection<MongoPreferencesType>(PREFERENCES_COLLECTION);
    const now = new Date();
    const result = await collection.updateOne(
        { did },
        {
            $set: { ...MINOR_PREFERENCE_VALUES, updatedAt: now },
            $setOnInsert: {
                _id: randomUUID(),
                did,
                theme: ThemeEnum.Colorful,
                createdAt: now,
            },
        },
        { upsert: true }
    );
    // Separate write so an existing lock keeps its original source and timestamp.
    const locked = await collection.updateOne(
        { did, privacyLock: { $exists: false } },
        { $set: { privacyLock: { source, lockedAt: now } } }
    );
    return result.upsertedCount > 0 || result.modifiedCount > 0 || locked.modifiedCount > 0;
};

/**
 * Remove privacy locks set by `source` from these DIDs' preferences. The stored preference
 * values (AI, analytics, bug reports off) are kept; only the lock that forces them is removed.
 * Returns the number of records unlocked.
 */
export const clearPrivacyLocks = async (dids: string[], source: string): Promise<number> => {
    const unique = [...new Set(dids.filter(Boolean))];
    if (!unique.length) return 0;
    const result = await mongodb
        .collection<MongoPreferencesType>(PREFERENCES_COLLECTION)
        .updateMany(
            { did: { $in: unique }, 'privacyLock.source': source },
            { $unset: { privacyLock: '' }, $set: { updatedAt: new Date() } }
        );
    return result.modifiedCount;
};
