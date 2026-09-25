import { z } from 'zod';

export const SIGNING_AUTHORITIES_COLLECTION = 'signingauthorities';

export const MongoSigningAuthorityValidator = z.object({
    _id: z.string().optional(),
    ownerDid: z.string(),
    name: z.string(),
    // Legacy and prepared migration rows only. New writes use the envelope fields.
    seed: z.string().optional(),
    encryptedSeed: z.string().optional(),
    encryptedDek: z.string().optional(),
    keyVersion: z.enum(['kms-v1', 'local-v1']).optional(),
    did: z.string().optional(),
    endpoint: z.string().optional(),
});

export const SigningAuthorityResponseValidator = MongoSigningAuthorityValidator.pick({
    _id: true,
    ownerDid: true,
    name: true,
}).extend({
    did: z.string(),
    endpoint: z.string(),
});

export type SigningAuthorityResponseType = z.infer<typeof SigningAuthorityResponseValidator>;

export type MongoSigningAuthorityType = z.infer<typeof MongoSigningAuthorityValidator>;
