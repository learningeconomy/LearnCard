/**
 * LC-2187 owner share-link policy types.
 *
 * Policy is always derived server-side from trusted persisted state; nothing in
 * this module reads the request body. The conservative default (unknown age,
 * 30-day expiry, no view counting) is what an unavailable or untrustworthy age
 * source produces — absence of a manager is NOT evidence of adulthood.
 */

/** Result of consulting the authoritative server-side age source. */
export type ShareLinkOwnerAge = 'adult' | 'minor' | 'unknown';

/** Immutable policy snapshot persisted with the share under the write lock. */
export type ShareLinkPolicySnapshot = {
    /** `true` known minor, `false` known adult, `null` unknown. */
    isMinor: boolean | null;
    /** `true` only when the age source returned a known adult/minor value. */
    policyResolved: boolean;
    defaultExpiryDays: 30 | 365;
    viewCountingEnabled: boolean;
};

/**
 * Authoritative server-side sources. Implementations must read persisted server
 * state only; no request-derived value may be used as authority.
 */
export type ShareLinkPolicySource = {
    /**
     * Resolve the owner's age. `unknown` is required when no trustworthy source
     * exists; it must never be inferred from the absence of a manager.
     */
    resolveOwnerAge: (profileId: string) => Promise<ShareLinkOwnerAge>;
    /** Whether the profile is currently managed by another profile. */
    isManaged: (profileId: string) => Promise<boolean>;
};

/** Injectable server-side policy resolver used by the coordinator. */
export type ShareLinkPolicyResolver = {
    resolve: (profileId: string) => Promise<ShareLinkPolicySnapshot>;
};

/** Fail-closed policy: no views, 30 days, age unknown. */
export const DEFAULT_SHARE_LINK_POLICY: ShareLinkPolicySnapshot = Object.freeze({
    isMinor: null,
    policyResolved: false,
    defaultExpiryDays: 30,
    viewCountingEnabled: false,
});
