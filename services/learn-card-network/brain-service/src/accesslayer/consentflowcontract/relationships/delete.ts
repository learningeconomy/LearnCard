import { ConsentFlowTerms } from '@models';

export const deleteTermsById = async (id: string): Promise<number> => {
    return ConsentFlowTerms.delete({ where: { id }, detach: true });
};
