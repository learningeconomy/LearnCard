import { getIdFromUri } from '@helpers/uri.helpers';
import { ConsentFlowContract, ConsentFlowInstance } from '@models';

export const getContractById = async (id: string): Promise<ConsentFlowInstance | null> => {
    return ConsentFlowContract.findOne({ where: { id } });
};

export const getContractByUri = async (uri: string): Promise<ConsentFlowInstance | null> => {
    const id = getIdFromUri(uri);

    return ConsentFlowContract.findOne({ where: { id } });
};
