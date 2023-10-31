import { z } from 'zod';

export const USER_COLLECTION = 'user';

export const MongoUserValidator = z.object({
    /** Primary Did */
    did: z.string(),

    /** Secondary Dids */
    associatedDids: z.string().array(),

    /**
     * [Primary Did, ...Secondary Dids]
     *
     * (We are storing duplicate state for read performance!)
     */
    dids: z.string().array(),
});
export type MongoUserType = z.infer<typeof MongoUserValidator>;
