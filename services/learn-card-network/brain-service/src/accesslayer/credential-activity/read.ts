import { neogma } from '@instance';
import { int } from 'neo4j-driver';

import {
    CredentialActivityWithDetails,
    CredentialActivityStats,
    CredentialActivityEventType,
} from 'types/activity';
import { getIdFromUri } from '@helpers/uri.helpers';

const safeGetIdFromUri = (uri: string): string | null => {
    try {
        return getIdFromUri(uri);
    } catch {
        return null;
    }
};

export type GetActivitiesOptions = {
    limit: number;
    cursor?: string;
    boostUri?: string;
    eventType?: CredentialActivityEventType;
    integrationId?: string;
};

export const getActivitiesForProfile = async (
    profileId: string,
    options: GetActivitiesOptions
): Promise<CredentialActivityWithDetails[]> => {
    const { limit, cursor, boostUri, eventType, integrationId } = options;

    const boostId = boostUri ? safeGetIdFromUri(boostUri) : null;

    const whereConditions: string[] = ['a.actorProfileId = $profileId'];

    if (cursor) {
        whereConditions.push('a.timestamp < $cursor');
    }

    if (eventType) {
        whereConditions.push('a.eventType = $eventType');
    }

    if (integrationId) {
        whereConditions.push('a.integrationId = $integrationId');
    }

    const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const boostMatch = boostId
        ? 'MATCH (a)-[:FOR_BOOST]->(b:Boost {id: $boostId})'
        : 'OPTIONAL MATCH (a)-[:FOR_BOOST]->(b:Boost)';

    const query = `
        MATCH (a:CredentialActivity)
        ${whereClause}
        ${boostMatch}
        OPTIONAL MATCH (a)-[:TO_RECIPIENT]->(r:Profile)
        WITH a, b, r
        ORDER BY a.timestamp DESC
        LIMIT $limit
        RETURN a, b, r
    `;

    const result = await neogma.queryRunner.run(query, {
        profileId,
        limit: int(limit),
        cursor,
        boostId,
        eventType,
        integrationId,
    });

    return result.records.map(record => {
        const activity = record.get('a').properties;
        const boost = record.get('b')?.properties;
        const recipient = record.get('r')?.properties;

        let parsedMetadata: Record<string, unknown> | undefined;

        if (activity.metadata) {
            try {
                parsedMetadata = JSON.parse(activity.metadata);
            } catch {
                parsedMetadata = undefined;
            }
        }

        return {
            ...activity,
            metadata: parsedMetadata,
            boost: boost ? {
                id: boost.id,
                name: boost.name,
                category: boost.category,
            } : undefined,
            recipientProfile: recipient ? {
                profileId: recipient.profileId,
                displayName: recipient.displayName,
            } : undefined,
        };
    });
};

export const getActivityStatsForProfile = async (
    profileId: string,
    options: {
        boostUris?: string[];
        integrationId?: string;
    } = {}
): Promise<CredentialActivityStats> => {
    const { boostUris, integrationId } = options;

    const boostIds = boostUris?.map(uri => safeGetIdFromUri(uri)).filter(Boolean) as string[];

    const whereConditions: string[] = ['a.actorProfileId = $profileId'];

    if (integrationId) {
        whereConditions.push('a.integrationId = $integrationId');
    }

    const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const boostFilter = boostIds?.length
        ? 'WHERE b.id IN $boostIds'
        : '';

    const query = `
        MATCH (a:CredentialActivity)
        ${whereClause}
        ${boostIds?.length ? 'MATCH (a)-[:FOR_BOOST]->(b:Boost)' : ''}
        ${boostFilter}
        WITH a.activityId as aid, COLLECT(a) as events
        WITH aid, [e IN events | e] as allEvents,
             [e IN events WHERE e.eventType IN ['CLAIMED'] | e][0] as claimedEvent
        WITH 
            COUNT(DISTINCT aid) as total,
            SUM(CASE WHEN [e IN allEvents WHERE e.eventType = 'CREATED'][0] IS NOT NULL THEN 1 ELSE 0 END) as created,
            SUM(CASE WHEN [e IN allEvents WHERE e.eventType = 'DELIVERED'][0] IS NOT NULL THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN claimedEvent IS NOT NULL THEN 1 ELSE 0 END) as claimed,
            SUM(CASE WHEN [e IN allEvents WHERE e.eventType = 'EXPIRED'][0] IS NOT NULL THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN [e IN allEvents WHERE e.eventType = 'FAILED'][0] IS NOT NULL THEN 1 ELSE 0 END) as failed
        RETURN total, created, delivered, claimed, expired, failed
    `;

    const result = await neogma.queryRunner.run(query, {
        profileId,
        boostIds,
        integrationId,
    });

    if (result.records.length === 0) {
        return {
            total: 0,
            created: 0,
            delivered: 0,
            claimed: 0,
            expired: 0,
            failed: 0,
            claimRate: 0,
        };
    }

    const record = result.records[0];

    if (!record) {
        return {
            total: 0,
            created: 0,
            delivered: 0,
            claimed: 0,
            expired: 0,
            failed: 0,
            claimRate: 0,
        };
    }

    const totalVal = record.get('total');
    const createdVal = record.get('created');
    const deliveredVal = record.get('delivered');
    const claimedVal = record.get('claimed');
    const expiredVal = record.get('expired');
    const failedVal = record.get('failed');

    const total = typeof totalVal?.toNumber === 'function' ? totalVal.toNumber() : (totalVal ?? 0);
    const created = typeof createdVal?.toNumber === 'function' ? createdVal.toNumber() : (createdVal ?? 0);
    const delivered = typeof deliveredVal?.toNumber === 'function' ? deliveredVal.toNumber() : (deliveredVal ?? 0);
    const claimed = typeof claimedVal?.toNumber === 'function' ? claimedVal.toNumber() : (claimedVal ?? 0);
    const expired = typeof expiredVal?.toNumber === 'function' ? expiredVal.toNumber() : (expiredVal ?? 0);
    const failed = typeof failedVal?.toNumber === 'function' ? failedVal.toNumber() : (failedVal ?? 0);

    const claimRate = delivered > 0 ? (claimed / delivered) * 100 : 0;

    return {
        total,
        created,
        delivered,
        claimed,
        expired,
        failed,
        claimRate: Math.round(claimRate * 100) / 100,
    };
};

export const getActivityById = async (
    activityId: string
): Promise<CredentialActivityWithDetails | null> => {
    const query = `
        MATCH (a:CredentialActivity {activityId: $activityId})
        OPTIONAL MATCH (a)-[:FOR_BOOST]->(b:Boost)
        OPTIONAL MATCH (a)-[:TO_RECIPIENT]->(r:Profile)
        RETURN a, b, r
        ORDER BY a.timestamp DESC
        LIMIT 1
    `;

    const result = await neogma.queryRunner.run(query, { activityId });

    if (result.records.length === 0) {
        return null;
    }

    const record = result.records[0];

    if (!record) {
        return null;
    }

    const activity = record.get('a')?.properties;

    if (!activity) {
        return null;
    }

    const boost = record.get('b')?.properties;
    const recipient = record.get('r')?.properties;

    let parsedMetadata: Record<string, unknown> | undefined;

    if (activity.metadata) {
        try {
            parsedMetadata = JSON.parse(activity.metadata);
        } catch {
            parsedMetadata = undefined;
        }
    }

    return {
        ...activity,
        metadata: parsedMetadata,
        boost: boost ? {
            id: boost.id,
            name: boost.name,
            category: boost.category,
        } : undefined,
        recipientProfile: recipient ? {
            profileId: recipient.profileId,
            displayName: recipient.displayName,
        } : undefined,
    };
};
