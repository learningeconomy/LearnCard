import { VC } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';
import { extractCompactJwt, verifyCredentialJwt } from './verifyCredentialJwt';

/**
 * Verifies a credential proof.
 *
 * JWT-backed inputs (a raw compact token, a canonical `jwt-vc-json` storage
 * envelope, or a legacy `JwtProof2020`/`proof.jwt` projection) are routed
 * through {@link verifyCredentialJwt}: the exact token bytes are verified by
 * DIDKit and the result is bound to the token-derived claims, so caller
 * mutations of the surrounding display object cannot influence verification.
 * All other inputs keep the existing JSON-LD/linked-data-proof behavior.
 */
export const verifyCredential = (initLearnCard: VCDependentLearnCard) => {
    return async (
        _learnCard: VCImplicitLearnCard,
        credential: VC | string,
        _options: Partial<ProofOptions> = {}
    ) => {
        if (extractCompactJwt(credential)) {
            const result = await verifyCredentialJwt(initLearnCard, credential, {
                proofOptions: _options,
            });

            return result.verified ? { checks: ['JWS'], warnings: [], errors: [] } : result.check;
        }

        const options: Partial<ProofOptions> = { ..._options };

        if (!options.checks) {
            options.checks = ['proof'];
            if (typeof credential !== 'string') {
                if (credential.credentialStatus) options.checks.push('credentialStatus');
                if (credential.credentialSchema) options.checks.push('credentialSchema');
            }
        }

        return initLearnCard.invoke.verifyCredential(credential, options);
    };
};
