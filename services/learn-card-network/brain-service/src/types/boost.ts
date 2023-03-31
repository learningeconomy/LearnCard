import { z } from 'zod';
import { BoostValidator as _BoostValidator, LCNBoostClaimLinkSigningAuthorityValidator, LCNBoostClaimLinkSigningAuthorityType, LCNBoostClaimLinkOptionsValidator, LCNBoostClaimLinkOptionsType } from '@learncard/types';

export const BoostValidator = _BoostValidator.omit({ uri: true }).extend({
    id: z.string(),
    boost: z.string(),
});
export type BoostType = z.infer<typeof BoostValidator>;

export const BoostClaimLinkSigningAuthorityValidator = LCNBoostClaimLinkSigningAuthorityValidator;
export type BoostClaimLinkSigningAuthorityType = LCNBoostClaimLinkSigningAuthorityType;

export const BoostClaimLinkOptionsValidator = LCNBoostClaimLinkOptionsValidator;
export type BoostClaimLinkOptionsType = LCNBoostClaimLinkOptionsType;

export const BoostGenerateClaimLinkInput = z.object({
    boostUri: z.string(), 
    challenge: z.string().optional(), 
    claimLinkSA: BoostClaimLinkSigningAuthorityValidator, 
    options: BoostClaimLinkOptionsValidator.optional()
});
export type BoostGenerateClaimLinkType = z.infer<typeof BoostGenerateClaimLinkInput>;

export const BoostClaimLinkCacheValueValidator = z.object({
    claimLinkSA: BoostClaimLinkSigningAuthorityValidator, 
    options: BoostClaimLinkOptionsValidator
});
export type BoostClaimLinkCacheValueType = z.infer<typeof BoostClaimLinkCacheValueValidator>;
