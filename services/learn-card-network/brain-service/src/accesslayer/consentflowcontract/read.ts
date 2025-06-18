import { QueryBuilder } from 'neogma';

import { getIdFromUri } from '@helpers/uri.helpers';
import { ConsentFlowContract } from '@models';
import type { DbContractType } from 'types/consentflowcontract';
import { inflateObject } from '@helpers/objects.helpers';

export const getContractById = async (id: string): Promise<DbContractType | null> => {
    return inflateObject<DbContractType>(
        (
            await new QueryBuilder()
                .match({ model: ConsentFlowContract, where: { id }, identifier: 'contract' })
                .return('contract')
                .limit(1)
                .run()
        ).records[0]?.toObject().contract.properties
    );
};

export const getContractByUri = async (uri: string): Promise<DbContractType | null> => {
    return getContractById(getIdFromUri(uri));
};
