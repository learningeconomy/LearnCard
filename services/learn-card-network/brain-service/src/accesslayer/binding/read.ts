import { getBindingRecord } from './shared';

import { neogma } from '@instance';
import type { BindingRecordType, FlatBindingType } from 'types/binding';

import { inflateBinding } from './shared';

export const readBindingById = getBindingRecord;

export const listBindingsByEcosystem = async (
    ecosystemId: string
): Promise<BindingRecordType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (binding:Binding { ecosystemId: $ecosystemId })
         RETURN binding
         ORDER BY binding.createdAt ASC`,
        { ecosystemId }
    );

    return result.records.map(record =>
        inflateBinding(record.get('binding').properties as FlatBindingType)
    );
};
