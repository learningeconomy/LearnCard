import { AppStoreListing } from '@models';
import { getIdFromUri } from '@helpers/uri.helpers';

export const associateListingWithIntegration = async (
    listingId: string,
    integrationId: string
): Promise<boolean> => {
    await AppStoreListing.relateTo({
        alias: 'publishedBy',
        where: {
            source: { listing_id: listingId },
            target: { id: integrationId },
        },
    });

    return true;
};

export const installAppForProfile = async (
    profileId: string,
    listingId: string,
    installedAt: string = new Date().toISOString()
): Promise<boolean> => {
    await AppStoreListing.relateTo({
        alias: 'installedBy',
        where: {
            source: { listing_id: listingId },
            target: { profileId },
        },
        properties: {
            listing_id: listingId,
            installed_at: installedAt,
        },
    });

    return true;
};

export const associateBoostWithListing = async (
    listingId: string,
    boostUri: string,
    templateAlias: string
): Promise<boolean> => {
    const id = getIdFromUri(boostUri);

    await AppStoreListing.relateTo({
        alias: 'hasBoost',
        where: {
            source: { listing_id: listingId },
            target: { id },
        },
        properties: {
            templateAlias,
            createdAt: new Date().toISOString(),
        },
    });

    return true;
};

export const associateListingWithSigningAuthority = async (
    listingId: string,
    signingAuthorityEndpoint: string,
    props: { name: string; did: string; isPrimary?: boolean }
): Promise<boolean> => {
    await AppStoreListing.relateTo({
        alias: 'usesSigningAuthority',
        where: {
            source: { listing_id: listingId },
            target: { endpoint: signingAuthorityEndpoint },
        },
        properties: props,
    });

    return true;
};
