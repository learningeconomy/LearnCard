import { VC } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

export const verifyCredential = (initLearnCard: VCDependentLearnCard) => {
    return async (
        _learnCard: VCImplicitLearnCard,
        credential: VC,
        _options: Partial<ProofOptions> = {}
    ) => {
        const options = _options;

        if (!options.checks) {
            options.checks = ['proof'];
            if (credential.credentialStatus) options.checks.push('credentialStatus');
            if (credential.credentialSchema) options.checks.push('credentialSchema');
        }

        return initLearnCard.invoke.verifyCredential(credential, options);
    };
};
