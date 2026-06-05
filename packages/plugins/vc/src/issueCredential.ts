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

        const contexts = Array.isArray(credential['@context'])
            ? credential['@context']
            : [credential['@context']];

        const hasV2Context = contexts.some(
            ctx =>
                typeof ctx === 'string' &&
                (ctx.includes('/ns/credentials/v2') || ctx.includes('/credentials/v2'))
        );

        // Ed25519Signature2018 is incompatible with credentials v2.
        const proofType =
            hasV2Context && signingOptions.type === 'Ed25519Signature2018'
                ? 'Ed25519Signature2020'
                : signingOptions.type ??
                  (signingOptions.proofFormat === 'jwt' ? undefined : 'DataIntegrityProof');

        const options: ProofOptions = {
            proofPurpose: 'assertionMethod',
            ...signingOptions,
            ...(proofType ? { type: proofType } : {}),
        };

        if (options.type === 'DataIntegrityProof' && !options.cryptosuite) {
            options.cryptosuite = 'eddsa-rdfc-2022';
        }

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
