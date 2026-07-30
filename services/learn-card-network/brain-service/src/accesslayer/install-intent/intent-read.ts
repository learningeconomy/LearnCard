import { getInstallIntentRecord } from './shared';

import { neogma } from '@instance';
import type { FlatInstallIntentType, InstallIntentRecordType } from 'types/install-intent';

import { inflateInstallIntent } from './shared';

export const readInstallIntentById = getInstallIntentRecord;

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
