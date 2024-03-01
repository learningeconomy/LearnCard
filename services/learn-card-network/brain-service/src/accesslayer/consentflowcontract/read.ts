import { getIdFromUri } from '@helpers/uri.helpers';
import { ConsentFlowContract } from '@models';
import { ConsentFlowType } from 'types/consentflowcontract';

export const getContractById = async (id: string): Promise<ConsentFlowType | null> => {
    return ConsentFlowContract.findOne({ where: { id }, plain: true });
};

export const getContractByUri = async (uri: string): Promise<ConsentFlowType | null> => {
    return getContractById(getIdFromUri(uri));
};
