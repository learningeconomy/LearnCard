import { neogma } from '@instance';
import type { IncrementAppCounterInput, IncrementAppCounterResult } from 'types/app-counter';

/**
 * Atomically increments (or decrements) an app-scoped counter using Neo4j MERGE.
 *
 * - If the relationship does not exist, it is created with value = amount.
 * - If the relationship already exists, value is incremented by amount.
 * - Uses MERGE with ON CREATE / ON MATCH for atomicity within a single transaction.
 *
 * The counter is stored as an APP_COUNTER relationship between Profile and AppStoreListing,
 * keyed by the `key` property. Multiple parallel APP_COUNTER relationships (one per key)
 * can exist between the same Profile and AppStoreListing.
 */
export const incrementAppCounter = async (
    input: IncrementAppCounterInput
): Promise<IncrementAppCounterResult> => {
    const now = new Date().toISOString();

    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId}), (l:AppStoreListing {listing_id: $listingId})
         MERGE (p)-[c:APP_COUNTER {key: $key}]->(l)
         ON CREATE SET c.value = $amount, c.createdAt = $now, c.updatedAt = $now
         ON MATCH SET c.value = c.value + $amount, c.updatedAt = $now
         RETURN c.value AS newValue`,
        {
            profileId: input.profileId,
            listingId: input.listingId,
            key: input.key,
            amount: input.amount,
            now,
        }
    );

    const newValue = Number(result.records[0]?.get('newValue') ?? input.amount);
    const previousValue = newValue - input.amount;

    return { previousValue, newValue };
};
