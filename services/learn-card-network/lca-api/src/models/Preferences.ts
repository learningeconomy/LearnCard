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

export const createMinorPreferencesIfAbsent = async (did: string): Promise<boolean> => {
    const collection = mongodb.collection<MongoPreferencesType>(PREFERENCES_COLLECTION);
    if (await collection.findOne({ did })) return false;
    await collection.insertOne({
        _id: randomUUID(),
        did,
        theme: ThemeEnum.Colorful,
        ...MINOR_PREFERENCE_VALUES,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return true;
};

/** Force minor settings, creating the record if needed. Returns true when anything changed. */
export const enforceMinorPreferences = async (did: string): Promise<boolean> => {
    const collection = mongodb.collection<MongoPreferencesType>(PREFERENCES_COLLECTION);
    const result = await collection.updateOne(
        { did },
        {
            $set: { ...MINOR_PREFERENCE_VALUES, updatedAt: new Date() },
            $setOnInsert: {
                _id: randomUUID(),
                did,
                theme: ThemeEnum.Colorful,
                createdAt: new Date(),
            },
        },
        { upsert: true }
    );
    return result.upsertedCount > 0 || result.modifiedCount > 0;
};
