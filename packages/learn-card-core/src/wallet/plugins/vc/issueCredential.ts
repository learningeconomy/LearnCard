import { UnsignedVC } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { getIssuerDidDocFromVc } from './helpers';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

export const issueCredential = (initLearnCard: VCDependentLearnCard) => {
    return async (
        learnCard: VCImplicitLearnCard,
        credential: UnsignedVC,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = learnCard.id.keypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const issuerDidDoc = await getIssuerDidDocFromVc(learnCard, credential);

        const verificationMethod = issuerDidDoc.assertionMethod[0];

        const options = {
            verificationMethod:
                verificationMethod ||
                (await initLearnCard.invoke.keyToVerificationMethod('key', kp)),
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2020',
            ...signingOptions,
        };

        return initLearnCard.invoke.issueCredential(credential, options, kp);
    };
};
