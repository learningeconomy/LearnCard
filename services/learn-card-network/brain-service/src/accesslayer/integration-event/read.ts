import { int } from 'neo4j-driver';
import type { IntegrationEvent } from '@learncard/types';

import { neogma } from '@instance';
import { toIntegrationEvent } from '@helpers/integration-events.helpers';

export type IntegrationEventPage = {
    /** Last sequence number allocated for the integration. 0 when it has no events yet. */
    eventSeq: number;
    /** Highest sequence number removed by retention. 0 when nothing was purged. */
    eventPurgedThroughSeq: number;
    /** Records with a sequence number above afterSequence, oldest first. */
    records: IntegrationEvent[];
};

/**
 * Reads the sequence bookkeeping of an Integration and one page of its feed in a single
 * statement. Returns null when the Integration does not exist.
 *
 * Neo4j reads are read-committed, so one statement alone is not a snapshot. The statement
 * therefore first takes the write lock of the Integration node (the same lock that sequence
 * allocation and retention take before they change anything). While it is held, retention can
 * neither advance eventPurgedThroughSeq nor delete records of this Integration, and no new
 * sequence number can be allocated, so the three returned values always belong together.
 */
export const readIntegrationEventPage = async ({
    integrationId,
    afterSequence,
    limit,
}: {
    integrationId: string;
    afterSequence: number;
    limit: number;
}): Promise<IntegrationEventPage | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $integrationId})
         SET integration.eventSeqLock = coalesce(integration.eventSeqLock, 0) + 1
         WITH coalesce(integration.eventSeq, 0) AS eventSeq,
             coalesce(integration.eventPurgedThroughSeq, 0) AS eventPurgedThroughSeq
         OPTIONAL MATCH (record:IntegrationEvent)
         WHERE record.integrationId = $integrationId AND record.sequence > $afterSequence
         WITH eventSeq, eventPurgedThroughSeq, record
         ORDER BY record.sequence ASC
         LIMIT $limit
         RETURN eventSeq, eventPurgedThroughSeq, collect(record) AS records`,
        { integrationId, afterSequence: int(afterSequence), limit: int(limit) }
    );
    const row = result.records[0];

    if (!row) return null;

    const records: IntegrationEvent[] = (row.get('records') as { properties: object }[]).map(
        record => toIntegrationEvent(record.properties as Record<string, unknown>)
    );

    return {
        eventSeq: Number(row.get('eventSeq')),
        eventPurgedThroughSeq: Number(row.get('eventPurgedThroughSeq')),
        records: records.sort((a, b) => a.sequence - b.sequence),
    };
};
