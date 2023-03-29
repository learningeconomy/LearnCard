import { z } from 'zod';
import { LCNProfile, LCNProfileValidator } from '@learncard/types';

export const ProfileValidator = LCNProfileValidator;
export type ProfileType = LCNProfile;

export const SigningAuthorityValidator = z.object({
    endpoint: z.string(),
})
export type SigningAuthorityType = z.infer<typeof SigningAuthorityValidator>;

export const SigningAuthorityForUserValidator = z.object({
    signingAuthority: SigningAuthorityValidator,
    relationship: z.object({
        name: z.string(),
        did: z.string()
    })
})
export type SigningAuthorityForUserType = z.infer<typeof SigningAuthorityForUserValidator>;