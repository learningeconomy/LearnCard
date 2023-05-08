import { z } from 'zod';

export const USER_COLLECTION = 'user';

export const MongoUserValidator = z.object({
    did: z.string(),
});
export type MongoUserType = z.infer<typeof MongoUserValidator>;
