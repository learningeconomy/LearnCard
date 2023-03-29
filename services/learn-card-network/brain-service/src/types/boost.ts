import { z } from 'zod';
import { BoostValidator as _BoostValidator } from '@learncard/types';

export const BoostValidator = _BoostValidator.omit({ uri: true }).extend({
    id: z.string(),
    boost: z.string(),
});
export type BoostType = z.infer<typeof BoostValidator>;


export const BoostClaimLinkSigningAuthorityValidator = z.object({
    endpoint: z.string(),
    name: z.string(),
    did: z.string().optional()
})
export type BoostClaimLinkSigningAuthorityType = z.infer<typeof BoostClaimLinkSigningAuthorityValidator>;
