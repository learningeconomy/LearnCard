import { ConsentFlowInstance } from '@models';

export const deleteConsentFlowContract = async (contract: ConsentFlowInstance): Promise<void> => {
    await contract.delete({ detach: true });
};
