import { ConsentFlowContract } from '@models';
import { DbContractType } from 'types/consentflowcontract';

export const deleteConsentFlowContract = async (contract: DbContractType): Promise<number> => {
    return ConsentFlowContract.delete({ where: { id: contract.id }, detach: true });
};
