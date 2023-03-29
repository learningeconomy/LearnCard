import { z } from 'zod';
import { BoostValidator as _BoostValidator, LCNBoostClaimLinkSigningAuthorityValidator, LCNBoostClaimLinkSigningAuthorityType } from '@learncard/types';

export const BoostValidator = _BoostValidator.omit({ uri: true }).extend({
    id: z.string(),
    boost: z.string(),
});
export type BoostType = z.infer<typeof BoostValidator>;

export const BoostClaimLinkSigningAuthorityValidator = LCNBoostClaimLinkSigningAuthorityValidator;
export type BoostClaimLinkSigningAuthorityType = LCNBoostClaimLinkSigningAuthorityType;
