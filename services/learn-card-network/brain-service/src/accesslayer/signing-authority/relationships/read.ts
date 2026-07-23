import { AppStoreListing, Profile } from '@models';
import { neogma } from '@instance';
import type { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import type { AppStoreListingType } from 'types/app-store-listing';

type SigningAuthorityRelationshipRecord = {
    target: { dataValues: SigningAuthorityForUserType['signingAuthority'] };
    relationship: SigningAuthorityForUserType['relationship'];
};

export const getSigningAuthoritiesForUser = async (
    user: ProfileType
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: { source: { profileId: user.profileId } },
        })
    ).map((relationship: SigningAuthorityRelationshipRecord) => {
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
    ).map((relationship: SigningAuthorityRelationshipRecord) => {
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
    ).map((relationship: SigningAuthorityRelationshipRecord) => {
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
    ).map((relationship: SigningAuthorityRelationshipRecord) => {
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
    ).map((relationship: SigningAuthorityRelationshipRecord) => {
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
    ).map((relationship: SigningAuthorityRelationshipRecord) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};

/**
 * Finds an app store listing that uses the given signing authority.
 *
 * App-owned signing authorities are keyed by the *app's* DID (not the user's DID)
 * in the LCA-API, so issuance flows must pass an ownerDidOverride derived from the
 * listing's slug (see app-store.ts). This lookup lets non-app flows (e.g. the
 * VC-API claim workflow) detect that a claim link's SA is app-owned.
 */
export const getListingUsingSigningAuthority = async (
    endpoint: string,
    name: string,
    did: string
): Promise<AppStoreListingType | undefined> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing)-[usesSigningAuthority:USES_SIGNING_AUTHORITY]->(signingAuthority:SigningAuthority { endpoint: $endpoint })
         WHERE usesSigningAuthority.name = $name AND usesSigningAuthority.did = $did
         RETURN listing
         LIMIT 1`,
        { endpoint, name, did }
    );

    const record = result.records[0];

    if (!record) return undefined;

    return (record.get('listing')?.properties ?? undefined) as AppStoreListingType | undefined;
};

export const getPrimarySigningAuthorityForIntegration = async (
    integrationId: string
): Promise<SigningAuthorityForUserType | undefined> => {
    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $integrationId})-[usesSigningAuthority:USES_SIGNING_AUTHORITY]->(signingAuthority:SigningAuthority)
         RETURN signingAuthority, usesSigningAuthority
         ORDER BY coalesce(usesSigningAuthority.isPrimary, false) DESC, usesSigningAuthority.createdAt DESC
         LIMIT 1`,
        { integrationId }
    );

    const record = result.records[0];

    if (!record) return undefined;

    const signingAuthority = record.get('signingAuthority')?.properties ?? {};
    const relationship = record.get('usesSigningAuthority')?.properties ?? {};

    return {
        signingAuthority,
        relationship,
    } as SigningAuthorityForUserType;
};
