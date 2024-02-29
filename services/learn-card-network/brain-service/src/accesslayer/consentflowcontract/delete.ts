import { ConsentFlowInstance } from '@models';

export const deleteConsentFlowContract = async (contract: ConsentFlowInstance): Promise<number> => {
    return contract.delete({ detach: true });
};
