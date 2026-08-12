import { z } from 'zod';

export const SIGNING_AUTHORITIES_COLLECTION = 'signingauthorities';

export const MongoSigningAuthorityValidator = z.object({
    _id: z.string().optional(),
    ownerDid: z.string(),
    name: z.string(),
    seed: z.string(),
    did: z.string().optional(),
    endpoint: z.string().optional(),
});

export const SigningAuthorityResponseValidator = MongoSigningAuthorityValidator.omit({
    seed: true,
}).extend({
    did: z.string(),
    endpoint: z.string(),
});

export type SigningAuthorityResponseType = z.infer<typeof SigningAuthorityResponseValidator>;

export type MongoSigningAuthorityType = z.infer<typeof MongoSigningAuthorityValidator>;
