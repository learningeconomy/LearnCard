import { z } from 'zod';

import mongodb from '@mongo';

export const ENCRYPTION_KEYS_COLLECTION = 'encryptionkeys';

export const MongoEncryptionKeyValidator = z.object({
    _id: z.string().optional(),
    did: z.string(),
    key: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
export type MongoEncryptionKeyType = z.infer<typeof MongoEncryptionKeyValidator>;

export const createEncryptionKeysCollection = async () => {
    return mongodb.createCollection(ENCRYPTION_KEYS_COLLECTION, {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['did', 'key'],
                additionalProperties: true,
                properties: {
                    _id: {},
                    did: {
                        bsonType: 'string',
                        description: "'did' is required and is a string",
                    },
                    key: {
                        bsonType: 'string',
                        description: "'key' is required and is a string",
                    },
                    createdAt: {
                        bsonType: 'string',
                        description: "'createdAt' is optional and is a string",
                    },
                    updatedAt: {
                        bsonType: 'number',
                        description: "'updatedAt' is optional and is a number",
                    },
                },
            },
        },
    });
};
