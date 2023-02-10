import { UnsignedVP } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

export const issuePresentation = (initLearnCard: VCDependentLearnCard) => {
    return async (
        learnCard: VCImplicitLearnCard,
        presentation: UnsignedVP,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = learnCard.id.keypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const verificationMethod = await learnCard.invoke.didToVerificationMethod(
            learnCard.id.did()
        );

        const options = {
            verificationMethod,
            ...(signingOptions.proofFormat === 'jwt' ? {} : { proofPurpose: 'assertionMethod' }),
            ...(signingOptions.proofFormat === 'jwt' ? {} : { type: 'Ed25519Signature2020' }),
            ...signingOptions,
        };

        return initLearnCard.invoke.issuePresentation(presentation, options, kp);
    };
};
