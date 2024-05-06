import { UnsignedVP } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

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
            const issuerDid = await learnCard.invoke.resolveDid(learnCard.id.did());

            const verificationMethodEntry =
                typeof issuerDid === 'string'
                    ? undefined
                    : issuerDid?.verificationMethod?.find(entry =>
                        typeof entry === 'string' ? false : entry?.publicKeyJwk?.x === kp.x
                    );

            const verificationMethod =
                (typeof verificationMethodEntry !== 'string' && verificationMethodEntry?.id) ||
                (await learnCard.invoke.didToVerificationMethod(learnCard.id.did()));

            options.verificationMethod = verificationMethod;
        }

        return initLearnCard.invoke.issuePresentation(presentation, options, kp);
    };
};
