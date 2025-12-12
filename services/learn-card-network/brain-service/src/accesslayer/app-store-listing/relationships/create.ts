import { AppStoreListing } from '@models';

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
