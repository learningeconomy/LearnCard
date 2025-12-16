import { BindParam, QueryBuilder } from 'neogma';
import { int } from 'neo4j-driver';

import { inflateObject } from '@helpers/objects.helpers';
import { AppStoreListing } from '@models';
import { AppStoreListingType } from 'types/app-store-listing';
import { neogma } from '@instance';

export const readAppStoreListingById = async (
    listingId: string
): Promise<AppStoreListingType | null> => {
    const result = await new QueryBuilder(new BindParam({ listing_id: listingId }))
        .match({ model: AppStoreListing, identifier: 'listing', where: { listing_id: listingId } })
        .return('listing')
        .limit(1)
        .run();

    const listing = result.records[0]?.get('listing')?.properties;

    if (!listing) return null;

    return inflateObject<AppStoreListingType>(listing as any);
};

export const getListingsForIntegration = async (
    integrationId: string,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<AppStoreListingType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (i:Integration {id: $integrationId})-[:PUBLISHES_LISTING]->(listing:AppStoreListing)
         ${cursor ? 'WHERE listing.listing_id < $cursor' : ''}
         RETURN DISTINCT listing
         ORDER BY listing.listing_id DESC
         LIMIT $limit`,
        {
            integrationId,
            cursor: cursor ?? null,
            limit: int(limit),
        }
    );

    return result.records.map(record => {
        const listing = record.get('listing')?.properties;
        return inflateObject<AppStoreListingType>(listing as any);
    });
};

export const countListingsForIntegration = async (integrationId: string): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `MATCH (i:Integration {id: $integrationId})-[:PUBLISHES_LISTING]->(listing:AppStoreListing)
         RETURN COUNT(DISTINCT listing) AS count`,
        { integrationId }
    );

    return Number(result.records[0]?.get('count') ?? 0);
};

export const getListedApps = async (
    {
        limit,
        cursor,
        category,
        promotionLevel,
        status,
        includeAllStatuses = false,
        excludeDemoted = true,
    }: {
        limit: number;
        cursor?: string;
        category?: string;
        promotionLevel?: string;
        status?: string; // When provided, filter by this specific status
        includeAllStatuses?: boolean; // When true, returns all statuses (for admin)
        excludeDemoted?: boolean; // When true, excludes DEMOTED apps from results (default true)
    }
): Promise<AppStoreListingType[]> => {
    const whereClauses: string[] = [];
    const params: Record<string, any> = { limit: int(limit) };

    // Status filtering: specific status > all statuses > default to LISTED only
    if (status) {
        whereClauses.push('listing.app_listing_status = $status');
        params.status = status;
    } else if (!includeAllStatuses) {
        whereClauses.push("listing.app_listing_status = 'LISTED'");
    }

    if (cursor) {
        whereClauses.push('listing.listing_id < $cursor');
        params.cursor = cursor;
    }

    if (category) {
        whereClauses.push('listing.category = $category');
        params.category = category;
    }

    if (promotionLevel) {
        whereClauses.push('listing.promotion_level = $promotionLevel');
        params.promotionLevel = promotionLevel;
    } else if (excludeDemoted) {
        // Exclude DEMOTED apps by default when no specific promotionLevel is requested
        whereClauses.push("(listing.promotion_level IS NULL OR listing.promotion_level <> 'DEMOTED')");
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing)
         ${whereClause}
         RETURN listing
         ORDER BY listing.promotion_level ASC, listing.listing_id DESC
         LIMIT $limit`,
        params
    );

    return result.records.map(record => {
        const listing = record.get('listing')?.properties;
        return inflateObject<AppStoreListingType>(listing as any);
    });
};

export const searchAppStoreListings = async (
    searchTerm: string,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<AppStoreListingType[]> => {
    const result = await neogma.queryRunner.run(
        `CALL db.index.fulltext.queryNodes('app_store_listing_name_text_idx', $searchTerm)
         YIELD node, score
         WHERE node.app_listing_status = 'LISTED'
         AND (node.promotion_level IS NULL OR node.promotion_level <> 'DEMOTED')
         ${cursor ? 'AND node.listing_id < $cursor' : ''}
         RETURN node AS listing
         ORDER BY score DESC, node.listing_id DESC
         LIMIT $limit`,
        {
            searchTerm,
            cursor: cursor ?? null,
            limit: int(limit),
        }
    );

    return result.records.map(record => {
        const listing = record.get('listing')?.properties;
        return inflateObject<AppStoreListingType>(listing as any);
    });
};

export const getInstalledAppsForProfile = async (
    profileId: string,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<Array<AppStoreListingType & { installed_at: string }>> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[r:INSTALLS]->(listing:AppStoreListing)
         ${cursor ? 'WHERE r.installed_at < $cursor' : ''}
         RETURN listing, r.installed_at AS installed_at
         ORDER BY r.installed_at DESC, listing.listing_id DESC
         LIMIT $limit`,
        {
            profileId,
            cursor: cursor ?? null,
            limit: int(limit),
        }
    );

    return result.records.map(record => {
        const listing = record.get('listing')?.properties;
        const installed_at = record.get('installed_at');
        return {
            ...inflateObject<AppStoreListingType>(listing as any),
            installed_at,
        };
    });
};

export const countInstalledAppsForProfile = async (profileId: string): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:INSTALLS]->(listing:AppStoreListing)
         RETURN COUNT(DISTINCT listing) AS count`,
        { profileId }
    );

    return Number(result.records[0]?.get('count') ?? 0);
};

export const checkIfProfileInstalledApp = async (
    profileId: string,
    listingId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:INSTALLS]->(listing:AppStoreListing {listing_id: $listingId})
         RETURN COUNT(listing) > 0 AS installed`,
        { profileId, listingId }
    );

    return result.records[0]?.get('installed') ?? false;
};
