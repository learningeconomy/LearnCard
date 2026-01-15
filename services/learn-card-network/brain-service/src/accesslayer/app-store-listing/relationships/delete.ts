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

export const removeBoostFromListing = async (
    listingId: string,
    templateAlias: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST {templateAlias: $templateAlias}]->(b:Boost)
         DELETE r
         RETURN COUNT(r) > 0 AS deleted`,
        { listingId, templateAlias }
    );

    return result.records[0]?.get('deleted') ?? false;
};
