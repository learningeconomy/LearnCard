import { UnsignedVC } from '@learncard/types';

import { prepareManagedRefreshContext } from '@learncard/helpers';
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

        // Credentials carrying a LearnCard-managed refresh service need the inline
        // JSON-LD context fragment that defines its terms; sign the prepared payload.
        // Untouched credentials (no managed service) pass through by reference.
        const preparedCredential = prepareManagedRefreshContext(credential);

        const contexts = Array.isArray(preparedCredential['@context'])
            ? preparedCredential['@context']
            : [preparedCredential['@context']];

        const hasV2Context = contexts.some(
            ctx =>
                typeof ctx === 'string' &&
                (ctx.includes('/ns/credentials/v2') || ctx.includes('/credentials/v2'))
        );

        // Ed25519Signature2018 is incompatible with credentials v2.
        const proofType =
            hasV2Context && signingOptions.type === 'Ed25519Signature2018'
                ? 'Ed25519Signature2020'
                : (signingOptions.type ??
                  (signingOptions.proofFormat === 'jwt' ? undefined : 'DataIntegrityProof'));

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
                typeof preparedCredential.issuer === 'string'
                    ? preparedCredential.issuer
                    : preparedCredential.issuer.id!;

            options.verificationMethod = await getDefaultVerificationMethod(learnCard, issuerDid);
        }

        learnCard.debug?.('Signing with these options', {
            credential: preparedCredential,
            options,
            kp,
        });

        return initLearnCard.invoke.issueCredential(preparedCredential, options, kp);
    };
};
