import { z } from 'zod';
import {
    BoostValidator as _BoostValidator,
    LCNBoostClaimLinkSigningAuthorityValidator,
    LCNBoostClaimLinkOptionsValidator,
    LCNBoostStatus,
    type LCNBoostClaimLinkSigningAuthorityType,
    type LCNBoostClaimLinkOptionsType,
    type LCNBoostStatusEnum
} from '@learncard/types';

export const BoostStatus = LCNBoostStatus;
export type BoostStatusEnum = LCNBoostStatusEnum;

export const BoostValidator = _BoostValidator
    .omit({ uri: true, claimPermissions: true })
    .extend({ id: z.string(), boost: z.string() });
export type BoostType = z.infer<typeof BoostValidator>;

export const BoostWithClaimPermissionsValidator = BoostValidator.extend({
    claimPermissions: _BoostValidator.shape.claimPermissions,
});
export type BoostWithClaimPermissionsType = z.infer<typeof BoostWithClaimPermissionsValidator>;

export const FlatBoostValidator = BoostValidator.omit({ meta: true }).catchall(z.any());
export type FlatBoostType = z.infer<typeof FlatBoostValidator>;

export const BoostClaimLinkSigningAuthorityValidator = LCNBoostClaimLinkSigningAuthorityValidator;
export type BoostClaimLinkSigningAuthorityType = LCNBoostClaimLinkSigningAuthorityType;

export const BoostClaimLinkOptionsValidator = LCNBoostClaimLinkOptionsValidator;
export type BoostClaimLinkOptionsType = LCNBoostClaimLinkOptionsType;

export const BoostGenerateClaimLinkInput = z.object({
    boostUri: z.string(),
    challenge: z.string().optional(),
    claimLinkSA: BoostClaimLinkSigningAuthorityValidator,
    options: BoostClaimLinkOptionsValidator.optional(),
});
export type BoostGenerateClaimLinkType = z.infer<typeof BoostGenerateClaimLinkInput>;

export const BoostClaimLinkCacheValueValidator = z.object({
    claimLinkSA: BoostClaimLinkSigningAuthorityValidator,
    options: BoostClaimLinkOptionsValidator,
});
export type BoostClaimLinkCacheValueType = z.infer<typeof BoostClaimLinkCacheValueValidator>;
