import { VC } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

export const verifyCredential = (initLearnCard: VCDependentLearnCard) => {
    return async (
        _learnCard: VCImplicitLearnCard,
        credential: VC,
        options: Partial<ProofOptions> = {}
    ) => {
        return initLearnCard.invoke.verifyCredential(credential, options);
    };
};
