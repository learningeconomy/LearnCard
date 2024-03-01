import { QueryBuilder } from 'neogma';

import { ConsentFlowContract as ConsentFlowContractType } from '@learncard/types';
import { ConsentFlowContract } from '@models';
import { v4 as uuid } from 'uuid';
import { getContractById } from './read';
import { ConsentFlowType } from 'types/consentflowcontract';

export const createConsentFlowContract = async (
    contract: ConsentFlowContractType
): Promise<ConsentFlowType> => {
    const id = uuid();

    await new QueryBuilder()
        .create({
            model: ConsentFlowContract,
            properties: {
                id,
                contract: JSON.stringify(contract),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        })
        .run();

    return (await getContractById(id))!;
};
