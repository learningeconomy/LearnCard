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

export const getBoostForListingByTemplateAlias = async (
    listingId: string,
    templateAlias: string,
    domain: string
): Promise<{ boost: BoostInstance; templateAlias: string; boostUri: string } | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST {templateAlias: $templateAlias}]->(b:Boost)
         RETURN b.id AS id, r.templateAlias AS templateAlias`,
        { listingId, templateAlias }
    );

    const record = result.records[0];
    if (!record) return null;

    const id = record.get('id') as string;
    const returnedTemplateAlias = record.get('templateAlias') as string;

    // Get proper BoostInstance via Neogma to ensure dataValues is populated
    const boost = await Boost.findOne({ where: { id } });
    if (!boost) return null;

    return {
        boost,
        templateAlias: returnedTemplateAlias,
        boostUri: getBoostUri(id, domain),
    };
};

export const getBoostsForListing = async (
    listingId: string,
    domain: string
): Promise<Array<{ templateAlias: string; boostUri: string }>> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST]->(b:Boost)
         RETURN b.id AS id, r.templateAlias AS templateAlias
         ORDER BY r.createdAt DESC`,
        { listingId }
    );

    return result.records.map(record => ({
        templateAlias: record.get('templateAlias') as string,
        boostUri: getBoostUri(record.get('id') as string, domain),
    }));
};

export const hasTemplateAliasForListing = async (
    listingId: string,
    templateAlias: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST {templateAlias: $templateAlias}]->(b:Boost)
         RETURN COUNT(r) > 0 AS exists`,
        { listingId, templateAlias }
    );

    return result.records[0]?.get('exists') ?? false;
};

export const getCredentialsSentByListingToProfile = async (
    listingId: string,
    profileId: string,
    options: { limit: number; cursor?: string }
): Promise<
    Array<{
        credentialId: string;
        date: string;
        status: 'pending' | 'claimed' | 'revoked';
        boostName?: string;
        boostCategory?: string;
        activityId?: string;
    }>
> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})
               -[r:CREDENTIAL_SENT {to: $profileId}]->(c:Credential)
         ${options.cursor ? 'WHERE r.date < $cursor' : ''}
         OPTIONAL MATCH (c)-[:INSTANCE_OF]->(b:Boost)
         OPTIONAL MATCH (c)-[received:CREDENTIAL_RECEIVED]->(recipient:Profile {profileId: $profileId})
         RETURN c.id AS credentialId, r.date AS date, 
                b.name AS boostName, b.category AS boostCategory, r.activityId AS activityId,
                received IS NOT NULL AS isReceived, received.status AS receivedStatus
         ORDER BY r.date DESC
         LIMIT $limit`,
        {
            listingId,
            profileId,
            cursor: options.cursor ?? null,
            limit: int(options.limit),
        }
    );

    return result.records
        .map(record => {
            const credentialId = record.get('credentialId');
            const date = record.get('date');

            // Skip records with missing required fields
            if (!credentialId || !date) {
                return null;
            }

            // Determine status based on CREDENTIAL_RECEIVED relationship
            const isReceived = record.get('isReceived');
            const receivedStatus = record.get('receivedStatus');
            let status: 'pending' | 'claimed' | 'revoked' = 'pending';
            if (isReceived) {
                status = receivedStatus === 'revoked' ? 'revoked' : 'claimed';
            }

            return {
                credentialId: String(credentialId),
                date: String(date),
                status,
                boostName: record.get('boostName') ? String(record.get('boostName')) : undefined,
                boostCategory: record.get('boostCategory')
                    ? String(record.get('boostCategory'))
                    : undefined,
                activityId: record.get('activityId') ? String(record.get('activityId')) : undefined,
            };
        })
        .filter((record): record is NonNullable<typeof record> => record !== null);
};

export const countCredentialsSentByListingToProfile = async (
    listingId: string,
    profileId: string
): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})
               -[r:CREDENTIAL_SENT {to: $profileId}]->(c:Credential)
         RETURN COUNT(c) AS count`,
        { listingId, profileId }
    );

    const count = result.records[0]?.get('count');
    // Neo4j returns Integer objects, ensure we return a JS number
    return count?.toNumber?.() ?? Number(count) ?? 0;
};

export type SubmitterInfo = {
    profileId: string;
    displayName: string;
    email?: string;
    submittedAt?: string;
};

export const getSubmitterForListing = async (listingId: string): Promise<SubmitterInfo | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[rel:SUBMITTED_LISTING]->(listing:AppStoreListing {listing_id: $listingId})
         OPTIONAL MATCH (p)-[:HAS_CONTACT_METHOD]->(cm:ContactMethod {type: 'email', isPrimary: true})
         RETURN p.profileId AS profileId,
                p.displayName AS displayName,
                COALESCE(p.email, cm.value) AS email,
                rel.submitted_at AS submittedAt
         LIMIT 1`,
        { listingId }
    );

    const record = result.records[0];
    if (!record) return null;

    const profileId = record.get('profileId');
    if (!profileId) return null;

    return {
        profileId,
        displayName: record.get('displayName') || profileId,
        email: record.get('email') || undefined,
        submittedAt: record.get('submittedAt') || undefined,
    };
};
