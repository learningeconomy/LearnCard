import { ConsentFlowTerms } from '@learncard/types';
import { Profile } from '@models';

export const updateTermsById = (id: string, terms: ConsentFlowTerms) => {
    Profile.updateRelationship(
        { terms: JSON.stringify(terms) },
        { alias: 'consentsTo', where: { relationship: { id } } }
    );
};
