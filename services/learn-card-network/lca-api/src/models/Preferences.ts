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

export const createMinorPreferencesIfAbsent = async (did: string): Promise<boolean> => {
    const collection = mongodb.collection<MongoPreferencesType>(PREFERENCES_COLLECTION);
    if (await collection.findOne({ did })) return false;
    await collection.insertOne({
        _id: randomUUID(),
        did,
        theme: ThemeEnum.Colorful,
        aiEnabled: false,
        analyticsEnabled: false,
        bugReportsEnabled: false,
        isMinor: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return true;
};
