import { neogma } from '@instance';

export const dissociateListingFromIntegration = async (
    listingId: string,
    integrationId: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (i:Integration {id: $integrationId})-[r:PUBLISHES_LISTING]->(listing:AppStoreListing {listing_id: $listingId})
         DELETE r`,
        { integrationId, listingId }
    );
};

export const uninstallAppForProfile = async (
    profileId: string,
    listingId: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[r:INSTALLS]->(listing:AppStoreListing {listing_id: $listingId})
         DELETE r`,
        { profileId, listingId }
    );
};
