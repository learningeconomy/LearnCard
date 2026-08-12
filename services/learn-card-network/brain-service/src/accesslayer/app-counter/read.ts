import { neogma } from '@instance';
import type { AppCounterRecord } from 'types/app-counter';

/**
 * Read a single app-scoped counter for a given profile + listing + key.
 * Returns null if no counter exists for that key.
 */
export const getAppCounter = async (input: {
    profileId: string;
    listingId: string;
    key: string;
}): Promise<AppCounterRecord | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[c:APP_COUNTER {key: $key}]->(l:AppStoreListing {listing_id: $listingId})
         RETURN c.key AS key, c.value AS value, c.updatedAt AS updatedAt, c.createdAt AS createdAt`,
        {
            profileId: input.profileId,
            listingId: input.listingId,
            key: input.key,
        }
    );

    const record = result.records[0];

    if (!record) return null;

    return {
        key: record.get('key') as string,
        value: Number(record.get('value') ?? 0),
        updatedAt: (record.get('updatedAt') as string) ?? null,
        createdAt: (record.get('createdAt') as string) ?? null,
    };
};

/**
 * Read all app-scoped counters for a given profile + listing.
 * Optionally filter to specific keys.
 */
export const getAppCounters = async (input: {
    profileId: string;
    listingId: string;
    keys?: string[];
}): Promise<AppCounterRecord[]> => {
    const keyFilter = input.keys && input.keys.length > 0 ? 'WHERE c.key IN $keys' : '';

    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[c:APP_COUNTER]->(l:AppStoreListing {listing_id: $listingId})
         ${keyFilter}
         RETURN c.key AS key, c.value AS value, c.updatedAt AS updatedAt, c.createdAt AS createdAt
         ORDER BY c.key`,
        {
            profileId: input.profileId,
            listingId: input.listingId,
            keys: input.keys ?? null,
        }
    );

    return result.records.map(record => ({
        key: record.get('key') as string,
        value: Number(record.get('value') ?? 0),
        updatedAt: (record.get('updatedAt') as string) ?? null,
        createdAt: (record.get('createdAt') as string) ?? null,
    }));
};

/**
 * Count the number of distinct counter keys a profile has for a given listing.
 * Used to enforce the max-keys-per-user-per-app limit.
 */
export const countAppCounterKeys = async (input: {
    profileId: string;
    listingId: string;
}): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[c:APP_COUNTER]->(l:AppStoreListing {listing_id: $listingId})
         RETURN COUNT(c) AS count`,
        {
            profileId: input.profileId,
            listingId: input.listingId,
        }
    );

    return Number(result.records[0]?.get('count') ?? 0);
};
