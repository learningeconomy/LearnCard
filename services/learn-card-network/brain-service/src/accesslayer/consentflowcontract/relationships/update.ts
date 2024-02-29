import { ConsentFlowTerms } from '@learncard/types';
import { Profile } from '@models';

export const updateTermsById = async (id: string, terms: ConsentFlowTerms): Promise<boolean> => {
    await Profile.updateRelationship(
        { terms: JSON.stringify(terms) },
        { alias: 'consentsTo', where: { relationship: { id } } }
    );

    return true;
};
