import { z } from 'zod';

import mongodb from '@mongo';

export const PUSH_TOKENS_COLLECTION = 'pushtokens';

export const MongoPushTokenValidator = z.object({
    _id: z.string().optional(),
    did: z.string(),
    token: z.string(),
    enabled: z.boolean().optional().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
export type MongoPushTokenType = z.infer<typeof MongoPushTokenValidator>;

// Example of how we could enforce schema at DB level. Not currently being called anywhere.
export const createPushTokensCollection = async () => {
    return mongodb.createCollection(PUSH_TOKENS_COLLECTION, {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["did", "token"],
                additionalProperties: true,
                properties: {
                    _id: {},
                    did: {
                        bsonType: "string",
                        description: "'did' is required and is a string"
                    },
                    token: {
                        bsonType: "string",
                        description: "'token' is required and is a string"
                    },
                    enabled: {
                        bsonType: "boolean",
                        description: "'enabled' is optional and is a boolean"
                    },
                    createdAt: {
                        bsonType: "string",
                        description: "'createdAt' is optional and is a string"
                    },
                    updatedAt: {
                        bsonType: "number",
                        description: "'updatedAt' is optional and is a number"
                    }
                }
            }
        }
    })
    }