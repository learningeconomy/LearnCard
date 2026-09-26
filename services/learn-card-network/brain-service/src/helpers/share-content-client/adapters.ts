import { getDidWebLearnCard, getServerDidWebDID } from '@helpers/learnCard.helpers';

import type { ShareContentTokenSigner } from './types';

/**
 * Runtime signing adapter for the LC-2187 share-content service token.
 *
 * It reuses the existing did:web LearnCard signing primitives — no new
 * cryptographic algorithm or key material is introduced. The fixed C1 verifier
 * expects a holder-signed VP JWT whose `nonce` is the JSON-serialized claims
 * object, signed with `EdDSA` by an allowlisted did:web verification method. The
 * `kid` did:web fragment is produced by DIDKit from the signing key; the client
 * independently re-checks that it binds the configured signer DID before any
 * request is sent.
 *
 * Exported separately from the client barrel so unit tests never load the
 * LearnCard/environment graph.
 */
export const createDidWebLearnCardTokenSigner = (dependencies?: {
    getLearnCard?: () => Promise<{
        invoke: { issuePresentation: (...args: unknown[]) => unknown };
    }>;
    getSignerDid?: () => string;
}): ShareContentTokenSigner => {
    const resolveLearnCard = dependencies?.getLearnCard ?? getDidWebLearnCard;
    const resolveSignerDid = dependencies?.getSignerDid ?? getServerDidWebDID;

    return async claims => {
        const learnCard = await resolveLearnCard();
        const signerDid = resolveSignerDid();

        if (claims.iss !== signerDid) {
            throw new Error('share-content signer DID does not match the token issuer binding');
        }

        const presentation = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: signerDid,
            verifiableCredential: [],
        };

        const issued = await learnCard.invoke.issuePresentation(presentation, {
            proofPurpose: 'authentication',
            proofFormat: 'jwt',
            challenge: JSON.stringify(claims),
        });

        if (typeof issued !== 'string' || issued.length === 0) {
            throw new Error('share-content signer did not return a JWT presentation');
        }

        return issued;
    };
};
