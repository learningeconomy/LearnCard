import { z } from 'zod';

export const SIGNING_AUTHORITIES_COLLECTION = 'signingauthorities';

export const MongoSigningAuthorityValidator = z.object({
    _id: z.string().optional(),
    ownerDid: z.string(),
    name: z.string(),
    seed: z.string(),
    did: z.string().optional(),
    endpoint: z.string().optional()
});

export type MongoSigningAuthorityType = z.infer<typeof MongoSigningAuthorityValidator>;
