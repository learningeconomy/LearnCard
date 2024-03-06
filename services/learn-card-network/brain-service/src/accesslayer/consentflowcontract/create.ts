import { QueryBuilder, BindParam } from 'neogma';

import { ConsentFlowContract } from '@models';
import { ConsentFlowContract as ConsentFlowContractType } from '@learncard/types';
import { v4 as uuid } from 'uuid';
import { getContractById } from './read';
import { DbContractType } from 'types/consentflowcontract';
import { flattenObject } from '@helpers/objects.helpers';

export const createConsentFlowContract = async ({
    contract,
    name,
    subtitle = '',
    description = '',
    image = '',
    expiresAt,
}: {
    contract: ConsentFlowContractType;
    name: string;
    subtitle?: string;
    description?: string;
    image?: string;
    expiresAt?: string;
}): Promise<DbContractType> => {
    const id = uuid();

    const query = new QueryBuilder(
        new BindParam({
            params: flattenObject({
                id,
                name,
                subtitle,
                description,
                image,
                contract,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt,
            }),
        })
    )
        .create({ model: ConsentFlowContract, identifier: 'contract' })
        .set('contract += $params');

    await query.run();

    return (await getContractById(id))!;
};
