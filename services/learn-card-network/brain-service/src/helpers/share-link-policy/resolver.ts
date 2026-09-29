import { DEFAULT_SHARE_LINK_POLICY } from './types';
import type {
    ShareLinkOwnerAge,
    ShareLinkPolicyResolver,
    ShareLinkPolicySnapshot,
    ShareLinkPolicySource,
} from './types';

/**
 * Pure policy decision table.
 *
 * - known minor, managed or unknown age => no views, 30 days
 * - known unmanaged adult => views enabled, 365 days
 *
 */
export const composeShareLinkPolicy = (
    age: ShareLinkOwnerAge,
    isManaged: boolean
): ShareLinkPolicySnapshot => {
    const isMinor = age === 'minor' ? true : age === 'adult' ? false : null;
    const policyResolved = age !== 'unknown';
    const isUnmanagedAdult = age === 'adult' && !isManaged;

    return {
        isMinor,
        policyResolved,
        defaultExpiryDays: isUnmanagedAdult ? 365 : 30,
        viewCountingEnabled: isUnmanagedAdult,
    };
};

/**
 * Build an injectable resolver over an authoritative source. Any source failure
 * fails closed to the conservative default rather than assuming adult.
 */
export const createShareLinkPolicyResolver = (
    source: ShareLinkPolicySource
): ShareLinkPolicyResolver => ({
    resolve: async (profileId: string): Promise<ShareLinkPolicySnapshot> => {
        try {
            const [age, isManaged] = await Promise.all([
                source.resolveOwnerAge(profileId),
                source.isManaged(profileId),
            ]);

            return composeShareLinkPolicy(age, isManaged);
        } catch {
            return DEFAULT_SHARE_LINK_POLICY;
        }
    },
});

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Effective expiry: an explicit caller value (including explicit `null`) is
 * preserved; only an omitted value receives the policy default. The default is
 * derived from the policy at first reservation and then persisted, so a retry on
 * a later clock replays the original value.
 */
export const resolveShareLinkExpiry = (
    policy: ShareLinkPolicySnapshot,
    expiresAt: string | null | undefined,
    now: Date
): string | null => {
    if (expiresAt !== undefined) return expiresAt;

    return new Date(now.getTime() + policy.defaultExpiryDays * DAY_MS).toISOString();
};

/**
 * Conservatively merge a share's currently committed policy with the policy a
 * reservation intends to apply at finalization.
 *
 * A reservation can be created before the owner's authoritative policy changes
 * and then finalized later by a replay or a recovery worker. Applying the stale
 * reservation policy verbatim could re-enable view counting for an owner who has
 * since become managed/minor. The merge therefore only ever tightens:
 *
 * - view counting stays enabled only if BOTH policies allow it;
 * - a known minor on either side is a minor, an unknown on either side is
 *   unknown (never inferred adult);
 * - the default expiry is the shorter of the two.
 *
 * Production finalization also rechecks current graph policy under the share
 * lock before an explicit update can replace an old unknown snapshot.
 */
export const mergeShareLinkPolicyConservatively = (
    current: ShareLinkPolicySnapshot,
    incoming: ShareLinkPolicySnapshot
): ShareLinkPolicySnapshot => {
    const isMinor =
        current.isMinor === true || incoming.isMinor === true
            ? true
            : current.isMinor === false && incoming.isMinor === false
              ? false
              : null;

    return {
        isMinor,
        policyResolved: current.policyResolved && incoming.policyResolved,
        defaultExpiryDays:
            current.defaultExpiryDays <= incoming.defaultExpiryDays
                ? current.defaultExpiryDays
                : incoming.defaultExpiryDays,
        viewCountingEnabled: current.viewCountingEnabled && incoming.viewCountingEnabled,
    };
};
