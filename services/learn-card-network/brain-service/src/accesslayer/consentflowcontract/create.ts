import { ConsentFlowContract as ConsentFlowContractType } from '@learncard/types';
import { ConsentFlowContract, ConsentFlowInstance } from '@models';
import { v4 as uuid } from 'uuid';

export const createConsentFlowContract = async (contract: ConsentFlowContractType): Promise<ConsentFlowInstance> => {
    return ConsentFlowContract.createOne({
        id: uuid(),
        contract: JSON.stringify(contract),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
};
