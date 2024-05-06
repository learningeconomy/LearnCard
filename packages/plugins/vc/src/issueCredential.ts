import { UnsignedVC } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';

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
            const issuerDid = await learnCard.invoke.resolveDid(
                typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id!
            );

            const verificationMethodEntry =
                typeof issuerDid === 'string'
                    ? undefined
                    : issuerDid?.verificationMethod?.find(entry =>
                        typeof entry === 'string' ? false : entry?.publicKeyJwk?.x === kp.x
                    );

            const verificationMethod =
                (typeof verificationMethodEntry !== 'string' && verificationMethodEntry?.id) ||
                (await learnCard.invoke.didToVerificationMethod(
                    typeof credential.issuer === 'string'
                        ? credential.issuer
                        : credential.issuer.id!
                ));

            options.verificationMethod = verificationMethod;
        }

        learnCard.debug?.('Signing with these options', {
            credential,
            options,
            kp,
        });

        return initLearnCard.invoke.issueCredential(credential, options, kp);
    };
};
