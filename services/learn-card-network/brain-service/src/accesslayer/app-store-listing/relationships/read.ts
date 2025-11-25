import { neogma } from '@instance';
import { inflateObject } from '@helpers/objects.helpers';
import { IntegrationType } from 'types/integration';
import { ProfileType } from 'types/profile';
import { int } from 'neo4j-driver';

export const getIntegrationForListing = async (
    listingId: string
): Promise<IntegrationType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (i:Integration)-[:PUBLISHES_LISTING]->(listing:AppStoreListing {listing_id: $listingId})
         RETURN i AS integration
         LIMIT 1`,
        { listingId }
    );

    const integration = result.records[0]?.get('integration')?.properties;

    if (!integration) return null;

    return inflateObject<IntegrationType>(integration as any);
};

export const getProfilesInstalledApp = async (
    listingId: string,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<ProfileType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[:INSTALLS]->(listing:AppStoreListing {listing_id: $listingId})
         ${cursor ? 'WHERE p.profileId < $cursor' : ''}
         RETURN p AS profile
         ORDER BY p.profileId DESC
         LIMIT $limit`,
        {
            listingId,
            cursor: cursor ?? null,
            limit: int(limit),
        }
    );

    return result.records.map(record => {
        const profile = record.get('profile')?.properties;
        return inflateObject<ProfileType>(profile as any);
    });
};

export const countProfilesInstalledApp = async (listingId: string): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[:INSTALLS]->(listing:AppStoreListing {listing_id: $listingId})
         RETURN COUNT(DISTINCT p) AS count`,
        { listingId }
    );

    return Number(result.records[0]?.get('count') ?? 0);
};
