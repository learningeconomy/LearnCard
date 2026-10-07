import { TRPCError } from '@trpc/server';
import type { VC, VerificationCheck } from '@learncard/types';
import { getCredentialIssuerId } from '@learncard/helpers';

import type { SeedLearnCard } from './learnCard.helpers';

const proofVerified = (result: VerificationCheck): boolean =>
    result.errors.length === 0 && result.warnings.length === 0 && result.checks.includes('proof');

/**
 * Verify without fetching status lists. A new signing authority can be missing
 * from DIDKit's process-local DID cache even after the server document is invalidated.
 * Refresh only the authenticated issuer's exact local profile DID, then verify once
 * more. Never trust a successful resolution alone or relax proof/warning checks.
 */
export const verifyManagedRefreshProof = async (
    verifier: Pick<SeedLearnCard['invoke'], 'verifyCredential' | 'resolveDid'>,
    credential: VC,
    localIssuerDid: string
): Promise<void> => {
    try {
        let result = await verifier.verifyCredential(credential, { checks: ['proof'] });

        if (proofVerified(result)) return;

        if (getCredentialIssuerId(credential) === localIssuerDid) {
            await verifier.resolveDid(localIssuerDid, { noCache: true });
            result = await verifier.verifyCredential(credential, { checks: ['proof'] });
            if (proofVerified(result)) return;
        }
    } catch (cause) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential proof could not be verified',
            cause,
        });
    }

    throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Credential proof could not be verified',
    });
};
