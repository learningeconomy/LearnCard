import { DelegateAuthGrantValidator } from './delegate-auth-grant.schema';

export type DelegateGrantRequest = {
    /** Populated only after cryptographic verification, never from an act-as header. */
    signerDid: string;
    issuerDid: string;
    holderDid: string;
    audience: string;
    expectedAudience: string;
    challenge: string;
    requiredScope: string;
    requestedProfileId?: string;
    now: number;
};

export type DelegateGrantDecision =
    | { allowed: false }
    | {
          allowed: true;
          actorDid: string;
          effectiveProfileId: string;
          ownerProfileId: string;
          grantId: string;
          scope: string;
      };

/**
 * Policy primitive, not an authentication middleware. The caller must verify the
 * presentation and load the authoritative grant on EVERY request before calling.
 * No grant lookup, cache, profile switch, or audit persistence occurs here.
 */
export const evaluateDelegateAuthGrant = (
    storedGrant: unknown,
    request: DelegateGrantRequest
): DelegateGrantDecision => {
    const parsed = DelegateAuthGrantValidator.safeParse(storedGrant);
    if (!parsed.success || !Number.isFinite(request.now)) return { allowed: false };

    const grant = parsed.data;
    if (
        grant.status !== 'active' ||
        Date.parse(grant.createdAt) > request.now ||
        Date.parse(grant.expiresAt) <= request.now ||
        request.signerDid !== grant.delegateDid ||
        request.issuerDid !== request.signerDid ||
        request.holderDid !== request.signerDid ||
        request.challenge !== grant.challenge ||
        request.audience !== grant.audience ||
        request.expectedAudience !== grant.audience ||
        (request.requestedProfileId !== undefined &&
            request.requestedProfileId !== grant.effectiveProfileId) ||
        !grant.scope.split(' ').includes(request.requiredScope)
    ) {
        return { allowed: false };
    }

    return {
        allowed: true,
        actorDid: request.signerDid,
        effectiveProfileId: grant.effectiveProfileId,
        ownerProfileId: grant.ownerProfileId,
        grantId: grant.id,
        scope: grant.scope,
    };
};
