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
    listingId?: string;
    startDate?: string;
    endDate?: string;
    groupByLatestStatus?: boolean; // When true, returns unique credentials filtered by their current status
};

export const getActivitiesForProfile = async (
    profileId: string,
    options: GetActivitiesOptions
): Promise<CredentialActivityWithDetails[]> => {
    const {
        limit,
        cursor,
        boostUri,
        eventType,
        integrationId,
        listingId,
        startDate,
        endDate,
        groupByLatestStatus,
    } = options;

    const boostId = boostUri ? safeGetIdFromUri(boostUri) : null;

    const boostMatch = boostId
        ? 'MATCH (a)-[:FOR_BOOST]->(b:Boost {id: $boostId})'
        : 'OPTIONAL MATCH (a)-[:FOR_BOOST]->(b:Boost)';

    // Note: listingId filtering is handled in WHERE clause via EXISTS to include chained events
    // Do NOT use a direct MATCH here as it would exclude chained events without the relationship

    let query: string;

    if (groupByLatestStatus) {
        // Export mode: Group by activityId and filter by derived (latest) status
        const whereConditions: string[] = ['a.actorProfileId = $profileId'];
        if (integrationId) {
            whereConditions.push('a.integrationId = $integrationId');
        }
        if (listingId) {
            // Match activities that share an activityId with any activity that has the PERFORMED_BY_LISTING relationship
            // This ensures chained events (e.g., CLAIMED after DELIVERED) are included
            whereConditions.push(
                'EXISTS { MATCH (l:AppStoreListing {listing_id: $listingId})-[:PERFORMED_BY_LISTING]->(linked:CredentialActivity) WHERE linked.activityId = a.activityId }'
            );
        }
        const whereClause =
            whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Build post-group filters for derived status and dates
        // Note: latestEvent is a map {activity: a, boost: b, recipient: r}
        const postGroupFilters: string[] = [];
        if (eventType) {
            postGroupFilters.push('latestEvent.activity.eventType = $eventType');
        }
        if (startDate) {
            postGroupFilters.push('latestEvent.activity.timestamp >= $startDate');
        }
        if (endDate) {
            postGroupFilters.push('latestEvent.activity.timestamp <= $endDate');
        }
        if (cursor) {
            postGroupFilters.push('latestEvent.activity.timestamp < $cursor');
        }
        const postGroupFilter =
            postGroupFilters.length > 0 ? `WHERE ${postGroupFilters.join(' AND ')}` : '';

        query = `
            MATCH (a:CredentialActivity)
            ${whereClause}
            ${boostMatch}
            OPTIONAL MATCH (a)-[:TO_RECIPIENT]->(r:Profile)
            WITH a.activityId as aid, COLLECT({activity: a, boost: b, recipient: r}) as events
            WITH aid, events, REDUCE(latest = HEAD(events), e IN TAIL(events) |
                CASE WHEN e.activity.timestamp > latest.activity.timestamp THEN e ELSE latest END) as latestEvent
            ${postGroupFilter}
            WITH latestEvent.activity as a, latestEvent.boost as b, latestEvent.recipient as r
            ORDER BY a.timestamp DESC
            LIMIT $limit
            RETURN a, b, r
        `;
    } else {
        // Recent Activity mode: Show all individual events
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
        if (listingId) {
            // Match activities that share an activityId with any activity that has the PERFORMED_BY_LISTING relationship
            // This ensures chained events (e.g., CLAIMED after DELIVERED) are included
            whereConditions.push(
                'EXISTS { MATCH (l:AppStoreListing {listing_id: $listingId})-[:PERFORMED_BY_LISTING]->(linked:CredentialActivity) WHERE linked.activityId = a.activityId }'
            );
        }
        if (startDate) {
            whereConditions.push('a.timestamp >= $startDate');
        }
        if (endDate) {
            whereConditions.push('a.timestamp <= $endDate');
        }
        const whereClause =
            whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        query = `
            MATCH (a:CredentialActivity)
            ${whereClause}
            ${boostMatch}
            OPTIONAL MATCH (a)-[:TO_RECIPIENT]->(r:Profile)
            WITH a, b, r
            ORDER BY a.timestamp DESC
            LIMIT $limit
            RETURN a, b, r
        `;
    }

    const result = await neogma.queryRunner.run(query, {
        profileId,
        limit: int(limit),
        cursor,
        boostId,
        eventType,
        integrationId,
        listingId,
        startDate,
        endDate,
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
            boost: boost
                ? {
                      id: boost.id,
                      name: boost.name,
                      category: boost.category,
                  }
                : undefined,
            recipientProfile: recipient
                ? {
                      profileId: recipient.profileId,
                      displayName: recipient.displayName,
                  }
                : undefined,
        };
    });
};

export const getActivityStatsForProfile = async (
    profileId: string,
    options: {
        boostUris?: string[];
        integrationId?: string;
        listingId?: string;
        eventType?: CredentialActivityEventType;
        startDate?: string;
        endDate?: string;
    } = {}
): Promise<CredentialActivityStats> => {
    const { boostUris, integrationId, listingId, eventType, startDate, endDate } = options;

    const boostIds = boostUris?.map(uri => safeGetIdFromUri(uri)).filter(Boolean) as string[];

    // Base conditions that don't include eventType - we filter by derived status later
    const whereConditions: string[] = ['a.actorProfileId = $profileId'];

    if (integrationId) {
        whereConditions.push('a.integrationId = $integrationId');
    }

    if (listingId) {
        // Match activities that share an activityId with any activity that has the PERFORMED_BY_LISTING relationship
        // This ensures chained events (e.g., CLAIMED after DELIVERED) are included in stats
        whereConditions.push(
            'EXISTS { MATCH (l:AppStoreListing {listing_id: $listingId})-[:PERFORMED_BY_LISTING]->(linked:CredentialActivity) WHERE linked.activityId = a.activityId }'
        );
    }

    // Date filters apply to the activity chain, not individual events
    // We'll filter based on the latest event's timestamp after grouping

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const boostFilter = boostIds?.length ? 'WHERE b.id IN $boostIds' : '';

    // Build date filters for the latest event
    const dateFilters: string[] = [];
    if (startDate) {
        dateFilters.push('latestEvent.timestamp >= $startDate');
    }
    if (endDate) {
        dateFilters.push('latestEvent.timestamp <= $endDate');
    }

    // Combine status and date filters
    let postGroupFilter = '';
    if (eventType || dateFilters.length > 0) {
        const allFilters: string[] = [];
        if (eventType) allFilters.push('latestEvent.eventType = $eventType');
        allFilters.push(...dateFilters);
        postGroupFilter = `WHERE ${allFilters.join(' AND ')}`;
    }

    const query = `
        MATCH (a:CredentialActivity)
        ${whereClause}
        ${boostIds?.length ? 'MATCH (a)-[:FOR_BOOST]->(b:Boost)' : ''}
        ${boostFilter}
        WITH a.activityId as aid, COLLECT(a) as events
        WITH aid, events, REDUCE(latest = HEAD(events), e IN TAIL(events) |
            CASE WHEN e.timestamp > latest.timestamp THEN e ELSE latest END) as latestEvent
        ${postGroupFilter}
        WITH 
            COUNT(DISTINCT aid) as total,
            SUM(CASE WHEN latestEvent.eventType = 'CREATED' THEN 1 ELSE 0 END) as created,
            SUM(CASE WHEN latestEvent.eventType = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN latestEvent.eventType = 'CLAIMED' THEN 1 ELSE 0 END) as claimed,
            SUM(CASE WHEN latestEvent.eventType = 'EXPIRED' THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN latestEvent.eventType = 'FAILED' THEN 1 ELSE 0 END) as failed
        RETURN total, created, delivered, claimed, expired, failed
    `;

    const result = await neogma.queryRunner.run(query, {
        profileId,
        boostIds,
        integrationId,
        listingId,
        eventType,
        startDate,
        endDate,
    });

    if (result.records.length === 0) {
        return {
            totalEvents: 0,
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
            totalEvents: 0,
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

    const total = typeof totalVal?.toNumber === 'function' ? totalVal.toNumber() : totalVal ?? 0;
    const created =
        typeof createdVal?.toNumber === 'function' ? createdVal.toNumber() : createdVal ?? 0;
    const delivered =
        typeof deliveredVal?.toNumber === 'function' ? deliveredVal.toNumber() : deliveredVal ?? 0;
    const claimed =
        typeof claimedVal?.toNumber === 'function' ? claimedVal.toNumber() : claimedVal ?? 0;
    const expired =
        typeof expiredVal?.toNumber === 'function' ? expiredVal.toNumber() : expiredVal ?? 0;
    const failed =
        typeof failedVal?.toNumber === 'function' ? failedVal.toNumber() : failedVal ?? 0;

    const totalSent = created + delivered + claimed;
    const claimRate = totalSent > 0 ? (claimed / totalSent) * 100 : 0;

    return {
        totalEvents: created + delivered + claimed + expired + failed, // Total count of all events
        total,
        created,
        delivered,
        claimed,
        expired,
        failed,
        claimRate: Math.round(claimRate * 100) / 100,
    };
};

/**
 * Get all events in an activity chain by activityId
 * Returns events ordered by timestamp (oldest first) to show the lifecycle
 */
export const getActivityChain = async (
    activityId: string
): Promise<CredentialActivityWithDetails[]> => {
    const query = `
        MATCH (a:CredentialActivity {activityId: $activityId})
        OPTIONAL MATCH (a)-[:FOR_BOOST]->(b:Boost)
        OPTIONAL MATCH (a)-[:TO_RECIPIENT]->(r:Profile)
        RETURN a, b, r
        ORDER BY a.timestamp ASC
    `;

    const result = await neogma.queryRunner.run(query, { activityId });

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
            boost: boost
                ? {
                      id: boost.id,
                      name: boost.name,
                      category: boost.category,
                  }
                : undefined,
            recipientProfile: recipient
                ? {
                      profileId: recipient.profileId,
                      displayName: recipient.displayName,
                  }
                : undefined,
        };
    });
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
        boost: boost
            ? {
                  id: boost.id,
                  name: boost.name,
                  category: boost.category,
              }
            : undefined,
        recipientProfile: recipient
            ? {
                  profileId: recipient.profileId,
                  displayName: recipient.displayName,
              }
            : undefined,
    };
};
