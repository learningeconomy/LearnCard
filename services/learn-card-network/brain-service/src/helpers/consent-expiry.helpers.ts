/**
 * The one rule for "has this consent expired?", shared by the consented-data reads
 * (data-for-did), the contract connections snapshot and the `consent_expired` scan.
 *
 * A consent is judged by two dates: the terms' own `expiresAt`, and the `expiresAt` of the
 * contract version the consenter accepted (`terms.consentedVersion`, 1 when absent). The
 * contract node's `expiresAt` is NOT used: it mirrors the newest version, which terms that
 * are still awaiting re-consent have not accepted.
 *
 * Keep this module free of imports: a small Lambda bundles it.
 */

/** Empty expiry values mean no expiry. Invalid nonempty values never authorize access. */
export const isConsentExpiryActive = (expiresAt: unknown, now: number): boolean => {
    if (typeof expiresAt !== 'string' || !expiresAt.trim()) return true;

    const expiry = Date.parse(expiresAt);

    return Number.isFinite(expiry) && expiry > now;
};

/**
 * Cypher predicate that ties a `terms` node to the contract version it accepted, bound as
 * `accepted`. Use it in a WHERE after matching
 * `(contract)-[:HAS_VERSION]->(accepted:ConsentFlowContractVersion)`.
 */
export const ACCEPTED_VERSION_PREDICATE = 'accepted.version = coalesce(terms.consentedVersion, 1)';

/**
 * true while a consent is not expired: its own expiry is active, the version it accepted
 * exists, and that version's expiry is active.
 *
 * A missing accepted version counts as expired. Legacy terms with no version node therefore
 * count as "was expired" and can receive `expiry_extended` without an earlier `consent_expired`
 * (they never get one), which is consistent with the connections snapshot leaving them out.
 */
export const isConsentUnexpired = (
    {
        termsExpiresAt,
        hasAcceptedVersion,
        acceptedVersionExpiresAt,
    }: {
        termsExpiresAt: unknown;
        hasAcceptedVersion: boolean;
        acceptedVersionExpiresAt: unknown;
    },
    now: number
): boolean =>
    isConsentExpiryActive(termsExpiresAt, now) &&
    hasAcceptedVersion &&
    isConsentExpiryActive(acceptedVersionExpiresAt, now);
