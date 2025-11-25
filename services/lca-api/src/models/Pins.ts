import { z } from 'zod';
import mongodb from '@mongo';

export const PINS_COLLECTION = 'pins';

export const MongoPinValidator = z.object({
    _id: z.string().optional(),
    pin: z.string(),
    did: z.string(),
    token: z.string().optional(), // Temporary token for PIN updates
    tokenExpire: z.date().optional(), // Expiry time for the update token
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
export type MongoPinType = z.infer<typeof MongoPinValidator>;

export const createPinsCollection = async () => {
    return mongodb.createCollection(PINS_COLLECTION, {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['pin'],
                additionalProperties: true,
                properties: {
                    _id: {},
                    did: {
                        bsonType: 'string',
                        description: "'did' is required and is a string",
                    },
                    pin: {
                        bsonType: 'string',
                        description: "'pin' is required and is a string",
                    },
                    token: {
                        bsonType: 'string',
                        description: "'token' is optional and used for PIN updates",
                    },
                    tokenExpire: {
                        bsonType: 'date',
                        description: "'tokenExpire' is optional and defines token expiry",
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
