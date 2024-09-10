import { UnsignedVC } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';
import { getDefaultVerificationMethod } from './helpers';

export const issueCredential = (initLearnCard: VCDependentLearnCard) => {
    return async (
        learnCard: VCImplicitLearnCard,
        credential: UnsignedVC,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = learnCard.id.keypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2020',
            ...signingOptions,
        };

        if (!('verificationMethod' in options)) {
            const issuerDid =
                typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id!;

            options.verificationMethod = await getDefaultVerificationMethod(learnCard, issuerDid);
        }

        learnCard.debug?.('Signing with these options', {
            credential,
            options,
            kp,
        });

        return initLearnCard.invoke.issueCredential(credential, options, kp);
    };
};
