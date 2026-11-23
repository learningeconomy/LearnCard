import { TRPCError } from '@trpc/server';
import type { IssueInboxCredentialType, UnsignedVC, VC, VP } from '@learncard/types';

import { getDelegateAuthGrantByChallenge } from '@accesslayer/delegate-auth-grant/read';
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

/**
 * The user context of a delegate request, or `null` for a refusal. The caller answers every
 * `null` alike, so a delegate cannot tell a revoked grant from a closed route.
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
}): Promise<DelegateUser | null> => {
    if (!presentation) return null;

    // The route must declare exactly the scope pinned for it: a route whose metadata changes
    // closes until this list is changed with it.
    const pinnedScope = getPinnedScope(path);
    if (pinnedScope === undefined || requiredScope !== pinnedScope) return null;

    // Read on every request and never cached, so a revocation holds from the next request on.
    // An error is not caught: an outage must not look like a refused token.
    const stored = await getDelegateAuthGrantByChallenge(presentation.challenge);
    if (!stored) return null;

    const decision = evaluateDelegateAuthGrant(stored.grant, {
        signerDid: presentation.signerDid,
        issuerDid: presentation.issuerDid,
        holderDid: presentation.holderDid,
        audience: presentation.audience,
        challenge: presentation.challenge,
        expectedAudience: getDelegateGrantAudience(),
        requiredScope: pinnedScope,
        now: Date.now(),
    });
    if (!decision.allowed) return null;

    // A grant whose stored owner differs from the profile it is linked to authorises nobody.
    const { ownerProfile } = stored;
    if (ownerProfile.profileId !== decision.effectiveProfileId) return null;

    return {
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
    };
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
