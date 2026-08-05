import { getInstallIntentRecord } from './shared';

import { neogma } from '@instance';
import type { FlatInstallIntentType, InstallIntentRecordType } from 'types/install-intent';

import { inflateInstallIntent } from './shared';

export const readInstallIntentById = getInstallIntentRecord;

/**
 * Candidates for unattended reconciliation, across all ecosystems.
 *
 * `status` is stored as serialized JSON, so the phase cannot be filtered in Cypher;
 * callers classify in memory (see the scheduler). Bounded by `limit` so a pass has a
 * predictable cost — if intent volume outgrows this, denormalize the phase onto the
 * node and index it rather than raising the ceiling.
 */
export const listInstallIntentsForReconciliation = async (
    limit = 500
): Promise<InstallIntentRecordType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (intent:InstallIntent)
         WHERE intent.status IS NOT NULL
         RETURN intent
         ORDER BY intent.updatedAt ASC
         LIMIT toInteger($limit)`,
        { limit }
    );

    return result.records.map(record =>
        inflateInstallIntent(record.get('intent').properties as FlatInstallIntentType)
    );
};

export const listInstallIntentsByEcosystem = async (
    ecosystemId: string
): Promise<InstallIntentRecordType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (intent:InstallIntent { ecosystemId: $ecosystemId })
         RETURN intent
         ORDER BY intent.createdAt ASC`,
        { ecosystemId }
    );

    return result.records.map(record =>
        inflateInstallIntent(record.get('intent').properties as FlatInstallIntentType)
    );
};
