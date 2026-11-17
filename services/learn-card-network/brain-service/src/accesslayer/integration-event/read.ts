import { int } from 'neo4j-driver';
import type { IntegrationEvent } from '@learncard/types';

import { neogma } from '@instance';
import { toIntegrationEvent } from '@helpers/integration-events.helpers';

export type IntegrationEventSequenceState = {
    /** Last sequence number allocated for the integration. 0 when it has no events yet. */
    eventSeq: number;
    /** Highest sequence number removed by retention. 0 when nothing was purged. */
    eventPurgedThroughSeq: number;
};

/** Reads the sequence bookkeeping of an Integration. Returns null when it does not exist. */
export const getIntegrationEventSequenceState = async (
    integrationId: string
): Promise<IntegrationEventSequenceState | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $integrationId})
         RETURN coalesce(integration.eventSeq, 0) AS eventSeq,
             coalesce(integration.eventPurgedThroughSeq, 0) AS eventPurgedThroughSeq`,
        { integrationId }
    );
    const record = result.records[0];

    if (!record) return null;

    return {
        eventSeq: Number(record.get('eventSeq')),
        eventPurgedThroughSeq: Number(record.get('eventPurgedThroughSeq')),
    };
};

/** Reads feed records with a sequence number above afterSequence, oldest first. */
export const getIntegrationEventsAfter = async ({
    integrationId,
    afterSequence,
    limit,
}: {
    integrationId: string;
    afterSequence: number;
    limit: number;
}): Promise<IntegrationEvent[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (record:IntegrationEvent)
         WHERE record.integrationId = $integrationId AND record.sequence > $afterSequence
         RETURN record
         ORDER BY record.sequence ASC
         LIMIT $limit`,
        { integrationId, afterSequence: int(afterSequence), limit: int(limit) }
    );

    return result.records.map(row => toIntegrationEvent(row.get('record').properties));
};
