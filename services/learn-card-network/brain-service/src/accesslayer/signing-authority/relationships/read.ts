import { AppStoreListing, Profile } from '@models';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { AppStoreListingType } from 'types/app-store-listing';

export const getSigningAuthoritiesForUser = async (
    user: ProfileType
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: { source: { profileId: user.profileId } },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    });
};

export const getSigningAuthorityForUserByName = async (
    user: ProfileType,
    endpoint: string,
    name: string
): Promise<SigningAuthorityForUserType | undefined> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                source: { profileId: user.profileId },
                relationship: { name },
                target: { endpoint },
            },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};

export const getPrimarySigningAuthorityForUser = async (
    user: ProfileType
): Promise<SigningAuthorityForUserType | undefined> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                source: { profileId: user.profileId },
                relationship: { isPrimary: true },
            },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};

export const getSigningAuthoritiesForListing = async (
    listing: AppStoreListingType
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await AppStoreListing.findRelationships({
            alias: 'usesSigningAuthority',
            where: { source: { listing_id: listing.listing_id } },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    });
};

export const getSigningAuthoritiesForListingByName = async (
    listing: AppStoreListingType,
    name: string
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await AppStoreListing.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                source: { listing_id: listing.listing_id },
                relationship: { name },
            },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    });
};

export const getPrimarySigningAuthorityForListing = async (
    listing: AppStoreListingType
): Promise<SigningAuthorityForUserType | undefined> => {
    return (
        await AppStoreListing.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                source: { listing_id: listing.listing_id },
                relationship: { isPrimary: true },
            },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};
