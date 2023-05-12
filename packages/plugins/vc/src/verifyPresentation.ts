import { VP } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

export const verifyPresentation = (initLearnCard: VCDependentLearnCard) => {
    return async (
        _learnCard: VCImplicitLearnCard,
        presentation: VP | string,
        options: Partial<ProofOptions> = {}
    ) => {
        return initLearnCard.invoke.verifyPresentation(presentation, options);
    };
};
