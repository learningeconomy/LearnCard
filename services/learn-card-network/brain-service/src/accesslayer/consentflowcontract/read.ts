import { ConsentFlowContract, ConsentFlowInstance } from '@models';

export const getContractById = async (id: string): Promise<ConsentFlowInstance | null> => {
    return ConsentFlowContract.findOne({ where: { id } });
};
