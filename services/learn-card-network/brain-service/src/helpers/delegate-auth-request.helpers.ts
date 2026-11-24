import { TRPCError } from '@trpc/server';
import type { IssueInboxCredentialType, UnsignedVC, VC, VP } from '@learncard/types';

import { getDelegateAuthGrantByChallenge } from '@accesslayer/delegate-auth-grant/read';
import type { NewDelegateGrantAudit } from '@accesslayer/delegate-grant-audit/create';
import type { Context } from '@routes';
import type { ProfileType } from 'types/profile';

import { evaluateDelegateAuthGrant, getDelegateGrantAudience } from './delegate-auth-grant.helpers';
import type { DelegatePresentation } from './delegate-auth-presentation.helpers';
import { isSignedInboxCredential } from './inbox.helpers';

type ContextUser = NonNullable<Context['user']>;

/** The user a delegate request runs as: the owner profile of its grant, with the attribution. */
export type DelegateUser = ContextUser & {
    profile: ProfileType;
    delegate: NonNullable<ContextUser['delegate']>;
};

/**
 * The only routes a delegate reaches, each with the one scope it requires. Scopes alone do not
 * close the others: a route that declares no `requiredScope` skips the scope check, and the same
 * two scopes also open routes a delegate must not reach (`inbox.finalize`, `inbox.issueBatch`,
 * `contracts.syncCredentialsToContract`, `contracts.writeCredentialToContract`).
 */
export const DELEGATE_ROUTE_ALLOWLIST: Readonly<Record<string, string>> = Object.freeze({
    'inbox.issue': 'inbox:write',
    'contracts.writeCredentialToContractViaSigningAuthority': 'contracts-data:write',
});

// Own keys only: `constructor` or `__proto__` as a path must not find an inherited value.
const getPinnedScope = (path: string): string | undefined =>
    Object.prototype.hasOwnProperty.call(DELEGATE_ROUTE_ALLOWLIST, path)
        ? DELEGATE_ROUTE_ALLOWLIST[path]
        : undefined;

/** `withDid` keeps the owner this user already carries instead of resolving a profile. */
export const isDelegateUser = (user: ContextUser): user is DelegateUser =>
    user.delegate !== undefined && 'profile' in user;

type DelegateAttribution = NonNullable<ContextUser['delegate']>;

/** Where a refusal was decided. Stored for the owner's review, never sent to the caller. */
export type DelegateDenialStage = 'route' | 'policy' | 'owner';

/**
 * The answer about a delegate request. A refusal carries an `attribution` exactly when a stored
 * grant was found for the token's challenge and the token was signed by that grant's own
 * delegate key: only such a refusal is recorded.
 */
export type DelegateRequestResolution =
    | { allowed: true; user: DelegateUser }
    | { allowed: false; attribution?: DelegateAttribution & { stage: DelegateDenialStage } };

/**
 * The user context of a delegate request, or a refusal. The caller answers every refusal
 * alike, so a delegate cannot tell a revoked grant from a closed route.
 */
export const resolveDelegateRequest = async ({
    presentation,
    path,
    requiredScope,
}: {
    presentation: DelegatePresentation | undefined;
    path: string;
    /** The route's own `meta.requiredScope`, compared and never trusted to be a string. */
    requiredScope: unknown;
}): Promise<DelegateRequestResolution> => {
    if (!presentation) return { allowed: false };

    // Read on every request and never cached, so a revocation holds from the next request on.
    // An error is not caught: an outage must not look like a refused token.
    // Read before the route is checked, so that the grant holder's own attempt on a closed
    // route is visible to the owner.
    const stored = await getDelegateAuthGrantByChallenge(presentation.challenge);
    if (!stored) return { allowed: false };

    const { grant, ownerProfile } = stored;
    const { signerDid } = presentation;

    // A refusal is recorded only when the token names a stored grant and was signed by that
    // grant's own delegate key. The challenge is not a secret: it travels in every token and
    // the owner's read routes return it. A record for any signer would let anyone who has seen
    // a challenge fill the store with a throwaway key.
    const signedByGrantDelegate = signerDid === grant.delegateDid;

    // Who asked is the verified signer, which here is always the key the grant names.
    const refusedAt = (stage: DelegateDenialStage): DelegateRequestResolution =>
        signedByGrantDelegate
            ? {
                  allowed: false,
                  attribution: {
                      stage,
                      actorDid: signerDid,
                      grantId: grant.id,
                      ownerProfileId: grant.ownerProfileId,
                  },
              }
            : { allowed: false };

    // The route must declare exactly the scope pinned for it: a route whose metadata changes
    // closes until this list is changed with it.
    const pinnedScope = getPinnedScope(path);
    if (pinnedScope === undefined || requiredScope !== pinnedScope) return refusedAt('route');

    const decision = evaluateDelegateAuthGrant(grant, {
        signerDid,
        issuerDid: presentation.issuerDid,
        holderDid: presentation.holderDid,
        audience: presentation.audience,
        challenge: presentation.challenge,
        expectedAudience: getDelegateGrantAudience(),
        requiredScope: pinnedScope,
        now: Date.now(),
    });
    if (!decision.allowed) return refusedAt('policy');

    // A grant whose stored owner differs from the profile it is linked to authorises nobody.
    if (ownerProfile.profileId !== decision.effectiveProfileId) return refusedAt('owner');

    return {
        allowed: true,
        user: {
            // As when a manager acts as a profile (`resolveActAs`): the profile's own stored DID.
            did: ownerProfile.did,
            profile: ownerProfile,
            isChallengeValid: true,
            // Least privilege per request: the scope of this route, not all the grant holds.
            scope: pinnedScope,
            isAuthGrant: true,
            delegate: {
                actorDid: decision.actorDid,
                grantId: decision.grantId,
                ownerProfileId: decision.ownerProfileId,
            },
        },
    };
};

/**
 * The record of one delegated request: the route, the scope it declares, and who asked under
 * which grant. With a `stage` it is a denial. Nothing of the token or of the input goes in.
 */
export const delegateAuditRecord = ({
    path,
    requiredScope,
    stage,
    actorDid,
    grantId,
    ownerProfileId,
}: DelegateAttribution & {
    path: string;
    requiredScope: unknown;
    stage?: DelegateDenialStage;
}): NewDelegateGrantAudit => {
    const decision: Pick<NewDelegateGrantAudit, 'decision' | 'stage'> = stage
        ? { decision: 'denied', stage }
        : { decision: 'allowed' };

    return {
        ...decision,
        route: path,
        // A route may declare no scope, or one that is not a string: then none is recorded.
        ...(typeof requiredScope === 'string' && requiredScope ? { requiredScope } : {}),
        actorDid,
        grantId,
        ownerProfileId,
    };
};

/**
 * A reference to what an allowed request issued, for its record: the issuance id `inbox.issue`
 * answers with, or the string the contract route answers with. Any other shape gives nothing.
 * It never throws: it runs after the handler has answered, and must not change that answer.
 */
export const delegateResultRef = (path: string, data: unknown): string | undefined => {
    try {
        let ref: unknown;

        if (path === 'inbox.issue') {
            if (typeof data === 'object' && data !== null && 'issuanceId' in data) {
                ref = data.issuanceId;
            }
        } else if (path === 'contracts.writeCredentialToContractViaSigningAuthority') {
            ref = data;
        }

        return typeof ref === 'string' && ref ? ref : undefined;
    } catch {
        return undefined;
    }
};

/**
 * A delegate never signs: it holds no key of the organisation, so a credential it signed is not
 * the organisation's. A managed refresh re-issues under stored authority its grant does not carry.
 */
export const assertDelegatedInboxIssuance = (
    user: Pick<ContextUser, 'delegate'>,
    input: Pick<IssueInboxCredentialType, 'refresh'>,
    credential: VC | UnsignedVC | VP
): void => {
    if (user.delegate === undefined) return;

    if (input.refresh) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                "A delegate cannot ask for a managed refresh; the organisation's own request does that.",
        });
    }

    // The predicate by which `issueToInbox` skips the signing authority.
    if (isSignedInboxCredential(credential)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                "A delegate submits unsigned credential content; the organisation's signing authority signs it.",
        });
    }
};
