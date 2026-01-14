import { neogma } from '@instance';
import { inflateObject } from '@helpers/objects.helpers';
import { IntegrationType } from 'types/integration';
import { ProfileType } from 'types/profile';
import { Boost, BoostInstance } from '@models';
import { int } from 'neo4j-driver';
import { getBoostUri } from '@helpers/boost.helpers';

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

export const hasProfileInstalledApp = async (
    profileId: string,
    listingId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:INSTALLS]->(listing:AppStoreListing {listing_id: $listingId})
         RETURN COUNT(p) > 0 AS installed`,
        { profileId, listingId }
    );

    return result.records[0]?.get('installed') ?? false;
};

export const getBoostForListingByBoostId = async (
    listingId: string,
    boostId: string,
    domain: string
): Promise<{ boost: BoostInstance; boostId: string; boostUri: string } | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST {boostId: $boostId}]->(b:Boost)
         RETURN b.id AS id, r.boostId AS boostId`,
        { listingId, boostId }
    );

    const record = result.records[0];
    if (!record) return null;

    const id = record.get('id') as string;
    const returnedBoostId = record.get('boostId') as string;

    // Get proper BoostInstance via Neogma to ensure dataValues is populated
    const boost = await Boost.findOne({ where: { id } });
    if (!boost) return null;

    return {
        boost,
        boostId: returnedBoostId,
        boostUri: getBoostUri(id, domain),
    };
};

export const getBoostsForListing = async (
    listingId: string,
    domain: string
): Promise<Array<{ boostId: string; boostUri: string }>> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST]->(b:Boost)
         RETURN b.id AS id, r.boostId AS boostId
         ORDER BY r.createdAt DESC`,
        { listingId }
    );

    return result.records.map(record => ({
        boostId: record.get('boostId') as string,
        boostUri: getBoostUri(record.get('id') as string, domain),
    }));
};

export const hasBoostIdForListing = async (
    listingId: string,
    boostId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST {boostId: $boostId}]->(b:Boost)
         RETURN COUNT(r) > 0 AS exists`,
        { listingId, boostId }
    );

    return result.records[0]?.get('exists') ?? false;
};
