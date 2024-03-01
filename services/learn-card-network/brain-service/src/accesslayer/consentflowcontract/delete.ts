import { ConsentFlowContract } from '@models';
import { ConsentFlowType } from 'types/consentflowcontract';

export const deleteConsentFlowContract = async (contract: ConsentFlowType): Promise<number> => {
    return ConsentFlowContract.delete({ where: { id: contract.id }, detach: true });
};
