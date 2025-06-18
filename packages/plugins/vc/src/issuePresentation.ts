import type { UnsignedVP } from '@learncard/types';

import type { ProofOptions } from '@learncard/didkit-plugin';
import type { VCDependentLearnCard, VCImplicitLearnCard } from './types';
import { getDefaultVerificationMethod } from './helpers';

export const issuePresentation = (initLearnCard: VCDependentLearnCard) => {
    return async (
        learnCard: VCImplicitLearnCard,
        presentation: UnsignedVP,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = learnCard.id.keypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            ...(signingOptions.proofFormat === 'jwt'
                ? {}
                : { proofPurpose: 'assertionMethod', type: 'Ed25519Signature2020' }),
            ...signingOptions,
        };

        if (!('verificationMethod' in options)) {
            options.verificationMethod = await getDefaultVerificationMethod(
                learnCard,
                learnCard.id.did()
            );
        }

        return initLearnCard.invoke.issuePresentation(presentation, options, kp);
    };
};
