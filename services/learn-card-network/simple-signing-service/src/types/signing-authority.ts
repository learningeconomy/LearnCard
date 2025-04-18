import { z } from 'zod';

export const SigningAuthorityValidator = z.object({
    name: z.string(),
    ownerDid: z.string(),
    did: z.string(),
    endpoint: z.string().optional()
});
export type SigningAuthority = z.infer<typeof SigningAuthorityValidator>;


export const SigningAuthorityMetaValidator = z.object({
    name: z.string(),
    ownerDid: z.string(),
});
export type SigningAuthorityMeta = z.infer<typeof SigningAuthorityMetaValidator>;


export const SigningAuthorityAuthorizationValidator = z.object({
    type: z.string(),
    boostUri: z.string(),
});
export type SigningAuthorityAuthorizationType = z.infer<typeof SigningAuthorityAuthorizationValidator>;