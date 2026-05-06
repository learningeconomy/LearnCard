import { z } from 'zod';
import {
    BoostValidator as _BoostValidator,
    LCNBoostClaimLinkSigningAuthorityValidator,
    LCNBoostClaimLinkSigningAuthorityType,
    LCNBoostClaimLinkOptionsValidator,
    LCNBoostClaimLinkOptionsType,
    LCNBoostStatus,
    LCNBoostStatusEnum,
} from '@learncard/types';
import { ProfileType } from './profile';
import { AppStoreListingType } from './app-store-listing';

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
    generatorProfileId: z.string().optional(),
});
export type BoostClaimLinkCacheValueType = z.infer<typeof BoostClaimLinkCacheValueValidator>;

export type ProfileBoostOwner = {
    type: 'profile';
    profile: ProfileType;
};

export type AppStoreListingBoostOwner = {
    type: 'appStoreListing';
    listing: AppStoreListingType;
    ownerProfile: ProfileType;
};

export type BoostOwner = ProfileBoostOwner | AppStoreListingBoostOwner;

export function getBoostOwnerProfile(owner: BoostOwner): ProfileType {
    if (owner.type === 'profile') {
        return owner.profile;
    }
    return owner.ownerProfile;
}

export function getBoostOwnerDisplayName(owner: BoostOwner): string {
    if (owner.type === 'profile') {
        return owner.profile.displayName ?? owner.profile.profileId;
    }
    return owner.listing.display_name;
}

export function isProfileBoostOwner(owner: BoostOwner): owner is ProfileBoostOwner {
    return owner.type === 'profile';
}

export function isAppStoreListingBoostOwner(owner: BoostOwner): owner is AppStoreListingBoostOwner {
    return owner.type === 'appStoreListing';
}
