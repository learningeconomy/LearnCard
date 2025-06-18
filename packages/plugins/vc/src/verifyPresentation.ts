import type { VP } from '@learncard/types';

import type { ProofOptions } from '@learncard/didkit-plugin';
import type { VCDependentLearnCard, VCImplicitLearnCard } from './types';

export const verifyPresentation = (initLearnCard: VCDependentLearnCard) => {
    return async (
        _learnCard: VCImplicitLearnCard,
        presentation: VP | string,
        options: Partial<ProofOptions> = {}
    ) => {
        return initLearnCard.invoke.verifyPresentation(presentation, options);
    };
};
