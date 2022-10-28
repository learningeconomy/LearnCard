import { VP } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

export const verifyPresentation = (initLearnCard: VCDependentLearnCard) => {
    return async (
        _learnCard: VCImplicitLearnCard,
        presentation: VP,
        options: Partial<ProofOptions> = {}
    ) => {
        return initLearnCard.invoke.verifyPresentation(presentation, options);
    };
};
