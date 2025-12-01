import { z } from 'zod';
import mongodb from '@mongo';
import { ThemeEnum } from '../types/preferences';

export const PREFERENCES_COLLECTION = 'preferences';

export const MongoPreferencesValidator = z.object({
    _id: z.string().optional(),
    theme: z.nativeEnum(ThemeEnum),
    did: z.string(),
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
