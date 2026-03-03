import { UnsignedVP } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';
import { getDefaultVerificationMethod } from './helpers';

export const issuePresentation = (initLearnCard: VCDependentLearnCard) => {
    return async (
        learnCard: VCImplicitLearnCard,
        presentation: UnsignedVP,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = learnCard.id.keypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        // Check if presentation uses v2 context
        const contexts = Array.isArray(presentation['@context']) 
            ? presentation['@context'] 
            : [presentation['@context']];
        const hasV2Context = contexts.some(ctx => 
            typeof ctx === 'string' && (ctx.includes('/ns/credentials/v2') || ctx.includes('/credentials/v2'))
        );

        // For v2 contexts, upgrade Ed25519Signature2018 to Ed25519Signature2020
        // Ed25519Signature2018 is incompatible with credentials v2
        const proofType = hasV2Context && signingOptions.type === 'Ed25519Signature2018'
            ? 'Ed25519Signature2020'
            : signingOptions.type ?? 'Ed25519Signature2020';

        const options = {
            ...(signingOptions.proofFormat === 'jwt'
                ? {}
                : { proofPurpose: 'assertionMethod', type: proofType }),
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
